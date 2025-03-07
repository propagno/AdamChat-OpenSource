"""
Endpoints de autenticação refatorados
Com documentação aprimorada usando Swagger/OpenAPI e validação de dados
"""

import os
import logging
from flask import Blueprint, jsonify, request, current_app, g
from app.middlewares.auth import token_required, admin_required
from app.services.auth_service import auth_service
from app.utils.request_utils import get_json_data
from flasgger import swag_from

# Configuração de logging
logger = logging.getLogger(__name__)

# Blueprint para rotas de autenticação
auth_bp = Blueprint('auth_v2', __name__, url_prefix='/api/auth/v2')

# Definir schemas de erros para documentação
ErrorSchema = {
    'type': 'object',
    'properties': {
        'status': {'type': 'string', 'enum': ['error']},
        'message': {'type': 'string'}
    }
}

ValidationErrorSchema = {
    'type': 'object',
    'properties': {
        'status': {'type': 'string', 'enum': ['error']},
        'message': {'type': 'string'},
        'errors': {'type': 'object'}
    }
}

AuthErrorSchema = {
    'type': 'object',
    'properties': {
        'status': {'type': 'string', 'enum': ['error']},
        'message': {'type': 'string'},
        'code': {'type': 'string', 'enum': ['token_expired', 'invalid_token', 'missing_token']}
    }
}


@auth_bp.route('/status', methods=['GET'])
@swag_from({
    'tags': ['Auth'],
    'summary': 'Verifica o status do sistema de autenticação',
    'description': 'Retorna informações sobre o estado atual do sistema de autenticação',
    'responses': {
        200: {
            'description': 'Status do sistema de autenticação',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['ok', 'error']},
                    'message': {'type': 'string'},
                    'emergency_mode': {'type': 'boolean'},
                    'auth_type': {'type': 'string'}
                }
            }
        },
        500: {
            'description': 'Erro interno do servidor',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['error']},
                    'message': {'type': 'string'}
                }
            }
        }
    }
})
def auth_status():
    """Verifica o status do servidor de autenticação"""
    try:
        # Verificar status do serviço de autenticação
        status_info = auth_service.get_auth_status()
        return jsonify(status_info), 200
    except Exception as e:
        logger.error(f"Erro ao verificar status de autenticação: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erro ao verificar status do serviço de autenticação'
        }), 500


@auth_bp.route('/register', methods=['POST'])
@swag_from({
    'tags': ['Auth'],
    'summary': 'Registra um novo usuário',
    'description': 'Cria uma nova conta de usuário no sistema',
    'requestBody': {
        'description': 'Dados do novo usuário',
        'required': True,
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'username': {'type': 'string', 'minLength': 3, 'maxLength': 80},
                        'email': {'type': 'string', 'format': 'email'},
                        'password': {'type': 'string', 'minLength': 8, 'maxLength': 128},
                        'name': {'type': 'string'},
                        'language': {'type': 'string', 'minLength': 2, 'maxLength': 5},
                        'theme': {'type': 'string', 'enum': ['light', 'dark']}
                    },
                    'required': ['username', 'email', 'password']
                }
            }
        }
    },
    'responses': {
        201: {
            'description': 'Usuário registrado com sucesso',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['success']},
                    'message': {'type': 'string'},
                    'user_id': {'type': 'string'}
                }
            }
        },
        400: {
            'description': 'Dados inválidos',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['error']},
                    'message': {'type': 'string'},
                    'errors': {'type': 'object'}
                }
            }
        },
        409: {
            'description': 'Usuário já existe',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['error']},
                    'message': {'type': 'string'}
                }
            }
        },
        500: {
            'description': 'Erro interno do servidor',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['error']},
                    'message': {'type': 'string'}
                }
            }
        }
    }
})
def register():
    """Registra um novo usuário no sistema"""
    try:
        # Obter dados da requisição
        data = request.json
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Dados inválidos',
                'errors': 'No JSON data provided'
            }), 400

        # Validar campos obrigatórios
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': 'Dados inválidos',
                    'errors': f'Field {field} is required'
                }), 400

        # Registrar usuário
        user = auth_service.register_user(data)

        # Incluir user_id para compatibilidade com os testes
        return jsonify({
            'status': 'success',
            'message': 'Usuário criado com sucesso',
            'user': user,
            'user_id': str(user.get('_id', user.get('id', '')))
        }), 201
    except ValueError as e:
        logger.warning(f"Conflito no registro: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 409
    except Exception as e:
        logger.error(f"Erro ao registrar usuário: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Erro ao registrar usuário: {str(e)}'
        }), 500


@auth_bp.route('/login', methods=['POST'])
@swag_from({
    'tags': ['Auth'],
    'summary': 'Realiza login de usuário',
    'description': 'Autentica um usuário e retorna tokens de acesso',
    'requestBody': {
        'description': 'Credenciais de login',
        'required': True,
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'email': {'type': 'string', 'format': 'email'},
                        'password': {'type': 'string'}
                    },
                    'required': ['email', 'password']
                }
            }
        }
    },
    'responses': {
        200: {
            'description': 'Login bem-sucedido',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['success']},
                    'message': {'type': 'string'},
                    'token': {
                        'type': 'object',
                        'properties': {
                            'access_token': {'type': 'string'},
                            'refresh_token': {'type': 'string'},
                            'token_type': {'type': 'string', 'enum': ['Bearer']},
                            'expires_in': {'type': 'integer'}
                        }
                    },
                    'user': {'type': 'object'}
                }
            }
        },
        400: {
            'description': 'Dados inválidos',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['error']},
                    'message': {'type': 'string'},
                    'errors': {'type': 'object'}
                }
            }
        },
        401: {
            'description': 'Credenciais inválidas',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['error']},
                    'message': {'type': 'string'}
                }
            }
        },
        500: {
            'description': 'Erro interno do servidor',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['error']},
                    'message': {'type': 'string'}
                }
            }
        }
    }
})
def login():
    """Realiza o login de um usuário"""
    # Validar dados de entrada usando schema
    schema = UserLoginSchema()
    try:
        # Validar dados de entrada
        data = schema.load(request.json)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Dados inválidos',
            'errors': e.messages if hasattr(e, 'messages') else {'_general': str(e)}
        }), 400

    try:
        # Realizar login
        result = auth_service.login_user(
            email=data['email'],
            password=data['password']
        )

        if result.get('status') == 'error':
            return jsonify(result), 401

        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Erro ao realizar login: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erro ao realizar login'
        }), 500


@auth_bp.route('/refresh', methods=['POST'])
@swag_from({
    'tags': ['Auth'],
    'summary': 'Renova token de acesso',
    'description': 'Renova um token de acesso utilizando o token de refresh',
    'requestBody': {
        'description': 'Token de refresh',
        'required': True,
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'refresh_token': {'type': 'string'}
                    },
                    'required': ['refresh_token']
                }
            }
        }
    },
    'responses': {
        200: {
            'description': 'Token renovado com sucesso',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['success']},
                    'message': {'type': 'string'},
                    'token': {
                        'type': 'object',
                        'properties': {
                            'access_token': {'type': 'string'},
                            'refresh_token': {'type': 'string'},
                            'token_type': {'type': 'string', 'enum': ['Bearer']},
                            'expires_in': {'type': 'integer'}
                        }
                    }
                }
            }
        },
        400: {
            'description': 'Dados inválidos',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['error']},
                    'message': {'type': 'string'}
                }
            }
        },
        401: {
            'description': 'Token inválido ou expirado',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['error']},
                    'message': {'type': 'string'}
                }
            }
        },
        500: {
            'description': 'Erro interno do servidor',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['error']},
                    'message': {'type': 'string'}
                }
            }
        }
    }
})
def refresh():
    """Renova tokens de acesso utilizando um token de refresh"""
    # Validar dados de entrada usando schema
    schema = RefreshTokenSchema()
    try:
        # Validar dados de entrada
        data = schema.load(request.json)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Dados inválidos'
        }), 400

    try:
        # Renovar token
        result = auth_service.refresh_token(
            refresh_token=data['refresh_token']
        )

        if result.get('status') == 'error':
            return jsonify(result), 401

        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Erro ao renovar token: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erro ao renovar token'
        }), 500


@auth_bp.route('/logout', methods=['POST'])
@swag_from({
    'tags': ['Auth'],
    'summary': 'Realiza logout de usuário',
    'description': 'Invalida os tokens de acesso do usuário',
    'parameters': [
        {
            'name': 'Authorization',
            'in': 'header',
            'type': 'string',
            'required': True,
            'description': 'Token de acesso no formato Bearer {token}'
        }
    ],
    'responses': {
        200: {
            'description': 'Logout realizado com sucesso',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['success']},
                    'message': {'type': 'string'}
                }
            }
        },
        401: {
            'description': 'Token inválido ou não fornecido',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['error']},
                    'message': {'type': 'string'}
                }
            }
        },
        500: {
            'description': 'Erro interno do servidor',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['error']},
                    'message': {'type': 'string'}
                }
            }
        }
    }
})
def logout():
    """Realiza o logout do usuário"""
    # Obter token do cabeçalho
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({
            'status': 'error',
            'message': 'Token de acesso não fornecido'
        }), 401

    token = auth_header.split(' ')[1]

    try:
        # Realizar logout
        result = auth_service.logout_user(token)

        if result.get('status') == 'error':
            return jsonify(result), 401

        return jsonify({
            'status': 'success',
            'message': 'Logout realizado com sucesso'
        }), 200
    except Exception as e:
        logger.error(f"Erro ao realizar logout: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erro ao realizar logout'
        }), 500


@auth_bp.route('/user', methods=['GET'])
@token_required
@swag_from({
    'tags': ['Auth'],
    'summary': 'Obtém informações do usuário atual',
    'description': 'Retorna os dados do usuário autenticado',
    'security': [{'Bearer': []}],
    'responses': {
        200: {
            'description': 'Informações do usuário',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'string'},
                    'username': {'type': 'string'},
                    'email': {'type': 'string'},
                    'name': {'type': 'string'},
                    'roles': {'type': 'array', 'items': {'type': 'string'}}
                }
            }
        },
        401: {
            'description': 'Não autorizado',
            'schema': ErrorSchema
        },
        500: {
            'description': 'Erro interno do servidor',
            'schema': ErrorSchema
        }
    }
})
def get_user_info():
    """Retorna informações do usuário autenticado"""
    try:
        # Obter usuário da requisição (definido pelo middleware token_required)
        user = getattr(g, 'user', None)
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'Usuário não encontrado'
            }), 404

        # Retornar informações do usuário
        # Garantir que o formato inclua um campo 'id' para compatibilidade
        if '_id' in user and 'id' not in user:
            user['id'] = str(user['_id'])

        return jsonify(user), 200
    except Exception as e:
        logger.error(f"Erro ao obter informações do usuário: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Erro ao obter informações do usuário: {str(e)}'
        }), 500


@auth_bp.route('/update-profile', methods=['PUT'])
@token_required
@swag_from({
    'tags': ['Auth'],
    'summary': 'Atualiza o perfil do usuário',
    'description': 'Atualiza as informações do usuário autenticado',
    'security': [{'Bearer': []}],
    'requestBody': {
        'description': 'Dados a serem atualizados',
        'required': True,
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'name': {'type': 'string'},
                        'language': {'type': 'string'},
                        'theme': {'type': 'string'}
                    }
                }
            }
        }
    },
    'responses': {
        200: {
            'description': 'Perfil atualizado com sucesso',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string'},
                    'message': {'type': 'string'},
                    'user': {'type': 'object'}
                }
            }
        },
        400: {
            'description': 'Dados inválidos',
            'schema': ValidationErrorSchema
        },
        401: {
            'description': 'Não autorizado',
            'schema': ErrorSchema
        },
        500: {
            'description': 'Erro interno do servidor',
            'schema': ErrorSchema
        }
    }
})
def update_profile():
    """Atualiza o perfil do usuário autenticado"""
    try:
        # Obter usuário da requisição
        user = getattr(g, 'user', None)
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'Usuário não encontrado'
            }), 404

        # Obter dados da requisição
        data = request.json
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Nenhum dado fornecido para atualização'
            }), 400

        # Campos permitidos para atualização
        allowed_fields = ['name', 'language', 'theme']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        # Atualizar usuário
        updated_user = auth_service.update_user_profile(
            user.get('id') or user.get('_id'), update_data)

        # Garantir que o formato inclua um campo 'id' para compatibilidade
        if '_id' in updated_user and 'id' not in updated_user:
            updated_user['id'] = str(updated_user['_id'])

        return jsonify({
            'status': 'success',
            'message': 'Perfil atualizado com sucesso',
            'user': updated_user
        }), 200
    except ValueError as e:
        logger.warning(f"Erro de validação ao atualizar perfil: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Erro ao atualizar perfil: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Erro ao atualizar perfil: {str(e)}'
        }), 500


@auth_bp.route('/refresh-token', methods=['POST'])
@swag_from({
    'tags': ['Auth'],
    'summary': 'Renova um token de acesso',
    'description': 'Utilizando um refresh token válido, gera um novo token de acesso',
    'requestBody': {
        'description': 'Refresh token',
        'required': True,
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'refresh_token': {'type': 'string'}
                    },
                    'required': ['refresh_token']
                }
            }
        }
    },
    'responses': {
        200: {
            'description': 'Token renovado com sucesso',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string'},
                    'access_token': {'type': 'string'},
                    'refresh_token': {'type': 'string'},
                    'expires_in': {'type': 'integer'}
                }
            }
        },
        400: {
            'description': 'Dados inválidos',
            'schema': ValidationErrorSchema
        },
        401: {
            'description': 'Token inválido ou expirado',
            'schema': AuthErrorSchema
        },
        500: {
            'description': 'Erro interno do servidor',
            'schema': ErrorSchema
        }
    }
})
def refresh_token():
    """Renova um token de acesso usando refresh token"""
    try:
        # Obter refresh token da requisição
        refresh_token = request.json.get('refresh_token')
        if not refresh_token:
            return jsonify({
                'status': 'error',
                'message': 'Refresh token não fornecido'
            }), 400

        # Renovar token
        tokens = auth_service.refresh_auth_token(refresh_token)

        return jsonify({
            'status': 'success',
            'message': 'Token renovado com sucesso',
            'access_token': tokens['access_token'],
            'refresh_token': tokens['refresh_token'],
            'expires_in': tokens.get('expires_in', 3600)
        }), 200
    except ValueError as e:
        logger.warning(f"Token inválido: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 401
    except Exception as e:
        logger.error(f"Erro ao renovar token: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Erro ao renovar token: {str(e)}'
        }), 500


@auth_bp.route('/delete-account', methods=['DELETE'])
@token_required
@swag_from({
    'tags': ['Auth'],
    'summary': 'Exclui a conta do usuário',
    'description': 'Remove permanentemente a conta do usuário autenticado',
    'security': [{'Bearer': []}],
    'responses': {
        200: {
            'description': 'Conta excluída com sucesso',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string'},
                    'message': {'type': 'string'}
                }
            }
        },
        401: {
            'description': 'Não autorizado',
            'schema': ErrorSchema
        },
        500: {
            'description': 'Erro interno do servidor',
            'schema': ErrorSchema
        }
    }
})
def delete_account():
    """Exclui a conta do usuário autenticado"""
    try:
        # Obter usuário da requisição
        user = getattr(g, 'user', None)
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'Usuário não encontrado'
            }), 404

        # Excluir a conta do usuário
        auth_service.delete_user_account(user.get('id') or user.get('_id'))

        return jsonify({
            'status': 'success',
            'message': 'Conta excluída com sucesso'
        }), 200
    except Exception as e:
        logger.error(f"Erro ao excluir conta: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Erro ao excluir conta: {str(e)}'
        }), 500

# Endpoint protegido para teste


@auth_bp.route('/protected/resource', methods=['GET'])
@token_required
@swag_from({
    'tags': ['Auth'],
    'summary': 'Endpoint protegido para teste',
    'description': 'Endpoint para testar a proteção de rotas',
    'security': [{'Bearer': []}],
    'responses': {
        200: {
            'description': 'Acesso autorizado',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['success']},
                    'message': {'type': 'string'},
                    'user_id': {'type': 'string'}
                }
            }
        },
        401: {
            'description': 'Não autorizado',
            'schema': ErrorSchema
        },
        500: {
            'description': 'Erro interno do servidor',
            'schema': ErrorSchema
        }
    }
})
def protected_resource():
    """Endpoint protegido para teste"""
    user = getattr(g, 'user', {})
    user_id = str(user.get('_id', '')) if user else ''

    return jsonify({
        'status': 'success',
        'message': 'Acesso autorizado ao recurso protegido',
        'user_id': user_id
    }), 200
