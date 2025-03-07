# backend/app/routes/export_routes.py
from flask import Blueprint, request, jsonify, send_file
from app.services.export_service import (
    export_ebook, get_export_status, list_exports,
    EXPORT_FORMATS
)
import logging
import os

logger = logging.getLogger(__name__)
export_bp = Blueprint("export_bp", __name__)


@export_bp.route("/export/formats", methods=["GET"])
def get_formats_route():
    """
    Obtém os formatos de exportação disponíveis.
    ---
    tags:
      - Exportação
    responses:
      200:
        description: Formatos de exportação disponíveis.
        schema:
          type: object
          properties:
            formats:
              type: array
              items:
                type: string
    """
    return jsonify({"formats": EXPORT_FORMATS}), 200


@export_bp.route("/export/ebook/<ebook_id>", methods=["POST"])
def export_ebook_route(ebook_id):
    """
    Exporta um eBook para o formato especificado.
    ---
    tags:
      - Exportação
    parameters:
      - name: ebook_id
        in: path
        type: string
        required: true
        description: ID do eBook
      - in: body
        name: body
        required: false
        schema:
          type: object
          properties:
            format:
              type: string
              enum: ["pdf", "epub", "docx", "html"]
              example: "pdf"
            options:
              type: object
              properties:
                include_cover:
                  type: boolean
                  example: true
                include_toc:
                  type: boolean
                  example: true
    responses:
      200:
        description: eBook exportado com sucesso.
        schema:
          type: object
          properties:
            export_id:
              type: string
            ebook_id:
              type: string
            format:
              type: string
            status:
              type: string
      400:
        description: Dados obrigatórios ausentes ou inválidos.
      404:
        description: eBook não encontrado.
      500:
        description: Erro ao exportar eBook.
    """
    data = request.get_json() or {}
    formato = data.get("format", "pdf")
    options = data.get("options", {})

    if formato not in EXPORT_FORMATS:
        return jsonify({
            "error": f"Formato inválido. Formatos disponíveis: {', '.join(EXPORT_FORMATS)}"
        }), 400

    try:
        export_info = export_ebook(ebook_id, formato, options)
        if not export_info:
            return jsonify({"error": "Erro ao exportar eBook."}), 500

        return jsonify(export_info), 200
    except ValueError as e:
        logger.error(f"Erro ao exportar eBook {ebook_id}: {str(e)}")
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        logger.error(f"Erro ao exportar eBook {ebook_id}: {str(e)}")
        return jsonify({"error": "Erro ao exportar eBook."}), 500


@export_bp.route("/export/status/<export_id>", methods=["GET"])
def get_export_status_route(export_id):
    """
    Obtém o status de uma exportação.
    ---
    tags:
      - Exportação
    parameters:
      - name: export_id
        in: path
        type: string
        required: true
        description: ID da exportação
    responses:
      200:
        description: Status da exportação.
        schema:
          type: object
          properties:
            export_id:
              type: string
            ebook_id:
              type: string
            format:
              type: string
            status:
              type: string
            progress:
              type: integer
            url:
              type: string
            created_at:
              type: number
      404:
        description: Exportação não encontrada.
      500:
        description: Erro ao obter status da exportação.
    """
    try:
        status = get_export_status(export_id=export_id)
        if not status:
            return jsonify({"error": "Exportação não encontrada."}), 404

        return jsonify(status), 200
    except Exception as e:
        logger.error(
            f"Erro ao obter status da exportação {export_id}: {str(e)}")
        return jsonify({"error": "Erro ao obter status da exportação."}), 500


@export_bp.route("/export/ebook/<ebook_id>/status", methods=["GET"])
def get_ebook_export_status_route(ebook_id):
    """
    Obtém o status da última exportação de um eBook.
    ---
    tags:
      - Exportação
    parameters:
      - name: ebook_id
        in: path
        type: string
        required: true
        description: ID do eBook
    responses:
      200:
        description: Status da exportação.
        schema:
          type: object
          properties:
            export_id:
              type: string
            ebook_id:
              type: string
            format:
              type: string
            status:
              type: string
            progress:
              type: integer
            url:
              type: string
            created_at:
              type: number
      404:
        description: Nenhuma exportação encontrada para este eBook.
      500:
        description: Erro ao obter status da exportação.
    """
    try:
        status = get_export_status(ebook_id=ebook_id)
        if not status:
            return jsonify({"error": "Nenhuma exportação encontrada para este eBook."}), 404

        return jsonify(status), 200
    except Exception as e:
        logger.error(
            f"Erro ao obter status da exportação para o eBook {ebook_id}: {str(e)}")
        return jsonify({"error": "Erro ao obter status da exportação."}), 500


@export_bp.route("/export/ebook/<ebook_id>/list", methods=["GET"])
def list_ebook_exports_route(ebook_id):
    """
    Lista as exportações de um eBook.
    ---
    tags:
      - Exportação
    parameters:
      - name: ebook_id
        in: path
        type: string
        required: true
        description: ID do eBook
      - name: limit
        in: query
        type: integer
        required: false
        description: Número máximo de exportações a retornar
    responses:
      200:
        description: Lista de exportações.
        schema:
          type: object
          properties:
            exports:
              type: array
              items:
                type: object
                properties:
                  export_id:
                    type: string
                  ebook_id:
                    type: string
                  format:
                    type: string
                  status:
                    type: string
                  url:
                    type: string
                  created_at:
                    type: number
      500:
        description: Erro ao listar exportações.
    """
    try:
        limit = request.args.get("limit", 10, type=int)
        exports = list_exports(ebook_id, limit)

        return jsonify({"exports": exports}), 200
    except Exception as e:
        logger.error(
            f"Erro ao listar exportações para o eBook {ebook_id}: {str(e)}")
        return jsonify({"error": "Erro ao listar exportações."}), 500


@export_bp.route("/export/download/<export_id>", methods=["GET"])
def download_export_route(export_id):
    """
    Faz o download de um arquivo de exportação.
    ---
    tags:
      - Exportação
    parameters:
      - name: export_id
        in: path
        type: string
        required: true
        description: ID da exportação
    responses:
      200:
        description: Arquivo de exportação.
        content:
          application/octet-stream:
            schema:
              type: string
              format: binary
      404:
        description: Exportação não encontrada ou arquivo não disponível.
      500:
        description: Erro ao fazer download da exportação.
    """
    try:
        status = get_export_status(export_id=export_id)
        if not status:
            return jsonify({"error": "Exportação não encontrada."}), 404

        if status.get("status") != "completed":
            return jsonify({"error": "Exportação ainda não concluída."}), 400

        filepath = status.get("filepath")
        if not filepath or not os.path.exists(filepath):
            return jsonify({"error": "Arquivo de exportação não encontrado."}), 404

        filename = os.path.basename(filepath)
        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype="application/octet-stream"
        )
    except Exception as e:
        logger.error(
            f"Erro ao fazer download da exportação {export_id}: {str(e)}")
        return jsonify({"error": "Erro ao fazer download da exportação."}), 500
