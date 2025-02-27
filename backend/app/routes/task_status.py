# backend/app/routes/task_status.py
from flask import Blueprint, request, jsonify
from app.celery_worker import process_message_task, celery
from app.db import get_db

task_bp = Blueprint("task_bp", __name__)


@task_bp.route("/task/<task_id>", methods=["GET"])
def get_task_status(task_id):
    task_result = celery.AsyncResult(task_id)
    if task_result.ready():
        # Se a tarefa estiver pronta, atualize o histórico do usuário com a resposta da AI
        ai_response = task_result.get()
        user_id = request.args.get("user_id")
        db = get_db()
        conversation = db.conversations.find_one({"user_id": user_id})
        # Substitua a mensagem "Processando resposta..." pela resposta final
        for i, msg in enumerate(conversation["history"]):
            if msg["sender"] == "ai" and msg["text"] == "Processando resposta...":
                conversation["history"][i]["text"] = ai_response
                break
        db.conversations.update_one({"user_id": user_id}, {
                                    "$set": {"history": conversation["history"]}})
        return jsonify({"status": "completed", "history": conversation["history"]}), 200
    else:
        return jsonify({"status": "processing"}), 200
