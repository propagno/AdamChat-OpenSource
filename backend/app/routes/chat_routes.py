# backend/app/routes/chat_routes.py
from flask import Blueprint, request, jsonify
from app.db import get_db
from app.services.genai_service import call_genai_api

chat_bp = Blueprint("chat_bp", __name__)


@chat_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    # Pode ser um identificador do usuário (pode vir da sessão autenticada)
    user_id = data.get("user_id")
    message = data.get("message")

    if not message:
        return jsonify({"error": "Mensagem vazia"}), 400

    db = get_db()
    # Suponha que o histórico das conversas esteja em uma coleção chamada "conversations"
    # e que cada documento tenha um campo "user_id" e "history" (lista de mensagens)
    conversation = db.conversations.find_one({"user_id": user_id})

    if conversation is None:
        # Cria um novo histórico se não existir
        conversation = {"user_id": user_id, "history": []}
        db.conversations.insert_one(conversation)

    # Atualiza o histórico com a nova mensagem do usuário
    conversation["history"].append(f"Usuário: {message}")

    try:
        # Chama a API de GEN AI passando o histórico completo
        ai_response = call_genai_api(conversation["history"])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Atualiza o histórico com a resposta da GEN AI
    conversation["history"].append(f"AI: {ai_response}")
    db.conversations.update_one({"user_id": user_id}, {
                                "$set": {"history": conversation["history"]}})

    return jsonify({"response": ai_response, "history": conversation["history"]}), 200
