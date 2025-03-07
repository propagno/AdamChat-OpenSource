"""
Serviço para gerenciamento de assinaturas e planos de usuários
"""

import logging
from datetime import datetime, timedelta
from app.db import get_db
from app.models.subscription_model import Subscription, SUBSCRIPTION_PLANS
from bson.objectid import ObjectId

logger = logging.getLogger(__name__)


class SubscriptionService:
    """Serviço para gerenciar assinaturas dos usuários"""

    def __init__(self):
        self.db = get_db()

    def get_user_subscription(self, user_id):
        """Obtém a assinatura atual do usuário"""
        sub_data = self.db.subscriptions.find_one({"user_id": user_id})
        if not sub_data:
            # Cria uma assinatura padrão para novos usuários
            subscription = Subscription(user_id)
            self.db.subscriptions.insert_one(subscription.to_dict())
            return subscription

        return Subscription.from_dict(sub_data)

    def upgrade_plan(self, user_id, new_plan):
        """Atualiza o plano do usuário"""
        if new_plan not in SUBSCRIPTION_PLANS:
            raise ValueError(f"Plano inválido: {new_plan}")

        subscription = self.get_user_subscription(user_id)
        subscription.plan = new_plan
        subscription.start_date = datetime.now()

        # Se for um plano pago, define a data de término para 30 dias
        if SUBSCRIPTION_PLANS[new_plan]["price"] > 0:
            subscription.end_date = datetime.now() + timedelta(days=30)
            subscription.next_billing_date = subscription.end_date

        self.db.subscriptions.update_one(
            {"user_id": user_id},
            {"$set": subscription.to_dict()},
            upsert=True
        )

        return subscription

    def add_tokens(self, user_id, token_amount):
        """Adiciona tokens extras à conta do usuário"""
        subscription = self.get_user_subscription(user_id)
        subscription.tokens_purchased += token_amount

        self.db.subscriptions.update_one(
            {"user_id": user_id},
            {"$set": {"tokens_purchased": subscription.tokens_purchased,
                      "updated_at": datetime.now()}}
        )

        return subscription

    def consume_tokens(self, user_id, token_amount):
        """Consome tokens ao usar serviços"""
        subscription = self.get_user_subscription(user_id)

        # Verifica se há tokens suficientes
        if subscription.get_tokens_remaining() < token_amount:
            return False, "Tokens insuficientes para esta operação"

        subscription.tokens_used += token_amount

        self.db.subscriptions.update_one(
            {"user_id": user_id},
            {"$set": {"tokens_used": subscription.tokens_used,
                      "updated_at": datetime.now()}}
        )

        # Verifica se está chegando no limite (80%)
        remaining = subscription.get_tokens_remaining()
        limit = subscription.get_tokens_limit()

        if remaining <= (limit * 0.2) and remaining > 0:
            # Aqui poderia disparar uma notificação
            logger.info(
                f"Usuário {user_id} está com poucos tokens restantes: {remaining}")

        return True, None

    def register_message(self, user_id):
        """Registra uma mensagem no contador do usuário"""
        subscription = self.get_user_subscription(user_id)

        if subscription.get_messages_remaining() <= 0:
            return False, "Limite de mensagens atingido para este plano"

        subscription.messages_used += 1

        self.db.subscriptions.update_one(
            {"user_id": user_id},
            {"$set": {"messages_used": subscription.messages_used,
                      "updated_at": datetime.now()}}
        )

        return True, None

    def reset_usage_counters(self, user_id):
        """Reseta os contadores de uso (normalmente chamado no início do ciclo de faturamento)"""
        self.db.subscriptions.update_one(
            {"user_id": user_id},
            {"$set": {"tokens_used": 0,
                      "messages_used": 0,
                      "updated_at": datetime.now()}}
        )

    def can_use_feature(self, user_id, feature):
        """Verifica se o usuário pode usar uma funcionalidade específica"""
        subscription = self.get_user_subscription(user_id)
        return subscription.can_use_feature(feature)

    def get_subscription_details(self, user_id):
        """Retorna os detalhes completos da assinatura do usuário"""
        subscription = self.get_user_subscription(user_id)
        plan_details = subscription.get_plan_details()

        return {
            "plan": subscription.plan,
            "plan_name": plan_details.get("name"),
            "tokens_limit": subscription.get_tokens_limit(),
            "tokens_used": subscription.tokens_used,
            "tokens_remaining": subscription.get_tokens_remaining(),
            "messages_limit": subscription.get_messages_limit(),
            "messages_used": subscription.messages_used,
            "messages_remaining": subscription.get_messages_remaining(),
            "features": {k: v for k, v in plan_details.items()
                         if k not in ["name", "monthly_tokens", "monthly_messages", "price"]},
            "active": subscription.active,
            "next_billing_date": subscription.next_billing_date
        }

    def check_subscription_status(self, user_id):
        """Verifica e atualiza o status da assinatura se necessário"""
        subscription = self.get_user_subscription(user_id)

        # Verifica se é um plano gratuito (não expira)
        if SUBSCRIPTION_PLANS[subscription.plan]["price"] == 0:
            return True

        # Verifica se a assinatura está ativa e não expirou
        if subscription.active and subscription.end_date:
            if subscription.end_date < datetime.now():
                # Assinatura expirou - volta para o plano gratuito
                subscription.plan = "free"
                subscription.active = True
                subscription.end_date = None

                self.db.subscriptions.update_one(
                    {"user_id": user_id},
                    {"$set": {"plan": "free",
                              "active": True,
                              "end_date": None,
                              "updated_at": datetime.now()}}
                )
                return False

        return subscription.active


# Instância global do serviço
subscription_service = SubscriptionService()
