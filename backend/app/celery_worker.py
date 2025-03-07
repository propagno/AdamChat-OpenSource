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
def process_message_task(user_id, prompt_history, provider, provider_config=None, provider_version=None):
    """
    Processa a mensagem para o provedor de IA de forma assíncrona.

    Parâmetros:
      - user_id: ID do usuário.
      - prompt_history: Lista de strings que compõem o histórico de prompt.
      - provider: Nome do provedor (ex.: "chatgpt", "gemini", "deepseek", "llama", "copilot", "claude").
      - provider_config: (Opcional) Dicionário contendo a configuração específica para o provedor e versão desejada.
      - provider_version: (Opcional) String indicando a versão do provedor (ex.: "v4", "v35_turbo").

    Retorna:
      A resposta da IA como string.
    """
    from app.services.genai_service import GenAIService

    # Concatena o histórico em um único prompt
    prompt = "\n".join(prompt_history)

    # Instancia o GenAIService com a configuração dinâmica, se fornecida.
    genai = GenAIService(provider_config=provider_config)

    try:
        if provider.lower() == "chatgpt":
            # Se provider_version não for informado, usar um default (ex.: v35_turbo)
            if not provider_version:
                provider_version = "v35_turbo"
            ai_response = genai.chat_with_chatgpt(
                prompt, version=provider_version)
        elif provider.lower() == "gemini":
            ai_response = genai.chat_with_gemini(prompt)
        elif provider.lower() == "deepseek":
            ai_response = genai.chat_with_deepseek(prompt)
        elif provider.lower() == "llama":
            ai_response = genai.chat_with_llama(prompt)
        elif provider.lower() == "copilot":
            ai_response = genai.chat_with_copilot(prompt)
        elif provider.lower() == "claude":
            ai_response = genai.chat_with_claude(prompt)
        else:
            raise Exception(f"Provider '{provider}' não suportado.")
    except Exception as e:
        raise Exception(
            f"Erro na chamada da API de GEN AI para provider '{provider}': {str(e)}")

    return ai_response
