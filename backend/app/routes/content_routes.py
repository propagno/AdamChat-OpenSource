# backend/app/routes/content_routes.py
from flask import Blueprint, request, jsonify
from app.services.content_service import (
    generate_titles, generate_chapters, generate_chapter_content,
    generate_image_prompt
)
import logging

logger = logging.getLogger(__name__)
content_bp = Blueprint("content_bp", __name__)


@content_bp.route("/content/titles", methods=["POST"])
def generate_titles_route():
    """
    Gera sugestões de títulos para o eBook com base no tema.
    ---
    tags:
      - Conteúdo
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - tema
          properties:
            tema:
              type: string
              example: "Inteligência Artificial"
            provider:
              type: string
              example: "chatgpt"
            version:
              type: string
              example: "v4"
            qtd:
              type: integer
              example: 5
    responses:
      200:
        description: Títulos gerados com sucesso.
        schema:
          type: object
          properties:
            titulos:
              type: array
              items:
                type: string
      400:
        description: Dados obrigatórios ausentes ou inválidos.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados JSON obrigatórios."}), 400

    tema = data.get("tema")
    if not tema:
        return jsonify({"error": "Campo 'tema' é obrigatório."}), 400

    # Parâmetros opcionais
    provider = data.get("provider", "chatgpt")
    version = data.get("version", "v4")
    qtd = data.get("qtd", 5)

    try:
        titulos = generate_titles(tema, provider, version, qtd)
        return jsonify({"titulos": titulos}), 200
    except Exception as e:
        logger.error(f"Erro ao gerar títulos: {str(e)}")
        return jsonify({"error": "Erro ao gerar títulos."}), 500


@content_bp.route("/content/chapters", methods=["POST"])
def generate_chapters_route():
    """
    Gera sugestões de capítulos para o eBook com base no título.
    ---
    tags:
      - Conteúdo
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - titulo
          properties:
            titulo:
              type: string
              example: "Guia de IA Generativa"
            tema:
              type: string
              example: "Inteligência Artificial"
            provider:
              type: string
              example: "chatgpt"
            version:
              type: string
              example: "v4"
            qtd:
              type: integer
              example: 5
    responses:
      200:
        description: Capítulos gerados com sucesso.
        schema:
          type: object
          properties:
            capitulos:
              type: array
              items:
                type: object
                properties:
                  titulo:
                    type: string
                  subtemas:
                    type: array
                    items:
                      type: string
      400:
        description: Dados obrigatórios ausentes ou inválidos.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados JSON obrigatórios."}), 400

    titulo = data.get("titulo")
    if not titulo:
        return jsonify({"error": "Campo 'titulo' é obrigatório."}), 400

    # Parâmetros opcionais
    tema = data.get("tema")
    provider = data.get("provider", "chatgpt")
    version = data.get("version", "v4")
    qtd = data.get("qtd", 5)

    try:
        capitulos = generate_chapters(titulo, tema, provider, version, qtd)
        return jsonify({"capitulos": capitulos}), 200
    except Exception as e:
        logger.error(f"Erro ao gerar capítulos: {str(e)}")
        return jsonify({"error": "Erro ao gerar capítulos."}), 500


@content_bp.route("/content/chapter", methods=["POST"])
def generate_chapter_content_route():
    """
    Gera o conteúdo detalhado para um capítulo específico.
    ---
    tags:
      - Conteúdo
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - capitulo
          properties:
            capitulo:
              type: string
              example: "Introdução à IA Generativa"
            subtemas:
              type: array
              items:
                type: string
              example: ["História da IA", "Conceitos básicos", "Aplicações modernas"]
            titulo_ebook:
              type: string
              example: "Guia de IA Generativa"
            provider:
              type: string
              example: "chatgpt"
            version:
              type: string
              example: "v4"
    responses:
      200:
        description: Conteúdo do capítulo gerado com sucesso.
        schema:
          type: object
          properties:
            conteudo:
              type: string
      400:
        description: Dados obrigatórios ausentes ou inválidos.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados JSON obrigatórios."}), 400

    capitulo = data.get("capitulo")
    if not capitulo:
        return jsonify({"error": "Campo 'capitulo' é obrigatório."}), 400

    # Parâmetros opcionais
    subtemas = data.get("subtemas")
    titulo_ebook = data.get("titulo_ebook")
    provider = data.get("provider", "chatgpt")
    version = data.get("version", "v4")

    try:
        conteudo = generate_chapter_content(
            capitulo, subtemas, titulo_ebook, provider, version)
        return jsonify({"conteudo": conteudo}), 200
    except Exception as e:
        logger.error(f"Erro ao gerar conteúdo do capítulo: {str(e)}")
        return jsonify({"error": "Erro ao gerar conteúdo do capítulo."}), 500


@content_bp.route("/content/image-prompt", methods=["POST"])
def generate_image_prompt_route():
    """
    Gera um prompt de descrição para criação de imagem relacionada ao capítulo.
    ---
    tags:
      - Conteúdo
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - capitulo
          properties:
            capitulo:
              type: string
              example: "Introdução à IA Generativa"
            conteudo:
              type: string
              example: "Texto do capítulo para contexto..."
            provider:
              type: string
              example: "chatgpt"
            version:
              type: string
              example: "v4"
    responses:
      200:
        description: Prompt de imagem gerado com sucesso.
        schema:
          type: object
          properties:
            prompt:
              type: string
      400:
        description: Dados obrigatórios ausentes ou inválidos.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados JSON obrigatórios."}), 400

    capitulo = data.get("capitulo")
    if not capitulo:
        return jsonify({"error": "Campo 'capitulo' é obrigatório."}), 400

    # Parâmetros opcionais
    conteudo = data.get("conteudo")
    provider = data.get("provider", "chatgpt")
    version = data.get("version", "v4")

    try:
        prompt = generate_image_prompt(capitulo, conteudo, provider, version)
        return jsonify({"prompt": prompt}), 200
    except Exception as e:
        logger.error(f"Erro ao gerar prompt de imagem: {str(e)}")
        return jsonify({"error": "Erro ao gerar prompt de imagem."}), 500
