"""
Utilitários para processamento de requisições HTTP
Oferece funções para extrair e validar dados de requisições
"""

import json
from flask import request, jsonify
import logging

logger = logging.getLogger(__name__)


def get_json_data(required_fields=None, optional_fields=None):
    """
    Extrai e valida dados JSON de uma requisição

    Args:
        required_fields (list): Lista de campos obrigatórios
        optional_fields (list): Lista de campos opcionais

    Returns:
        dict: Dicionário com os dados validados

    Raises:
        400: Se os dados não forem JSON válido ou se campos obrigatórios estiverem faltando
    """
    try:
        if not request.is_json:
            return jsonify({
                'status': 'error',
                'message': 'Dados devem estar no formato JSON'
            }), 400

        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Nenhum dado fornecido'
            }), 400

        # Verificar campos obrigatórios
        if required_fields:
            missing_fields = [
                field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({
                    'status': 'error',
                    'message': 'Campos obrigatórios ausentes',
                    'fields': missing_fields
                }), 400

        # Filtrar apenas os campos permitidos (obrigatórios + opcionais)
        filtered_data = {}
        allowed_fields = (required_fields or []) + (optional_fields or [])

        if allowed_fields:
            for field in allowed_fields:
                if field in data:
                    filtered_data[field] = data[field]
            return filtered_data
        else:
            # Se não houver lista de campos, retornar todos os dados
            return data

    except Exception as e:
        logger.error(f"Erro ao processar dados JSON: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erro ao processar dados JSON',
            'error': str(e)
        }), 400
