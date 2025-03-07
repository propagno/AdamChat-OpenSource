# backend/app/routes/dashboard_routes.py

"""
Rotas para o dashboard do Inner AI
"""

from flask import Blueprint, jsonify, request, current_app
from app.middlewares.auth import token_required
from app.services.subscription_service import subscription_service
from app.db import get_db
import logging

logger = logging.getLogger(__name__)
dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@dashboard_bp.route('/', methods=['GET'])
@token_required
def dashboard(user_data):
    """
    Retorna os dados do dashboard principal do usuário
    ---
    tags:
      - Dashboard
    security:
      - Bearer: []
    responses:
      200:
        description: Dados do dashboard
      401:
        description: Token inválido ou expirado
    """
    user_id = user_data.get('sub')

    # Obtém dados da assinatura do usuário
    subscription_details = subscription_service.get_subscription_details(
        user_id)

    # Obtém dados de uso recente
    db = get_db()

    # Busca as últimas 5 conversas
    recent_chats = list(db.conversations.find(
        {"user_id": user_id},
        {"_id": 1, "title": 1, "created_at": 1, "updated_at": 1}
    ).sort("updated_at", -1).limit(5))

    # Busca as últimas 5 imagens geradas
    recent_images = list(db.images.find(
        {"user_id": user_id},
        {"_id": 1, "description": 1, "url": 1, "created_at": 1}
    ).sort("created_at", -1).limit(5))

    # Busca os últimos 5 vídeos gerados (se existir a coleção)
    recent_videos = []
    if "videos" in db.list_collection_names():
        recent_videos = list(db.videos.find(
            {"user_id": user_id},
            {"_id": 1, "title": 1, "url": 1, "created_at": 1}
        ).sort("created_at", -1).limit(5))

    # Busca os últimos 5 avatares gerados (se existir a coleção)
    recent_avatars = []
    if "avatars" in db.list_collection_names():
        recent_avatars = list(db.avatars.find(
            {"user_id": user_id},
            {"_id": 1, "name": 1, "url": 1, "created_at": 1}
        ).sort("created_at", -1).limit(5))

    # Define os cards de funcionalidades disponíveis com base no plano
    features_cards = [
        {
            "id": "chat",
            "title": "Chat com IA",
            "description": "Converse com a Inner AI para obter respostas, gerar textos e receber assistência.",
            "icon": "chat",
            "available": True  # Disponível para todos os planos
        },
        {
            "id": "image",
            "title": "Geração de Imagens",
            "description": "Crie imagens incríveis a partir de descrições textuais.",
            "icon": "image",
            "available": subscription_service.can_use_feature(user_id, "image_generation")
        },
        {
            "id": "avatar",
            "title": "Criação de Avatar",
            "description": "Crie avatares personalizados com base em descrições ou fotos.",
            "icon": "person",
            "available": subscription_service.can_use_feature(user_id, "avatar_creation")
        },
        {
            "id": "video",
            "title": "Geração de Vídeo",
            "description": "Transforme imagens em vídeos animados ou crie vídeos a partir do zero.",
            "icon": "video",
            "available": subscription_service.can_use_feature(user_id, "video_generation")
        },
        {
            "id": "fashion",
            "title": "Fotografia de Moda",
            "description": "Gere imagens profissionais de moda com modelos e roupas personalizadas.",
            "icon": "style",
            "available": subscription_service.can_use_feature(user_id, "fashion_photo")
        }
    ]

    # Obtém dados do usuário
    user = db.users.find_one({"_id": user_id}, {"name": 1, "email": 1})

    return jsonify({
        "user": {
            "name": user.get("name", "Usuário"),
            "email": user.get("email", "")
        },
        "subscription": subscription_details,
        "features": features_cards,
        "recent_activity": {
            "chats": recent_chats,
            "images": recent_images,
            "videos": recent_videos,
            "avatars": recent_avatars
        }
    })


@dashboard_bp.route('/plans', methods=['GET'])
@token_required
def available_plans(user_data):
    """
    Retorna todos os planos disponíveis para assinatura
    ---
    tags:
      - Dashboard
    security:
      - Bearer: []
    responses:
      200:
        description: Lista de planos disponíveis
    """
    from app.models.subscription_model import SUBSCRIPTION_PLANS

    user_id = user_data.get('sub')
    current_subscription = subscription_service.get_user_subscription(user_id)

    plans_list = []
    for plan_id, plan_details in SUBSCRIPTION_PLANS.items():
        plans_list.append({
            "id": plan_id,
            "name": plan_details["name"],
            "price": plan_details["price"],
            "features": {
                "tokens": plan_details["monthly_tokens"],
                "messages": plan_details["monthly_messages"],
                "image_quality": plan_details["image_quality"],
                "video": plan_details["video_generation"],
                "avatar": plan_details["avatar_creation"],
                "fashion": plan_details["fashion_photo"],
                "resolution": plan_details["max_resolution"],
                "advanced_models": plan_details["advanced_models"]
            },
            "current": plan_id == current_subscription.plan
        })

    return jsonify({
        "plans": plans_list
    })


@dashboard_bp.route('/upgrade', methods=['POST'])
@token_required
def upgrade_plan(user_data):
    """
    Atualiza o plano do usuário
    ---
    tags:
      - Dashboard
    security:
      - Bearer: []
    parameters:
      - in: body
        name: plan
        required: true
        schema:
          type: object
          required:
            - plan_id
          properties:
            plan_id:
              type: string
              description: ID do plano (free, pro, enterprise)
            payment_method:
              type: object
              description: Dados de pagamento (opcional para plano free)
    responses:
      200:
        description: Plano atualizado com sucesso
      400:
        description: Dados inválidos
      402:
        description: Problema no pagamento
    """
    data = request.get_json()

    if not data or 'plan_id' not in data:
        return jsonify({
            "status": "error",
            "message": "Dados incompletos"
        }), 400

    plan_id = data.get('plan_id')
    user_id = user_data.get('sub')

    try:
        # Aqui poderia ter uma integração com gateway de pagamento
        # para planos pagos, antes de fazer o upgrade
        from app.models.subscription_model import SUBSCRIPTION_PLANS

        if plan_id in SUBSCRIPTION_PLANS and SUBSCRIPTION_PLANS[plan_id]["price"] > 0:
            payment_method = data.get('payment_method')
            if not payment_method:
                return jsonify({
                    "status": "error",
                    "message": "Método de pagamento obrigatório para planos pagos"
                }), 400

            # Processa pagamento aqui
            # ...

        # Atualiza o plano
        subscription = subscription_service.upgrade_plan(user_id, plan_id)

        return jsonify({
            "status": "success",
            "message": f"Plano atualizado para {SUBSCRIPTION_PLANS[plan_id]['name']}",
            "subscription": subscription_service.get_subscription_details(user_id)
        })

    except ValueError as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400
    except Exception as e:
        logger.error(f"Erro ao atualizar plano: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Erro interno ao processar sua solicitação"
        }), 500


@dashboard_bp.route('/tokens/add', methods=['POST'])
@token_required
def add_tokens(user_data):
    """
    Adiciona tokens à conta do usuário
    ---
    tags:
      - Dashboard
    security:
      - Bearer: []
    parameters:
      - in: body
        name: tokens
        required: true
        schema:
          type: object
          required:
            - amount
          properties:
            amount:
              type: integer
              description: Quantidade de tokens a adicionar
            payment_method:
              type: object
              description: Dados de pagamento
    responses:
      200:
        description: Tokens adicionados com sucesso
      400:
        description: Dados inválidos
      402:
        description: Problema no pagamento
    """
    data = request.get_json()

    if not data or 'amount' not in data or not data.get('payment_method'):
        return jsonify({
            "status": "error",
            "message": "Dados incompletos"
        }), 400

    token_amount = data.get('amount')
    user_id = user_data.get('sub')

    if token_amount <= 0:
        return jsonify({
            "status": "error",
            "message": "A quantidade de tokens deve ser maior que zero"
        }), 400

    try:
        # Aqui teria integração com gateway de pagamento
        # ...

        # Adiciona os tokens
        subscription = subscription_service.add_tokens(user_id, token_amount)

        return jsonify({
            "status": "success",
            "message": f"{token_amount} tokens adicionados com sucesso",
            "subscription": subscription_service.get_subscription_details(user_id)
        })

    except Exception as e:
        logger.error(f"Erro ao adicionar tokens: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Erro interno ao processar sua solicitação"
        }), 500


@dashboard_bp.route('/usage/reset', methods=['POST'])
@token_required
def reset_usage(user_data):
    """
    Reseta contadores de uso (geralmente para testes ou admin)
    ---
    tags:
      - Dashboard
    security:
      - Bearer: []
    responses:
      200:
        description: Contadores resetados com sucesso
      403:
        description: Permissão negada
    """
    user_id = user_data.get('sub')

    # Verifica se o usuário é administrador
    if not user_data.get('is_admin', False):
        return jsonify({
            "status": "error",
            "message": "Permissão negada"
        }), 403

    subscription_service.reset_usage_counters(user_id)

    return jsonify({
        "status": "success",
        "message": "Contadores de uso resetados com sucesso",
        "subscription": subscription_service.get_subscription_details(user_id)
    })
