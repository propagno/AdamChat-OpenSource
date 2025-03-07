"""
Configuração central do Swagger para a API do AdamChat.
Este arquivo contém a configuração para a documentação da API utilizando Swagger/OpenAPI.
"""

from flask import url_for, current_app, jsonify
from apispec import APISpec
from apispec.ext.marshmallow import MarshmallowPlugin
from flasgger import Swagger, LazyJSONEncoder
import yaml
import os

# Função para configurar o Swagger na aplicação

# Define a basic API spec
api_spec = {
    "swagger": "2.0",
    "info": {
        "title": "AdamChat API",
        "description": "API do AdamChat - Plataforma de IA para várias funcionalidades",
        "version": "1.0.0",
        "contact": {
            "name": "Suporte AdamChat",
            "url": "https://adamchat.ai/support",
            "email": "support@adamchat.ai"
        },
        "license": {
            "name": "Proprietário",
            "url": "https://adamchat.ai/terms"
        }
    },
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Insira o token com o formato: Bearer {seu_token}"
        }
    },
    "security": [
        {"Bearer": []}
    ],
    "tags": [
        {"name": "Auth", "description": "Operações de autenticação e gerenciamento de usuários"},
        {"name": "Chat", "description": "Interações com o chat IA"},
        {"name": "Health", "description": "Verificação de saúde do sistema"},
        {"name": "Content", "description": "Gerenciamento de conteúdo"},
        {"name": "Storage", "description": "Armazenamento de arquivos"},
        {"name": "Payment", "description": "Operações de pagamento e assinaturas"},
        {"name": "Image", "description": "Geração e processamento de imagens"},
        {"name": "Video", "description": "Geração e gerenciamento de vídeos"},
        {"name": "Avatar", "description": "Gerenciamento de avatares"},
        {"name": "Tasks", "description": "Gerenciamento de tarefas assíncronas"},
        {"name": "Dashboard", "description": "Endpoints para dashboard"},
        {"name": "Fashion", "description": "Funcionalidades relacionadas a moda"},
        {"name": "Ebook", "description": "Gerenciamento de ebooks"},
        {"name": "Patient", "description": "Gerenciamento de pacientes"},
        {"name": "Canva", "description": "Integração com Canva"},
        {"name": "Providers", "description": "Gerenciamento de provedores"},
        {"name": "Export", "description": "Funcionalidades de exportação"},
        {"name": "Agent", "description": "Gerenciamento de agentes virtuais"},
        {"name": "Debug", "description": "Endpoints de depuração"},
        {"name": "Docs", "description": "Documentação da API"}
    ],
    "paths": {
        "/api/health": {
            "get": {
                "tags": ["Health"],
                "summary": "Verifica a saúde do sistema",
                "description": "Retorna informações sobre o status do backend",
                "responses": {
                    "200": {
                        "description": "Sistema saudável",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "status": {"type": "string"},
                                "version": {"type": "string"},
                                "service": {"type": "string"}
                            }
                        }
                    }
                }
            }
        },
        "/api/auth/status": {
            "get": {
                "tags": ["Auth"],
                "summary": "Verifica o status do sistema de autenticação",
                "description": "Retorna informações sobre o estado atual do sistema de autenticação",
                "responses": {
                    "200": {
                        "description": "Status do sistema de autenticação",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "status": {"type": "string"},
                                "message": {"type": "string"},
                                "emergency_mode": {"type": "boolean"},
                                "auth_type": {"type": "string"}
                            }
                        }
                    }
                }
            }
        },
        "/api/auth/check": {
            "get": {
                "tags": ["Auth"],
                "summary": "Verifica a validade do token",
                "description": "Verifica se o token de autenticação é válido",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {"description": "Token válido"},
                    "401": {"description": "Token inválido ou expirado"}
                }
            }
        },
        "/api/auth/user": {
            "get": {
                "tags": ["Auth"],
                "summary": "Obtém dados do usuário atual",
                "description": "Retorna informações do usuário autenticado",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {
                        "description": "Dados do usuário",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "email": {"type": "string"},
                                "name": {"type": "string"},
                                "role": {"type": "string"}
                            }
                        }
                    },
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/auth/register": {
            "post": {
                "tags": ["Auth"],
                "summary": "Registra um novo usuário",
                "description": "Cria uma nova conta de usuário no sistema",
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "username": {"type": "string"},
                                "email": {"type": "string", "format": "email"},
                                "password": {"type": "string"},
                                "name": {"type": "string"},
                                "language": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "201": {"description": "Usuário criado com sucesso"},
                    "400": {"description": "Dados inválidos"},
                    "409": {"description": "Email já registrado"}
                }
            }
        },
        "/api/auth/users": {
            "post": {
                "tags": ["Auth"],
                "summary": "Cria um novo usuário (admin)",
                "description": "Permite que administradores criem novos usuários",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "email": {"type": "string", "format": "email"},
                                "password": {"type": "string"},
                                "name": {"type": "string"},
                                "role": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "201": {"description": "Usuário criado com sucesso"},
                    "400": {"description": "Dados inválidos"},
                    "401": {"description": "Não autorizado"},
                    "403": {"description": "Permissão negada"}
                }
            }
        },
        "/api/auth/users/{user_id}": {
            "get": {
                "tags": ["Auth"],
                "summary": "Obtém detalhes de um usuário",
                "description": "Retorna informações detalhadas de um usuário específico",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "user_id",
                        "in": "path",
                        "required": True,
                        "type": "string",
                        "description": "ID do usuário"
                    }
                ],
                "responses": {
                    "200": {"description": "Dados do usuário"},
                    "401": {"description": "Não autorizado"},
                    "404": {"description": "Usuário não encontrado"}
                }
            },
            "put": {
                "tags": ["Auth"],
                "summary": "Atualiza um usuário",
                "description": "Atualiza informações de um usuário específico",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "user_id",
                        "in": "path",
                        "required": True,
                        "type": "string",
                        "description": "ID do usuário"
                    },
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "email": {"type": "string", "format": "email"},
                                "active": {"type": "boolean"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Usuário atualizado com sucesso"},
                    "400": {"description": "Dados inválidos"},
                    "401": {"description": "Não autorizado"},
                    "404": {"description": "Usuário não encontrado"}
                }
            }
        },
        "/api/auth/users/{user_id}/roles": {
            "put": {
                "tags": ["Auth"],
                "summary": "Atualiza papéis de um usuário",
                "description": "Atualiza os papéis (roles) de um usuário específico",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "user_id",
                        "in": "path",
                        "required": True,
                        "type": "string",
                        "description": "ID do usuário"
                    },
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "roles": {"type": "array", "items": {"type": "string"}}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Papéis atualizados com sucesso"},
                    "400": {"description": "Dados inválidos"},
                    "401": {"description": "Não autorizado"},
                    "403": {"description": "Permissão negada"},
                    "404": {"description": "Usuário não encontrado"}
                }
            }
        },
        "/api/auth/login": {
            "post": {
                "tags": ["Auth"],
                "summary": "Realiza login",
                "description": "Autentica o usuário e retorna tokens de acesso",
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "email": {"type": "string", "format": "email"},
                                "password": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Login bem-sucedido"},
                    "401": {"description": "Credenciais inválidas"}
                }
            }
        },
        "/api/auth/logout": {
            "post": {
                "tags": ["Auth"],
                "summary": "Realiza logout",
                "description": "Invalida o token de acesso atual",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {"description": "Logout realizado com sucesso"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/auth/refresh": {
            "post": {
                "tags": ["Auth"],
                "summary": "Atualiza token de acesso",
                "description": "Gera um novo token de acesso usando o refresh token",
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "refresh_token": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Token atualizado com sucesso"},
                    "401": {"description": "Token inválido ou expirado"}
                }
            }
        },
        "/api/auth/admin/setup": {
            "post": {
                "tags": ["Auth"],
                "summary": "Configura permissões de administrador",
                "description": "Inicializa a configuração de admin para o sistema",
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "admin_key": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Configuração realizada com sucesso"},
                    "400": {"description": "Chave inválida"},
                    "403": {"description": "Configuração já realizada"}
                }
            }
        },
        "/api/auth/request-reset": {
            "post": {
                "tags": ["Auth"],
                "summary": "Solicita redefinição de senha",
                "description": "Envia código para redefinição de senha por email",
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "email": {"type": "string", "format": "email"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Email enviado com sucesso"},
                    "400": {"description": "Email inválido"},
                    "404": {"description": "Usuário não encontrado"}
                }
            }
        },
        "/api/auth/verify-reset-code": {
            "post": {
                "tags": ["Auth"],
                "summary": "Verifica código de redefinição",
                "description": "Verifica se o código de redefinição é válido",
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "email": {"type": "string", "format": "email"},
                                "code": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Código válido"},
                    "400": {"description": "Código inválido"}
                }
            }
        },
        "/api/auth/reset-password": {
            "post": {
                "tags": ["Auth"],
                "summary": "Redefine senha",
                "description": "Redefine a senha do usuário usando o código de verificação",
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "email": {"type": "string", "format": "email"},
                                "code": {"type": "string"},
                                "new_password": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Senha redefinida com sucesso"},
                    "400": {"description": "Código inválido"}
                }
            }
        },
        "/api/auth/change-password": {
            "post": {
                "tags": ["Auth"],
                "summary": "Altera senha",
                "description": "Altera a senha do usuário atual",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "current_password": {"type": "string"},
                                "new_password": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Senha alterada com sucesso"},
                    "400": {"description": "Senha atual incorreta"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/chat": {
            "post": {
                "tags": ["Chat"],
                "summary": "Envia mensagem para o chat IA",
                "description": "Processa uma mensagem de chat com a IA generativa",
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "message": {"type": "string"},
                                "history": {"type": "array"},
                                "provider": {"type": "string"},
                                "agent": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Resposta do chat"},
                    "400": {"description": "Parâmetros inválidos"},
                    "500": {"description": "Erro de servidor"}
                }
            }
        },
        "/api/content/titles": {
            "post": {
                "tags": ["Content"],
                "summary": "Gera títulos para conteúdo",
                "description": "Gera sugestões de títulos para conteúdo",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "topic": {"type": "string"},
                                "type": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Títulos gerados com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/content/chapters": {
            "post": {
                "tags": ["Content"],
                "summary": "Gera capítulos para conteúdo",
                "description": "Gera estrutura de capítulos para um conteúdo",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "description": {"type": "string"},
                                "count": {"type": "integer"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Capítulos gerados com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/content/chapter": {
            "post": {
                "tags": ["Content"],
                "summary": "Gera texto para um capítulo",
                "description": "Gera conteúdo textual para um capítulo específico",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "chapter_title": {"type": "string"},
                                "context": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Conteúdo gerado com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/content/image-prompt": {
            "post": {
                "tags": ["Content"],
                "summary": "Gera prompt para imagem",
                "description": "Gera prompt para criação de imagem relacionada ao conteúdo",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "content": {"type": "string"},
                                "style": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Prompt gerado com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/dashboard": {
            "get": {
                "tags": ["Dashboard"],
                "summary": "Obtém dados do dashboard",
                "description": "Retorna estatísticas e métricas para o dashboard",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {"description": "Dados do dashboard obtidos com sucesso"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/dashboard/plans": {
            "get": {
                "tags": ["Dashboard"],
                "summary": "Lista planos disponíveis",
                "description": "Retorna lista de planos de assinatura disponíveis",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {"description": "Lista de planos obtida com sucesso"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/dashboard/upgrade": {
            "post": {
                "tags": ["Dashboard"],
                "summary": "Atualiza plano de assinatura",
                "description": "Atualiza o plano de assinatura do usuário",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "plan_id": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Plano atualizado com sucesso"},
                    "400": {"description": "Plano inválido"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/dashboard/tokens/add": {
            "post": {
                "tags": ["Dashboard"],
                "summary": "Adiciona tokens",
                "description": "Adiciona tokens à conta do usuário",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "amount": {"type": "integer"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Tokens adicionados com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/image/generate": {
            "post": {
                "tags": ["Image"],
                "summary": "Gera imagem",
                "description": "Gera uma imagem usando IA",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "prompt": {"type": "string"},
                                "model": {"type": "string"},
                                "size": {"type": "string"},
                                "style": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Imagem gerada com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/image/variations": {
            "post": {
                "tags": ["Image"],
                "summary": "Gera variações de imagem",
                "description": "Cria variações de uma imagem existente",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "image_id": {"type": "string"},
                                "count": {"type": "integer"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Variações geradas com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"},
                    "404": {"description": "Imagem não encontrada"}
                }
            }
        },
        "/api/video/generate": {
            "post": {
                "tags": ["Video"],
                "summary": "Gera vídeo",
                "description": "Gera um vídeo usando IA",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "prompt": {"type": "string"},
                                "duration": {"type": "integer"},
                                "resolution": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "202": {"description": "Solicitação aceita, vídeo sendo processado"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/video/status/{task_id}": {
            "get": {
                "tags": ["Video"],
                "summary": "Verifica status de geração de vídeo",
                "description": "Obtém o status atual de uma tarefa de geração de vídeo",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "task_id",
                        "in": "path",
                        "required": True,
                        "type": "string",
                        "description": "ID da tarefa de geração"
                    }
                ],
                "responses": {
                    "200": {"description": "Status da tarefa obtido com sucesso"},
                    "401": {"description": "Não autorizado"},
                    "404": {"description": "Tarefa não encontrada"}
                }
            }
        },
        "/api/avatar/generate": {
            "post": {
                "tags": ["Avatar"],
                "summary": "Gera avatar",
                "description": "Gera um avatar personalizado usando IA",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "prompt": {"type": "string"},
                                "style": {"type": "string"},
                                "gender": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Avatar gerado com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/avatar/list": {
            "get": {
                "tags": ["Avatar"],
                "summary": "Lista avatares",
                "description": "Lista todos os avatares do usuário",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {"description": "Lista de avatares obtida com sucesso"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/storage/upload": {
            "post": {
                "tags": ["Storage"],
                "summary": "Faz upload de arquivo",
                "description": "Envia um arquivo para armazenamento",
                "security": [{"Bearer": []}],
                "consumes": ["multipart/form-data"],
                "parameters": [
                    {
                        "name": "file",
                        "in": "formData",
                        "required": True,
                        "type": "file",
                        "description": "Arquivo a ser enviado"
                    },
                    {
                        "name": "type",
                        "in": "formData",
                        "required": False,
                        "type": "string",
                        "description": "Tipo de arquivo"
                    }
                ],
                "responses": {
                    "200": {"description": "Upload realizado com sucesso"},
                    "400": {"description": "Arquivo inválido"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/storage/files": {
            "get": {
                "tags": ["Storage"],
                "summary": "Lista arquivos",
                "description": "Lista todos os arquivos do usuário",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "type",
                        "in": "query",
                        "required": False,
                        "type": "string",
                        "description": "Filtro por tipo de arquivo"
                    }
                ],
                "responses": {
                    "200": {"description": "Lista de arquivos obtida com sucesso"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/storage/files/{file_id}": {
            "get": {
                "tags": ["Storage"],
                "summary": "Obtém arquivo",
                "description": "Obtém um arquivo específico",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "file_id",
                        "in": "path",
                        "required": True,
                        "type": "string",
                        "description": "ID do arquivo"
                    }
                ],
                "responses": {
                    "200": {"description": "Arquivo obtido com sucesso"},
                    "401": {"description": "Não autorizado"},
                    "404": {"description": "Arquivo não encontrado"}
                }
            },
            "delete": {
                "tags": ["Storage"],
                "summary": "Remove arquivo",
                "description": "Remove um arquivo específico",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "file_id",
                        "in": "path",
                        "required": True,
                        "type": "string",
                        "description": "ID do arquivo"
                    }
                ],
                "responses": {
                    "200": {"description": "Arquivo removido com sucesso"},
                    "401": {"description": "Não autorizado"},
                    "404": {"description": "Arquivo não encontrado"}
                }
            }
        },
        "/api/payment/plans": {
            "get": {
                "tags": ["Payment"],
                "summary": "Lista planos de assinatura",
                "description": "Retorna os planos de assinatura disponíveis",
                "responses": {
                    "200": {"description": "Lista de planos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/payment/subscribe": {
            "post": {
                "tags": ["Payment"],
                "summary": "Realiza assinatura",
                "description": "Inicia processo de assinatura para um plano",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "plan_id": {"type": "string"},
                                "payment_method": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Assinatura iniciada com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/payment/subscription": {
            "get": {
                "tags": ["Payment"],
                "summary": "Obtém detalhes da assinatura",
                "description": "Retorna detalhes da assinatura atual do usuário",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {"description": "Detalhes da assinatura obtidos com sucesso"},
                    "401": {"description": "Não autorizado"},
                    "404": {"description": "Assinatura não encontrada"}
                }
            }
        },
        "/api/ebook/generate": {
            "post": {
                "tags": ["Ebook"],
                "summary": "Gera ebook",
                "description": "Gera um ebook completo usando IA",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "description": {"type": "string"},
                                "chapters": {"type": "integer"},
                                "style": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "202": {"description": "Solicitação aceita, ebook sendo gerado"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/ebook/list": {
            "get": {
                "tags": ["Ebook"],
                "summary": "Lista ebooks",
                "description": "Lista todos os ebooks do usuário",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {"description": "Lista de ebooks obtida com sucesso"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/ebook/{ebook_id}": {
            "get": {
                "tags": ["Ebook"],
                "summary": "Obtém ebook",
                "description": "Obtém detalhes de um ebook específico",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "ebook_id",
                        "in": "path",
                        "required": True,
                        "type": "string",
                        "description": "ID do ebook"
                    }
                ],
                "responses": {
                    "200": {"description": "Ebook obtido com sucesso"},
                    "401": {"description": "Não autorizado"},
                    "404": {"description": "Ebook não encontrado"}
                }
            }
        },
        "/api/patient/list": {
            "get": {
                "tags": ["Patient"],
                "summary": "Lista pacientes",
                "description": "Retorna a lista de pacientes",
                "responses": {
                    "200": {"description": "Lista de pacientes"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/canva/design": {
            "post": {
                "tags": ["Canva"],
                "summary": "Cria design no Canva",
                "description": "Cria um novo design no Canva",
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "template": {"type": "string"},
                                "elements": {"type": "array"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Design criado com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/providers/list": {
            "get": {
                "tags": ["Providers"],
                "summary": "Lista provedores",
                "description": "Retorna a lista de provedores disponíveis",
                "responses": {
                    "200": {"description": "Lista de provedores"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/providers/config": {
            "get": {
                "tags": ["Providers"],
                "summary": "Obtém configurações de provedores",
                "description": "Retorna configurações de provedores do usuário",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {"description": "Configurações obtidas com sucesso"},
                    "401": {"description": "Não autorizado"}
                }
            },
            "post": {
                "tags": ["Providers"],
                "summary": "Atualiza configurações de provedores",
                "description": "Atualiza configurações de provedores do usuário",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "provider": {"type": "string"},
                                "api_key": {"type": "string"},
                                "default": {"type": "boolean"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Configurações atualizadas com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/export/pdf": {
            "post": {
                "tags": ["Export"],
                "summary": "Exporta para PDF",
                "description": "Converte conteúdo para formato PDF",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "content": {"type": "string"},
                                "title": {"type": "string"},
                                "options": {"type": "object"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "PDF gerado com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/export/docx": {
            "post": {
                "tags": ["Export"],
                "summary": "Exporta para DOCX",
                "description": "Converte conteúdo para formato DOCX (Word)",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "content": {"type": "string"},
                                "title": {"type": "string"},
                                "options": {"type": "object"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Documento DOCX gerado com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/agent/list": {
            "get": {
                "tags": ["Agent"],
                "summary": "Lista agentes",
                "description": "Lista todos os agentes virtuais disponíveis",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {"description": "Lista de agentes obtida com sucesso"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/agent/create": {
            "post": {
                "tags": ["Agent"],
                "summary": "Cria agente",
                "description": "Cria um novo agente virtual personalizado",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "description": {"type": "string"},
                                "personality": {"type": "string"},
                                "knowledge": {"type": "array", "items": {"type": "string"}},
                                "avatar_id": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "201": {"description": "Agente criado com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/agent/{agent_id}": {
            "get": {
                "tags": ["Agent"],
                "summary": "Obtém agente",
                "description": "Obtém detalhes de um agente virtual específico",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "agent_id",
                        "in": "path",
                        "required": True,
                        "type": "string",
                        "description": "ID do agente"
                    }
                ],
                "responses": {
                    "200": {"description": "Agente obtido com sucesso"},
                    "401": {"description": "Não autorizado"},
                    "404": {"description": "Agente não encontrado"}
                }
            },
            "put": {
                "tags": ["Agent"],
                "summary": "Atualiza agente",
                "description": "Atualiza informações de um agente virtual específico",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "agent_id",
                        "in": "path",
                        "required": True,
                        "type": "string",
                        "description": "ID do agente"
                    },
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "description": {"type": "string"},
                                "personality": {"type": "string"},
                                "knowledge": {"type": "array", "items": {"type": "string"}},
                                "avatar_id": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Agente atualizado com sucesso"},
                    "400": {"description": "Parâmetros inválidos"},
                    "401": {"description": "Não autorizado"},
                    "404": {"description": "Agente não encontrado"}
                }
            },
            "delete": {
                "tags": ["Agent"],
                "summary": "Remove agente",
                "description": "Remove um agente virtual específico",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "agent_id",
                        "in": "path",
                        "required": True,
                        "type": "string",
                        "description": "ID do agente"
                    }
                ],
                "responses": {
                    "200": {"description": "Agente removido com sucesso"},
                    "401": {"description": "Não autorizado"},
                    "404": {"description": "Agente não encontrado"}
                }
            }
        },
        "/api/debug/routes": {
            "get": {
                "tags": ["Debug"],
                "summary": "Lista rotas",
                "description": "Lista todas as rotas registradas na aplicação",
                "responses": {
                    "200": {"description": "Lista de rotas obtida com sucesso"}
                }
            }
        },
        "/api/debug/config": {
            "get": {
                "tags": ["Debug"],
                "summary": "Exibe configuração",
                "description": "Mostra a configuração atual da aplicação",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {"description": "Configuração obtida com sucesso"},
                    "401": {"description": "Não autorizado"},
                    "403": {"description": "Permissão negada"}
                }
            }
        },
        "/api/debug/logs": {
            "get": {
                "tags": ["Debug"],
                "summary": "Exibe logs",
                "description": "Mostra os logs recentes da aplicação",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "lines",
                        "in": "query",
                        "required": False,
                        "type": "integer",
                        "description": "Número de linhas a exibir"
                    }
                ],
                "responses": {
                    "200": {"description": "Logs obtidos com sucesso"},
                    "401": {"description": "Não autorizado"},
                    "403": {"description": "Permissão negada"}
                }
            }
        },
        "/api/tasks/{task_id}": {
            "get": {
                "tags": ["Tasks"],
                "summary": "Verifica status de tarefa",
                "description": "Retorna o status atual de uma tarefa assíncrona",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "task_id",
                        "in": "path",
                        "required": True,
                        "type": "string",
                        "description": "ID da tarefa"
                    }
                ],
                "responses": {
                    "200": {"description": "Status da tarefa obtido com sucesso"},
                    "401": {"description": "Não autorizado"},
                    "404": {"description": "Tarefa não encontrada"}
                }
            }
        },
        "/api/tasks/list": {
            "get": {
                "tags": ["Tasks"],
                "summary": "Lista tarefas",
                "description": "Lista todas as tarefas do usuário",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {"description": "Lista de tarefas obtida com sucesso"},
                    "401": {"description": "Não autorizado"}
                }
            }
        },
        "/api/docs": {
            "get": {
                "tags": ["Docs"],
                "summary": "Documentação da API",
                "description": "Acessa a documentação interativa da API",
                "responses": {
                    "200": {"description": "Documentação obtida com sucesso"}
                }
            }
        }
    }
}


def configure_swagger(app):
    # Configure the LazyJSONEncoder
    app.json_encoder = LazyJSONEncoder

    # Add a custom route to serve the API spec
    @app.route('/apispec.json')
    def get_apispec():
        return jsonify(api_spec)

    # Create a Swagger instance with our comprehensive API spec
    swagger = Swagger(app,
                      config={
                          'headers': [],
                          'specs': [
                              {
                                  'endpoint': 'apispec',
                                  'route': '/apispec.json',
                                  'rule_filter': lambda rule: True,
                                  'model_filter': lambda tag: True,
                              }
                          ],
                          'static_url_path': '/flasgger_static',
                          'swagger_ui': True,
                          'specs_route': '/apidocs/'
                      },
                      template=api_spec)

    return swagger


def init_swagger(app):
    """
    Inicializa o Swagger com a aplicação Flask

    Args:
        app: Aplicação Flask
    """
    swagger = Swagger(app, template={
        "swagger": "2.0",
        "info": {
            "title": "AdamChat API",
            "description": "API para o AdamChat",
            "version": "1.0.0",
            "contact": {
                "name": "Suporte AdamChat",
                "email": "suporte@adamchat.com"
            }
        },
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header usando o esquema Bearer. Exemplo: \"Authorization: Bearer {token}\""
            }
        },
        "security": [
            {
                "Bearer": []
            }
        ]
    })
