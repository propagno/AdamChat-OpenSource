"""
Esquemas para autenticação.
Estes esquemas são utilizados para serialização/deserialização e documentação da API.
"""

from app.schemas import ma
from marshmallow import fields, validate


class TokenSchema(ma.Schema):
    """Esquema para tokens de autenticação"""

    access_token = fields.Str(required=True)
    refresh_token = fields.Str(required=True)
    token_type = fields.Str(required=True, default="Bearer")
    expires_in = fields.Int(required=True)


class AuthResponseSchema(ma.Schema):
    """Esquema para resposta de autenticação"""

    status = fields.Str(required=True)
    message = fields.Str(required=True)
    token = fields.Nested(TokenSchema, required=False)
    user = fields.Dict(required=False)


class RefreshTokenSchema(ma.Schema):
    """Esquema para refresh de token"""

    refresh_token = fields.Str(required=True)


class AuthStatusSchema(ma.Schema):
    """Esquema para status de autenticação"""

    status = fields.Str(required=True)
    message = fields.Str(required=True)
    auth_type = fields.Str(required=True)
    emergency_mode = fields.Bool(required=True)


class RequestPasswordResetSchema(ma.Schema):
    """Esquema para solicitar reset de senha"""

    email = fields.Email(required=True)


class VerifyResetCodeSchema(ma.Schema):
    """Esquema para verificar código de reset"""

    email = fields.Email(required=True)
    code = fields.Str(required=True, validate=validate.Length(min=6, max=6))
