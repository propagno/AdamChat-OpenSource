# backend/app/celery_worker.py
import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

celery = Celery(
    'adamchat',
    broker=os.environ.get('CELERY_BROKER_URL', 'redis://redis:6379/0'),
    backend=os.environ.get('CELERY_RESULT_BACKEND', 'redis://redis:6379/0')
)

# Importação tardia para evitar problemas de circularidade


@celery.task
def process_message_task(user_id, prompt_history, provider):
    from app.services.genai_service import GenAIService
    genai = GenAIService()

    # Concatena o prompt
    prompt = "\n".join(prompt_history)

    if provider == "gemini":
        ai_response = genai.chat_with_gemini(prompt)
    elif provider == "outra_api":
        ai_response = genai.chat_with_outra_api(prompt)
    else:
        ai_response = genai.chat_with_chatgpt(prompt)

    return ai_response
