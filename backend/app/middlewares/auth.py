# backend/app/auth_middleware.py

import os
import json
import logging
from functools import wraps
from flask import request, jsonify, current_app
import requests
import jwt
from jose import jwk, jwt as jose_jwt
from jose.utils import base64url_decode
import time
import urllib.parse

# Configuração de logging
logger = logging.getLogger(__name__)

# Cache para a chave pública do Keycloak
_PUBLIC_KEY_CACHE = {
    'keys': None,
    'last_updated': 0,
    'cache_ttl': 3600  # 1 hora em segundos
}


def get_keycloak_public_keys():
    """
    Recupera as chaves públicas do Keycloak com cache para melhorar a performance
    """
    current_time = time.time()

    # Verificar se precisamos atualizar o cache
    if (_PUBLIC_KEY_CACHE['keys'] is None or
            current_time - _PUBLIC_KEY_CACHE['last_updated'] > _PUBLIC_KEY_CACHE['cache_ttl']):

        try:
            keycloak_url = os.environ.get(
                'KEYCLOAK_URL', 'http://localhost:8080')
            realm = os.environ.get('KEYCLOAK_REALM', 'master')
            certs_url = f"{keycloak_url}/realms/{realm}/protocol/openid-connect/certs"

            logger.info(
                f"Buscando chaves públicas do Keycloak em: {certs_url}")
            response = requests.get(certs_url, timeout=10)

            if response.status_code != 200:
                logger.error(
                    f"Falha ao obter chaves do Keycloak: {response.status_code} - {response.text}")
                raise Exception(
                    f"Falha ao obter chaves do Keycloak: {response.status_code}")

            keys_json = response.json()
            _PUBLIC_KEY_CACHE['keys'] = keys_json
            _PUBLIC_KEY_CACHE['last_updated'] = current_time
            logger.info(f"Chaves do Keycloak atualizadas com sucesso")

        except Exception as e:
            logger.error(f"Erro ao buscar chaves do Keycloak: {str(e)}")
            # Se já tivermos chaves em cache, continuamos usando mesmo expiradas
            if _PUBLIC_KEY_CACHE['keys'] is None:
                raise

    return _PUBLIC_KEY_CACHE['keys']


def decode_token(token):
    """
    Decodifica e valida o token JWT utilizando as chaves públicas do Keycloak
    """
    if not token:
        raise ValueError("Token não fornecido")

    # Decodificação básica para extrair o cabeçalho sem verificação
    header = json.loads(base64url_decode(token.split('.')[0]).decode('utf-8'))
    kid = header.get('kid')

    if not kid:
        raise ValueError("Token não contém 'kid' no cabeçalho")

    # Obter as chaves públicas
    jwks = get_keycloak_public_keys()

    # Encontrar a chave correspondente ao kid do token
    key = None
    for k in jwks['keys']:
        if k['kid'] == kid:
            key = k
            break

    if not key:
        raise ValueError(
            f"Não foi possível encontrar a chave pública correspondente ao kid: {kid}")

    # Preparar a chave pública para verificação
    public_key = jwk.construct(key)

    # Validação do token
    try:
        client_id = os.environ.get('KEYCLOAK_CLIENT_ID', 'adamchat-frontend')
        options = {
            'verify_signature': True,
            'verify_aud': True,
            'verify_exp': True,
            'verify_iat': True
        }

        claims = jose_jwt.decode(
            token,
            key,
            audience=client_id,
            options=options
        )

        return claims

    except jose_jwt.ExpiredSignatureError:
        raise ValueError("Token expirado")
    except jose_jwt.JWTClaimsError as e:
        raise ValueError(f"Falha na validação do claims do token: {str(e)}")
    except jose_jwt.JWTError as e:
        raise ValueError(f"Falha na validação do token: {str(e)}")


def token_required(f):
    """
    Decorator para verificar se o token JWT é válido
    Melhoria: tratamento de erros mais detalhado e cache de chaves públicas
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Verificar se estamos em modo de emergência
        if current_app.config.get('EMERGENCY_MODE', False):
            logger.warning("Autenticação ignorada - modo de emergência ativo")
            return f(*args, **kwargs)

        # Extrair o token do cabeçalho Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            logger.warning("Token ausente na requisição")
            return jsonify({
                'message': 'Token de autenticação não fornecido',
                'error': 'missing_token',
                'status': 'error'
            }), 401

        # Verificar formato do token
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            logger.warning("Formato do token inválido")
            return jsonify({
                'message': 'Formato de token inválido. Use: Bearer <token>',
                'error': 'invalid_token_format',
                'status': 'error'
            }), 401

        token = parts[1]

        try:
            # Decodificar e validar o token
            claims = decode_token(token)

            # Verificar perfis e permissões específicas, se necessário
            # Exemplo: verificar se o usuário tem o papel 'admin'
            # if 'realm_access' in claims and 'roles' in claims['realm_access']:
            #     if 'admin' not in claims['realm_access']['roles']:
            #         return jsonify({'message': 'Acesso negado', 'status': 'error'}), 403

            # Adicionar as claims aos argumentos da função
            kwargs['user_data'] = claims

            return f(*args, **kwargs)

        except ValueError as e:
            logger.warning(f"Erro na validação do token: {str(e)}")
            return jsonify({
                'message': str(e),
                'error': 'invalid_token',
                'status': 'error'
            }), 401
        except Exception as e:
            logger.error(
                f"Erro inesperado ao validar token: {str(e)}", exc_info=True)
            return jsonify({
                'message': 'Erro interno ao validar token',
                'error': 'internal_error',
                'status': 'error'
            }), 500

    return decorated


def admin_required(f):
    """
    Decorator para verificar se o usuário é um administrador
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        user_data = kwargs.get('user_data')

        if not user_data:
            return jsonify({
                'message': 'Dados do usuário não encontrados',
                'status': 'error'
            }), 401

        # Verificar se o usuário tem o papel de admin
        has_admin_role = False

        if 'realm_access' in user_data and 'roles' in user_data['realm_access']:
            has_admin_role = 'admin' in user_data['realm_access']['roles']

        if not has_admin_role:
            return jsonify({
                'message': 'Acesso negado. Requer privilégios de administrador',
                'status': 'error'
            }), 403

        return f(*args, **kwargs)

    return decorated
