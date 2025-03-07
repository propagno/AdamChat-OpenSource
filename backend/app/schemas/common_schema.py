"""
Esquemas comuns e reutilizáveis.
Estes esquemas são utilizados em várias partes da API.
"""

from app.schemas import ma
from marshmallow import fields


class SuccessSchema(ma.Schema):
    """Esquema para respostas de sucesso simples"""

    status = fields.Str(required=True, default="success")
    message = fields.Str(required=True)


class PaginationSchema(ma.Schema):
    """Esquema para paginação de resultados"""

    page = fields.Int(required=True)
    per_page = fields.Int(required=True)
    total = fields.Int(required=True)
    pages = fields.Int(required=True)
    has_next = fields.Bool(required=True)
    has_prev = fields.Bool(required=True)


class PaginatedResponseSchema(ma.Schema):
    """Esquema para respostas paginadas"""

    status = fields.Str(required=True, default="success")
    pagination = fields.Nested(PaginationSchema, required=True)
    data = fields.List(fields.Dict(), required=True)


class IDSchema(ma.Schema):
    """Esquema para identificadores"""

    id = fields.Str(required=True)


class SearchQuerySchema(ma.Schema):
    """Esquema para consultas de busca"""

    query = fields.Str(required=True)
    page = fields.Int(required=False, default=1)
    per_page = fields.Int(required=False, default=20)
    sort_by = fields.Str(required=False)
    order = fields.Str(required=False, default="asc")
