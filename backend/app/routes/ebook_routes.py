# backend/app/routes/ebook_routes.py
from flask import Blueprint, request, jsonify
from app.services.ebook_service import (
    create_ebook, get_ebook, get_ebook_status,
    update_ebook_status, update_ebook_metadata,
    finalize_ebook, list_ebooks
)
import logging

logger = logging.getLogger(__name__)
ebook_bp = Blueprint("ebook_bp", __name__)


@ebook_bp.route("/ebook/create", methods=["POST"])
def create_ebook_route():
    """
    Cria um novo eBook.
    ---
    tags:
      - eBook
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
    responses:
      201:
        description: eBook criado com sucesso.
        schema:
          type: object
          properties:
            ebook_id:
              type: string
              example: "12345"
            message:
              type: string
              example: "eBook criado com sucesso"
      400:
        description: Dados obrigatórios ausentes ou inválidos.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados JSON obrigatórios."}), 400

    tema = data.get("tema")
    if not tema:
        return jsonify({"error": "Campo 'tema' é obrigatório."}), 400

    try:
        ebook_id = create_ebook(tema)
        return jsonify({
            "ebook_id": ebook_id,
            "message": "eBook criado com sucesso"
        }), 201
    except Exception as e:
        logger.error(f"Erro ao criar eBook: {str(e)}")
        return jsonify({"error": "Erro ao criar eBook."}), 500


@ebook_bp.route("/ebook/<ebook_id>", methods=["GET"])
def get_ebook_route(ebook_id):
    """
    Obtém os detalhes de um eBook.
    ---
    tags:
      - eBook
    parameters:
      - name: ebook_id
        in: path
        type: string
        required: true
        description: ID do eBook
    responses:
      200:
        description: Detalhes do eBook.
      404:
        description: eBook não encontrado.
    """
    ebook = get_ebook(ebook_id)
    if not ebook:
        return jsonify({"error": "eBook não encontrado."}), 404
    return jsonify(ebook), 200


@ebook_bp.route("/ebook/<ebook_id>/status", methods=["GET"])
def ebook_status_route(ebook_id):
    """
    Retorna o status e o progresso do eBook.
    ---
    tags:
      - eBook
    parameters:
      - name: ebook_id
        in: path
        type: string
        required: true
        description: ID do eBook
    responses:
      200:
        description: Status e etapas do eBook.
        schema:
          type: object
          properties:
            status:
              type: string
              example: "em_andamento"
            etapas:
              type: array
              items:
                type: object
                properties:
                  etapa:
                    type: string
                  status:
                    type: string
      404:
        description: eBook não encontrado.
    """
    status_info = get_ebook_status(ebook_id)
    if not status_info:
        return jsonify({"error": "eBook não encontrado."}), 404
    return jsonify(status_info), 200


@ebook_bp.route("/ebook/<ebook_id>/update-status", methods=["POST"])
def update_status_route(ebook_id):
    """
    Atualiza o status de uma etapa do eBook.
    ---
    tags:
      - eBook
    parameters:
      - name: ebook_id
        in: path
        type: string
        required: true
        description: ID do eBook
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - etapa
            - status
          properties:
            etapa:
              type: string
              example: "Título"
            status:
              type: string
              example: "concluido"
    responses:
      200:
        description: Status atualizado com sucesso.
      400:
        description: Dados obrigatórios ausentes ou inválidos.
      404:
        description: eBook ou etapa não encontrada.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados JSON obrigatórios."}), 400

    etapa = data.get("etapa")
    status = data.get("status")

    if not etapa or not status:
        return jsonify({"error": "Campos 'etapa' e 'status' são obrigatórios."}), 400

    # Verifica se o status é válido
    if status not in ["pendente", "em_andamento", "concluido", "falha"]:
        return jsonify({"error": "Status inválido. Use: pendente, em_andamento, concluido ou falha."}), 400

    success = update_ebook_status(ebook_id, etapa, status)
    if not success:
        return jsonify({"error": "eBook ou etapa não encontrada."}), 404

    return jsonify({"message": f"Status da etapa '{etapa}' atualizado para '{status}' com sucesso."}), 200


@ebook_bp.route("/ebook/<ebook_id>/metadata", methods=["POST"])
def update_metadata_route(ebook_id):
    """
    Atualiza os metadados do eBook.
    ---
    tags:
      - eBook
    parameters:
      - name: ebook_id
        in: path
        type: string
        required: true
        description: ID do eBook
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            titulo:
              type: string
              example: "Guia de IA Generativa"
            capitulos:
              type: array
              items:
                type: object
            imagens:
              type: array
              items:
                type: object
    responses:
      200:
        description: Metadados atualizados com sucesso.
      400:
        description: Dados obrigatórios ausentes ou inválidos.
      404:
        description: eBook não encontrado.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados JSON obrigatórios."}), 400

    success = update_ebook_metadata(ebook_id, data)
    if not success:
        return jsonify({"error": "eBook não encontrado."}), 404

    return jsonify({"message": "Metadados atualizados com sucesso."}), 200


@ebook_bp.route("/ebook/<ebook_id>/finalizar", methods=["POST"])
def finalizar_ebook_route(ebook_id):
    """
    Finaliza o eBook, marcando-o como pronto para exportação.
    ---
    tags:
      - eBook
    parameters:
      - name: ebook_id
        in: path
        type: string
        required: true
        description: ID do eBook
    responses:
      200:
        description: eBook finalizado com sucesso.
      404:
        description: eBook não encontrado.
    """
    success = finalize_ebook(ebook_id)
    if not success:
        return jsonify({"error": "eBook não encontrado."}), 404

    return jsonify({"message": "eBook finalizado com sucesso."}), 200


@ebook_bp.route("/ebooks", methods=["GET"])
def list_ebooks_route():
    """
    Lista os eBooks criados, com paginação.
    ---
    tags:
      - eBook
    parameters:
      - name: limit
        in: query
        type: integer
        required: false
        description: 'Número máximo de resultados (padrão: 10)'
      - name: skip
        in: query
        type: integer
        required: false
        description: 'Número de registros a pular (padrão: 0)'
    responses:
      200:
        description: Lista de eBooks.
    """
    try:
        limit = request.args.get("limit", default=10, type=int)
        skip = request.args.get("skip", default=0, type=int)

        ebooks = list_ebooks(limit=limit, skip=skip)
        return jsonify(ebooks), 200
    except Exception as e:
        logger.error(f"Erro ao listar eBooks: {str(e)}")
        return jsonify({"error": "Erro ao listar eBooks."}), 500
