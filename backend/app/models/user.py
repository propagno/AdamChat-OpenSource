from app.extensions import db
from datetime import datetime
from flask_bcrypt import generate_password_hash, check_password_hash
import json


class User(db.Model):
    """
    Modelo para usuários do sistema
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(100), nullable=True)

    # Campos para gerenciamento de assinatura
    # free, basic, premium, business
    subscription_level = db.Column(db.String(20), default='free')

    # Campos para integração com Stripe
    stripe_customer_id = db.Column(db.String(100), nullable=True, unique=True)
    default_payment_method_id = db.Column(db.String(100), nullable=True)

    # Preferências do usuário
    preferences = db.Column(db.Text, nullable=True)  # JSON com preferências
    theme = db.Column(db.String(20), default='light')  # light, dark
    language = db.Column(db.String(5), default='pt-BR')  # código de idioma

    # Status e controle
    is_active = db.Column(db.Boolean, default=True)
    is_confirmed = db.Column(db.Boolean, default=False)
    is_admin = db.Column(db.Boolean, default=False)

    # Controle de tempo de sessão
    last_login = db.Column(db.DateTime, nullable=True)
    jwt_revoked_at = db.Column(db.DateTime, nullable=True)

    # Pista de auditoria
    created_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        if 'password' in kwargs:
            kwargs['password_hash'] = generate_password_hash(
                kwargs['password']).decode('utf-8')
            del kwargs['password']
        super(User, self).__init__(**kwargs)

    def __repr__(self):
        return f'<User {self.id}: {self.username}>'

    @property
    def password(self):
        raise AttributeError('Não é possível ler a senha')

    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_preferences(self):
        """
        Retorna as preferências do usuário como dicionário
        """
        if not self.preferences:
            return {}

        try:
            return json.loads(self.preferences)
        except:
            return {}

    def set_preferences(self, preferences_dict):
        """
        Define as preferências do usuário a partir de um dicionário
        """
        self.preferences = json.dumps(preferences_dict)

    def update_preference(self, key, value):
        """
        Atualiza uma preferência específica
        """
        prefs = self.get_preferences()
        prefs[key] = value
        self.set_preferences(prefs)

    def to_dict(self, include_private=False):
        """
        Converte o objeto para dicionário para serialização
        """
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email if include_private else None,
            'name': self.name,
            'subscription_level': self.subscription_level,
            'theme': self.theme,
            'language': self.language,
            'is_active': self.is_active,
            'is_admin': self.is_admin if include_private else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_private:
            data.update({
                'stripe_customer_id': self.stripe_customer_id,
                'preferences': self.get_preferences(),
                'is_confirmed': self.is_confirmed,
                'last_login': self.last_login.isoformat() if self.last_login else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            })

        return data
