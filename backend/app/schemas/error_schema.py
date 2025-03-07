"""
Esquemas para erros.
Estes esquemas são utilizados para padronizar as respostas de erro da API.
"""

from app.schemas import ma
from marshmallow import fields


class ErrorSchema(ma.Schema):
    """Esquema para erros padrão"""

    status = fields.Str(required=True, default="error")
    message = fields.Str(required=True)
    code = fields.Str(required=False)
    details = fields.Dict(required=False)


class ValidationErrorSchema(ma.Schema):
    """Esquema para erros de validação"""

    status = fields.Str(required=True, default="error")
    message = fields.Str(required=True)
    errors = fields.Dict(required=True)


class AuthErrorSchema(ma.Schema):
    """Esquema para erros de autenticação"""

    status = fields.Str(required=True, default="error")
    message = fields.Str(required=True)
    auth_error_code = fields.Str(required=False)
    redirect_url = fields.Str(required=False)
