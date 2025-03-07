from app.extensions import db
from app.models.user import User
from app.models.subscription import Subscription
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class InsufficientTokensError(Exception):
    """Erro quando o usuário não tem tokens suficientes"""
    pass


def get_token_balance(user_id):
    """
    Obtém o saldo atual de tokens do usuário

    Args:
        user_id: ID do usuário

    Returns:
        dict: Dicionário com o saldo e informações da assinatura
    """
    # Busca a assinatura ativa do usuário
    subscription = Subscription.query.filter_by(
        user_id=user_id,
        status='active'
    ).first()

    if not subscription:
        return {
            "success": False,
            "error": "Nenhuma assinatura ativa encontrada",
            "balance": 0,
            "tokens_used": 0,
            "tokens_total": 0
        }

    return {
        "success": True,
        "balance": subscription.tokens_remaining,
        "tokens_used": subscription.tokens_used,
        "tokens_total": subscription.tokens_total,
        "subscription_id": subscription.id,
        "plan_id": subscription.plan_id,
        "plan_name": subscription.plan.name if subscription.plan else None
    }


def add_tokens(user_id, amount, description=None):
    """
    Adiciona tokens à conta do usuário

    Args:
        user_id: ID do usuário
        amount: Quantidade de tokens a adicionar
        description: Descrição opcional da operação

    Returns:
        dict: Resultado da operação com novo saldo
    """
    try:
        # Verifica se é um número válido
        amount = int(amount)
        if amount <= 0:
            return {
                "success": False,
                "error": "Quantidade de tokens deve ser maior que zero"
            }

        # Busca a assinatura ativa do usuário
        subscription = Subscription.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()

        if not subscription:
            return {
                "success": False,
                "error": "Nenhuma assinatura ativa encontrada"
            }

        # Atualiza os tokens
        subscription.tokens_total += amount
        subscription.tokens_remaining += amount
        subscription.updated_at = datetime.utcnow()

        # Registra a transação no histórico (não implementado)

        db.session.commit()

        return {
            "success": True,
            "message": f"{amount} tokens adicionados com sucesso",
            "new_balance": subscription.tokens_remaining,
            "tokens_added": amount,
            "description": description
        }

    except Exception as e:
        db.session.rollback()
        logger.exception(f"Erro ao adicionar tokens: {str(e)}")
        return {
            "success": False,
            "error": f"Erro ao adicionar tokens: {str(e)}"
        }


def consume_tokens(user_id, amount, description=None, throw_exception=False):
    """
    Consome tokens da conta do usuário

    Args:
        user_id: ID do usuário
        amount: Quantidade de tokens a consumir
        description: Descrição opcional da operação
        throw_exception: Se True, lança exceção quando não há tokens suficientes

    Returns:
        dict: Resultado da operação com novo saldo

    Raises:
        InsufficientTokensError: Se throw_exception=True e não há tokens suficientes
    """
    try:
        # Verifica se é um número válido
        amount = int(amount)
        if amount <= 0:
            return {
                "success": False,
                "error": "Quantidade de tokens deve ser maior que zero"
            }

        # Busca a assinatura ativa do usuário
        subscription = Subscription.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()

        if not subscription:
            error_msg = "Nenhuma assinatura ativa encontrada"
            if throw_exception:
                raise InsufficientTokensError(error_msg)
            return {
                "success": False,
                "error": error_msg
            }

        # Verifica se há tokens suficientes
        if subscription.tokens_remaining < amount:
            error_msg = f"Saldo insuficiente. Necessário: {amount}, Disponível: {subscription.tokens_remaining}"
            if throw_exception:
                raise InsufficientTokensError(error_msg)
            return {
                "success": False,
                "error": error_msg,
                "tokens_required": amount,
                "tokens_available": subscription.tokens_remaining
            }

        # Atualiza os tokens
        subscription.tokens_used += amount
        subscription.tokens_remaining -= amount
        subscription.updated_at = datetime.utcnow()

        # Registra a transação no histórico (não implementado)

        db.session.commit()

        return {
            "success": True,
            "message": f"{amount} tokens consumidos com sucesso",
            "new_balance": subscription.tokens_remaining,
            "tokens_consumed": amount,
            "description": description
        }

    except InsufficientTokensError as e:
        # Não faz rollback aqui, apenas propaga a exceção
        if throw_exception:
            raise
        return {
            "success": False,
            "error": str(e),
            "tokens_required": amount,
            "tokens_available": subscription.tokens_remaining if subscription else 0
        }
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Erro ao consumir tokens: {str(e)}")
        return {
            "success": False,
            "error": f"Erro ao consumir tokens: {str(e)}"
        }


def refund_tokens(user_id, amount, description=None):
    """
    Devolve tokens para a conta do usuário (ex: em caso de erro ou cancelamento)

    Args:
        user_id: ID do usuário
        amount: Quantidade de tokens a devolver
        description: Descrição opcional da operação

    Returns:
        dict: Resultado da operação com novo saldo
    """
    try:
        # Verifica se é um número válido
        amount = int(amount)
        if amount <= 0:
            return {
                "success": False,
                "error": "Quantidade de tokens deve ser maior que zero"
            }

        # Busca a assinatura ativa do usuário
        subscription = Subscription.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()

        if not subscription:
            return {
                "success": False,
                "error": "Nenhuma assinatura ativa encontrada"
            }

        # Atualiza os tokens (garante que não vai além do total)
        refund_amount = min(amount, subscription.tokens_used)

        subscription.tokens_used -= refund_amount
        subscription.tokens_remaining += refund_amount
        subscription.updated_at = datetime.utcnow()

        # Registra a transação no histórico (não implementado)

        db.session.commit()

        return {
            "success": True,
            "message": f"{refund_amount} tokens devolvidos com sucesso",
            "new_balance": subscription.tokens_remaining,
            "tokens_refunded": refund_amount,
            "description": description
        }

    except Exception as e:
        db.session.rollback()
        logger.exception(f"Erro ao devolver tokens: {str(e)}")
        return {
            "success": False,
            "error": f"Erro ao devolver tokens: {str(e)}"
        }


def check_resource_availability(user_id, resource_type):
    """
    Verifica se o usuário tem acesso a determinado recurso com base no plano

    Args:
        user_id: ID do usuário
        resource_type: Tipo de recurso (video, avatar, fashion, etc)

    Returns:
        dict: Resultado com status de disponibilidade
    """
    try:
        # Busca a assinatura ativa do usuário
        subscription = Subscription.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()

        if not subscription:
            return {
                "success": False,
                "error": "Nenhuma assinatura ativa encontrada",
                "available": False
            }

        # Mapeia recursos para colunas do plano
        resource_map = {
            'video': 'has_video_generation',
            'avatar': 'has_avatar_creation',
            'fashion': 'has_fashion_photo',
            'api': 'has_api_access',
            'priority': 'has_priority_processing'
        }

        if resource_type not in resource_map:
            return {
                "success": False,
                "error": f"Tipo de recurso desconhecido: {resource_type}",
                "available": False
            }

        # Obtém o plano
        plan = subscription.plan

        # Verifica se o recurso está disponível
        attribute = resource_map[resource_type]
        is_available = getattr(plan, attribute, False)

        return {
            "success": True,
            "available": is_available,
            "plan_id": plan.id,
            "plan_name": plan.name,
            "resource": resource_type
        }

    except Exception as e:
        logger.exception(
            f"Erro ao verificar disponibilidade de recurso: {str(e)}")
        return {
            "success": False,
            "error": f"Erro ao verificar disponibilidade: {str(e)}",
            "available": False
        }
