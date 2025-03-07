# backend/app/routes/image_routes.py
from flask import Blueprint, request, jsonify
from app.services.image_service import (
    generate_image, regenerate_image, get_image
)
import logging

logger = logging.getLogger(__name__)
image_bp = Blueprint("image_bp", __name__)


@image_bp.route("/image/generate", methods=["POST"])
def generate_image_route():
    """
    Gera uma imagem com base na descrição.
    ---
    tags:
      - Imagens
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
              example: "Um robô humanóide ensinando um grupo de crianças, estilo render 3D"
            service:
              type: string
              example: "openai"
            size:
              type: string
              example: "1024x1024"
    responses:
      200:
        description: Imagem gerada com sucesso.
        schema:
          type: object
          properties:
            image_id:
              type: string
            url:
              type: string
            service:
              type: string
      400:
        description: Dados obrigatórios ausentes ou inválidos.
      500:
        description: Erro ao gerar a imagem.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados JSON obrigatórios."}), 400

    description = data.get("description")
    if not description:
        return jsonify({"error": "Campo 'description' é obrigatório."}), 400

    # Parâmetros opcionais
    service = data.get("service", "openai")
    size = data.get("size", "1024x1024")

    try:
        image_info = generate_image(description, service, size)
        if not image_info:
            return jsonify({"error": "Erro ao gerar imagem."}), 500

        return jsonify(image_info), 200
    except Exception as e:
        logger.error(f"Erro ao gerar imagem: {str(e)}")
        return jsonify({"error": "Erro ao gerar imagem."}), 500


@image_bp.route("/image/regenerate", methods=["POST"])
def regenerate_image_route():
    """
    Regenera uma imagem com base na descrição ou em um ID de imagem existente.
    ---
    tags:
      - Imagens
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            image_id:
              type: string
              example: "123e4567-e89b-12d3-a456-426614174000"
            description:
              type: string
              example: "Um robô humanóide ensinando um grupo de crianças, estilo render 3D"
            service:
              type: string
              example: "openai"
            size:
              type: string
              example: "1024x1024"
    responses:
      200:
        description: Imagem regenerada com sucesso.
        schema:
          type: object
          properties:
            image_id:
              type: string
            url:
              type: string
            service:
              type: string
      400:
        description: Dados obrigatórios ausentes ou inválidos.
      500:
        description: Erro ao regenerar a imagem.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados JSON obrigatórios."}), 400

    image_id = data.get("image_id")
    description = data.get("description")

    # É necessário pelo menos um destes: image_id ou description
    if not image_id and not description:
        return jsonify({"error": "É necessário fornecer 'image_id' ou 'description'."}), 400

    # Parâmetros opcionais
    service = data.get("service", "openai")
    size = data.get("size", "1024x1024")

    try:
        image_info = regenerate_image(image_id, description, service, size)
        if not image_info:
            return jsonify({"error": "Erro ao regenerar imagem."}), 500

        return jsonify(image_info), 200
    except Exception as e:
        logger.error(f"Erro ao regenerar imagem: {str(e)}")
        return jsonify({"error": "Erro ao regenerar imagem."}), 500


@image_bp.route("/image/<image_id>", methods=["GET"])
def get_image_route(image_id):
    """
    Obtém informações sobre uma imagem específica.
    ---
    tags:
      - Imagens
    parameters:
      - name: image_id
        in: path
        type: string
        required: true
        description: ID da imagem
    responses:
      200:
        description: Informações da imagem.
        schema:
          type: object
          properties:
            image_id:
              type: string
            url:
              type: string
            description:
              type: string
            service:
              type: string
            size:
              type: string
            created_at:
              type: number
      404:
        description: Imagem não encontrada.
    """
    try:
        image = get_image(image_id)
        if not image:
            return jsonify({"error": "Imagem não encontrada."}), 404

        return jsonify(image), 200
    except Exception as e:
        logger.error(f"Erro ao obter imagem {image_id}: {str(e)}")
        return jsonify({"error": "Erro ao obter imagem."}), 500
