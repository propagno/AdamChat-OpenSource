"""
Serviço de OAuth para autenticação social.
Gerencia a integração com provedores de identidade externa como Google, Facebook e GitHub.
"""
import os
import json
import logging
import requests
import secrets
import string
import uuid
from urllib.parse import urlencode
from flask import url_for, session, request, current_app
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
from app.db import get_db
from app.config.oauth_config import (
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_AUTH_URI, GOOGLE_TOKEN_URI, GOOGLE_USER_INFO,
    FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, FACEBOOK_AUTH_URI, FACEBOOK_TOKEN_URI, FACEBOOK_USER_INFO,
    GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_AUTH_URI, GITHUB_TOKEN_URI, GITHUB_USER_INFO,
    OAUTH_REDIRECT_URI, PROVIDER_SCOPES, SUPPORTED_PROVIDERS, ENABLE_MOCK_OAUTH
)
from app.services.auth_service import auth_service
from app.auth_middleware import generate_tokens
from app.config.app_config import Config

# Configuração de logging
logger = logging.getLogger(__name__)

# Obter as configurações de JWT
JWT_REFRESH_TOKEN_EXPIRES = Config.JWT_REFRESH_TOKEN_EXPIRES


class OAuthService:
    """
    Serviço que gerencia a autenticação OAuth com provedores de identidade social.
    """

    def __init__(self):
        """
        Inicializa o serviço OAuth.
        """
        logger.info("Inicializando serviço OAuth...")
        self.client_configs = {
            'google': {
                'client_id': GOOGLE_CLIENT_ID,
                'client_secret': GOOGLE_CLIENT_SECRET,
                'auth_uri': GOOGLE_AUTH_URI,
                'token_uri': GOOGLE_TOKEN_URI,
                'userinfo_uri': GOOGLE_USER_INFO,
                'scopes': PROVIDER_SCOPES['google'],
            },
            'facebook': {
                'client_id': FACEBOOK_CLIENT_ID,
                'client_secret': FACEBOOK_CLIENT_SECRET,
                'auth_uri': FACEBOOK_AUTH_URI,
                'token_uri': FACEBOOK_TOKEN_URI,
                'userinfo_uri': FACEBOOK_USER_INFO,
                'scopes': PROVIDER_SCOPES['facebook'],
            },
            'github': {
                'client_id': GITHUB_CLIENT_ID,
                'client_secret': GITHUB_CLIENT_SECRET,
                'auth_uri': GITHUB_AUTH_URI,
                'token_uri': GITHUB_TOKEN_URI,
                'userinfo_uri': GITHUB_USER_INFO,
                'scopes': PROVIDER_SCOPES['github'],
            }
        }

        # No ambiente de desenvolvimento, permitir mock dos provedores
        # O valor será definido em tempo de execução durante as chamadas
        self.mock_enabled = ENABLE_MOCK_OAUTH
        if self.mock_enabled:
            logger.info(
                "Modo de desenvolvimento: Mock de provedores OAuth disponível.")

    def is_provider_configured(self, provider):
        """
        Verifica se um provedor está configurado e disponível para uso.

        Args:
            provider (str): Nome do provedor (google, facebook, github)

        Returns:
            bool: True se o provedor estiver configurado, False caso contrário
        """
        if provider not in SUPPORTED_PROVIDERS:
            return False

        # Em modo de desenvolvimento com mock ativado, todos os provedores estão disponíveis
        if self.mock_enabled:
            return True

        # Em modo de produção, verifica se as credenciais estão configuradas
        config = self.client_configs.get(provider, {})
        return bool(config.get('client_id')) and bool(config.get('client_secret'))

    def get_authorization_url(self, provider):
        """
        Gera URL de autorização para o provedor OAuth especificado.

        Args:
            provider (str): Nome do provedor (google, facebook, github)

        Returns:
            dict: Dicionário contendo a URL de autorização ou uma mensagem de erro
        """
        if not self.is_provider_configured(provider):
            return {
                'status': 'error',
                'message': f'Provedor {provider} não está configurado ou não é suportado.'
            }

        try:
            # Gerar um estado para prevenir CSRF
            state = ''.join(secrets.choice(
                string.ascii_letters + string.digits) for _ in range(32))
            session['oauth_state'] = state
            session['oauth_provider'] = provider

            # Em modo de desenvolvimento com mock ativado, redirecionar para endpoint de mock
            if self.mock_enabled:
                # Checamos se estamos em modo DEBUG verificando a configuração atual
                is_debug = current_app.config.get('DEBUG', False)

                if is_debug:
                    mock_url = f"{request.host_url.rstrip('/')}/api/auth/oauth/mock-callback?provider={provider}&state={state}"
                    return {
                        'status': 'success',
                        'auth_url': mock_url
                    }

            # Criar parâmetros para a URL de autorização
            config = self.client_configs[provider]
            params = {
                'client_id': config['client_id'],
                'redirect_uri': OAUTH_REDIRECT_URI,
                'scope': config['scopes'],
                'response_type': 'code',
                'state': state
            }

            # Adicionar parâmetros específicos do provedor
            if provider == 'google':
                params['access_type'] = 'offline'
                params['prompt'] = 'consent'

            # Construir a URL de autorização
            auth_url = f"{config['auth_uri']}?{urlencode(params)}"

            return {
                'status': 'success',
                'auth_url': auth_url
            }

        except Exception as e:
            logger.error(
                f"Erro ao gerar URL de autorização para {provider}: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erro ao gerar URL de autorização: {str(e)}'
            }

    def handle_callback(self, provider, code, state):
        """
        Processa o callback de autorização OAuth.

        Args:
            provider (str): Nome do provedor (google, facebook, github)
            code (str): Código de autorização retornado pelo provedor
            state (str): Estado para validação CSRF

        Returns:
            dict: Resultado do processo de autenticação
        """
        logger.info(
            f"Recebendo callback OAuth para {provider} com estado {state[:5]}...")

        # Verificar se o estado corresponde para prevenir CSRF
        stored_state = session.get('oauth_state')
        stored_provider = session.get('oauth_provider')

        if not stored_state or not stored_provider or state != stored_state or provider != stored_provider:
            return {
                'status': 'error',
                'message': 'Erro de validação do estado OAuth. Tente novamente.'
            }

        # Limpar dados da sessão
        session.pop('oauth_state', None)
        session.pop('oauth_provider', None)

        try:
            # Em modo de desenvolvimento com mock ativado, usar dados de usuário fictícios
            is_debug = current_app.config.get('DEBUG', False)
            if self.mock_enabled and is_debug and code == 'mock_auth_code':
                return self._process_mock_authentication(provider)

            # Obter o token de acesso
            token_data = self._get_token(provider, code)

            if 'error' in token_data:
                return {
                    'status': 'error',
                    'message': f'Erro ao obter token: {token_data.get("error_description", token_data.get("error"))}'
                }

            access_token = token_data.get('access_token')

            # Obter informações do usuário
            user_info = self._get_user_info(provider, access_token)

            if 'error' in user_info:
                return {
                    'status': 'error',
                    'message': f'Erro ao obter informações do usuário: {user_info.get("error")}'
                }

            # Processar informações do usuário para autenticação/registro
            return self._process_user_info(provider, user_info)

        except Exception as e:
            logger.error(
                f"Erro ao processar callback OAuth de {provider}: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erro ao processar autenticação: {str(e)}'
            }

    def _process_mock_authentication(self, provider):
        """
        Processa uma autenticação mock para desenvolvimento.

        Args:
            provider (str): Nome do provedor

        Returns:
            dict: Resultado simulado do processo de autenticação
        """
        logger.info(f"Gerando autenticação mock para {provider}")

        # Gerar dados de usuário fictícios baseados no provedor
        mock_user_info = {
            'id': str(uuid.uuid4()),
            'email': f"user_{provider}@example.com",
            'name': f"Usuário Teste {provider.capitalize()}",
            'picture': f"https://via.placeholder.com/150?text={provider}"
        }

        # Customizar dados de acordo com o provedor
        if provider == 'google':
            mock_user_info['sub'] = mock_user_info['id']
        elif provider == 'github':
            mock_user_info['login'] = f"user_{provider}"
            mock_user_info['avatar_url'] = mock_user_info['picture']
        elif provider == 'facebook':
            mock_user_info['picture'] = {
                'data': {'url': mock_user_info['picture']}}

        return self._process_user_info(provider, mock_user_info)

    def _get_token(self, provider, code):
        """
        Obtém o token de acesso do provedor OAuth.

        Args:
            provider (str): Nome do provedor
            code (str): Código de autorização

        Returns:
            dict: Dados do token retornados pelo provedor
        """
        config = self.client_configs[provider]

        data = {
            'client_id': config['client_id'],
            'client_secret': config['client_secret'],
            'code': code,
            'redirect_uri': OAUTH_REDIRECT_URI,
            'grant_type': 'authorization_code'
        }

        headers = {'Accept': 'application/json'}

        # GitHub requer um header Accept específico
        if provider == 'github':
            headers['Accept'] = 'application/json'

        response = requests.post(
            config['token_uri'], data=data, headers=headers)

        if response.status_code != 200:
            logger.error(f"Erro ao obter token de {provider}: {response.text}")
            return {'error': 'invalid_request', 'error_description': f'Erro {response.status_code}: {response.text}'}

        # Processar a resposta
        if provider == 'github' and response.headers.get('content-type', '').startswith('application/x-www-form-urlencoded'):
            # GitHub pode responder como form-urlencoded
            token_data = dict(item.split('=')
                              for item in response.text.split('&'))
        else:
            # A maioria dos provedores responde com JSON
            token_data = response.json()

        return token_data

    def _get_user_info(self, provider, access_token):
        """
        Obtém informações do usuário do provedor OAuth.

        Args:
            provider (str): Nome do provedor
            access_token (str): Token de acesso

        Returns:
            dict: Informações do usuário
        """
        config = self.client_configs[provider]

        headers = {'Authorization': f'Bearer {access_token}'}

        # Headers específicos para cada provedor
        if provider == 'github':
            headers['Accept'] = 'application/json'
        elif provider == 'facebook':
            # Facebook não usa header Authorization
            headers = {}
            url = f"{config['userinfo_uri']}&access_token={access_token}"
        else:
            url = config['userinfo_uri']

        # Realizar a requisição
        if provider != 'facebook':
            response = requests.get(config['userinfo_uri'], headers=headers)
        else:
            response = requests.get(url)

        if response.status_code != 200:
            logger.error(
                f"Erro ao obter informações do usuário de {provider}: {response.text}")
            return {'error': f'Erro {response.status_code}: {response.text}'}

        user_info = response.json()

        # Se o email não for retornado pelo GitHub, fazer uma requisição adicional
        if provider == 'github' and 'email' not in user_info:
            email_response = requests.get(
                'https://api.github.com/user/emails', headers=headers)
            if email_response.status_code == 200:
                emails = email_response.json()
                primary_email = next((e for e in emails if e.get(
                    'primary')), emails[0] if emails else None)
                if primary_email:
                    user_info['email'] = primary_email.get('email')

        return user_info

    def _process_user_info(self, provider, user_info):
        """
        Processa as informações do usuário para autenticação/registro.

        Args:
            provider (str): Nome do provedor
            user_info (dict): Informações do usuário

        Returns:
            dict: Resultado do processo de autenticação
        """
        logger.info(
            f"Processando informações do usuário do provedor {provider}")

        db = get_db()

        # Extrair email e id do usuário (varia conforme o provedor)
        if provider == 'google':
            email = user_info.get('email')
            provider_id = user_info.get('sub')
            name = user_info.get('name')
            picture = user_info.get('picture')
        elif provider == 'facebook':
            email = user_info.get('email')
            provider_id = user_info.get('id')
            name = user_info.get('name')
            picture = user_info.get('picture', {}).get('data', {}).get('url')
        elif provider == 'github':
            email = user_info.get('email')
            provider_id = str(user_info.get('id'))
            name = user_info.get('name') or user_info.get('login')
            picture = user_info.get('avatar_url')
        else:
            return {
                'status': 'error',
                'message': f'Provedor não suportado: {provider}'
            }

        # Verificar se temos um email
        if not email:
            return {
                'status': 'error',
                'message': f'Não foi possível obter o email do usuário do provedor {provider}'
            }

        try:
            # Verificar se já existe um usuário com essa identidade social
            social_identity = db.social_identities.find_one({
                'provider': provider,
                'provider_id': provider_id
            })

            if social_identity:
                # Usuário já existe, autenticar
                user = db.users.find_one({'_id': social_identity['user_id']})
                if not user:
                    return {
                        'status': 'error',
                        'message': 'Usuário associado não encontrado'
                    }

                # Gerar tokens de autenticação
                user_data = {
                    'sub': str(user['_id']),
                    'email': user['email'],
                    'name': user.get('name', ''),
                    'roles': user.get('roles', ['user'])
                }
                tokens = generate_tokens(user_data)

                # Armazenar o refresh token
                self._store_refresh_token(user['_id'], tokens['refresh_token'])

                # Atualizar última autenticação
                db.users.update_one(
                    {'_id': user['_id']},
                    {'$set': {'last_login': datetime.utcnow()}}
                )

                return {
                    'status': 'success',
                    'message': f'Autenticação via {provider} bem-sucedida',
                    'tokens': tokens,
                    'user': {
                        'id': str(user['_id']),
                        'email': user['email'],
                        'name': user.get('name', ''),
                        'roles': user.get('roles', ['user'])
                    }
                }
            else:
                # Verificar se já existe um usuário com esse email
                existing_user = db.users.find_one({'email': email})

                if existing_user:
                    # Vincular identidade social ao usuário existente
                    social_id = db.social_identities.insert_one({
                        'user_id': existing_user['_id'],
                        'provider': provider,
                        'provider_id': provider_id,
                        'email': email,
                        'created_at': datetime.utcnow()
                    }).inserted_id

                    # Gerar tokens de autenticação
                    user_data = {
                        'sub': str(existing_user['_id']),
                        'email': existing_user['email'],
                        'name': existing_user.get('name', ''),
                        'roles': existing_user.get('roles', ['user'])
                    }
                    tokens = generate_tokens(user_data)

                    # Armazenar o refresh token
                    self._store_refresh_token(
                        existing_user['_id'], tokens['refresh_token'])

                    # Atualizar última autenticação
                    db.users.update_one(
                        {'_id': existing_user['_id']},
                        {'$set': {'last_login': datetime.utcnow()}}
                    )

                    return {
                        'status': 'success',
                        'message': f'Conta vinculada a {provider} com sucesso',
                        'tokens': tokens,
                        'user': {
                            'id': str(existing_user['_id']),
                            'email': existing_user['email'],
                            'name': existing_user.get('name', ''),
                            'roles': existing_user.get('roles', ['user'])
                        }
                    }
                else:
                    # Criar um novo usuário
                    # Gerar uma senha aleatória (não será usada, mas é necessária)
                    random_password = ''.join(secrets.choice(
                        string.ascii_letters + string.digits) for _ in range(16))
                    password_hash = generate_password_hash(random_password)

                    new_user = {
                        'email': email,
                        'name': name,
                        'password_hash': password_hash,
                        'profile_picture': picture,
                        'roles': ['user'],
                        'is_active': True,
                        'created_at': datetime.utcnow(),
                        'last_login': datetime.utcnow(),
                        'auth_type': 'oauth'
                    }

                    # Inserir o novo usuário
                    user_id = db.users.insert_one(new_user).inserted_id

                    # Vincular identidade social
                    social_id = db.social_identities.insert_one({
                        'user_id': user_id,
                        'provider': provider,
                        'provider_id': provider_id,
                        'email': email,
                        'created_at': datetime.utcnow()
                    }).inserted_id

                    # Gerar tokens de autenticação
                    user_data = {
                        'sub': str(user_id),
                        'email': email,
                        'name': name,
                        'roles': ['user']
                    }
                    tokens = generate_tokens(user_data)

                    # Armazenar o refresh token
                    self._store_refresh_token(user_id, tokens['refresh_token'])

                    return {
                        'status': 'success',
                        'message': f'Registro via {provider} bem-sucedido',
                        'tokens': tokens,
                        'user': {
                            'id': str(user_id),
                            'email': email,
                            'name': name,
                            'roles': ['user']
                        }
                    }
        except Exception as e:
            logger.error(
                f"Erro ao processar informações do usuário: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erro ao processar autenticação: {str(e)}'
            }

    def _store_refresh_token(self, user_id, token):
        """
        Armazena um token de atualização no banco de dados

        Args:
            user_id: ID do usuário
            token: Token de atualização

        Returns:
            bool: True se o token foi armazenado com sucesso, False caso contrário
        """
        logger.info(f"Armazenando refresh token para usuário {user_id}")

        try:
            db = get_db()
            expires_at = datetime.utcnow() + timedelta(seconds=JWT_REFRESH_TOKEN_EXPIRES)

            # Remover tokens antigos deste usuário
            db.refresh_tokens.delete_many({'user_id': ObjectId(user_id)})

            # Criar novo token
            db.refresh_tokens.insert_one({
                'user_id': ObjectId(user_id),
                'token': token,
                'expires_at': expires_at,
                'created_at': datetime.utcnow()
            })

            return True
        except Exception as e:
            logger.error(f"Erro ao armazenar refresh token: {e}")
            return False


# Criar uma instância única do serviço
oauth_service = OAuthService()
