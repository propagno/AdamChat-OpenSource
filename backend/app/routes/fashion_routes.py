"""
Rotas para geração de fotografias de moda com IA
"""

import logging
import uuid
from flask import Blueprint, jsonify, request, current_app
from app.middlewares.auth import token_required
from app.db import get_db
from app.services.subscription_service import subscription_service
from datetime import datetime

logger = logging.getLogger(__name__)
fashion_bp = Blueprint("fashion_bp", __name__, url_prefix='/api/fashion')


@fashion_bp.route("/generate", methods=["POST"])
@token_required
def generate_fashion_photo(user_data):
    """
    Gera uma fotografia de moda com base nos parâmetros fornecidos
    ---
    tags:
      - Fotografia de Moda
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
              description: Descrição da foto de moda desejada
            model_type:
              type: string
              enum: [male, female, both]
              default: female
            outfit_style:
              type: string
              description: Estilo das roupas (ex. "casual", "formal", "streetwear")
            lighting:
              type: string
              enum: [studio, natural, evening, dramatic]
              default: studio
            background:
              type: string
              description: Descrição do plano de fundo
            resolution:
              type: string
              enum: [512x512, 1024x1024, 2048x2048]
              default: 1024x1024
    responses:
      200:
        description: Solicitação de fotografia enviada com sucesso
      400:
        description: Dados inválidos
      403:
        description: Limite de uso excedido ou recurso não disponível no plano
    """
    user_id = user_data.get('sub')

    # Verifica se o usuário pode usar este recurso
    if not subscription_service.can_use_feature(user_id, "fashion_photo"):
        return jsonify({
            "status": "error",
            "message": "Fotografia de moda não disponível no seu plano atual. Faça upgrade para acessar este recurso."
        }), 403

    data = request.get_json()
    if not data or 'description' not in data:
        return jsonify({
            "status": "error",
            "message": "Descrição da fotografia é obrigatória"
        }), 400

    # Consumo de tokens
    token_cost = 80  # Custo base

    # Ajusta custo com base na resolução
    resolution = data.get('resolution', '1024x1024')
    if resolution == '2048x2048':
        token_cost += 100

    # Verifica se tem tokens suficientes
    success, message = subscription_service.consume_tokens(user_id, token_cost)
    if not success:
        return jsonify({
            "status": "error",
            "message": message
        }), 403

    # Gera ID único para a imagem
    photo_id = str(uuid.uuid4())

    # Registra a solicitação no banco
    db = get_db()

    # Aqui geraria a imagem (simulado para este exemplo)

    # Cria entrada no banco para a foto de moda
    photo_data = {
        "photo_id": photo_id,
        "user_id": user_id,
        "description": data.get('description'),
        "model_type": data.get('model_type', 'female'),
        "outfit_style": data.get('outfit_style'),
        "lighting": data.get('lighting', 'studio'),
        "background": data.get('background'),
        "resolution": resolution,
        "status": "processing",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "token_cost": token_cost
    }

    db.fashion_photos.insert_one(photo_data)

    return jsonify({
        "status": "success",
        "message": "Solicitação de fotografia de moda recebida. O processamento pode levar alguns minutos.",
        "photo_id": photo_id,
        "estimated_time": "1-3 minutos"
    })


@fashion_bp.route("/<photo_id>/status", methods=["GET"])
@token_required
def check_photo_status(user_data, photo_id):
    """
    Verifica o status de processamento de uma fotografia de moda
    ---
    tags:
      - Fotografia de Moda
    security:
      - Bearer: []
    parameters:
      - name: photo_id
        in: path
        required: true
        type: string
    responses:
      200:
        description: Status da fotografia
      404:
        description: Fotografia não encontrada
    """
    user_id = user_data.get('sub')
    db = get_db()

    photo = db.fashion_photos.find_one(
        {"photo_id": photo_id, "user_id": user_id})
    if not photo:
        return jsonify({
            "status": "error",
            "message": "Fotografia não encontrada"
        }), 404

    # Para fins de simulação, atualiza o status se estiver em processamento há mais de 20 segundos
    if photo.get("status") == "processing":
        time_diff = (datetime.now() - photo.get("created_at")).total_seconds()
        if time_diff > 20:
            new_status = "completed"
            # Simula URL da foto
            photo_url = f"https://storage.innerai.example.com/fashion/{photo_id}.png"

            db.fashion_photos.update_one(
                {"photo_id": photo_id},
                {"$set": {
                    "status": new_status,
                    "url": photo_url,
                    "updated_at": datetime.now()
                }}
            )

            photo["status"] = new_status
            photo["url"] = photo_url

    return jsonify({
        "photo_id": photo.get("photo_id"),
        "description": photo.get("description"),
        "status": photo.get("status"),
        "url": photo.get("url") if photo.get("status") == "completed" else None,
        "resolution": photo.get("resolution"),
        "created_at": photo.get("created_at"),
        "updated_at": photo.get("updated_at")
    })


@fashion_bp.route("/list", methods=["GET"])
@token_required
def list_user_photos(user_data):
    """
    Lista todas as fotografias de moda do usuário
    ---
    tags:
      - Fotografia de Moda
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
        description: Lista de fotografias do usuário
    """
    user_id = user_data.get('sub')
    limit = int(request.args.get('limit', 20))

    db = get_db()

    # Busca as fotografias ordenadas por data de criação
    photos = list(db.fashion_photos.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit))

    return jsonify({
        "photos": photos,
        "count": len(photos)
    })


@fashion_bp.route("/<photo_id>", methods=["DELETE"])
@token_required
def delete_photo(user_data, photo_id):
    """
    Remove uma fotografia de moda do usuário
    ---
    tags:
      - Fotografia de Moda
    security:
      - Bearer: []
    parameters:
      - name: photo_id
        in: path
        required: true
        type: string
    responses:
      200:
        description: Fotografia removida com sucesso
      404:
        description: Fotografia não encontrada
    """
    user_id = user_data.get('sub')
    db = get_db()

    # Verifica se a foto existe e pertence ao usuário
    photo = db.fashion_photos.find_one(
        {"photo_id": photo_id, "user_id": user_id})
    if not photo:
        return jsonify({
            "status": "error",
            "message": "Fotografia não encontrada"
        }), 404

    # Remove a foto
    db.fashion_photos.delete_one({"photo_id": photo_id})

    # Aqui teria código para remover o arquivo do storage

    return jsonify({
        "status": "success",
        "message": "Fotografia removida com sucesso"
    })


@fashion_bp.route("/outfit-styles", methods=["GET"])
@token_required
def get_outfit_styles(user_data):
    """
    Retorna uma lista de estilos de roupas disponíveis
    ---
    tags:
      - Fotografia de Moda
    security:
      - Bearer: []
    responses:
      200:
        description: Lista de estilos disponíveis
    """
    styles = [
        {"id": "casual", "name": "Casual",
            "description": "Roupas do dia a dia, confortáveis e simples"},
        {"id": "formal", "name": "Formal",
            "description": "Roupas elegantes, como ternos, vestidos e trajes sociais"},
        {"id": "streetwear", "name": "Streetwear",
            "description": "Estilo urbano, influenciado pela cultura skate e hip-hop"},
        {"id": "vintage", "name": "Vintage",
            "description": "Peças inspiradas em décadas passadas (anos 50, 60, 70, 80, 90)"},
        {"id": "bohemian", "name": "Boho",
            "description": "Estilo livre e descontraído com elementos étnicos e naturais"},
        {"id": "athleisure", "name": "Athleisure",
            "description": "Roupas esportivas usadas no dia a dia"},
        {"id": "business", "name": "Business",
            "description": "Trajes corporativos e roupas para ambiente de trabalho"},
        {"id": "evening", "name": "Gala",
            "description": "Vestidos longos, ternos e trajes para eventos formais noturnos"},
        {"id": "summer", "name": "Verão",
            "description": "Roupas leves, shorts, regatas, vestidos e saídas de praia"},
        {"id": "winter", "name": "Inverno",
            "description": "Casacos, blusas de lã, cachecóis e roupas para o frio"}
    ]

    return jsonify({
        "styles": styles
    })


@fashion_bp.route("/backgrounds", methods=["GET"])
@token_required
def get_backgrounds(user_data):
    """
    Retorna uma lista de fundos pré-definidos para fotografias de moda
    ---
    tags:
      - Fotografia de Moda
    security:
      - Bearer: []
    responses:
      200:
        description: Lista de fundos disponíveis
    """
    backgrounds = [
        {"id": "studio_white", "name": "Estúdio Branco",
            "description": "Fundo branco limpo de estúdio profissional"},
        {"id": "studio_gray", "name": "Estúdio Cinza",
            "description": "Fundo cinza neutro de estúdio"},
        {"id": "studio_black", "name": "Estúdio Preto",
            "description": "Fundo preto dramático de estúdio"},
        {"id": "urban", "name": "Urbano",
            "description": "Cenário urbano com ruas, prédios e elementos da cidade"},
        {"id": "nature", "name": "Natureza",
            "description": "Ambientes naturais como campos, florestas ou praias"},
        {"id": "gradient", "name": "Gradiente",
            "description": "Fundos com gradientes coloridos suaves"},
        {"id": "indoor_minimal", "name": "Interior Minimalista",
            "description": "Ambientes internos clean e minimalistas"},
        {"id": "cafe", "name": "Café",
            "description": "Interior de café ou restaurante estiloso"},
        {"id": "runway", "name": "Passarela",
            "description": "Ambiente de desfile de moda com passarela"},
        {"id": "abstract", "name": "Abstrato",
            "description": "Fundos artísticos abstratos com formas e cores diversas"}
    ]

    return jsonify({
        "backgrounds": backgrounds
    })
