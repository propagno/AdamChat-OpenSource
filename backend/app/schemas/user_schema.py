"""
Esquemas para o modelo de usuário.
Estes esquemas são utilizados para serialização/deserialização e documentação da API.
"""

from app.schemas import ma
from marshmallow import fields, validate, ValidationError
from app.models.user import User


class UserSchema(ma.SQLAlchemySchema):
    """Esquema para o modelo de usuário"""

    class Meta:
        model = User

    id = ma.auto_field()
    username = ma.auto_field()
    email = ma.auto_field()
    name = ma.auto_field()
    subscription_level = ma.auto_field()
    theme = ma.auto_field()
    language = ma.auto_field()
    is_active = ma.auto_field()
    is_confirmed = ma.auto_field()
    is_admin = ma.auto_field()
    created_at = ma.auto_field()
    updated_at = ma.auto_field()
    last_login = ma.auto_field()

    # Campos calculados
    subscription_status = fields.Method("get_subscription_status")

    def get_subscription_status(self, obj):
        """Retorna o status da assinatura do usuário"""
        if not hasattr(obj, 'subscription_level'):
            return "free"
        return obj.subscription_level


class UserCreateSchema(ma.Schema):
    """Esquema para criação de usuário"""

    username = fields.Str(
        required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.Str(
        required=True, validate=validate.Length(min=8, max=128))
    name = fields.Str(required=False)
    language = fields.Str(
        required=False, validate=validate.Length(min=2, max=5))
    theme = fields.Str(
        required=False, validate=validate.OneOf(["light", "dark"]))


class UserUpdateSchema(ma.Schema):
    """Esquema para atualização de usuário"""

    username = fields.Str(validate=validate.Length(min=3, max=80))
    email = fields.Email()
    name = fields.Str()
    language = fields.Str(validate=validate.Length(min=2, max=5))
    theme = fields.Str(validate=validate.OneOf(["light", "dark"]))


class UserProfileSchema(ma.Schema):
    """Esquema para obtenção do perfil do usuário"""

    id = fields.Int()
    username = fields.Str()
    email = fields.Email()
    name = fields.Str()
    subscription_level = fields.Str()
    theme = fields.Str()
    language = fields.Str()
    created_at = fields.DateTime()
    last_login = fields.DateTime()
    subscription_status = fields.Str()
    is_admin = fields.Bool()


class UserLoginSchema(ma.Schema):
    """Esquema para login de usuário"""

    email = fields.Email(required=True)
    password = fields.Str(required=True)


class UserChangePasswordSchema(ma.Schema):
    """Esquema para alteração de senha"""

    current_password = fields.Str(required=True)
    new_password = fields.Str(
        required=True, validate=validate.Length(min=8, max=128))
    confirm_password = fields.Str(required=True, validate=validate.Equal(
        field_name='new_password', error='As senhas não coincidem'))


class UserResetPasswordSchema(ma.Schema):
    """Esquema para reset de senha"""

    reset_token = fields.Str(required=True)
    new_password = fields.Str(
        required=True, validate=validate.Length(min=8, max=128))
    confirm_password = fields.Str(required=True, validate=validate.Equal(
        field_name='new_password', error='As senhas não coincidem'))
