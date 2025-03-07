from app.extensions import db
from datetime import datetime
import json


class SubscriptionPlan(db.Model):
    """
    Modelo para armazenar planos de assinatura disponíveis
    """
    __tablename__ = 'subscription_plans'

    id = db.Column(db.Integer, primary_key=True)

    # Informações básicas
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    # free, basic, premium, business
    level = db.Column(db.String(20), nullable=False)

    # Limite de uso
    price = db.Column(db.Float, nullable=False)
    tokens_per_month = db.Column(db.Integer, nullable=False, default=0)
    messages_per_month = db.Column(db.Integer, nullable=False, default=0)

    # Limites de recursos
    max_image_resolution = db.Column(db.String(20), nullable=True)
    max_video_duration = db.Column(db.Integer, nullable=True)  # em segundos
    max_video_resolution = db.Column(db.String(20), nullable=True)

    # Recursos disponíveis
    has_video_generation = db.Column(db.Boolean, default=False)
    has_avatar_creation = db.Column(db.Boolean, default=False)
    has_fashion_photo = db.Column(db.Boolean, default=False)
    has_priority_processing = db.Column(db.Boolean, default=False)
    has_api_access = db.Column(db.Boolean, default=False)

    # Para integrações externas
    stripe_price_id = db.Column(db.String(50), nullable=True)
    external_plan_id = db.Column(db.String(50), nullable=True)

    # Status e controle
    is_active = db.Column(db.Boolean, default=True)
    is_public = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)

    # Pista de auditoria
    created_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    subscriptions = db.relationship('Subscription', backref='plan', lazy=True)

    def __init__(self, **kwargs):
        super(SubscriptionPlan, self).__init__(**kwargs)

    def __repr__(self):
        return f'<SubscriptionPlan {self.id}: {self.name} - {self.level}>'

    def to_dict(self):
        """
        Converte o objeto para dicionário para serialização
        """
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'level': self.level,
            'price': self.price,
            'tokens_per_month': self.tokens_per_month,
            'messages_per_month': self.messages_per_month,
            'max_image_resolution': self.max_image_resolution,
            'max_video_duration': self.max_video_duration,
            'max_video_resolution': self.max_video_resolution,
            'has_video_generation': self.has_video_generation,
            'has_avatar_creation': self.has_avatar_creation,
            'has_fashion_photo': self.has_fashion_photo,
            'has_priority_processing': self.has_priority_processing,
            'has_api_access': self.has_api_access,
            'is_active': self.is_active,
            'is_public': self.is_public,
            'sort_order': self.sort_order
        }


class Subscription(db.Model):
    """
    Modelo para armazenar assinaturas de usuários
    """
    __tablename__ = 'subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey(
        'subscription_plans.id'), nullable=False)

    # Status e informação temporal
    # active, canceled, expired, suspended
    status = db.Column(db.String(20), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)
    auto_renew = db.Column(db.Boolean, default=True)

    # Contagem de uso
    tokens_total = db.Column(db.Integer, nullable=False, default=0)
    tokens_used = db.Column(db.Integer, nullable=False, default=0)
    tokens_remaining = db.Column(db.Integer, nullable=False, default=0)

    messages_total = db.Column(db.Integer, nullable=False, default=0)
    messages_used = db.Column(db.Integer, nullable=False, default=0)
    messages_remaining = db.Column(db.Integer, nullable=False, default=0)

    # Referências de pagamento
    payment_id = db.Column(db.Integer, db.ForeignKey(
        'payments.id'), nullable=True)
    # ID da assinatura no serviço externo
    external_id = db.Column(db.String(100), nullable=True)

    # Pista de auditoria
    created_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    user = db.relationship(
        'User', backref=db.backref('subscriptions', lazy=True))
    payment = db.relationship('Payment', backref=db.backref(
        'subscription', uselist=False), lazy=True)

    def __init__(self, **kwargs):
        super(Subscription, self).__init__(**kwargs)

    def __repr__(self):
        return f'<Subscription {self.id}: {self.user_id} - {self.plan_id} ({self.status})>'

    def to_dict(self):
        """
        Converte o objeto para dicionário para serialização
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan_id': self.plan_id,
            'status': self.status,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'auto_renew': self.auto_renew,
            'tokens_total': self.tokens_total,
            'tokens_used': self.tokens_used,
            'tokens_remaining': self.tokens_remaining,
            'messages_total': self.messages_total,
            'messages_used': self.messages_used,
            'messages_remaining': self.messages_remaining,
            'payment_id': self.payment_id,
            'external_id': self.external_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
