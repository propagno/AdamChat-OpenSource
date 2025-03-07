"""
Rotas para verificação de saúde do sistema.
"""
from flask import Blueprint, jsonify, current_app

# Criar blueprint para rotas de saúde
health_bp = Blueprint('health', __name__, url_prefix='/api')


@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Verifica a saúde do sistema.

    Returns:
        200 JSON: Status do sistema.
    """
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'service': 'AdamChat API'
    }), 200
