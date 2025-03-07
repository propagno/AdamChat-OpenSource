"""
Documentação Swagger para as rotas do backend.
Este arquivo define as especificações Swagger para as principais rotas da API.
"""

from flasgger import swag_from

# Definições Swagger para as rotas

health_check_spec = {
    'tags': ['Health'],
    'summary': 'Verifica a saúde do sistema',
    'description': 'Retorna informações sobre o status do backend',
    'responses': {
        200: {
            'description': 'Sistema saudável',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string'},
                    'version': {'type': 'string'},
                    'service': {'type': 'string'}
                }
            }
        }
    }
}

auth_status_spec = {
    'tags': ['Auth'],
    'summary': 'Verifica o status da autenticação',
    'description': 'Retorna informações sobre o status do sistema de autenticação',
    'responses': {
        200: {
            'description': 'Status da autenticação',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string'},
                    'message': {'type': 'string'},
                    'auth_type': {'type': 'string'},
                    'emergency_mode': {'type': 'boolean'}
                }
            }
        }
    }
}

login_spec = {
    'tags': ['Auth'],
    'summary': 'Login de usuário',
    'description': 'Autentica um usuário e retorna tokens de acesso',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'required': ['email', 'password'],
                'properties': {
                    'email': {'type': 'string', 'description': 'Email do usuário'},
                    'password': {'type': 'string', 'description': 'Senha do usuário'}
                }
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Login bem-sucedido',
            'schema': {
                'type': 'object',
                'properties': {
                    'access_token': {'type': 'string'},
                    'refresh_token': {'type': 'string'},
                    'user': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'string'},
                            'email': {'type': 'string'},
                            'name': {'type': 'string'}
                        }
                    }
                }
            }
        },
        401: {
            'description': 'Credenciais inválidas'
        }
    }
}

register_spec = {
    'tags': ['Auth'],
    'summary': 'Registro de usuário',
    'description': 'Registra um novo usuário no sistema',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'required': ['email', 'password', 'name'],
                'properties': {
                    'email': {'type': 'string', 'description': 'Email do usuário'},
                    'password': {'type': 'string', 'description': 'Senha do usuário'},
                    'name': {'type': 'string', 'description': 'Nome do usuário'}
                }
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Usuário criado com sucesso',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'string'},
                    'email': {'type': 'string'},
                    'name': {'type': 'string'}
                }
            }
        },
        400: {
            'description': 'Erro de validação'
        },
        409: {
            'description': 'Email já registrado'
        }
    }
}

list_ebooks_spec = {
    'tags': ['Ebooks'],
    'summary': 'Lista ebooks',
    'description': 'Retorna a lista de ebooks do usuário',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'page',
            'in': 'query',
            'type': 'integer',
            'description': 'Número da página',
            'default': 1
        },
        {
            'name': 'per_page',
            'in': 'query',
            'type': 'integer',
            'description': 'Itens por página',
            'default': 10
        }
    ],
    'responses': {
        200: {
            'description': 'Lista de ebooks',
            'schema': {
                'type': 'object',
                'properties': {
                    'items': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'id': {'type': 'string'},
                                'title': {'type': 'string'},
                                'description': {'type': 'string'},
                                'created_at': {'type': 'string', 'format': 'date-time'},
                                'updated_at': {'type': 'string', 'format': 'date-time'}
                            }
                        }
                    },
                    'total': {'type': 'integer'},
                    'page': {'type': 'integer'},
                    'per_page': {'type': 'integer'},
                    'pages': {'type': 'integer'}
                }
            }
        },
        401: {
            'description': 'Não autorizado'
        }
    }
}

get_ebook_spec = {
    'tags': ['Ebooks'],
    'summary': 'Obtém detalhes de um ebook',
    'description': 'Retorna os detalhes de um ebook específico',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'ebook_id',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'ID do ebook'
        }
    ],
    'responses': {
        200: {
            'description': 'Detalhes do ebook',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'string'},
                    'title': {'type': 'string'},
                    'description': {'type': 'string'},
                    'content': {'type': 'string'},
                    'created_at': {'type': 'string', 'format': 'date-time'},
                    'updated_at': {'type': 'string', 'format': 'date-time'}
                }
            }
        },
        404: {
            'description': 'Ebook não encontrado'
        }
    }
}

create_ebook_spec = {
    'tags': ['Ebooks'],
    'summary': 'Cria um novo ebook',
    'description': 'Cria um novo ebook para o usuário atual',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'required': ['title'],
                'properties': {
                    'title': {'type': 'string', 'description': 'Título do ebook'},
                    'description': {'type': 'string', 'description': 'Descrição do ebook'},
                    'content': {'type': 'string', 'description': 'Conteúdo inicial do ebook'}
                }
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Ebook criado com sucesso',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'string'},
                    'title': {'type': 'string'},
                    'description': {'type': 'string'},
                    'created_at': {'type': 'string', 'format': 'date-time'}
                }
            }
        },
        400: {
            'description': 'Erro de validação'
        }
    }
}

list_routes_spec = {
    'tags': ['Debug'],
    'summary': 'Lista todas as rotas disponíveis',
    'description': 'Retorna uma lista de todas as rotas registradas no sistema',
    'responses': {
        200: {
            'description': 'Lista de rotas',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'endpoint': {'type': 'string'},
                        'methods': {'type': 'array', 'items': {'type': 'string'}},
                        'rule': {'type': 'string'}
                    }
                }
            }
        }
    }
}
