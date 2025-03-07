"""
Middleware de autenticação para o AdamChat.
Fornece funcionalidades para validação de tokens JWT e controle de acesso.
"""
import os
import jwt
import json
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g, current_app
from dotenv import load_dotenv

load_dotenv()

# Configurações de JWT
JWT_SECRET_KEY = os.environ.get(
    'JWT_SECRET_KEY', 'adamchat_secure_key_change_in_production')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get(
    'JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hora
JWT_REFRESH_TOKEN_EXPIRES = int(os.environ.get(
    'JWT_REFRESH_TOKEN_EXPIRES', 2592000))  # 30 dias


def token_required(f):
    """
    Decorador que verifica se um token JWT válido foi fornecido nas requisições.
    Deve ser usado em rotas que requerem autenticação.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Verifica se o token está no header de autorização
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        # Se não encontrou token
        if not token:
            return jsonify({
                'message': 'Token de autenticação não fornecido',
                'status': 'error'
            }), 401

        try:
            # Decodifica o token
            payload = jwt.decode(token, JWT_SECRET_KEY,
                                 algorithms=[JWT_ALGORITHM])

            # Verifica se o token não expirou
            if 'exp' in payload and datetime.utcnow() > datetime.fromtimestamp(payload['exp']):
                return jsonify({
                    'message': 'Token expirado',
                    'status': 'error'
                }), 401

            # Adiciona o payload do usuário a flask.g para acesso em qualquer lugar
            g.user = payload

            # Passa o usuário do token para a função como argumento
            kwargs['user_data'] = payload
        except jwt.ExpiredSignatureError:
            return jsonify({
                'message': 'Token expirado',
                'status': 'error'
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'message': 'Token inválido',
                'status': 'error'
            }), 401
        except Exception as e:
            return jsonify({
                'message': f'Erro ao processar token: {str(e)}',
                'status': 'error'
            }), 401

        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    """
    Decorador que verifica se o usuário tem função de administrador.
    Deve ser usado em conjunto com token_required.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        user_data = kwargs.get('user_data')

        if not user_data:
            return jsonify({
                'message': 'Dados do usuário não encontrados',
                'status': 'error'
            }), 401

        # Verifica se o usuário tem o papel de admin
        roles = user_data.get('roles', [])
        if 'admin' not in roles:
            return jsonify({
                'message': 'Acesso negado: requer privilégios de administrador',
                'status': 'error'
            }), 403

        return f(*args, **kwargs)

    return decorated


def generate_tokens(user_data):
    """
    Gera tokens de acesso e refresh para o usuário

    Args:
        user_data (dict): Dados do usuário a serem codificados no token

    Returns:
        dict: Tokens de acesso e refresh
    """
    now = datetime.utcnow()

    # Criar payload do token de acesso
    access_payload = {
        'sub': user_data.get('id', str(user_data.get('_id', ''))),
        'name': user_data.get('name', ''),
        'email': user_data.get('email', ''),
        'roles': user_data.get('roles', []),
        'iat': now,
        'exp': now + timedelta(seconds=JWT_ACCESS_TOKEN_EXPIRES)
    }

    # Criar payload do token de refresh (com menos dados e validade mais longa)
    refresh_payload = {
        'sub': user_data.get('id', str(user_data.get('_id', ''))),
        'type': 'refresh',
        'iat': now,
        'exp': now + timedelta(seconds=JWT_REFRESH_TOKEN_EXPIRES)
    }

    # Gerar tokens
    access_token = jwt.encode(
        access_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    refresh_token = jwt.encode(
        refresh_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'expires_in': JWT_ACCESS_TOKEN_EXPIRES
    }
