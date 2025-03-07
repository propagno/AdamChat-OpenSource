"""
Rotas relacionadas à autenticação e gerenciamento de usuários
"""

import os
import logging
from flask import Blueprint, jsonify, request, current_app
from app.middlewares.auth import token_required, admin_required
from app.services.auth_service import auth_service

# Configuração de logging
logger = logging.getLogger(__name__)

# Blueprint para rotas de autenticação
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/ping', methods=['GET', 'POST'])
def ping():
    """
    Endpoint simples para testar conectividade com a API
    ---
    tags:
      - Autenticação
    summary: Testa conectividade com a API
    description: Endpoint para verificar se a API está acessível
    responses:
      200:
        description: API está funcionando corretamente
    """
    try:
        # Logging para diagnóstico
        logger.info("Ping recebido")

        # Se for POST, mostrar o corpo da requisição para diagnóstico
        if request.method == 'POST':
            if request.is_json:
                data = request.get_json()
                logger.info(f"Dados recebidos: {data}")
                return jsonify({
                    'status': 'ok',
                    'message': 'Ping recebido com sucesso',
                    'method': 'POST',
                    'received_data': data
                })
            else:
                logger.warning("Requisição POST sem JSON válido")
                return jsonify({
                    'status': 'ok',
                    'message': 'Ping recebido, mas sem dados JSON válidos',
                    'method': 'POST',
                    'content_type': request.content_type
                })

        # Para GET, resposta simples
        return jsonify({
            'status': 'ok',
            'message': 'Servidor está online',
            'method': 'GET'
        })
    except Exception as e:
        logger.error(f"Erro no endpoint ping: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao processar ping: {str(e)}'
        }), 500


@auth_bp.route('/status', methods=['GET'])
def auth_status():
    """
    Verifica o status do servidor de autenticação
    ---
    tags:
      - Autenticação
    summary: Verifica o status do sistema de autenticação
    description: Retorna informações sobre o estado atual do sistema de autenticação
    responses:
      200:
        description: Status do sistema de autenticação
        schema:
          properties:
            status:
              type: string
              description: Status da operação (ok, error)
            message:
              type: string
              description: Mensagem descritiva
            emergency_mode:
              type: boolean
              description: Indica se o modo de emergência está ativado
            auth_type:
              type: string
              description: Tipo de autenticação utilizado
      500:
        description: Erro interno do servidor
        schema:
          properties:
            status:
              type: string
              enum: [error]
            message:
              type: string
            error:
              type: string
            emergency_mode:
              type: boolean
    """
    try:
        # Status da aplicação
        emergency_mode = current_app.config.get('EMERGENCY_MODE', False)

        return jsonify({
            'status': 'ok',
            'message': 'Sistema de autenticação verificado com sucesso',
            'emergency_mode': emergency_mode,
            'auth_type': 'jwt'
        })
    except Exception as e:
        logger.error(
            f"Erro ao verificar status da autenticação: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': 'Erro ao verificar status da autenticação',
            'error': str(e),
            'emergency_mode': current_app.config.get('EMERGENCY_MODE', False)
        }), 500


@auth_bp.route('/check', methods=['GET'])
@token_required
def check_auth(user_data):
    """
    Endpoint para verificar se o token é válido
    ---
    tags:
      - Autenticação
    summary: Verifica a validade do token de autenticação
    description: Valida o token JWT fornecido e retorna os dados do usuário
    security:
      - Bearer: []
    responses:
      200:
        description: Token válido
        schema:
          properties:
            authenticated:
              type: boolean
              description: Indica se o usuário está autenticado
            user:
              type: object
              properties:
                sub:
                  type: string
                  description: ID do usuário
                email:
                  type: string
                  description: Email do usuário
                name:
                  type: string
                  description: Nome do usuário
                roles:
                  type: array
                  items:
                    type: string
                  description: Papéis/permissões do usuário
            status:
              type: string
              enum: [ok]
      401:
        description: Token inválido ou expirado
      500:
        description: Erro interno do servidor
    """
    try:
        # Filtrar apenas os dados que desejamos expor
        user_info = {
            'sub': user_data.get('sub'),
            'email': user_data.get('email'),
            'name': user_data.get('name'),
            'roles': user_data.get('roles', [])
        }

        return jsonify({
            'authenticated': True,
            'user': user_info,
            'status': 'ok'
        })
    except Exception as e:
        logger.error(
            f"Erro ao verificar autenticação: {str(e)}", exc_info=True)
        return jsonify({
            'authenticated': False,
            'status': 'error',
            'message': 'Erro ao verificar autenticação',
            'error': str(e)
        }), 500


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Registra um novo usuário
    ---
    tags:
      - Autenticação
    summary: Cria uma nova conta de usuário
    description: Registra um novo usuário no sistema com os dados fornecidos
    parameters:
      - in: body
        name: user
        description: Dados do usuário a ser registrado
        required: true
        schema:
          type: object
          required:
            - username
            - email
            - password
          properties:
            username:
              type: string
              description: Nome de usuário (único)
            email:
              type: string
              description: Email do usuário (único)
            password:
              type: string
              description: Senha do usuário
            first_name:
              type: string
              description: Nome do usuário
            last_name:
              type: string
              description: Sobrenome do usuário
    responses:
      201:
        description: Usuário registrado com sucesso
        schema:
          properties:
            status:
              type: string
              enum: [success]
            message:
              type: string
            user:
              type: object
              properties:
                id:
                  type: string
                username:
                  type: string
                email:
                  type: string
      400:
        description: Dados inválidos ou usuário já existe
        schema:
          properties:
            status:
              type: string
              enum: [error]
            message:
              type: string
      500:
        description: Erro interno do servidor
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Dados não fornecidos'
            }), 400

        # Registrar usuário usando o serviço de autenticação
        result = auth_service.register_user(data)

        if result['status'] == 'success':
            return jsonify(result), 201
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(f"Erro ao registrar usuário: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao registrar usuário: {str(e)}'
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Autentica um usuário e retorna tokens de acesso e refresh
    ---
    tags:
      - Autenticação
    summary: Realiza login do usuário
    description: Autentica o usuário e retorna tokens de acesso e refresh
    parameters:
      - in: body
        name: credentials
        description: Credenciais de login
        required: true
        schema:
          type: object
          required:
            - password
          properties:
            username:
              type: string
              description: Nome de usuário
            email:
              type: string
              description: Email (alternativa ao username)
            password:
              type: string
              description: Senha do usuário
    responses:
      200:
        description: Autenticação bem-sucedida
      400:
        description: Dados inválidos
      401:
        description: Credenciais inválidas
      500:
        description: Erro interno do servidor
    """
    try:
        # Logging detalhado para diagnóstico
        content_type = request.content_type
        method = request.method
        headers = {k: v for k, v in request.headers.items()
                   if k.lower() not in ['authorization', 'cookie']}

        logger.info(
            f"Login attempt: method={method}, content-type={content_type}")
        logger.info(f"Request headers: {headers}")

        # Log do corpo da requisição bruto para diagnóstico
        raw_data = request.get_data()
        logger.info(f"Raw request data: {raw_data}")

        # Tentar processar diferentes formatos
        request_data = None

        # Verificar se conteúdo está em formato JSON
        if request.is_json:
            try:
                request_data = request.get_json()
                logger.info(f"JSON data parsed successfully: {request_data}")
            except Exception as json_err:
                logger.error(f"Error parsing JSON: {str(json_err)}")
                return jsonify({
                    'status': 'error',
                    'message': f'Error parsing JSON: {str(json_err)}',
                    'debug_info': {
                        'content_type': content_type,
                        'raw_data': str(raw_data)[:200] + ('...' if len(raw_data) > 200 else '')
                    }
                }), 400
        # Se não for JSON, tentar form data
        elif content_type and 'application/x-www-form-urlencoded' in content_type:
            request_data = request.form.to_dict()
            logger.info(f"Form data parsed: {request_data}")
        # Último recurso: tentar processar os dados brutos
        else:
            try:
                # Tentar decodificar como JSON independente do content-type
                import json
                request_data = json.loads(raw_data.decode('utf-8'))
                logger.info(f"Manual JSON parsing successful: {request_data}")
            except Exception as raw_err:
                logger.error(f"Failed to parse raw data: {str(raw_err)}")
                return jsonify({
                    'status': 'error',
                    'message': 'Formato de requisição inválido. Esperado application/json',
                    'debug_info': {
                        'content_type': content_type,
                        'raw_data': str(raw_data)[:200] + ('...' if len(raw_data) > 200 else '')
                    }
                }), 400

        # Se não conseguimos obter dados de nenhuma forma
        if not request_data:
            return jsonify({
                'status': 'error',
                'message': 'Dados não fornecidos ou em formato inválido',
                'debug_info': {
                    'content_type': content_type,
                    'headers': headers
                }
            }), 400

        # Validar campos obrigatórios
        if 'username' not in request_data and 'email' not in request_data:
            return jsonify({
                'status': 'error',
                'message': 'Username ou email é obrigatório'
            }), 400

        if 'password' not in request_data:
            return jsonify({
                'status': 'error',
                'message': 'Senha é obrigatória'
            }), 400

        # Autenticar usuário
        username_or_email = request_data.get(
            'username', request_data.get('email'))
        result = auth_service.authenticate(
            username_or_email, request_data['password'])

        if result['status'] == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 401

    except Exception as e:
        logger.error(f"Erro na autenticação: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro na autenticação: {str(e)}'
        }), 500


@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """
    Atualiza o token de acesso usando um token de refresh
    ---
    tags:
      - Autenticação
    summary: Renova o token de acesso
    description: Gera um novo token de acesso usando um token de atualização válido
    parameters:
      - in: body
        name: refresh
        description: Token de atualização
        required: true
        schema:
          type: object
          required:
            - refresh_token
          properties:
            refresh_token:
              type: string
              description: Token de atualização JWT
    responses:
      200:
        description: Token renovado com sucesso
        schema:
          properties:
            status:
              type: string
              enum: [success]
            message:
              type: string
            tokens:
              type: object
              properties:
                access_token:
                  type: string
                  description: Novo token de acesso JWT
                refresh_token:
                  type: string
                  description: Novo token de atualização JWT
      400:
        description: Token de atualização não fornecido
      401:
        description: Token de atualização inválido ou expirado
      500:
        description: Erro interno do servidor
    """
    try:
        data = request.get_json()

        if not data or 'refresh_token' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Token de refresh não fornecido'
            }), 400

        # Atualizar token
        result = auth_service.refresh_token(data['refresh_token'])

        if result['status'] == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 401

    except Exception as e:
        logger.error(f"Erro ao atualizar token: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao atualizar token: {str(e)}'
        }), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Realiza o logout do usuário invalidando o refresh token
    ---
    tags:
      - Autenticação
    summary: Realiza logout do usuário
    description: Invalida o token de atualização fornecido, efetivamente realizando o logout do usuário
    parameters:
      - in: body
        name: refresh
        description: Token de atualização a ser invalidado
        required: true
        schema:
          type: object
          required:
            - refresh_token
          properties:
            refresh_token:
              type: string
              description: Token de atualização JWT
    responses:
      200:
        description: Logout realizado com sucesso
        schema:
          properties:
            status:
              type: string
              enum: [success, warning]
            message:
              type: string
      400:
        description: Token de atualização não fornecido
      500:
        description: Erro interno do servidor
    """
    try:
        data = request.get_json()

        if not data or 'refresh_token' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Token de refresh não fornecido'
            }), 400

        # Realizar logout
        result = auth_service.logout(data['refresh_token'])

        return jsonify(result)

    except Exception as e:
        logger.error(f"Erro ao realizar logout: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao realizar logout: {str(e)}'
        }), 500


@auth_bp.route('/users', methods=['POST'])
@token_required
@admin_required
def create_user(user_data):
    """
    Cria um novo usuário
    Requer autenticação e papel de administrador
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Dados não fornecidos'
            }), 400

        # Registrar usuário usando o serviço de autenticação
        result = auth_service.register_user(data)

        if result['status'] == 'success':
            return jsonify(result), 201
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(f"Erro ao criar usuário: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao criar usuário: {str(e)}'
        }), 500


@auth_bp.route('/users/<user_id>', methods=['GET'])
@token_required
def get_user(user_data, user_id):
    """
    Obtém os dados de um usuário
    Requer autenticação
    """
    try:
        # Verificar se o usuário está buscando seus próprios dados ou é admin
        is_admin = 'admin' in user_data.get('roles', [])
        is_self = user_id == user_data.get('sub')

        if not is_admin and not is_self:
            return jsonify({
                'status': 'error',
                'message': 'Permissão negada'
            }), 403

        # Buscar usuário
        user = auth_service.get_user_by_id(user_id)

        if user:
            return jsonify({
                'status': 'success',
                'user': user
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Usuário não encontrado'
            }), 404

    except Exception as e:
        logger.error(f"Erro ao buscar usuário: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao buscar usuário: {str(e)}'
        }), 500


@auth_bp.route('/users/<user_id>', methods=['PUT'])
@token_required
def update_user(user_data, user_id):
    """
    Atualiza os dados de um usuário
    Requer autenticação
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Dados não fornecidos'
            }), 400

        # Verificar se o usuário está atualizando seus próprios dados ou é admin
        is_admin = 'admin' in user_data.get('roles', [])
        is_self = user_id == user_data.get('sub')

        if not is_admin and not is_self:
            return jsonify({
                'status': 'error',
                'message': 'Permissão negada'
            }), 403

        # Atualizar usuário
        result = auth_service.update_user(user_id, data)

        if result['status'] == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(f"Erro ao atualizar usuário: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao atualizar usuário: {str(e)}'
        }), 500


@auth_bp.route('/users/<user_id>/roles', methods=['PUT'])
@token_required
@admin_required
def update_user_roles(user_data, user_id):
    """
    Atualiza os papéis (roles) de um usuário
    Requer autenticação e papel de administrador
    """
    try:
        data = request.get_json()

        if not data or 'roles' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Papéis (roles) não fornecidos'
            }), 400

        # Atualizar papéis
        result = auth_service.change_user_role(
            user_id,
            data['roles'],
            user_data.get('sub')
        )

        if result['status'] == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(
            f"Erro ao atualizar papéis do usuário: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao atualizar papéis do usuário: {str(e)}'
        }), 500


@auth_bp.route('/admin/setup', methods=['POST'])
def setup_admin():
    """
    Configura o primeiro usuário administrador
    Só funciona se não existir nenhum administrador
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Dados não fornecidos'
            }), 400

        # Criar administrador
        result = auth_service.create_admin_user(data)

        if result['status'] == 'success':
            return jsonify(result), 201
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(
            f"Erro ao configurar administrador: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao configurar administrador: {str(e)}'
        }), 500


@auth_bp.route('/reset-password', methods=['POST'])
@token_required
@admin_required
def reset_password(user_data):
    """
    Redefine a senha de um usuário
    Requer autenticação e papel de administrador
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Dados não fornecidos'
            }), 400

        # Validar campos obrigatórios
        if 'email' not in data and 'userId' not in data:
            return jsonify({
                'status': 'error',
                'message': 'É necessário fornecer email ou userId'
            }), 400

        if 'password' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Nova senha não fornecida'
            }), 400

        # Buscar usuário por ID ou email
        user_id = data.get('userId')
        if not user_id and 'email' in data:
            from app.db import get_db
            db = get_db()
            user = db.users.find_one({'email': data['email']})
            if user:
                user_id = str(user['_id'])

        if not user_id:
            return jsonify({
                'status': 'error',
                'message': 'Usuário não encontrado'
            }), 404

        # Atualizar senha
        update_data = {'password': data['password']}
        result = auth_service.update_user(user_id, update_data)

        if result['status'] == 'success':
            return jsonify({
                'status': 'success',
                'message': 'Senha redefinida com sucesso'
            })
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(f"Erro ao redefinir senha: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao redefinir senha: {str(e)}'
        }), 500


@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(user_data):
    """
    Permite que um usuário altere sua própria senha
    Requer autenticação
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Dados não fornecidos'
            }), 400

        # Validar campos obrigatórios
        if 'currentPassword' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Senha atual não fornecida'
            }), 400

        if 'newPassword' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Nova senha não fornecida'
            }), 400

        # Verificar senha atual
        user_id = user_data.get('sub')
        from app.db import get_db
        db = get_db()
        user = db.users.find_one({'_id': ObjectId(user_id)})

        if not user:
            return jsonify({
                'status': 'error',
                'message': 'Usuário não encontrado'
            }), 404

        if not auth_service.verify_password(
            user['password_hash'],
            user['password_salt'],
            data['currentPassword']
        ):
            return jsonify({
                'status': 'error',
                'message': 'Senha atual incorreta'
            }), 401

        # Atualizar senha
        update_data = {'password': data['newPassword']}
        result = auth_service.update_user(user_id, update_data)

        if result['status'] == 'success':
            return jsonify({
                'status': 'success',
                'message': 'Senha alterada com sucesso'
            })
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(f"Erro ao alterar senha: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao alterar senha: {str(e)}'
        }), 500


@auth_bp.route('/request-reset', methods=['POST'])
def request_password_reset():
    """
    Solicita um código para redefinição de senha
    ---
    tags:
      - Recuperação de Senha
    summary: Solicita código de recuperação de senha
    description: Envia um código de verificação para o email do usuário para redefinição de senha
    parameters:
      - in: body
        name: email_data
        description: Email do usuário
        required: true
        schema:
          type: object
          required:
            - email
          properties:
            email:
              type: string
              description: Email cadastrado do usuário
    responses:
      200:
        description: Código enviado com sucesso
        schema:
          properties:
            status:
              type: string
              enum: [success]
            message:
              type: string
      400:
        description: Email não fornecido ou inválido
      404:
        description: Usuário não encontrado
      500:
        description: Erro interno do servidor
    """
    try:
        data = request.get_json()

        if not data or 'email' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Email não fornecido'
            }), 400

        email = data['email']

        # Gerar e enviar código de redefinição de senha
        result = auth_service.generate_reset_code(email)

        if result['status'] == 'success':
            return jsonify(result)
        elif result['status'] == 'error' and 'não encontrado' in result.get('message', ''):
            return jsonify(result), 404
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(
            f"Erro ao solicitar redefinição de senha: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao solicitar redefinição de senha: {str(e)}'
        }), 500


@auth_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    """
    Verifica se um código de redefinição de senha é válido
    ---
    tags:
      - Recuperação de Senha
    summary: Verifica código de recuperação de senha
    description: Valida o código de verificação enviado ao email do usuário
    parameters:
      - in: body
        name: verification_data
        description: Dados de verificação
        required: true
        schema:
          type: object
          required:
            - email
            - reset_code
          properties:
            email:
              type: string
              description: Email do usuário
            reset_code:
              type: string
              description: Código de verificação recebido por email
    responses:
      200:
        description: Código verificado com sucesso
        schema:
          properties:
            status:
              type: string
              enum: [success]
            message:
              type: string
      400:
        description: Dados inválidos ou incompletos
      401:
        description: Código inválido ou expirado
      500:
        description: Erro interno do servidor
    """
    try:
        data = request.get_json()

        if not data or 'email' not in data or 'reset_code' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Email ou código não fornecidos'
            }), 400

        email = data['email']
        reset_code = data['reset_code']

        # Verificar código de redefinição
        result = auth_service.verify_reset_code(email, reset_code)

        if result['status'] == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 401

    except Exception as e:
        logger.error(
            f"Erro ao verificar código de redefinição: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao verificar código de redefinição: {str(e)}'
        }), 500


@auth_bp.route('/reset-password', methods=['POST'])
def public_reset_password():
    """
    Redefine a senha do usuário com um código válido
    ---
    tags:
      - Recuperação de Senha
    summary: Redefine a senha do usuário
    description: Define uma nova senha para o usuário após validação do código de verificação
    parameters:
      - in: body
        name: reset_data
        description: Dados para redefinição de senha
        required: true
        schema:
          type: object
          required:
            - email
            - reset_code
            - new_password
          properties:
            email:
              type: string
              description: Email do usuário
            reset_code:
              type: string
              description: Código de verificação válido
            new_password:
              type: string
              description: Nova senha do usuário
    responses:
      200:
        description: Senha redefinida com sucesso
        schema:
          properties:
            status:
              type: string
              enum: [success]
            message:
              type: string
      400:
        description: Dados inválidos ou incompletos
      401:
        description: Código inválido ou expirado
      500:
        description: Erro interno do servidor
    """
    try:
        data = request.get_json()

        if not data or 'email' not in data or 'reset_code' not in data or 'new_password' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Dados incompletos para redefinição de senha'
            }), 400

        email = data['email']
        reset_code = data['reset_code']
        new_password = data['new_password']

        # Verificar força da senha
        if len(new_password) < 8:
            return jsonify({
                'status': 'error',
                'message': 'A senha deve ter pelo menos 8 caracteres'
            }), 400

        # Redefinir senha
        result = auth_service.reset_password(email, reset_code, new_password)

        if result['status'] == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 401

    except Exception as e:
        logger.error(f"Erro ao redefinir senha: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao redefinir senha: {str(e)}'
        }), 500


# Alias para forgot-password (redireciona para request-reset)
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Alias para a rota de redefinição de senha (request-reset)
    ---
    tags:
      - Recuperação de Senha
    summary: Solicita código de recuperação de senha
    description: Alias para a rota /request-reset
    parameters:
      - in: body
        name: email_data
        description: Email do usuário
        required: true
        schema:
          type: object
          required:
            - email
          properties:
            email:
              type: string
              description: Email cadastrado do usuário
    responses:
      200:
        description: Código enviado com sucesso
    """
    return request_password_reset()
