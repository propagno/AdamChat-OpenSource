"""
Rotas para geração e gerenciamento de avatares com IA
"""

import logging
import uuid
import os
from flask import Blueprint, jsonify, request, current_app
from app.middlewares.auth import token_required
from app.db import get_db
from app.services.subscription_service import subscription_service
from datetime import datetime

logger = logging.getLogger(__name__)
avatar_bp = Blueprint("avatar_bp", __name__, url_prefix='/api/avatar')


@avatar_bp.route("/generate", methods=["POST"])
@token_required
def generate_avatar(user_data):
    """
    Gera um avatar personalizado para o usuário
    ---
    tags:
      - Avatares
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - description
          properties:
            description:
              type: string
              description: Descrição textual do avatar (ex. "homem de terno azul com óculos")
            reference_image_url:
              type: string
              description: URL de imagem de referência (opcional)
            style:
              type: string
              enum: [realistic, cartoon, anime, 3d, pixel]
              default: realistic
            gender:
              type: string
              enum: [male, female, neutral]
              default: neutral
    responses:
      200:
        description: Solicitação de avatar enviada com sucesso
      400:
        description: Dados inválidos
      403:
        description: Limite de uso excedido
    """
    user_id = user_data.get('sub')

    # Verifica se o usuário pode usar o recurso
    if not subscription_service.can_use_feature(user_id, "avatar_creation"):
        return jsonify({
            "status": "error",
            "message": "Geração de avatares não disponível no seu plano atual."
        }), 403

    data = request.get_json()
    if not data or 'description' not in data:
        return jsonify({
            "status": "error",
            "message": "Descrição do avatar é obrigatória"
        }), 400

    # Consumo de tokens
    token_cost = 50  # Custo base para avatar simples

    # Verifica o estilo e ajusta o custo
    style = data.get('style', 'realistic')
    if style == 'realistic':
        token_cost = 80
    elif style == '3d':
        token_cost = 100

    # Verifica se tem tokens suficientes
    success, message = subscription_service.consume_tokens(user_id, token_cost)
    if not success:
        return jsonify({
            "status": "error",
            "message": message
        }), 403

    # Gera ID único para o avatar
    avatar_id = str(uuid.uuid4())

    # Registra a solicitação no banco
    db = get_db()

    # Simula o processo de geração
    # Em uma implementação real, isso seria processado de forma assíncrona

    # Cria entrada no banco para o avatar
    avatar_data = {
        "avatar_id": avatar_id,
        "user_id": user_id,
        "name": f"Avatar {datetime.now().strftime('%d/%m/%Y %H:%M')}",
        "description": data.get('description'),
        "reference_image": data.get('reference_image_url'),
        "style": style,
        "gender": data.get('gender', 'neutral'),
        "status": "processing",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "token_cost": token_cost
    }

    db.avatars.insert_one(avatar_data)

    return jsonify({
        "status": "success",
        "message": "Solicitação de avatar recebida. O processamento pode levar alguns minutos.",
        "avatar_id": avatar_id,
        "estimated_time": "1-3 minutos"
    })


@avatar_bp.route("/<avatar_id>/status", methods=["GET"])
@token_required
def check_avatar_status(user_data, avatar_id):
    """
    Verifica o status de processamento de um avatar
    ---
    tags:
      - Avatares
    security:
      - Bearer: []
    parameters:
      - name: avatar_id
        in: path
        required: true
        type: string
    responses:
      200:
        description: Status do avatar
      404:
        description: Avatar não encontrado
    """
    user_id = user_data.get('sub')
    db = get_db()

    avatar = db.avatars.find_one({"avatar_id": avatar_id, "user_id": user_id})
    if not avatar:
        return jsonify({
            "status": "error",
            "message": "Avatar não encontrado"
        }), 404

    # Para fins de simulação, atualiza o status se estiver em processamento há mais de 20 segundos
    if avatar.get("status") == "processing":
        time_diff = (datetime.now() - avatar.get("created_at")).total_seconds()
        if time_diff > 20:
            new_status = "completed"
            # Simula URL do avatar
            avatar_url = f"https://storage.innerai.example.com/avatars/{avatar_id}.png"

            db.avatars.update_one(
                {"avatar_id": avatar_id},
                {"$set": {
                    "status": new_status,
                    "url": avatar_url,
                    "updated_at": datetime.now()
                }}
            )

            avatar["status"] = new_status
            avatar["url"] = avatar_url

    return jsonify({
        "avatar_id": avatar.get("avatar_id"),
        "name": avatar.get("name"),
        "status": avatar.get("status"),
        "style": avatar.get("style"),
        "url": avatar.get("url") if avatar.get("status") == "completed" else None,
        "created_at": avatar.get("created_at"),
        "updated_at": avatar.get("updated_at")
    })


@avatar_bp.route("/list", methods=["GET"])
@token_required
def list_user_avatars(user_data):
    """
    Lista todos os avatares do usuário
    ---
    tags:
      - Avatares
    security:
      - Bearer: []
    parameters:
      - name: limit
        in: query
        type: integer
        description: Limite de resultados
        default: 20
    responses:
      200:
        description: Lista de avatares do usuário
    """
    user_id = user_data.get('sub')
    limit = int(request.args.get('limit', 20))

    db = get_db()

    # Busca os avatares ordenados por data de criação
    avatars = list(db.avatars.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit))

    return jsonify({
        "avatars": avatars,
        "count": len(avatars)
    })


@avatar_bp.route("/<avatar_id>", methods=["PUT"])
@token_required
def update_avatar(user_data, avatar_id):
    """
    Atualiza informações de um avatar existente
    ---
    tags:
      - Avatares
    security:
      - Bearer: []
    parameters:
      - name: avatar_id
        in: path
        required: true
        type: string
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
              description: Novo nome para o avatar
    responses:
      200:
        description: Avatar atualizado com sucesso
      404:
        description: Avatar não encontrado
      400:
        description: Dados inválidos
    """
    user_id = user_data.get('sub')

    data = request.get_json()
    if not data:
        return jsonify({
            "status": "error",
            "message": "Dados inválidos"
        }), 400

    db = get_db()

    # Verifica se o avatar existe e pertence ao usuário
    avatar = db.avatars.find_one({"avatar_id": avatar_id, "user_id": user_id})
    if not avatar:
        return jsonify({
            "status": "error",
            "message": "Avatar não encontrado"
        }), 404

    # Atualiza apenas os campos permitidos
    update_data = {}

    if 'name' in data:
        update_data["name"] = data["name"]

    if update_data:
        update_data["updated_at"] = datetime.now()

        db.avatars.update_one(
            {"avatar_id": avatar_id},
            {"$set": update_data}
        )

    return jsonify({
        "status": "success",
        "message": "Avatar atualizado com sucesso"
    })


@avatar_bp.route("/<avatar_id>", methods=["DELETE"])
@token_required
def delete_avatar(user_data, avatar_id):
    """
    Remove um avatar do usuário
    ---
    tags:
      - Avatares
    security:
      - Bearer: []
    parameters:
      - name: avatar_id
        in: path
        required: true
        type: string
    responses:
      200:
        description: Avatar removido com sucesso
      404:
        description: Avatar não encontrado
    """
    user_id = user_data.get('sub')
    db = get_db()

    # Verifica se o avatar existe e pertence ao usuário
    avatar = db.avatars.find_one({"avatar_id": avatar_id, "user_id": user_id})
    if not avatar:
        return jsonify({
            "status": "error",
            "message": "Avatar não encontrado"
        }), 404

    # Remove o avatar
    db.avatars.delete_one({"avatar_id": avatar_id})

    # Aqui teria código para remover o arquivo do storage

    return jsonify({
        "status": "success",
        "message": "Avatar removido com sucesso"
    })
