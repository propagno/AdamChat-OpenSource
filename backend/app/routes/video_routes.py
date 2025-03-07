"""
Rotas para geração e manipulação de vídeos com IA
"""

import logging
import uuid
from flask import Blueprint, jsonify, request, current_app
from app.middlewares.auth import token_required
from app.db import get_db
from app.services.subscription_service import subscription_service
import time
from datetime import datetime

logger = logging.getLogger(__name__)
video_bp = Blueprint("video_bp", __name__, url_prefix='/api/video')


@video_bp.route("/generate", methods=["POST"])
@token_required
def generate_video(user_data):
    """
    Gera um vídeo a partir de um prompt textual ou imagem
    ---
    tags:
      - Vídeos
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - prompt
          properties:
            prompt:
              type: string
              description: Descrição textual do vídeo a ser gerado
            image_url:
              type: string
              description: URL da imagem de referência (opcional)
            duration:
              type: integer
              description: Duração do vídeo em segundos (2-30)
              default: 5
            style:
              type: string
              enum: [realistic, animation, cinematic, artistic]
              default: realistic
            resolution:
              type: string
              enum: [480p, 720p, 1080p]
              default: 720p
    responses:
      200:
        description: Solicitação de vídeo enviada com sucesso
      400:
        description: Dados inválidos
      403:
        description: Limite de uso excedido ou recurso não disponível no plano
    """
    user_id = user_data.get('sub')

    # Verifica se o usuário pode usar o recurso de vídeo
    if not subscription_service.can_use_feature(user_id, "video_generation"):
        return jsonify({
            "status": "error",
            "message": "Geração de vídeos não disponível no seu plano atual. Faça upgrade para acessar este recurso."
        }), 403

    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({
            "status": "error",
            "message": "Descrição do vídeo (prompt) é obrigatória"
        }), 400

    # Consumo de tokens - cada vídeo consome mais tokens que imagens
    token_cost = 100  # Custo base

    # Ajusta custo com base na duração e resolução
    duration = data.get('duration', 5)
    if duration > 15:
        token_cost += 150
    elif duration > 5:
        token_cost += 50

    resolution = data.get('resolution', '720p')
    if resolution == '1080p':
        token_cost += 100

    # Verifica se tem tokens suficientes
    success, message = subscription_service.consume_tokens(user_id, token_cost)
    if not success:
        return jsonify({
            "status": "error",
            "message": message
        }), 403

    # Gera ID único para o vídeo
    video_id = str(uuid.uuid4())

    # Registra a solicitação no banco
    db = get_db()

    # Aqui processaria o vídeo de forma assíncrona em background
    # Para este exemplo, apenas simulamos o resultado

    # Cria entrada no banco para o vídeo
    video_data = {
        "video_id": video_id,
        "user_id": user_id,
        "prompt": data.get('prompt'),
        "image_url": data.get('image_url'),
        "duration": duration,
        "style": data.get('style', 'realistic'),
        "resolution": resolution,
        "status": "processing",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "token_cost": token_cost
    }

    db.videos.insert_one(video_data)

    return jsonify({
        "status": "success",
        "message": "Solicitação de vídeo recebida. O processamento pode levar alguns minutos.",
        "video_id": video_id,
        "estimated_time": "2-5 minutos"
    })


@video_bp.route("/<video_id>/status", methods=["GET"])
@token_required
def check_video_status(user_data, video_id):
    """
    Verifica o status de processamento de um vídeo
    ---
    tags:
      - Vídeos
    security:
      - Bearer: []
    parameters:
      - name: video_id
        in: path
        required: true
        type: string
        description: ID do vídeo
    responses:
      200:
        description: Status do vídeo
      404:
        description: Vídeo não encontrado
    """
    user_id = user_data.get('sub')
    db = get_db()

    video = db.videos.find_one({"video_id": video_id, "user_id": user_id})
    if not video:
        return jsonify({
            "status": "error",
            "message": "Vídeo não encontrado"
        }), 404

    # Para fins de simulação, atualiza o status se estiver em processamento há mais de 30 segundos
    if video.get("status") == "processing":
        time_diff = (datetime.now() - video.get("created_at")).total_seconds()
        if time_diff > 30:
            new_status = "completed"
            # Simula URL do vídeo
            video_url = f"https://storage.innerai.example.com/videos/{video_id}.mp4"

            db.videos.update_one(
                {"video_id": video_id},
                {"$set": {
                    "status": new_status,
                    "url": video_url,
                    "updated_at": datetime.now()
                }}
            )

            video["status"] = new_status
            video["url"] = video_url

    return jsonify({
        "video_id": video.get("video_id"),
        "status": video.get("status"),
        "url": video.get("url") if video.get("status") == "completed" else None,
        "created_at": video.get("created_at"),
        "updated_at": video.get("updated_at")
    })


@video_bp.route("/list", methods=["GET"])
@token_required
def list_user_videos(user_data):
    """
    Lista todos os vídeos gerados pelo usuário
    ---
    tags:
      - Vídeos
    security:
      - Bearer: []
    parameters:
      - name: limit
        in: query
        type: integer
        description: Limite de resultados
        default: 20
      - name: status
        in: query
        type: string
        description: Filtrar por status (processing, completed, failed)
    responses:
      200:
        description: Lista de vídeos do usuário
    """
    user_id = user_data.get('sub')
    limit = int(request.args.get('limit', 20))
    status = request.args.get('status')

    db = get_db()

    # Constrói o filtro
    filter_query = {"user_id": user_id}
    if status:
        filter_query["status"] = status

    # Busca os vídeos ordenados por data de criação
    videos = list(db.videos.find(
        filter_query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit))

    return jsonify({
        "videos": videos,
        "count": len(videos)
    })


@video_bp.route("/<video_id>", methods=["DELETE"])
@token_required
def delete_video(user_data, video_id):
    """
    Remove um vídeo do usuário
    ---
    tags:
      - Vídeos
    security:
      - Bearer: []
    parameters:
      - name: video_id
        in: path
        required: true
        type: string
        description: ID do vídeo
    responses:
      200:
        description: Vídeo removido com sucesso
      404:
        description: Vídeo não encontrado
    """
    user_id = user_data.get('sub')
    db = get_db()

    # Verifica se o vídeo existe e pertence ao usuário
    video = db.videos.find_one({"video_id": video_id, "user_id": user_id})
    if not video:
        return jsonify({
            "status": "error",
            "message": "Vídeo não encontrado"
        }), 404

    # Remove o vídeo
    db.videos.delete_one({"video_id": video_id})

    # Aqui teria código para remover o arquivo do storage

    return jsonify({
        "status": "success",
        "message": "Vídeo removido com sucesso"
    })


@video_bp.route("/image-to-video", methods=["POST"])
@token_required
def image_to_video(user_data):
    """
    Gera um vídeo animado a partir de uma imagem existente
    ---
    tags:
      - Vídeos
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - image_id
          properties:
            image_id:
              type: string
              description: ID da imagem que será convertida em vídeo
            motion:
              type: string
              enum: [zoom, pan, rotate, 3d]
              default: zoom
            duration:
              type: integer
              description: Duração do vídeo em segundos (2-15)
              default: 5
    responses:
      200:
        description: Solicitação de conversão enviada com sucesso
      400:
        description: Dados inválidos
      403:
        description: Limite de uso excedido ou recurso não disponível no plano
      404:
        description: Imagem não encontrada
    """
    user_id = user_data.get('sub')

    # Verifica se o usuário pode usar o recurso de vídeo
    if not subscription_service.can_use_feature(user_id, "video_generation"):
        return jsonify({
            "status": "error",
            "message": "Conversão de imagem para vídeo não disponível no seu plano atual. Faça upgrade para acessar este recurso."
        }), 403

    data = request.get_json()
    if not data or 'image_id' not in data:
        return jsonify({
            "status": "error",
            "message": "ID da imagem é obrigatório"
        }), 400

    # Busca a imagem no banco
    db = get_db()
    image = db.images.find_one(
        {"_id": data.get('image_id'), "user_id": user_id})

    if not image:
        return jsonify({
            "status": "error",
            "message": "Imagem não encontrada"
        }), 404

    # Consumo de tokens - conversão de imagem para vídeo custa menos que gerar um vídeo novo
    token_cost = 50
    duration = data.get('duration', 5)
    if duration > 10:
        token_cost += 30

    # Verifica se tem tokens suficientes
    success, message = subscription_service.consume_tokens(user_id, token_cost)
    if not success:
        return jsonify({
            "status": "error",
            "message": message
        }), 403

    # Gera ID único para o vídeo
    video_id = str(uuid.uuid4())

    # Cria entrada no banco para o vídeo
    video_data = {
        "video_id": video_id,
        "user_id": user_id,
        "source_type": "image",
        "source_id": data.get('image_id'),
        "source_url": image.get('url'),
        "motion": data.get('motion', 'zoom'),
        "duration": duration,
        "status": "processing",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "token_cost": token_cost
    }

    db.videos.insert_one(video_data)

    return jsonify({
        "status": "success",
        "message": "Solicitação de conversão de imagem para vídeo recebida. O processamento pode levar alguns minutos.",
        "video_id": video_id,
        "estimated_time": "1-3 minutos"
    })
