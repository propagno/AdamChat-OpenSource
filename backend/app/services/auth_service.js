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

# Configuração de logging
logger = logging.getLogger(__name__)


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

    # ... outros métodos existentes ...

    def generate_reset_code(self, email):
        """
        Gera um código de redefinição de senha para o email especificado
        
        Args:
            email (str): Email do usuário
            
        Returns:
            dict: Resultado da operação
        """
        try:
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
            logger.error(f"Erro ao gerar código de redefinição: {str(e)}", exc_info=True)
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
            password_hash = self._hash_password(new_password, password_salt)
            
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