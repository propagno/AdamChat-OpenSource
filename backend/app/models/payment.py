from app.extensions import db
from datetime import datetime
import json


class Payment(db.Model):
    """
    Modelo para armazenar histórico de pagamentos e transações
    """
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Detalhes do pagamento
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), nullable=False, default='BRL')
    # subscription, token_purchase, etc.
    type = db.Column(db.String(20), nullable=False)
    # completed, failed, pending
    status = db.Column(db.String(20), nullable=False)
    description = db.Column(db.String(256), nullable=True)

    # Referências externas
    payment_method_id = db.Column(
        db.String(50), nullable=True)  # ID do método usado
    # ID no sistema externo (Stripe, etc)
    external_id = db.Column(db.String(100), nullable=True, index=True)
    # Referência para pedido/fatura
    order_id = db.Column(db.String(100), nullable=True)

    # Detalhes adicionais
    # JSON com informações adicionais
    payment_metadata = db.Column(db.Text, nullable=True)
    error_message = db.Column(db.String(256), nullable=True)

    # Pista de auditoria
    created_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    user = db.relationship('User', backref=db.backref('payments', lazy=True))

    def __init__(self, **kwargs):
        super(Payment, self).__init__(**kwargs)

    def __repr__(self):
        return f'<Payment {self.id}: {self.amount} {self.currency} - {self.status}>'

    def to_dict(self):
        """
        Converte o objeto para dicionário para serialização
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': self.amount,
            'currency': self.currency,
            'type': self.type,
            'status': self.status,
            'description': self.description,
            'payment_method_id': self.payment_method_id,
            'external_id': self.external_id,
            'order_id': self.order_id,
            'payment_metadata': json.loads(self.payment_metadata) if self.payment_metadata else None,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class PaymentMethod(db.Model):
    """
    Modelo para armazenar métodos de pagamento dos usuários
    """
    __tablename__ = 'payment_methods'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Detalhes do método
    type = db.Column(db.String(20), nullable=False)  # card, bank_account, etc.
    provider = db.Column(db.String(20), nullable=False)  # stripe, local, etc.
    # JSON com detalhes específicos
    details = db.Column(db.Text, nullable=True)

    # Status
    is_default = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)

    # Pista de auditoria
    created_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)

    # Relacionamentos
    user = db.relationship('User', backref=db.backref(
        'payment_methods', lazy=True))

    def __init__(self, **kwargs):
        super(PaymentMethod, self).__init__(**kwargs)

    def __repr__(self):
        deleted = " (deleted)" if self.is_deleted else ""
        default = " (default)" if self.is_default else ""
        return f'<PaymentMethod {self.id}: {self.type} - {self.provider}{default}{deleted}>'

    def to_dict(self):
        """
        Converte o objeto para dicionário para serialização
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'provider': self.provider,
            'details': json.loads(self.details) if self.details else None,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
