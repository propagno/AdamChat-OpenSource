"""
Funções utilitárias para uso em toda a aplicação
"""
import json
import datetime
import uuid
from bson import ObjectId
from flask import jsonify, request


class JSONEncoder(json.JSONEncoder):
    """
    Classe personalizada para codificar objetos JSON com tipos especiais
    como ObjectId, datetime, etc.
    """

    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        if isinstance(obj, uuid.UUID):
            return str(obj)
        return json.JSONEncoder.default(self, obj)


def parse_json(data):
    """
    Converte dados para JSON usando o encoder personalizado
    """
    return json.loads(json.dumps(data, cls=JSONEncoder))


def api_response(data=None, message=None, status=200, error=None):
    """
    Função utilitária para padronizar respostas da API

    Args:
        data: Dados a serem retornados
        message: Mensagem de sucesso ou erro
        status: Código de status HTTP
        error: Detalhes do erro (se houver)

    Returns:
        Resposta JSON padronizada
    """
    response = {
        'success': 200 <= status < 300,
        'message': message,
        'data': data
    }

    if error:
        response['error'] = error

    return jsonify(response), status


def get_pagination_params():
    """
    Extrai parâmetros de paginação da requisição

    Returns:
        Tupla com (página, itens por página, filtros)
    """
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))

    # Limita o número máximo de itens por página
    per_page = min(per_page, 100)

    # Extrai filtros adicionais
    filters = {}
    for key, value in request.args.items():
        if key not in ['page', 'per_page', 'sort', 'order']:
            filters[key] = value

    return page, per_page, filters


def validate_required_fields(data, required_fields):
    """
    Valida se todos os campos obrigatórios estão presentes

    Args:
        data: Dicionário com os dados a serem validados
        required_fields: Lista de campos obrigatórios

    Returns:
        Tupla (válido, mensagem de erro)
    """
    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        return False, f"Campos obrigatórios ausentes: {', '.join(missing_fields)}"

    return True, None
