"""
Rotas principais da API
"""

import logging
from flask import Blueprint, jsonify, request
from app.middlewares.auth import token_required
from app.config import Config

# Configuração de logging
logger = logging.getLogger(__name__)

# Blueprint para rotas principais
core_bp = Blueprint('core', __name__, url_prefix='/api')


@core_bp.route('/health', methods=['GET'])
def health_check():
    """
    Verifica a saúde da API
    ---
    tags:
      - Core
    summary: Verifica a saúde da API
    description: Retorna informações sobre o estado da API
    responses:
      200:
        description: API está funcionando corretamente
    """
    try:
        # Adicionar informações sobre a conexão e ambiente
        return jsonify({
            'status': 'ok',
            'message': 'API está operacional',
            'version': Config.APP_VERSION,
            'environment': Config.ENVIRONMENT,
            'request_info': {
                'remote_addr': request.remote_addr,
                'host': request.host,
                'path': request.path,
                'headers': {k: v for k, v in request.headers.items() if k.lower() not in ['authorization', 'cookie']}
            }
        })
    except Exception as e:
        logger.error(
            f"Erro ao verificar saúde da API: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Erro ao verificar saúde da API: {str(e)}'
        }), 500
