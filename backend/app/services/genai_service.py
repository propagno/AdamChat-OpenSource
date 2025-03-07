# backend/app/services/genai_service.py
import requests
import os
from flask import current_app

# Mapeamento de provedores para variáveis de ambiente
ENV_API_KEYS = {
    "chatgpt": "OPENAI_API_KEY",
    "openai": "OPENAI_API_KEY",
    "claude": "ANTHROPIC_API_KEY",
    "anthropic": "ANTHROPIC_API_KEY",
    "gemini": "GOOGLE_API_KEY",
    "google": "GOOGLE_API_KEY",
    "mistral": "MISTRAL_API_KEY",
    "llama": "META_API_KEY",
    "deepseek": "DEEPSEEK_API_KEY",
    "copilot": "COPILOT_API_KEY"
}


class GenAIService:
    def __init__(self, provider_config: dict = None):
        """
        Inicializa o serviço usando as configurações do provider.
        provider_config pode ter a estrutura:
          { "api_key": "...", "endpoint": "...", ... }
        ou estar aninhada, no formato:
          { "chatgpt": { "v4": { ... }, ... }, "gemini": { "default": { ... } }, ... }

        Nota: API keys definidas no arquivo .env têm prioridade sobre as configurações do provider.
        """
        self.provider_config = provider_config or {}
        self.use_env_keys = os.environ.get(
            'USE_ENV_API_KEYS', 'true').lower() == 'true'

    def get_api_key(self, provider: str) -> str:
        """
        Obtém a API key para o provedor especificado, priorizando variáveis de ambiente.

        Args:
            provider: Nome do provedor (chatgpt, gemini, etc.)

        Returns:
            API key como string
        """
        provider = provider.lower()

        # 1. Verificar se existe no arquivo .env
        if self.use_env_keys and provider in ENV_API_KEYS:
            env_key = os.environ.get(ENV_API_KEYS[provider])
            if env_key:
                if current_app:
                    current_app.logger.info(
                        f"Usando API key de variável de ambiente para {provider}")
                return env_key

        # 2. Fallback para a configuração fornecida
        if "api_key" in self.provider_config:
            if current_app:
                current_app.logger.info(
                    f"Usando API key da configuração fornecida para {provider}")
            return self.provider_config["api_key"]

        # 3. Caso não encontre, lançar exceção
        raise ValueError(f"API key não encontrada para o provedor {provider}")

    def chat_with_chatgpt(self, prompt: str, version: str = "v35_turbo") -> str:
        config = self._get_provider_version_config("chatgpt", version)
        if not config:
            raise Exception(
                f"Configuração para ChatGPT {version} não encontrada.")

        # Usar a API key do ambiente se disponível
        api_key = self.get_api_key("chatgpt")
        config["api_key"] = api_key

        return self._chat_with_openai(prompt, config)

    def _chat_with_openai(self, prompt: str, config: dict) -> str:
        url = config.get(
            "endpoint", "https://api.openai.com/v1/chat/completions")
        headers = {
            "Authorization": f"Bearer {config['api_key']}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": config.get("model", "gpt-3.5-turbo"),
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": config.get("max_tokens", 1100),
            "temperature": config.get("temperature", 0.7)
        }
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        if "choices" in data and data["choices"]:
            return data["choices"][0]["message"]["content"].strip()
        else:
            raise Exception("Resposta inválida da API ChatGPT.")

    def chat_with_gemini(self, prompt: str) -> str:
        config = self._get_provider_version_config("gemini", "default")
        if not config:
            raise Exception("Configuração para Gemini não encontrada.")

        # Usar a API key do ambiente se disponível
        api_key = self.get_api_key("gemini")

        endpoint = f"{config['endpoint']}?key={api_key}"
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
            raise Exception("Resposta inválida da API Gemini.")

    def chat_with_deepseek(self, prompt: str) -> str:
        config = self._get_provider_version_config("deepseek", "default")
        if not config:
            raise Exception("Configuração para DeepSeek não encontrada.")

        # Usar a API key do ambiente se disponível
        api_key = self.get_api_key("deepseek")

        url = config.get("endpoint")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": config.get("model", "default-model"),
            "input": prompt
        }
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        if "result" in data:
            return data["result"]
        else:
            raise Exception("Resposta inválida da API DeepSeek.")

    def chat_with_llama(self, prompt: str) -> str:
        config = self._get_provider_version_config("llama", "default")
        if not config:
            raise Exception("Configuração para Llama não encontrada.")

        # Usar a API key do ambiente se disponível
        api_key = self.get_api_key("llama")

        url = config.get("endpoint")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": config.get("model", "default-llama-model"),
            "input": prompt
        }
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        if "response" in data:
            return data["response"]
        else:
            raise Exception("Resposta inválida da API Llama.")

    def chat_with_copilot(self, prompt: str) -> str:
        config = self._get_provider_version_config("copilot", "default")
        if not config:
            raise Exception("Configuração para Copilot não encontrada.")

        # Usar a API key do ambiente se disponível
        api_key = self.get_api_key("copilot")

        url = config.get("endpoint")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": config.get("model", "default-copilot-model"),
            "input": prompt
        }
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        if "output" in data:
            return data["output"]
        else:
            raise Exception("Resposta inválida da API Copilot.")

    def chat_with_claude(self, prompt: str) -> str:
        config = self._get_provider_version_config("claude", "default")
        if not config:
            raise Exception("Configuração para Claude não encontrada.")

        # Usar a API key do ambiente se disponível
        api_key = self.get_api_key("claude")

        url = config.get("endpoint")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": config.get("model", "default-claude-model"),
            "input": prompt
        }
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        if "reply" in data:
            return data["reply"]
        else:
            raise Exception("Resposta inválida da API Claude.")

    def _get_provider_version_config(self, provider: str, version: str) -> dict:
        """
        Retorna a configuração para o provider e versão desejados.
        Se a configuração já foi extraída (ou seja, self.provider_config contém os campos 'api_key' e 'endpoint'),
        retorna ela mesma. Caso contrário, espera uma estrutura aninhada e busca pelo provider e versão.
        """
        # Se já temos a configuração extraída
        if "api_key" in self.provider_config and "endpoint" in self.provider_config:
            return self.provider_config

        # Caso contrário, trata a estrutura aninhada:
        provider = provider.lower()
        version = version.lower()
        if provider in self.provider_config:
            versions = self.provider_config[provider]
            return versions.get(version)
        return None
