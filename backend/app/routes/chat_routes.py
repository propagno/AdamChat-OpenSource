# backend/app/routes/chat_routes.py
"""
API de Conversas e Chat - AdamAI

Esta API implementa gerenciamento completo de conversas e interações com modelos de IA.
Substituiu a antiga API Legacy (/chat) com uma estrutura organizada em recursos RESTful.

Migração da API Legacy para a Nova API:
----------------------------------------
A API antiga foi descontinuada em favor desta nova implementação que oferece:
- Melhor organização de recursos (conversations, messages, providers, settings)
- Suporte a mais funcionalidades (streaming, uploads, paginação)
- Armazenamento eficiente em MongoDB para fácil listagem e busca
- Melhor tratamento de erros e validação de dados

Exemplo de migração:
- Antes: POST /api/chat 
  {"user_id": "123", "message": "Olá", "gptProvider": "chatgpt"}
  
- Agora (2 etapas): 
  1. Criar conversa: POST /api/conversations 
     {"user_id": "123", "title": "Nova conversa"}
     
  2. Enviar mensagem: POST /api/conversations/{id}/messages
     {"user_id": "123", "message": "Olá", "gptProvider": "chatgpt"}

Documentação completa em /apidocs
"""
from flask import Blueprint, request, jsonify, current_app, make_response
from app.db import get_db
from app.services.genai_service import GenAIService
from app.services.agent_service import get_prompt_instructions
from bson import ObjectId
from pymongo import DESCENDING
import time
import json
from functools import wraps
from datetime import datetime

chat_bp = Blueprint("chat_bp", __name__)

# --------------------------
# Funções auxiliares
# --------------------------


def get_provider_config(provider_name: str) -> dict:
    """
    Busca a configuração do provider na coleção providers.
    Retorna o documento do provider ou None se não encontrado.
    Os dados vêm dos seeders inseridos na coleção providers.
    """
    db = get_db()
    provider = db.providers.find_one(
        {"name": provider_name.lower()}, {"_id": 0})
    return provider


def get_agent_template(agent_name: str) -> str:
    """
    Busca o template customizado do agente na coleção agents.
    Retorna o template se encontrado; se não, retorna o campo 'description' como fallback.
    """
    db = get_db()
    agent = db.agents.find_one({"name": agent_name.lower()}, {
                               "_id": 0, "prompt_template": 1, "description": 1})
    if agent:
        # Se o campo prompt_template existir e não estiver vazio, usa-o; caso contrário, usa description.
        return agent.get("prompt_template") or agent.get("description")
    return None


def validate_request_data(f):
    """Decorator para validar dados da requisição"""
    @wraps(f)
    def decorated(*args, **kwargs):
        data = request.get_json()
        if not data:
            return jsonify({"error": "Dados JSON não fornecidos."}), 400

        required_fields = getattr(f, 'required_fields', ['user_id'])
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Campo obrigatório '{field}' ausente."}), 400

        return f(*args, **kwargs)
    return decorated


def format_conversation(conversation):
    """Formata uma conversa para retorno na API"""
    if conversation and '_id' in conversation:
        conversation['id'] = str(conversation['_id'])
        del conversation['_id']
    return conversation


def format_message(message):
    """Formata uma mensagem para retorno na API"""
    if message and '_id' in message:
        message['id'] = str(message['_id'])
        del message['_id']
    return message


# --------------------------
# Endpoints de Conversas
# --------------------------

@chat_bp.route("/conversations", methods=["GET"])
def list_conversations():
    """
    Lista todas as conversas de um usuário.

    ---
    tags:
      - Chat
    parameters:
      - name: user_id
        in: query
        type: string
        required: true
        description: ID do usuário
      - name: limit
        in: query
        type: integer
        required: false
        description: Limite de conversas a retornar (padrão 20)
      - name: offset
        in: query
        type: integer
        required: false
        description: Offset para paginação
    responses:
      200:
        description: Lista de conversas do usuário
      400:
        description: Erro de validação
    """
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id é obrigatório"}), 400

    limit = int(request.args.get("limit", 20))
    offset = int(request.args.get("offset", 0))

    db = get_db()
    total_conversations = db.conversations.count_documents(
        {"user_id": user_id})

    conversations = list(db.conversations.find(
        {"user_id": user_id},
        {"_id": 1, "title": 1, "created_at": 1, "updated_at": 1, "last_message": 1}
    ).sort("updated_at", DESCENDING).skip(offset).limit(limit))

    # Formatar os resultados
    result = []
    for conv in conversations:
        result.append({
            "id": str(conv["_id"]),
            "title": conv.get("title", "Nova conversa"),
            "created_at": conv.get("created_at"),
            "updated_at": conv.get("updated_at"),
            "last_message": conv.get("last_message")
        })

    return jsonify({
        "conversations": result,
        "total": total_conversations,
        "offset": offset,
        "limit": limit
    }), 200


@chat_bp.route("/conversations", methods=["POST"])
@validate_request_data
def create_conversation():
    """
    Cria uma nova conversa.

    ---
    tags:
      - Chat
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - user_id
          properties:
            user_id:
              type: string
              example: "12345"
            title:
              type: string
              example: "Consulta sobre diabetes"
    responses:
      201:
        description: Conversa criada com sucesso
      400:
        description: Erro de validação
    """
    data = request.get_json()
    user_id = data.get("user_id")
    title = data.get("title", "Nova conversa")

    now = datetime.utcnow().isoformat()

    db = get_db()
    conversation = {
        "user_id": user_id,
        "title": title,
        "history": [],
        "files": [],
        "created_at": now,
        "updated_at": now,
        "last_message": ""
    }

    result = db.conversations.insert_one(conversation)

    current_app.logger.info(
        f"Nova conversa criada: {result.inserted_id} para usuário {user_id}")

    return jsonify({
        "id": str(result.inserted_id),
        "title": title,
        "created_at": now,
        "updated_at": now
    }), 201


@chat_bp.route("/conversations/<conversation_id>", methods=["GET"])
def get_conversation(conversation_id):
    """
    Obtém os detalhes de uma conversa específica.

    ---
    tags:
      - Chat
    parameters:
      - name: conversation_id
        in: path
        type: string
        required: true
        description: ID da conversa
      - name: include_messages
        in: query
        type: boolean
        required: false
        description: Se deve incluir as mensagens (padrão false)
    responses:
      200:
        description: Detalhes da conversa
      404:
        description: Conversa não encontrada
    """
    try:
        include_messages = request.args.get(
            "include_messages", "false").lower() == "true"

        db = get_db()
        # Define a projeção para excluir mensagens se necessário
        projection = None if include_messages else {"history": 0}

        conversation = db.conversations.find_one(
            {"_id": ObjectId(conversation_id)}, projection)

        if not conversation:
            return jsonify({"error": "Conversa não encontrada."}), 404

        # Formatar a conversa
        formatted_conversation = format_conversation(conversation)
        return jsonify(formatted_conversation), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@chat_bp.route("/conversations/<conversation_id>", methods=["PUT"])
@validate_request_data
def update_conversation(conversation_id):
    """
    Atualiza uma conversa (renomeia).

    ---
    tags:
      - Chat
    parameters:
      - name: conversation_id
        in: path
        type: string
        required: true
        description: ID da conversa
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            title:
              type: string
              example: "Novo título da conversa"
    responses:
      200:
        description: Conversa atualizada com sucesso
      404:
        description: Conversa não encontrada
    """
    try:
        data = request.get_json()
        title = data.get("title")

        if not title:
            return jsonify({"error": "title é obrigatório."}), 400

        db = get_db()
        now = datetime.utcnow().isoformat()

        result = db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"title": title, "updated_at": now}}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Conversa não encontrada."}), 404

        current_app.logger.info(
            f"Conversa {conversation_id} renomeada para '{title}'")

        return jsonify({"message": "Conversa atualizada com sucesso."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@chat_bp.route("/conversations/<conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    """
    Exclui uma conversa.

    ---
    tags:
      - Chat
    parameters:
      - name: conversation_id
        in: path
        type: string
        required: true
        description: ID da conversa
    responses:
      200:
        description: Conversa excluída com sucesso
      404:
        description: Conversa não encontrada
    """
    try:
        db = get_db()

        # Primeiro, verificamos se a conversa existe
        conversation = db.conversations.find_one(
            {"_id": ObjectId(conversation_id)})
        if not conversation:
            return jsonify({"error": "Conversa não encontrada."}), 404

        # Remover quaisquer referências a arquivos associados
        user_id = conversation.get("user_id")

        # Excluir a conversa
        result = db.conversations.delete_one(
            {"_id": ObjectId(conversation_id)})

        if result.deleted_count == 0:
            return jsonify({"error": "Falha ao excluir a conversa."}), 500

        current_app.logger.info(
            f"Conversa {conversation_id} excluída para usuário {user_id}")

        return jsonify({"message": "Conversa excluída com sucesso."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# --------------------------
# Endpoints de Mensagens
# --------------------------

@chat_bp.route("/conversations/<conversation_id>/messages", methods=["GET"])
def get_messages(conversation_id):
    """
    Obtém as mensagens de uma conversa.

    ---
    tags:
      - Chat
    parameters:
      - name: conversation_id
        in: path
        type: string
        required: true
        description: ID da conversa
      - name: limit
        in: query
        type: integer
        required: false
        description: Limite de mensagens a retornar (padrão 50)
      - name: offset
        in: query
        type: integer
        required: false
        description: Offset para paginação
    responses:
      200:
        description: Lista de mensagens da conversa
      404:
        description: Conversa não encontrada
    """
    try:
        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))

        db = get_db()
        conversation = db.conversations.find_one(
            {"_id": ObjectId(conversation_id)},
            {"history": 1, "_id": 0}
        )

        if not conversation:
            return jsonify({"error": "Conversa não encontrada."}), 404

        history = conversation.get("history", [])
        total_messages = len(history)

        # Aplicar paginação
        paginated_history = history[offset:offset +
                                    limit] if offset < len(history) else []

        return jsonify({
            "messages": paginated_history,
            "total": total_messages,
            "offset": offset,
            "limit": limit
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@chat_bp.route("/conversations/<conversation_id>/messages", methods=["POST"])
@validate_request_data
def send_message(conversation_id):
    """
    Envia uma mensagem e obtém resposta da IA.

    ---
    tags:
      - Chat
    parameters:
      - name: conversation_id
        in: path
        type: string
        required: true
        description: ID da conversa
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - user_id
            - message
          properties:
            user_id:
              type: string
              example: "12345"
            user_email:
              type: string
              example: "usuario@exemplo.com"
            message:
              type: string
              example: "Olá, preciso de ajuda com minha consulta."
            agent:
              type: string
              example: "agent médico"
            gptProvider:
              type: string
              example: "gemini"
            providerVersion:
              type: string
              example: "default"
            userMsgId:
              type: string
              example: "msg-001"
            max_tokens:
              type: integer
              example: 2048
    responses:
      200:
        description: Resposta da IA
      400:
        description: Erro de validação
      404:
        description: Conversa não encontrada
      500:
        description: Erro interno
    """
    start_total = time.time()
    data = request.get_json()

    user_id = data.get("user_id")
    message = data.get("message")
    user_email = data.get("user_email", "")
    agent = data.get("agent", "").lower()  # opcional
    gpt_provider = data.get("gptProvider", "").lower()
    provider_version = data.get("providerVersion", "").lower()
    user_msg_id = data.get("userMsgId", f"msg-{int(time.time())}")
    max_tokens = data.get("max_tokens", 2048)

    # Busca a configuração do provider
    provider_config_doc = get_provider_config(gpt_provider)
    if not provider_config_doc:
        return jsonify({"error": f"Provider '{gpt_provider}' não está configurado."}), 400

    # Log para debug
    current_app.logger.info(
        "Provider config doc para '%s': %s", gpt_provider, provider_config_doc)

    versions = provider_config_doc.get("versions")
    if versions:
        current_app.logger.info("Versões encontradas: %s", versions)
        provider_config = versions.get(provider_version)
        if provider_config is None:
            current_app.logger.info(
                "Versão '%s' não encontrada, utilizando fallback.", provider_version)
            provider_config = next(iter(versions.values()), None)
    else:
        provider_config = provider_config_doc

    current_app.logger.info(
        "Provider config final utilizada: %s", provider_config)

    if not provider_config or "api_key" not in provider_config or "endpoint" not in provider_config:
        return jsonify({"error": f"Configuração para o provider '{gpt_provider}' (versão '{provider_version}') não encontrada."}), 400

    # Atualizar configuração para incluir max_tokens
    provider_config["max_tokens"] = max_tokens

    # Se um agente for informado, busca seu template customizado
    agent_template = None
    if agent:
        agent_template = get_agent_template(agent)
        if not agent_template:
            return jsonify({"error": f"Agente '{agent}' não está configurado."}), 400

    try:
        full_prompt = get_prompt_instructions(
            message, custom_template=agent_template)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    db = get_db()
    try:
        conversation = db.conversations.find_one(
            {"_id": ObjectId(conversation_id)})
        if not conversation:
            return jsonify({"error": "Conversa não encontrada."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    # Preparar a mensagem do usuário
    user_message = {
        "id": user_msg_id,
        "sender": "user",
        "text": message,
        "timestamp": datetime.utcnow().isoformat(),
        "agent": agent,
        "gpt": gpt_provider
    }

    genai = GenAIService(provider_config=provider_config)
    try:
        if gpt_provider == "chatgpt":
            ai_response_text = genai.chat_with_chatgpt(
                prompt=full_prompt, version=provider_version)
        elif gpt_provider == "gemini":
            ai_response_text = genai.chat_with_gemini(full_prompt)
        elif gpt_provider == "deepseek":
            ai_response_text = genai.chat_with_deepseek(full_prompt)
        elif gpt_provider == "llama":
            ai_response_text = genai.chat_with_llama(full_prompt)
        elif gpt_provider == "copilot":
            ai_response_text = genai.chat_with_copilot(full_prompt)
        elif gpt_provider == "claude":
            ai_response_text = genai.chat_with_claude(full_prompt)
        else:
            return jsonify({"error": f"Provider '{gpt_provider}' não suportado."}), 400
    except Exception as e:
        current_app.logger.error(
            "Erro na chamada da API de GEN AI: %s", str(e))
        return jsonify({"error": str(e)}), 500

    # Preparar a resposta do modelo
    ai_message = {
        "id": f"resp-{int(time.time())}",
        "sender": "ai",
        "text": ai_response_text,
        "timestamp": datetime.utcnow().isoformat(),
        "agent": agent,
        "gpt": gpt_provider,
        "parentId": user_msg_id
    }

    # Atualizar o histórico da conversa
    history = conversation.get("history", [])
    history.append(user_message)
    history.append(ai_message)

    # Atualizar a conversa
    now = datetime.utcnow().isoformat()
    preview = ai_message["text"][:100] + \
        "..." if len(ai_message["text"]) > 100 else ai_message["text"]

    db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {
            "$set": {
                "history": history,
                "updated_at": now,
                "last_message": preview
            }
        }
    )

    current_app.logger.info(
        f"Mensagem adicionada à conversa {conversation_id}, resposta gerada pelo {gpt_provider}")

    total_time = (time.time() - start_total) * 1000
    current_app.logger.info("Tempo total endpoint: %.2f ms", total_time)

    return jsonify({
        "user_message": user_message,
        "ai_response": ai_message
    }), 200


@chat_bp.route("/conversations/<conversation_id>/messages", methods=["DELETE"])
def clear_messages(conversation_id):
    """
    Limpa todas as mensagens de uma conversa.

    ---
    tags:
      - Chat
    parameters:
      - name: conversation_id
        in: path
        type: string
        required: true
        description: ID da conversa
    responses:
      200:
        description: Mensagens excluídas com sucesso
      404:
        description: Conversa não encontrada
    """
    try:
        db = get_db()
        now = datetime.utcnow().isoformat()

        # Verificar se a conversa existe
        conversation = db.conversations.find_one(
            {"_id": ObjectId(conversation_id)})
        if not conversation:
            return jsonify({"error": "Conversa não encontrada."}), 404

        # Limpar o histórico da conversa
        result = db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"history": [], "updated_at": now, "last_message": ""}}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Falha ao limpar o histórico de mensagens."}), 500

        current_app.logger.info(
            f"Histórico de mensagens limpo para conversa {conversation_id}")

        return jsonify({"message": "Histórico de mensagens limpo com sucesso."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# --------------------------
# Endpoints de Provedores de IA
# --------------------------

@chat_bp.route("/providers", methods=["GET"])
def list_providers():
    """
    Lista todos os provedores de IA disponíveis.

    ---
    tags:
      - Chat
    responses:
      200:
        description: Lista de provedores
    """
    db = get_db()
    providers = list(db.providers.find({}, {"_id": 0}))

    return jsonify(providers), 200


@chat_bp.route("/providers/<provider_name>/versions", methods=["GET"])
def list_provider_versions(provider_name):
    """
    Lista as versões disponíveis para um provedor específico.

    ---
    tags:
      - Chat
    parameters:
      - name: provider_name
        in: path
        type: string
        required: true
        description: Nome do provedor
    responses:
      200:
        description: Lista de versões do provedor
      404:
        description: Provedor não encontrado
    """
    db = get_db()
    provider = db.providers.find_one({"name": provider_name.lower()}, {
                                     "_id": 0, "versions": 1})

    if not provider:
        return jsonify({"error": f"Provider '{provider_name}' não encontrado."}), 404

    versions = provider.get("versions", {})
    version_names = list(versions.keys())

    return jsonify({"provider": provider_name, "versions": version_names}), 200


# --------------------------
# Endpoints de Configurações do Usuário
# --------------------------

@chat_bp.route("/settings", methods=["GET"])
def get_user_settings():
    """
    Obtém as configurações do usuário.

    ---
    tags:
      - Chat
    parameters:
      - name: user_id
        in: query
        type: string
        required: true
        description: ID do usuário
    responses:
      200:
        description: Configurações do usuário
      404:
        description: Configurações não encontradas
    """
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id é obrigatório."}), 400

    db = get_db()
    settings = db.chat_settings.find_one({"user_id": user_id}, {"_id": 0})

    if not settings:
        # Retornar configurações padrão
        settings = {
            "user_id": user_id,
            "default_provider": "chatgpt",
            "default_version": "v35_turbo",
            "max_tokens": 2048,
            "temperature": 0.7,
            "default_agent": None
        }

    return jsonify(settings), 200


@chat_bp.route("/settings", methods=["PUT"])
@validate_request_data
def update_user_settings():
    """
    Atualiza as configurações do usuário.

    ---
    tags:
      - Chat
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - user_id
          properties:
            user_id:
              type: string
              example: "12345"
            default_provider:
              type: string
              example: "chatgpt"
            default_version:
              type: string
              example: "v35_turbo"
            max_tokens:
              type: integer
              example: 2048
            temperature:
              type: number
              example: 0.7
            default_agent:
              type: string
              example: "agent médico"
    responses:
      200:
        description: Configurações atualizadas com sucesso
    """
    data = request.get_json()
    user_id = data.get("user_id")

    db = get_db()

    # Campos permitidos para atualização
    allowed_fields = ["default_provider", "default_version",
                      "max_tokens", "temperature", "default_agent"]
    settings_update = {"user_id": user_id}

    for field in allowed_fields:
        if field in data:
            settings_update[field] = data[field]

    db.chat_settings.update_one(
        {"user_id": user_id},
        {"$set": settings_update},
        upsert=True
    )

    current_app.logger.info(
        f"Configurações atualizadas para usuário {user_id}")

    return jsonify({"message": "Configurações atualizadas com sucesso."}), 200


# --------------------------
# Rotas para implementação do streaming (Server-Sent Events)
# --------------------------

@chat_bp.route("/chat", methods=["POST"])
def legacy_chat_route():
    """
    Endpoint para informar que a API legada foi removida.

    ---
    tags:
      - Chat Legacy
    responses:
      410:
        description: API Legacy removida
    """
    return jsonify({
        "error": "API Legacy removida",
        "message": "Este endpoint foi descontinuado. Por favor, utilize a nova API de Chat em /api/conversations.",
        "migration_guide": {
            "create_conversation": "POST /api/conversations",
            "send_message": "POST /api/conversations/{id}/messages",
            "documentation": "/apidocs"
        }
    }), 410


@chat_bp.route("/conversations/<conversation_id>/stream", methods=["POST"])
@validate_request_data
def stream_response(conversation_id):
    """
    Envia uma mensagem e recebe uma resposta em streaming.

    ---
    tags:
      - Chat
    parameters:
      - name: conversation_id
        in: path
        type: string
        required: true
        description: ID da conversa
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - user_id
            - message
          properties:
            user_id:
              type: string
              example: "12345"
            message:
              type: string
              example: "Olá, preciso de ajuda com minha consulta."
            agent:
              type: string
              example: "agent médico"
            gptProvider:
              type: string
              example: "chatgpt"
            providerVersion:
              type: string
              example: "default"
    responses:
      200:
        description: Stream de respostas da IA
      400:
        description: Erro de validação
      500:
        description: Erro interno
    """
    data = request.get_json()

    # Nota: Este é um exemplo de implementação de SSE
    # Uma implementação real exigiria integração com as APIs que suportam streaming

    def generate():
        # Exemplo: simulação de resposta em partes
        yield "data: {\"type\":\"start\", \"message\":\"Iniciando resposta...\"}\n\n"

        # Em uma implementação real, aqui seria onde você conectaria à API do modelo
        # e retornaria cada fragmento da resposta conforme ele é gerado

        # Simulando alguns fragmentos
        chunks = ["Essa é ", "uma resposta ", "de exemplo ", "em streaming."]
        for chunk in chunks:
            yield f"data: {{\"type\":\"chunk\", \"content\":\"{chunk}\"}}\n\n"
            time.sleep(0.5)  # Simulando atraso

        yield "data: {\"type\":\"end\", \"message\":\"Resposta completa\"}\n\n"

    response = make_response(generate())
    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"
    return response
