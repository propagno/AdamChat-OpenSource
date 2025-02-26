# backend/app/services/genai_service.py
import os
import requests

# Exemplo usando a API do OpenAI (ajuste conforme a sua API de GEN AI)


def call_genai_api(conversation_history):
    # Formate o prompt concatenando o histórico
    prompt = "\n".join(conversation_history) + "\nResposta:"

    # Dados de autenticação e parâmetros (exemplo para OpenAI ChatGPT)
    # defina essa variável no seu .env
    api_key = os.environ.get("GEN_AI_API_KEY")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    data = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 150
    }

    response = requests.post(
        "https://api.openai.com/v1/chat/completions", headers=headers, json=data)

    if response.status_code == 200:
        result = response.json()
        # Supondo que a resposta esteja em result['choices'][0]['message']['content']
        return result['choices'][0]['message']['content']
    else:
        raise Exception(f"API error: {response.status_code} {response.text}")
