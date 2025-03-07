# backend/app/routes/providers_routes.py
from flask import Blueprint, jsonify
from app.db import get_db

provider_bp = Blueprint("provider_bp", __name__)


@provider_bp.route("/providers", methods=["GET"])
def list_providers():
    """
    Lista todos os providers cadastrados.
    ---
    tags:
      - Provider
    responses:
      200:
        description: Lista de providers cadastrados.
        schema:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              versions:
                type: object
              description:
                type: string
    """
    db = get_db()
    # Exclui o campo api_key para não expor informações sensíveis
    providers = list(db.providers.find({}, {"_id": 0, "versions.api_key": 0}))
    return jsonify(providers), 200
