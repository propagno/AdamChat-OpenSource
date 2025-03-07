"""
Serviço de autenticação para o AdamChat.
Fornece funcionalidades para autenticação, gerenciamento de usuários e controle de acesso.
"""
import os
import logging
import hashlib
import secrets
import random
import string
from datetime import datetime, timedelta
from bson.objectid import ObjectId
from pymongo.errors import DuplicateKeyError
from flask import current_app
from app.db import get_db
from app.auth_middleware import generate_tokens
import jwt
from werkzeug.security import generate_password_hash, check_password_hash

# Configuração de logging
logger = logging.getLogger(__name__)

# Configurações de JWT
JWT_SECRET_KEY = os.environ.get(
    'JWT_SECRET_KEY', 'adamchat_secure_key_change_in_production')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get(
    'JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hora
JWT_REFRESH_TOKEN_EXPIRES = int(os.environ.get(
    'JWT_REFRESH_TOKEN_EXPIRES', 2592000))  # 30 dias


class AuthService:
    """
    Serviço de autenticação que gerencia usuários e sessões
    """

    def __init__(self, app=None):
        """
        Inicializa o serviço de autenticação

        Args:
            app: Instância do Flask app (opcional)
        """
        self.app = app
        if app:
            self.init_app(app)

    def init_app(self, app):
        """
        Inicializa o serviço com uma instância do Flask app

        Args:
            app: Instância do Flask app
        """
        self.app = app

        # Garantir que os índices necessários existam
        with app.app_context():
            db = get_db()
            # Índice único para email
            db.users.create_index('email', unique=True)
            # Índice único para username
            db.users.create_index('username', unique=True)
            # Índice para refresh tokens
            db.refresh_tokens.create_index('token', unique=True)
            db.refresh_tokens.create_index('expires_at', expireAfterSeconds=0)
            # Índice para códigos de redefinição de senha
            db.reset_codes.create_index('email')
            db.reset_codes.create_index('code')
            db.reset_codes.create_index('expires_at', expireAfterSeconds=0)

    def hash_password(self, password, salt=None):
        """
        Cria um hash seguro da senha usando PBKDF2 com SHA-256

        Args:
            password (str): Senha em texto plano
            salt (bytes, optional): Salt para o hash. Se None, gera um novo.

        Returns:
            tuple: (hash_password, salt)
        """
        if salt is None:
            salt = os.urandom(32)  # 32 bytes = 256 bits

        # Usar PBKDF2 com 100,000 iterações
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt,
            100000
        )

        return key, salt

    def verify_password(self, stored_password, stored_salt, provided_password):
        """
        Verifica se a senha fornecida corresponde à senha armazenada

        Args:
            stored_password (bytes): Hash da senha armazenada
            stored_salt (bytes): Salt usado para gerar o hash
            provided_password (str): Senha fornecida para verificação

        Returns:
            bool: True se a senha corresponder, False caso contrário
        """
        key, _ = self.hash_password(provided_password, stored_salt)
        return key == stored_password

    def register_user(self, user_data):
        """
        Registra um novo usuário

        Args:
            user_data (dict): Dados do usuário (username, email, password, etc.)

        Returns:
            dict: Dados do usuário criado ou mensagem de erro
        """
        try:
            db = get_db()

            # Validar dados obrigatórios
            required_fields = ['username', 'email', 'password']
            for field in required_fields:
                if field not in user_data:
                    return {
                        'status': 'error',
                        'message': f'Campo obrigatório ausente: {field}'
                    }

            # Verificar se o usuário já existe
            if db.users.find_one({'email': user_data['email']}):
                return {
                    'status': 'error',
                    'message': 'Email já cadastrado'
                }

            if db.users.find_one({'username': user_data['username']}):
                return {
                    'status': 'error',
                    'message': 'Nome de usuário já em uso'
                }

            # Hash da senha
            password_hash, salt = self.hash_password(user_data['password'])

            # Preparar dados do usuário
            new_user = {
                'username': user_data['username'],
                'email': user_data['email'],
                'password_hash': password_hash,
                'password_salt': salt,
                'name': user_data.get('name', user_data['username']),
                'roles': user_data.get('roles', ['user']),
                'active': True,
                'email_verified': False,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }

            # Inserir usuário
            result = db.users.insert_one(new_user)

            # Remover dados sensíveis antes de retornar
            new_user['_id'] = str(result.inserted_id)
            del new_user['password_hash']
            del new_user['password_salt']

            return {
                'status': 'success',
                'message': 'Usuário criado com sucesso',
                'user': new_user
            }

        except DuplicateKeyError:
            return {
                'status': 'error',
                'message': 'Usuário ou email já cadastrado'
            }
        except Exception as e:
            logger.error(f"Erro ao registrar usuário: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erro ao registrar usuário: {str(e)}'
            }

    def authenticate(self, username_or_email, password):
        """
        Autentica um usuário com username/email e senha

        Args:
            username_or_email (str): Username ou email do usuário
            password (str): Senha do usuário

        Returns:
            dict: Tokens de acesso e refresh ou mensagem de erro
        """
        try:
            db = get_db()

            # Buscar usuário por username ou email
            user = db.users.find_one({
                '$or': [
                    {'username': username_or_email},
                    {'email': username_or_email}
                ]
            })

            if not user:
                return {
                    'status': 'error',
                    'message': 'Usuário não encontrado'
                }

            # Verificar se o usuário está ativo
            if not user.get('active', True):
                return {
                    'status': 'error',
                    'message': 'Conta desativada'
                }

            # Verificar senha
            if not self.verify_password(
                user['password_hash'],
                user['password_salt'],
                password
            ):
                return {
                    'status': 'error',
                    'message': 'Senha incorreta'
                }

            # Preparar dados do usuário para o token
            user_data = {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user['email'],
                'name': user.get('name', user['username']),
                'roles': user.get('roles', ['user'])
            }

            # Gerar tokens
            tokens = generate_tokens(user_data)

            # Armazenar refresh token no banco
            self._store_refresh_token(user['_id'], tokens['refresh_token'])

            return {
                'status': 'success',
                'message': 'Autenticação bem-sucedida',
                'tokens': tokens,
                'user': user_data
            }

        except Exception as e:
            logger.error(f"Erro na autenticação: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erro na autenticação: {str(e)}'
            }

    def refresh_token(self, refresh_token):
        """
        Atualiza o token de acesso usando um token de refresh

        Args:
            refresh_token (str): Token de refresh

        Returns:
            dict: Novo token de acesso ou mensagem de erro
        """
        try:
            # Verificar e decodificar o token
            try:
                payload = jwt.decode(
                    refresh_token,
                    JWT_SECRET_KEY,
                    algorithms=[JWT_ALGORITHM]
                )

                # Verificar se é um token de refresh
                if payload.get('type') != 'refresh':
                    return {
                        'status': 'error',
                        'message': 'Token inválido'
                    }

                user_id = payload.get('sub')

            except jwt.ExpiredSignatureError:
                return {
                    'status': 'error',
                    'message': 'Token expirado'
                }
            except jwt.InvalidTokenError:
                return {
                    'status': 'error',
                    'message': 'Token inválido'
                }

            # Verificar se o token está na lista de tokens válidos
            db = get_db()
            stored_token = db.refresh_tokens.find_one({
                'token': refresh_token,
                'user_id': ObjectId(user_id)
            })

            if not stored_token:
                return {
                    'status': 'error',
                    'message': 'Token inválido ou revogado'
                }

            # Buscar dados do usuário
            user = db.users.find_one({'_id': ObjectId(user_id)})

            if not user:
                return {
                    'status': 'error',
                    'message': 'Usuário não encontrado'
                }

            # Verificar se o usuário está ativo
            if not user.get('active', True):
                return {
                    'status': 'error',
                    'message': 'Conta desativada'
                }

            # Preparar dados do usuário para o token
            user_data = {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user['email'],
                'name': user.get('name', user['username']),
                'roles': user.get('roles', ['user'])
            }

            # Gerar novos tokens
            tokens = generate_tokens(user_data)

            # Remover o token antigo e armazenar o novo
            db.refresh_tokens.delete_one({'token': refresh_token})
            self._store_refresh_token(user['_id'], tokens['refresh_token'])

            return {
                'status': 'success',
                'message': 'Token atualizado com sucesso',
                'tokens': tokens
            }

        except Exception as e:
            logger.error(f"Erro ao atualizar token: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erro ao atualizar token: {str(e)}'
            }

    def logout(self, refresh_token):
        """
        Realiza o logout do usuário invalidando o refresh token

        Args:
            refresh_token (str): Token de refresh a ser invalidado

        Returns:
            dict: Mensagem de sucesso ou erro
        """
        try:
            db = get_db()

            # Remover o token do banco
            result = db.refresh_tokens.delete_one({'token': refresh_token})

            if result.deleted_count > 0:
                return {
                    'status': 'success',
                    'message': 'Logout realizado com sucesso'
                }
            else:
                return {
                    'status': 'warning',
                    'message': 'Token não encontrado, mas logout realizado'
                }

        except Exception as e:
            logger.error(f"Erro ao realizar logout: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erro ao realizar logout: {str(e)}'
            }

    def get_user_by_id(self, user_id):
        """
        Busca um usuário pelo ID

        Args:
            user_id (str): ID do usuário

        Returns:
            dict: Dados do usuário ou None
        """
        try:
            db = get_db()
            user = db.users.find_one({'_id': ObjectId(user_id)})

            if user:
                # Remover dados sensíveis
                user['_id'] = str(user['_id'])
                if 'password_hash' in user:
                    del user['password_hash']
                if 'password_salt' in user:
                    del user['password_salt']

            return user
        except Exception as e:
            logger.error(f"Erro ao buscar usuário: {str(e)}", exc_info=True)
            return None

    def update_user(self, user_id, update_data):
        """
        Atualiza os dados de um usuário

        Args:
            user_id (str): ID do usuário
            update_data (dict): Dados a serem atualizados

        Returns:
            dict: Mensagem de sucesso ou erro
        """
        try:
            db = get_db()

            # Verificar se o usuário existe
            user = db.users.find_one({'_id': ObjectId(user_id)})
            if not user:
                return {
                    'status': 'error',
                    'message': 'Usuário não encontrado'
                }

            # Campos que não podem ser atualizados diretamente
            protected_fields = [
                '_id', 'password_hash', 'password_salt', 'roles']
            update_fields = {}

            # Processar campos a serem atualizados
            for key, value in update_data.items():
                if key not in protected_fields:
                    update_fields[key] = value

            # Atualizar senha se fornecida
            if 'password' in update_data:
                password_hash, salt = self.hash_password(
                    update_data['password'])
                update_fields['password_hash'] = password_hash
                update_fields['password_salt'] = salt

            # Adicionar timestamp de atualização
            update_fields['updated_at'] = datetime.utcnow()

            # Atualizar usuário
            db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_fields}
            )

            return {
                'status': 'success',
                'message': 'Usuário atualizado com sucesso'
            }

        except Exception as e:
            logger.error(f"Erro ao atualizar usuário: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erro ao atualizar usuário: {str(e)}'
            }

    def change_user_role(self, user_id, roles, admin_user_id):
        """
        Altera os papéis (roles) de um usuário

        Args:
            user_id (str): ID do usuário a ser modificado
            roles (list): Lista de papéis a serem atribuídos
            admin_user_id (str): ID do administrador realizando a alteração

        Returns:
            dict: Mensagem de sucesso ou erro
        """
        try:
            db = get_db()

            # Verificar se o administrador existe e tem permissão
            admin = db.users.find_one({'_id': ObjectId(admin_user_id)})
            if not admin or 'admin' not in admin.get('roles', []):
                return {
                    'status': 'error',
                    'message': 'Permissão negada'
                }

            # Verificar se o usuário existe
            user = db.users.find_one({'_id': ObjectId(user_id)})
            if not user:
                return {
                    'status': 'error',
                    'message': 'Usuário não encontrado'
                }

            # Atualizar papéis
            db.users.update_one(
                {'_id': ObjectId(user_id)},
                {
                    '$set': {
                        'roles': roles,
                        'updated_at': datetime.utcnow()
                    }
                }
            )

            return {
                'status': 'success',
                'message': 'Papéis do usuário atualizados com sucesso'
            }

        except Exception as e:
            logger.error(
                f"Erro ao alterar papéis do usuário: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erro ao alterar papéis do usuário: {str(e)}'
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
        try:
            # Usar datetime.utcnow() em vez de datetime.datetime.utcnow()
            expires_at = datetime.utcnow() + timedelta(seconds=JWT_REFRESH_TOKEN_EXPIRES)

            # Remover tokens antigos deste usuário
            db = get_db()
            db.refresh_tokens.delete_many({'user_id': ObjectId(user_id)})

            # Criar novo token
            db.refresh_tokens.insert_one({
                'user_id': ObjectId(user_id),
                'token': token,
                'issued_at': datetime.utcnow(),
                'expires_at': expires_at
            })

            return True
        except Exception as e:
            logger.error(f"Erro ao armazenar refresh token: {e}")
            return False

    def create_admin_user(self, admin_data):
        """
        Cria um usuário administrador (apenas se não existir nenhum admin)

        Args:
            admin_data (dict): Dados do administrador

        Returns:
            dict: Mensagem de sucesso ou erro
        """
        try:
            db = get_db()

            # Verificar se já existe algum administrador
            existing_admin = db.users.find_one({'roles': 'admin'})
            if existing_admin and not current_app.config.get('FORCE_ADMIN_CREATION', False):
                return {
                    'status': 'error',
                    'message': 'Já existe um administrador no sistema'
                }

            # Adicionar papel de admin
            admin_data['roles'] = ['admin', 'user']

            # Registrar usuário
            result = self.register_user(admin_data)

            if result['status'] == 'success':
                return {
                    'status': 'success',
                    'message': 'Administrador criado com sucesso',
                    'user': result['user']
                }
            else:
                return result

        except Exception as e:
            logger.error(
                f"Erro ao criar administrador: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erro ao criar administrador: {str(e)}'
            }

    def generate_reset_code(self, email):
        """
        Gera um código de redefinição de senha para o email especificado

        Args:
            email (str): Email do usuário

        Returns:
            dict: Resultado da operação
        """
        try:
            # Importar datetime e timedelta do módulo correto
            from datetime import datetime, timedelta

            db = get_db()

            # Verificar se o usuário existe
            user = db.users.find_one({'email': email})
            if not user:
                return {
                    'status': 'error',
                    'message': 'Usuário não encontrado'
                }

            # Gerar código aleatório de 6 dígitos
            code = ''.join(random.choices(string.digits, k=6))

            # Definir tempo de expiração (30 minutos)
            expires_at = datetime.utcnow() + timedelta(minutes=30)

            # Remover códigos anteriores do usuário
            db.reset_codes.delete_many({'email': email})

            # Armazenar o novo código
            db.reset_codes.insert_one({
                'email': email,
                'code': code,
                'created_at': datetime.utcnow(),
                'expires_at': expires_at,
                'used': False
            })

            # TODO: Enviar email com o código
            # Por enquanto, apenas simular o envio e logar o código
            logger.info(f"Código de redefinição gerado para {email}: {code}")

            return {
                'status': 'success',
                'message': 'Código enviado com sucesso para o email cadastrado'
            }

        except Exception as e:
            logger.error(
                f"Erro ao gerar código de redefinição: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erro ao gerar código de redefinição: {str(e)}'
            }

    def verify_reset_code(self, email, code):
        """
        Verifica se um código de redefinição é válido

        Args:
            email (str): Email do usuário
            code (str): Código de verificação

        Returns:
            dict: Resultado da verificação
        """
        try:
            # Importar datetime do módulo correto
            from datetime import datetime

            db = get_db()

            # Buscar o código
            reset_code = db.reset_codes.find_one({
                'email': email,
                'code': code,
                'used': False,
                'expires_at': {'$gt': datetime.utcnow()}
            })

            if not reset_code:
                return {
                    'status': 'error',
                    'message': 'Código inválido ou expirado'
                }

            return {
                'status': 'success',
                'message': 'Código validado com sucesso'
            }

        except Exception as e:
            logger.error(f"Erro ao verificar código: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erro ao verificar código: {str(e)}'
            }

    def reset_password(self, email, code, new_password):
        """
        Redefine a senha do usuário após verificação do código

        Args:
            email (str): Email do usuário
            code (str): Código de verificação
            new_password (str): Nova senha

        Returns:
            dict: Resultado da operação
        """
        try:
            # Importar datetime do módulo correto
            from datetime import datetime

            # Verificar o código
            verify_result = self.verify_reset_code(email, code)
            if verify_result['status'] != 'success':
                return verify_result

            db = get_db()

            # Buscar usuário
            user = db.users.find_one({'email': email})
            if not user:
                return {
                    'status': 'error',
                    'message': 'Usuário não encontrado'
                }

            # Gerar novo hash de senha
            password_salt = secrets.token_hex(16)
            password_hash = self.hash_password(new_password, password_salt)

            # Atualizar senha do usuário
            db.users.update_one(
                {'_id': user['_id']},
                {'$set': {
                    'password_hash': password_hash,
                    'password_salt': password_salt,
                    'updated_at': datetime.utcnow()
                }}
            )

            # Marcar código como usado
            db.reset_codes.update_one(
                {'email': email, 'code': code},
                {'$set': {'used': True}}
            )

            # Invalidar todos os refresh tokens do usuário
            db.refresh_tokens.delete_many({'user_id': user['_id']})

            return {
                'status': 'success',
                'message': 'Senha atualizada com sucesso'
            }

        except Exception as e:
            logger.error(f"Erro ao redefinir senha: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erro ao redefinir senha: {str(e)}'
            }

    def get_auth_status(self):
        """Retorna o status atual do sistema de autenticação"""
        return {
            'status': 'ok',
            'message': 'Sistema de autenticação operacional',
            'emergency_mode': False,
            'auth_type': 'jwt'
        }

    def update_user_profile(self, user_id, update_data):
        """
        Atualiza o perfil do usuário

        Args:
            user_id (str): ID do usuário
            update_data (dict): Dados a serem atualizados

        Returns:
            dict: Resultado da operação
        """
        try:
            # Importar datetime do módulo correto
            from datetime import datetime

            db = get_db()

            # Verificar se o usuário existe
            user = db.users.find_one({'_id': ObjectId(user_id)})
            if not user:
                return {
                    'status': 'error',
                    'message': 'Usuário não encontrado'
                }

            # Preparar dados para atualização
            update_dict = {}

            # Campos permitidos para atualização
            allowed_fields = ['name', 'bio', 'avatar_url', 'preferences']

            for field in allowed_fields:
                if field in update_data and update_data[field] is not None:
                    update_dict[field] = update_data[field]

            # Se não há campos para atualizar
            if not update_dict:
                return {
                    'status': 'error',
                    'message': 'Nenhum campo válido para atualização'
                }

            # Adicionar timestamp de atualização
            update_dict['updated_at'] = datetime.utcnow()

            # Atualizar usuário
            db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_dict}
            )

            # Buscar usuário atualizado
            updated_user = db.users.find_one({'_id': ObjectId(user_id)})

            # Preparar dados do usuário (sem a senha)
            return self._prepare_user_data(updated_user)

        except Exception as e:
            logger.error(f"Erro ao atualizar perfil: {str(e)}")
            raise

    def logout_user(self, user_id, token=None):
        """
        Realiza o logout do usuário, invalidando tokens

        Args:
            user_id (str): ID do usuário
            token (str, optional): Token JWT a ser revogado

        Returns:
            dict: Resultado da operação
        """
        try:
            # Importar datetime do módulo correto
            from datetime import datetime

            db = get_db()

            # Revogar token JWT específico se fornecido
            if token:
                db.revoked_tokens.insert_one({
                    'token': token,
                    'user_id': ObjectId(user_id),
                    'revoked_at': datetime.utcnow()
                })

            return True

        except Exception as e:
            logger.error(f"Erro ao realizar logout: {str(e)}")
            raise

    def delete_user_account(self, user_id):
        """
        Exclui a conta de um usuário

        Args:
            user_id (str): ID do usuário

        Returns:
            bool: True se a exclusão foi bem-sucedida

        Raises:
            ValueError: Se o usuário não for encontrado
            Exception: Para outros erros
        """
        try:
            # Converter string para ObjectId se necessário
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)

            # Verificar se o usuário existe
            user = get_db().users.find_one({'_id': user_id})
            if not user:
                raise ValueError(f"Usuário com ID {user_id} não encontrado")

            # Excluir o usuário
            get_db().users.delete_one({'_id': user_id})

            # Limpar tokens relacionados ao usuário
            get_db().revoked_tokens.delete_many({'user_id': user_id})

            return True

        except Exception as e:
            logger.error(f"Erro ao excluir conta: {str(e)}")
            raise

    def _prepare_user_data(self, user):
        """
        Prepara os dados do usuário para retorno, removendo informações sensíveis

        Args:
            user (dict): Dados completos do usuário

        Returns:
            dict: Dados do usuário sem informações sensíveis
        """
        # Converter ObjectId para string
        user_data = dict(user)
        user_data['id'] = str(user_data['_id'])

        # Remover campos sensíveis
        sensitive_fields = ['password_hash', 'password', '_id']
        for field in sensitive_fields:
            if field in user_data:
                del user_data[field]

        return user_data


# Instância global do serviço
auth_service = AuthService()
