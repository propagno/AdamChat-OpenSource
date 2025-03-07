"""
Esquemas para pagamentos e assinaturas.
Estes esquemas são utilizados para serialização/deserialização e documentação da API.
"""

from app.schemas import ma
from marshmallow import fields, validate


class PlanSchema(ma.Schema):
    """Esquema para planos de assinatura"""

    id = fields.Str(required=True)
    name = fields.Str(required=True)
    description = fields.Str(required=True)
    price = fields.Float(required=True)
    currency = fields.Str(required=True, default="BRL")
    interval = fields.Str(
        required=True, validate=validate.OneOf(["month", "year"]))
    interval_count = fields.Int(required=True, default=1)
    features = fields.List(fields.Str(), required=True)
    stripe_price_id = fields.Str(required=True)


class SubscriptionSchema(ma.Schema):
    """Esquema para assinaturas"""

    id = fields.Str(required=True)
    plan = fields.Nested(PlanSchema, required=True)
    status = fields.Str(required=True, validate=validate.OneOf([
        "active", "canceled", "incomplete", "incomplete_expired",
        "past_due", "trialing", "unpaid"
    ]))
    current_period_start = fields.DateTime(required=True)
    current_period_end = fields.DateTime(required=True)
    cancel_at = fields.DateTime(required=False)
    canceled_at = fields.DateTime(required=False)
    trial_start = fields.DateTime(required=False)
    trial_end = fields.DateTime(required=False)


class PaymentMethodSchema(ma.Schema):
    """Esquema para métodos de pagamento"""

    id = fields.Str(required=True)
    type = fields.Str(required=True)
    last4 = fields.Str(required=False)
    exp_month = fields.Int(required=False)
    exp_year = fields.Int(required=False)
    brand = fields.Str(required=False)
    is_default = fields.Bool(required=True)


class CreateSubscriptionSchema(ma.Schema):
    """Esquema para criação de assinatura"""

    plan_id = fields.Str(required=True)
    payment_method_id = fields.Str(required=True)


class UpdateSubscriptionSchema(ma.Schema):
    """Esquema para atualização de assinatura"""

    plan_id = fields.Str(required=False)
    cancel_at_period_end = fields.Bool(required=False)


class CreatePaymentMethodSchema(ma.Schema):
    """Esquema para criação de método de pagamento"""

    payment_method_id = fields.Str(required=True)
    set_as_default = fields.Bool(required=False, default=False)
