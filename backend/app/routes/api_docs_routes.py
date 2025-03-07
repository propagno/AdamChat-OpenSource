"""
Rotas para a documentação da API
Este arquivo contém os endpoints para acessar a documentação da API
"""

import os
from flask import Blueprint, redirect, url_for, jsonify, send_from_directory, current_app
import json

# Blueprint para rotas de documentação
api_docs_bp = Blueprint('api_docs', __name__)


@api_docs_bp.route('/docs', methods=['GET'])
def redirect_to_docs():
    """
    Redireciona para a documentação da API
    ---
    tags:
      - Documentation
    summary: Redireciona para a documentação da API
    description: Redireciona o usuário para a página de documentação Swagger da API
    responses:
      302:
        description: Redirecionamento para a documentação
    """
    return redirect('/apidocs/')


@api_docs_bp.route('/api/docs', methods=['GET'])
def api_redirect_to_docs():
    """
    Redireciona para a documentação da API (caminho alternativo)
    ---
    tags:
      - Documentation
    summary: Redireciona para a documentação da API
    description: Redireciona o usuário para a página de documentação Swagger da API
    responses:
      302:
        description: Redirecionamento para a documentação
    """
    return redirect('/apidocs/')


@api_docs_bp.route('/api/schema', methods=['GET'])
def api_schema():
    """
    Retorna o schema completo da API em formato JSON
    ---
    tags:
      - Documentation
    summary: Obtém o schema completo da API
    description: Retorna a especificação OpenAPI/Swagger completa da API em formato JSON
    responses:
      200:
        description: Schema da API em formato JSON
    """
    # Redireciona para o arquivo de especificação JSON gerado pelo Swagger
    return redirect('/apispec.json')


def register_api_docs_routes(app):
    """
    Registra as rotas de documentação na aplicação
    """
    app.register_blueprint(api_docs_bp)
