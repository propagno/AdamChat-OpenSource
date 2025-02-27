# backend/app/routes/chat_routes.py
from flask import Blueprint, request, jsonify, current_app
from app.db import get_db
from app.services.genai_service import GenAIService
import time

chat_bp = Blueprint("chat_bp", __name__)


@chat_bp.route("/chat", methods=["POST"])
def chat():
    start_total = time.time()
    data = request.get_json()

    user_id = data.get("user_id")
    user_email = data.get("user_email")
    message = data.get("message")
    agent = data.get("agent", "agent alpha").lower()
    gpt_provider = data.get("gptProvider", "chatgpt").lower()
    user_msg_id = data.get("userMsgId")

    if not user_id or not message:
        return jsonify({"error": "user_id e message são obrigatórios."}), 400

    db = get_db()
    conversation = db.conversations.find_one({"user_id": user_id})
    if conversation is None:
        conversation = {"user_id": user_id, "history": []}
        db.conversations.insert_one(conversation)

    conversation["history"].append({
        "id": user_msg_id,
        "sender": user_email,
        "text": message,
        "agent": agent,
        "gpt": gpt_provider
    })

    prompt_history = [
        f"{msg['sender']}: {msg['text']}" for msg in conversation["history"]]
    full_prompt = "\n".join(prompt_history)

    genai = GenAIService()
    try:
        if gpt_provider == "gemini":
            ai_response_text = genai.chat_with_gemini(full_prompt)
        elif gpt_provider == "outra_api":
            ai_response_text = genai.chat_with_outra_api(full_prompt)
        else:
            ai_response_text = genai.chat_with_chatgpt(full_prompt)
    except Exception as e:
        current_app.logger.error(
            "Erro na chamada da API de GEN AI: %s", str(e))
        return jsonify({"error": str(e)}), 500

    conversation["history"].append({
        "sender": "ai",
        "text": ai_response_text,
        "agent": agent,
        "gpt": gpt_provider,
        "parentId": user_msg_id
    })

    db.conversations.update_one({"user_id": user_id}, {
                                "$set": {"history": conversation["history"]}})
    total_time = (time.time() - start_total) * 1000
    current_app.logger.info("Tempo total endpoint: %.2f ms", total_time)
    return jsonify({"history": conversation["history"]}), 200
