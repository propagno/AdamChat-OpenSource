# backend/app/services/genai_service.py
import os
import requests
from dotenv import load_dotenv

load_dotenv()


class GenAIService:
    def __init__(self):
        self.api_keys = {
            "gemini": os.getenv("GEMINI_API_KEY"),
            "chatgpt": os.getenv("CHATGPT_API_KEY"),
            "outra_api": os.getenv("OUTRA_API_KEY")
        }

    def chat_with_gemini(self, prompt):
        api_key = self.api_keys["gemini"]
        base_url = "https://generativelanguage.googleapis.com"
        endpoint = f"{base_url}/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        response = requests.post(endpoint, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        if "candidates" in data:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            return "Erro: Resposta inválida da API Gemini."

    def chat_with_chatgpt(self, prompt):
        api_key = self.api_keys["chatgpt"]
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1100,
            "temperature": 0.7
        }
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        if "choices" in data and data["choices"]:
            return data["choices"][0]["message"]["content"].strip()
        else:
            raise Exception("Resposta inválida da API ChatGPT.")

    def chat_with_outra_api(self, prompt):
        # Placeholder para outra API
        return "Resposta da outra API (implementação pendente)."
