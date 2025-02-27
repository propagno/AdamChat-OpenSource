# backend/app/routes/agent_routes.py
from flask import Blueprint, request, jsonify, current_app
from app.db import get_db
from app.services.agent_service import get_prompt_instructions
from app.services.genai_service import GenAIService
import time

agent_bp = Blueprint("agent_bp", __name__)


@agent_bp.route("/agent", methods=["POST"])
def agent():
    start = time.time()
    data = request.get_json()

    user_id = data.get("user_id")
    user_email = data.get("user_email")
    # Para agentes, pode ser "consultation_data" (para agentes médicos) ou "message" para outros
    consultation_data = data.get("consultation_data") or data.get("message")
    agent = data.get("agent", "").lower()
    gpt = data.get("gptProvider", "chatgpt").lower()
    user_msg_id = data.get("userMsgId")

    if not user_id or not user_email or not consultation_data or not agent:
        return jsonify({"error": "Campos obrigatórios ausentes"}), 400

    db = get_db()
    conversation = db.conversations.find_one({"user_id": user_id})
    if conversation is None:
        conversation = {"user_id": user_id, "history": []}
        db.conversations.insert_one(conversation)

    # Armazena a mensagem do usuário
    conversation["history"].append({
        "id": user_msg_id,
        "sender": user_email,
        "text": consultation_data,
        "agent": agent,
        "gpt": gpt
    })

    # Monta o prompt final usando a estratégia definida no agent_service.py
    full_prompt = get_prompt_instructions(agent, consultation_data)

    genai = GenAIService()
    try:
        if gpt == "gemini":
            ai_response_text = genai.chat_with_gemini(full_prompt)
        elif gpt == "outra_api":
            ai_response_text = genai.chat_with_outra_api(full_prompt)
        else:
            ai_response_text = genai.chat_with_chatgpt(full_prompt)
    except Exception as e:
        current_app.logger.error(
            "Erro na chamada da API de GEN AI para agent %s: %s", agent, str(e))
        return jsonify({"error": str(e)}), 500

    # Armazena a resposta da AI associada à mensagem do usuário
    conversation["history"].append({
        "sender": "ai",
        "text": ai_response_text,
        "agent": agent,
        "gpt": gpt,
        "parentId": user_msg_id
    })

    db.conversations.update_one({"user_id": user_id}, {
                                "$set": {"history": conversation["history"]}})

    total_time = time.time() - start
    current_app.logger.info(
        f"Tempo total para agent {agent}: {total_time:.2f}s")
    return jsonify({"history": conversation["history"]}), 200
