# backend/app/routes/canva_routes.py
from flask import Blueprint, request, jsonify
from app.services.canva_service import (
    list_templates, create_canva_design, apply_template,
    export_design_from_canva, get_canva_config
)
import logging

logger = logging.getLogger(__name__)
canva_bp = Blueprint("canva_bp", __name__)


@canva_bp.route("/canva/config", methods=["GET"])
def get_config_route():
    """
    Obtém as configurações da integração com Canva.
    ---
    tags:
      - Canva
    responses:
      200:
        description: Configurações da integração com Canva.
        schema:
          type: object
          properties:
            api_key:
              type: string
            brand_id:
              type: string
            is_configured:
              type: boolean
      500:
        description: Erro ao obter configurações.
    """
    try:
        config = get_canva_config()
        return jsonify(config), 200
    except Exception as e:
        logger.error(f"Erro ao obter configurações do Canva: {str(e)}")
        return jsonify({"error": "Erro ao obter configurações do Canva."}), 500


@canva_bp.route("/canva/templates", methods=["GET"])
def list_templates_route():
    """
    Lista os templates disponíveis no Canva.
    ---
    tags:
      - Canva
    parameters:
      - name: category
        in: query
        type: string
        required: false
        description: Categoria de templates (ex. "ebook", "cover")
      - name: limit
        in: query
        type: integer
        required: false
        description: Número máximo de templates a retornar
    responses:
      200:
        description: Lista de templates.
        schema:
          type: object
          properties:
            templates:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                  name:
                    type: string
                  thumbnail_url:
                    type: string
                  category:
                    type: string
      500:
        description: Erro ao listar templates.
    """
    try:
        category = request.args.get("category")
        limit = request.args.get("limit", 10, type=int)

        templates = list_templates(category, limit)
        return jsonify({"templates": templates}), 200
    except Exception as e:
        logger.error(f"Erro ao listar templates do Canva: {str(e)}")
        return jsonify({"error": "Erro ao listar templates do Canva."}), 500


@canva_bp.route("/canva/design/create", methods=["POST"])
def create_design_route():
    """
    Cria um novo design no Canva.
    ---
    tags:
      - Canva
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - ebook_id
          properties:
            ebook_id:
              type: string
              example: "123e4567-e89b-12d3-a456-426614174000"
            template_id:
              type: string
              example: "template_123456"
    responses:
      200:
        description: Design criado com sucesso.
        schema:
          type: object
          properties:
            design_id:
              type: string
            url:
              type: string
      400:
        description: Dados obrigatórios ausentes ou inválidos.
      500:
        description: Erro ao criar design.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados JSON obrigatórios."}), 400

    ebook_id = data.get("ebook_id")
    if not ebook_id:
        return jsonify({"error": "Campo 'ebook_id' é obrigatório."}), 400

    template_id = data.get("template_id")

    try:
        design_info = create_canva_design(ebook_id, template_id)
        if not design_info:
            return jsonify({"error": "Erro ao criar design no Canva."}), 500

        return jsonify(design_info), 200
    except Exception as e:
        logger.error(f"Erro ao criar design no Canva: {str(e)}")
        return jsonify({"error": "Erro ao criar design no Canva."}), 500


@canva_bp.route("/canva/design/<design_id>/apply-template", methods=["POST"])
def apply_template_route(design_id):
    """
    Aplica um template a um design existente no Canva.
    ---
    tags:
      - Canva
    parameters:
      - name: design_id
        in: path
        type: string
        required: true
        description: ID do design no Canva
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - template_id
          properties:
            template_id:
              type: string
              example: "template_123456"
            options:
              type: object
              properties:
                apply_to_all:
                  type: boolean
                  example: true
    responses:
      200:
        description: Template aplicado com sucesso.
        schema:
          type: object
          properties:
            success:
              type: boolean
            design_id:
              type: string
      400:
        description: Dados obrigatórios ausentes ou inválidos.
      500:
        description: Erro ao aplicar template.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados JSON obrigatórios."}), 400

    template_id = data.get("template_id")
    if not template_id:
        return jsonify({"error": "Campo 'template_id' é obrigatório."}), 400

    options = data.get("options", {})

    try:
        result = apply_template(design_id, template_id, options)
        if not result:
            return jsonify({"error": "Erro ao aplicar template ao design."}), 500

        return jsonify({"success": True, "design_id": design_id}), 200
    except Exception as e:
        logger.error(
            f"Erro ao aplicar template ao design {design_id}: {str(e)}")
        return jsonify({"error": "Erro ao aplicar template ao design."}), 500


@canva_bp.route("/canva/design/<design_id>/export", methods=["POST"])
def export_design_route(design_id):
    """
    Exporta um design do Canva.
    ---
    tags:
      - Canva
    parameters:
      - name: design_id
        in: path
        type: string
        required: true
        description: ID do design no Canva
      - in: body
        name: body
        required: false
        schema:
          type: object
          properties:
            format:
              type: string
              enum: ["pdf", "png", "jpg"]
              example: "pdf"
            ebook_id:
              type: string
              example: "123e4567-e89b-12d3-a456-426614174000"
    responses:
      200:
        description: Design exportado com sucesso.
        schema:
          type: object
          properties:
            export_id:
              type: string
            url:
              type: string
            format:
              type: string
      400:
        description: Dados obrigatórios ausentes ou inválidos.
      500:
        description: Erro ao exportar design.
    """
    data = request.get_json() or {}
    formato = data.get("format", "pdf")
    ebook_id = data.get("ebook_id")

    try:
        export_info = export_design_from_canva(design_id, formato, ebook_id)
        if not export_info:
            return jsonify({"error": "Erro ao exportar design do Canva."}), 500

        return jsonify(export_info), 200
    except Exception as e:
        logger.error(f"Erro ao exportar design {design_id} do Canva: {str(e)}")
        return jsonify({"error": "Erro ao exportar design do Canva."}), 500
