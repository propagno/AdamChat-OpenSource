from flask import Blueprint, request, jsonify, current_app
from user_mongo_model import MongoUser
import jwt
import datetime
import os
from functools import wraps

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# JWT Secret (em produção, usar variável de ambiente)
JWT_SECRET = os.environ.get(
    'JWT_SECRET', 'um_segredo_muito_seguro_para_desenvolvimento_adamchat')
JWT_EXPIRATION = datetime.timedelta(days=1)  # Token válido por 1 dia


def generate_token(user):
    """
    Gera um token JWT para o usuário
    """
    payload = {
        'user_id': user['_id'],
        'email': user['email'],
        'exp': datetime.datetime.utcnow() + JWT_EXPIRATION
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
    return token


def token_required(f):
    """
    Decorador para proteger rotas que exigem autenticação
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Buscar token no cabeçalho Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Token de autenticação não fornecido'}), 401

        try:
            # Decodificar token
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            current_user = MongoUser.get_user_by_id(data['user_id'])

            if not current_user['success']:
                return jsonify({'message': 'Token inválido'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expirado'}), 401
        except Exception as e:
            return jsonify({'message': f'Erro ao decodificar token: {str(e)}'}), 401

        return f(current_user['user'], *args, **kwargs)

    return decorated


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Endpoint para registro de novos usuários no MongoDB
    """
    if not request.is_json:
        return jsonify({'status': 'error', 'message': 'Requisição deve ser JSON'}), 400

    data = request.get_json()

    # Validar campos obrigatórios
    if not all(k in data for k in ('email', 'password')):
        return jsonify({'status': 'error', 'message': 'Campos obrigatórios ausentes'}), 400

    # Criar usuário
    result = MongoUser.create_user(
        email=data['email'],
        password=data['password'],
        name=data.get('name'),
        username=data.get('username')
    )

    if result['success']:
        # Gerar token JWT para o usuário
        token = generate_token(result['user'])

        return jsonify({
            'status': 'ok',
            'message': 'Usuário criado com sucesso',
            'user': result['user'],
            'access_token': token
        }), 201
    else:
        return jsonify({
            'status': 'error',
            'message': result['message']
        }), 400


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint para login de usuários
    """
    if not request.is_json:
        return jsonify({
            'status': 'ok',
            'message': 'Função de login ativada',
            'note': 'Esta é uma função de exemplo para documentação'
        }), 200

    data = request.get_json()

    # Validar campos obrigatórios
    if not all(k in data for k in ('email', 'password')):
        return jsonify({'status': 'error', 'message': 'Email e senha são obrigatórios'}), 400

    # Autenticar usuário
    result = MongoUser.authenticate(data['email'], data['password'])

    if result['success']:
        # Gerar token JWT
        token = generate_token(result['user'])

        return jsonify({
            'status': 'ok',
            'message': 'Login realizado com sucesso',
            'user': result['user'],
            'access_token': token
        }), 200
    else:
        return jsonify({
            'status': 'error',
            'message': result['message']
        }), 401


@auth_bp.route('/status', methods=['GET'])
def auth_status():
    """
    Verifica o status da autenticação
    """
    return jsonify({
        'status': 'ok',
        'message': 'Sistema de autenticação verificado com sucesso',
        'auth_type': 'jwt',
        'emergency_mode': False
    })


@auth_bp.route('/user', methods=['GET'])
@token_required
def get_user(current_user):
    """
    Retorna os dados do usuário atual (requer autenticação)
    """
    return jsonify({
        'status': 'ok',
        'user': current_user
    })


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Endpoint para logout (invalidação de tokens)
    """
    # No lado do servidor, não há necessidade de invalidar tokens JWT
    # A responsabilidade é do cliente remover o token armazenado

    return jsonify({
        'status': 'ok',
        'message': 'Logout realizado com sucesso'
    })
