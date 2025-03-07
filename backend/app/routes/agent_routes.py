# backend/app/routes/agent_routes.py
from flask import Blueprint, request, jsonify, current_app
from app.db import get_db
from bson import ObjectId
from functools import wraps
from datetime import datetime

agent_bp = Blueprint("agent_bp", __name__)


def validate_request_data(f):
    """Decorator para validar dados da requisição"""
    @wraps(f)
    def decorated(*args, **kwargs):
        data = request.get_json()
        if not data:
            return jsonify({"error": "Dados JSON não fornecidos."}), 400

        required_fields = getattr(f, 'required_fields', ['name'])
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Campo obrigatório '{field}' ausente."}), 400

        return f(*args, **kwargs)
    return decorated


def format_agent(agent):
    """Formata um agent para retorno na API"""
    if agent and '_id' in agent:
        agent['id'] = str(agent['_id'])
        del agent['_id']
    return agent


@agent_bp.route("/agents", methods=["GET"])
def list_agents():
    """
    Lista todos os agents disponíveis.

    ---
    tags:
      - Agents
    responses:
      200:
        description: Lista de agents
    """
    db = get_db()
    agents = list(db.agents.find({}))

    # Formatar os agentes para retorno
    formatted_agents = []
    for agent in agents:
        formatted_agents.append(format_agent(agent))

    return jsonify(formatted_agents), 200


@agent_bp.route("/agents/<agent_id>", methods=["GET"])
def get_agent(agent_id):
    """
    Obtém os detalhes de um agent específico.

    ---
    tags:
      - Agents
    parameters:
      - name: agent_id
        in: path
        type: string
        required: true
        description: ID do agente
    responses:
      200:
        description: Detalhes do agente
      404:
        description: Agente não encontrado
    """
    try:
        db = get_db()
        agent = db.agents.find_one({"_id": ObjectId(agent_id)})

        if not agent:
            return jsonify({"error": "Agente não encontrado."}), 404

        return jsonify(format_agent(agent)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@agent_bp.route("/agents", methods=["POST"])
@validate_request_data
def create_agent():
    """
    Cria um novo agente.

    ---
    tags:
      - Agents
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
          properties:
            name:
              type: string
              example: "Agente Médico"
            description:
              type: string
              example: "Agente especializado em assuntos médicos"
            prompt_template:
              type: string
              example: "Você é um assistente médico e deve responder apenas perguntas sobre saúde."
            settings:
              type: object
              properties:
                temperature:
                  type: number
                  example: 0.7
                top_p:
                  type: number
                  example: 0.9
    responses:
      201:
        description: Agente criado com sucesso
      400:
        description: Erro de validação
    """
    data = request.get_json()

    # Campos obrigatórios
    name = data.get("name")

    # Campos opcionais
    description = data.get("description", "")
    prompt_template = data.get("prompt_template", "")
    settings = data.get("settings", {})

    # Verificar se o nome é único
    db = get_db()
    existing_agent = db.agents.find_one({"name": name.lower()})
    if existing_agent:
        return jsonify({"error": f"Já existe um agente com o nome '{name}'."}), 400

    # Preparar o documento do agente
    agent = {
        "name": name.lower(),
        "display_name": name,
        "description": description,
        "prompt_template": prompt_template,
        "settings": settings,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    # Inserir o agente no banco
    result = db.agents.insert_one(agent)

    # Retornar o agente criado
    created_agent = db.agents.find_one({"_id": result.inserted_id})
    return jsonify(format_agent(created_agent)), 201


@agent_bp.route("/agents/<agent_id>", methods=["PUT"])
@validate_request_data
def update_agent(agent_id):
    """
    Atualiza um agente existente.

    ---
    tags:
      - Agents
    parameters:
      - name: agent_id
        in: path
        type: string
        required: true
        description: ID do agente
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
              example: "Agente Médico Atualizado"
            description:
              type: string
              example: "Agente especializado em assuntos médicos"
            prompt_template:
              type: string
              example: "Você é um assistente médico e deve responder apenas perguntas sobre saúde."
            settings:
              type: object
              properties:
                temperature:
                  type: number
                  example: 0.7
                top_p:
                  type: number
                  example: 0.9
    responses:
      200:
        description: Agente atualizado com sucesso
      400:
        description: Erro de validação
      404:
        description: Agente não encontrado
    """
    data = request.get_json()

    # Campos atualizáveis
    update_fields = {}
    if "name" in data:
        update_fields["name"] = data["name"].lower()
        update_fields["display_name"] = data["name"]

    # Campos opcionais
    for field in ["description", "prompt_template", "settings"]:
        if field in data:
            update_fields[field] = data[field]

    # Marcar como atualizado
    update_fields["updated_at"] = datetime.utcnow().isoformat()

    # Verificar se o agente existe
    db = get_db()
    try:
        agent = db.agents.find_one({"_id": ObjectId(agent_id)})
        if not agent:
            return jsonify({"error": "Agente não encontrado."}), 404

        # Se o nome foi alterado, verificar se o novo nome é único
        if "name" in update_fields and update_fields["name"] != agent["name"]:
            existing_agent = db.agents.find_one(
                {"name": update_fields["name"]})
            if existing_agent:
                return jsonify({"error": f"Já existe um agente com o nome '{data['name']}'."}), 400

        # Atualizar o agente
        db.agents.update_one({"_id": ObjectId(agent_id)},
                             {"$set": update_fields})

        # Retornar o agente atualizado
        updated_agent = db.agents.find_one({"_id": ObjectId(agent_id)})
        return jsonify(format_agent(updated_agent)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@agent_bp.route("/agents/<agent_id>", methods=["DELETE"])
def delete_agent(agent_id):
    """
    Exclui um agente.

    ---
    tags:
      - Agents
    parameters:
      - name: agent_id
        in: path
        type: string
        required: true
        description: ID do agente
    responses:
      200:
        description: Agente excluído com sucesso
      404:
        description: Agente não encontrado
    """
    try:
        db = get_db()

        result = db.agents.delete_one({"_id": ObjectId(agent_id)})

        if result.deleted_count == 0:
            return jsonify({"error": "Agente não encontrado."}), 404

        return jsonify({"message": "Agente excluído com sucesso."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
