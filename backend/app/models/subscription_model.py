"""
Modelo de dados para gerenciamento de assinaturas e planos
"""

from datetime import datetime

# Definição das estruturas de planos e seus limites
SUBSCRIPTION_PLANS = {
    "free": {
        "name": "Free",
        "monthly_tokens": 1000,
        "monthly_messages": 100,
        "image_generation": True,
        "image_quality": "standard",
        "video_generation": False,
        "avatar_creation": True,
        "fashion_photo": False,
        "max_resolution": "512x512",
        "advanced_models": False,
        "support_priority": "low",
        "price": 0.0,
    },
    "pro": {
        "name": "Pro",
        "monthly_tokens": 10000,
        "monthly_messages": 1000,
        "image_generation": True,
        "image_quality": "high",
        "video_generation": True,
        "avatar_creation": True,
        "fashion_photo": True,
        "max_resolution": "1024x1024",
        "advanced_models": True,
        "support_priority": "medium",
        "price": 29.99,
    },
    "enterprise": {
        "name": "Enterprise",
        "monthly_tokens": 100000,
        "monthly_messages": 10000,
        "image_generation": True,
        "image_quality": "ultra",
        "video_generation": True,
        "avatar_creation": True,
        "fashion_photo": True,
        "max_resolution": "2048x2048",
        "advanced_models": True,
        "support_priority": "high",
        "price": 99.99,
    }
}


class Subscription:
    """Modelo para assinaturas de usuários"""

    def __init__(self, user_id, plan="free", start_date=None, end_date=None,
                 tokens_used=0, tokens_purchased=0, messages_used=0):
        self.user_id = user_id
        self.plan = plan
        self.start_date = start_date or datetime.now()
        self.end_date = end_date
        self.tokens_used = tokens_used
        self.tokens_purchased = tokens_purchased  # Tokens extras comprados
        self.messages_used = messages_used
        self.active = True
        self.payment_method = None
        self.last_payment_date = None
        self.next_billing_date = None

    def to_dict(self):
        """Converte o objeto para dicionário para armazenamento no MongoDB"""
        return {
            "user_id": self.user_id,
            "plan": self.plan,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "tokens_used": self.tokens_used,
            "tokens_purchased": self.tokens_purchased,
            "messages_used": self.messages_used,
            "active": self.active,
            "payment_method": self.payment_method,
            "last_payment_date": self.last_payment_date,
            "next_billing_date": self.next_billing_date,
            "updated_at": datetime.now()
        }

    @classmethod
    def from_dict(cls, data):
        """Cria uma instância a partir de um dicionário"""
        instance = cls(
            user_id=data.get("user_id"),
            plan=data.get("plan", "free"),
            start_date=data.get("start_date"),
            end_date=data.get("end_date"),
            tokens_used=data.get("tokens_used", 0),
            tokens_purchased=data.get("tokens_purchased", 0),
            messages_used=data.get("messages_used", 0)
        )
        instance.active = data.get("active", True)
        instance.payment_method = data.get("payment_method")
        instance.last_payment_date = data.get("last_payment_date")
        instance.next_billing_date = data.get("next_billing_date")
        return instance

    def get_tokens_limit(self):
        """Retorna o limite total de tokens disponíveis para o usuário"""
        plan_tokens = SUBSCRIPTION_PLANS.get(
            self.plan, {}).get("monthly_tokens", 0)
        return plan_tokens + self.tokens_purchased

    def get_tokens_remaining(self):
        """Retorna o número de tokens restantes para o usuário"""
        return max(0, self.get_tokens_limit() - self.tokens_used)

    def get_messages_limit(self):
        """Retorna o limite de mensagens para o plano do usuário"""
        return SUBSCRIPTION_PLANS.get(self.plan, {}).get("monthly_messages", 0)

    def get_messages_remaining(self):
        """Retorna o número de mensagens restantes para o usuário"""
        return max(0, self.get_messages_limit() - self.messages_used)

    def can_use_feature(self, feature):
        """Verifica se o usuário pode utilizar uma funcionalidade específica"""
        return SUBSCRIPTION_PLANS.get(self.plan, {}).get(feature, False)

    def get_plan_details(self):
        """Retorna os detalhes completos do plano atual"""
        return SUBSCRIPTION_PLANS.get(self.plan, {})
