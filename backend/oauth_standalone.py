"""
OAuth Standalone Application

Esta aplicação Flask independente implementa um fluxo OAuth simplificado
para fins de teste e diagnóstico. Ela não depende das configurações do
aplicativo principal e pode ser executada separadamente.

Para executar:
    python oauth_standalone.py
"""

import os
import json
import uuid
import logging
import secrets
import requests
from flask import Flask, request, redirect, jsonify, session
from flask_cors import CORS
from urllib.parse import urlencode, quote

# Configuração de logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Criar aplicação Flask
app = Flask(__name__)
app.secret_key = secrets.token_hex(16)
CORS(app, supports_credentials=True)

# Configurações dos provedores OAuth
OAUTH_PROVIDERS = {
    "google": {
        "client_id": os.environ.get("GOOGLE_CLIENT_ID", ""),
        "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET", ""),
        "authorize_url": "https://accounts.google.com/o/oauth2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://www.googleapis.com/oauth2/v3/userinfo",
        "scope": "email profile",
    },
    "github": {
        "client_id": os.environ.get("GITHUB_CLIENT_ID", ""),
        "client_secret": os.environ.get("GITHUB_CLIENT_SECRET", ""),
        "authorize_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "userinfo_url": "https://api.github.com/user",
        "scope": "read:user user:email",
    },
    "facebook": {
        "client_id": os.environ.get("FACEBOOK_CLIENT_ID", ""),
        "client_secret": os.environ.get("FACEBOOK_CLIENT_SECRET", ""),
        "authorize_url": "https://www.facebook.com/v12.0/dialog/oauth",
        "token_url": "https://graph.facebook.com/v12.0/oauth/access_token",
        "userinfo_url": "https://graph.facebook.com/me?fields=id,name,email,picture",
        "scope": "email",
    }
}

# Configurações do aplicativo
HOST = os.environ.get("OAUTH_HOST", "localhost")
PORT = int(os.environ.get("OAUTH_PORT", 5001))
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# URL de redirecionamento para a aplicação
REDIRECT_URI = f"http://{HOST}:{PORT}/callback"
FRONTEND_CALLBACK = f"{FRONTEND_URL}/oauth-callback"

# Armazenamento temporário para estados e tokens
states = {}
tokens = {}


@app.route('/health')
def health_check():
    """Verificar a saúde da aplicação"""
    logger.info("Health check realizado")
    return jsonify({
        "status": "ok",
        "message": "OAuth Standalone está funcionando!",
        "config": {
            "host": HOST,
            "port": PORT,
            "redirect_uri": REDIRECT_URI,
            "frontend_callback": FRONTEND_CALLBACK
        }
    })


@app.route('/providers')
def list_providers():
    """Listar provedores OAuth disponíveis"""
    providers = {}
    for provider, config in OAUTH_PROVIDERS.items():
        providers[provider] = {
            "name": provider.capitalize(),
            "client_id_configured": bool(config["client_id"]),
            "client_secret_configured": bool(config["client_secret"]),
            "scope": config["scope"]
        }

    logger.info(f"Provedores listados: {list(providers.keys())}")
    return jsonify(providers)


@app.route('/authorize/<provider>')
def authorize(provider):
    """Iniciar o fluxo de autorização OAuth"""
    if provider not in OAUTH_PROVIDERS:
        logger.error(f"Provedor não encontrado: {provider}")
        return jsonify({"error": "Provider not found"}), 404

    # Gerar estado para segurança contra CSRF
    state = str(uuid.uuid4())
    states[state] = {"provider": provider}

    # Construir URL de autorização
    config = OAUTH_PROVIDERS[provider]
    params = {
        "client_id": config["client_id"],
        "redirect_uri": REDIRECT_URI,
        "scope": config["scope"],
        "response_type": "code",
        "state": state
    }

    auth_url = f"{config['authorize_url']}?{urlencode(params)}"

    logger.info(f"Redirecionando para autorização: {provider}")
    logger.debug(f"URL de autorização: {auth_url}")

    return redirect(auth_url)


@app.route('/callback')
def callback():
    """Receber callback do provedor OAuth"""
    # Obter parâmetros da URL
    code = request.args.get('code')
    error = request.args.get('error')
    state = request.args.get('state')

    logger.info(
        f"Callback recebido: code={bool(code)}, error={error}, state={state}")

    # Verificar erros na resposta
    if error:
        logger.error(f"Erro no callback: {error}")
        error_redirect = f"{FRONTEND_CALLBACK}?error={error}"
        return redirect(error_redirect)

    # Verificar estado para segurança
    if state not in states:
        logger.error(f"Estado inválido: {state}")
        error_redirect = f"{FRONTEND_CALLBACK}?error=invalid_state"
        return redirect(error_redirect)

    # Recuperar informações do estado
    state_data = states.pop(state)
    provider = state_data["provider"]

    if not code:
        logger.error("Código de autorização não encontrado")
        error_redirect = f"{FRONTEND_CALLBACK}?error=no_code"
        return redirect(error_redirect)

    # Trocar código de autorização por token de acesso
    config = OAUTH_PROVIDERS[provider]
    token_params = {
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    logger.debug(f"Parâmetros para obter token: {token_params}")

    # Fazer requisição para obter token
    try:
        headers = {"Accept": "application/json"}
        token_response = requests.post(
            config["token_url"],
            data=token_params,
            headers=headers
        )

        if token_response.status_code != 200:
            logger.error(f"Erro ao obter token: {token_response.text}")
            error_redirect = f"{FRONTEND_CALLBACK}?error=token_error&details={quote(token_response.text)}"
            return redirect(error_redirect)

        # Garantir que a resposta seja JSON
        token_data = token_response.json() if token_response.headers.get(
            'Content-Type', '').startswith('application/json') else {}

        if not token_data and token_response.text:
            # Tentar parser a resposta como query string
            try:
                from urllib.parse import parse_qs
                token_data = {k: v[0]
                              for k, v in parse_qs(token_response.text).items()}
            except Exception as e:
                logger.error(f"Erro ao processar resposta de token: {e}")

        logger.info(f"Token obtido para: {provider}")

        # Armazenar token
        token_id = str(uuid.uuid4())
        tokens[token_id] = {
            "provider": provider,
            "token_data": token_data
        }

        # Obter informações do usuário
        access_token = token_data.get("access_token")
        if access_token:
            user_info = get_user_info(provider, access_token)
            if user_info:
                tokens[token_id]["user_info"] = user_info

        # Redirecionar para frontend com token_id
        success_redirect = f"{FRONTEND_CALLBACK}?success=true&token_id={token_id}&provider={provider}"
        return redirect(success_redirect)

    except Exception as e:
        logger.exception(f"Erro ao processar token: {e}")
        error_redirect = f"{FRONTEND_CALLBACK}?error=exception&details={quote(str(e))}"
        return redirect(error_redirect)


def get_user_info(provider, access_token):
    """Obter informações do usuário com o token de acesso"""
    try:
        config = OAUTH_PROVIDERS[provider]
        headers = {"Authorization": f"Bearer {access_token}"}

        # GitHub usa cabeçalho diferente
        if provider == "github":
            headers = {
                "Authorization": f"token {access_token}",
                "Accept": "application/vnd.github.v3+json"
            }

        user_response = requests.get(config["userinfo_url"], headers=headers)

        if user_response.status_code != 200:
            logger.error(
                f"Erro ao obter informações do usuário: {user_response.text}")
            return None

        user_info = user_response.json()
        logger.info(f"Informações do usuário obtidas para: {provider}")
        return user_info

    except Exception as e:
        logger.exception(f"Erro ao obter informações do usuário: {e}")
        return None


@app.route('/token/<token_id>')
def get_token(token_id):
    """Obter informações de token armazenado"""
    if token_id not in tokens:
        logger.error(f"Token ID não encontrado: {token_id}")
        return jsonify({"error": "Token not found"}), 404

    token_data = tokens[token_id]
    logger.info(f"Token recuperado: {token_id}")
    return jsonify(token_data)


@app.route('/test-tokens')
def test_tokens():
    """Gerar tokens falsos para teste"""
    fake_tokens = {
        "google": {
            "token_id": str(uuid.uuid4()),
            "provider": "google",
            "token_data": {"access_token": "fake_google_token"},
            "user_info": {
                "name": "Test User",
                "email": "test@example.com",
                "picture": "https://via.placeholder.com/150"
            }
        },
        "github": {
            "token_id": str(uuid.uuid4()),
            "provider": "github",
            "token_data": {"access_token": "fake_github_token"},
            "user_info": {
                "login": "testuser",
                "name": "Test User",
                "email": "test@example.com",
                "avatar_url": "https://via.placeholder.com/150"
            }
        }
    }

    # Armazenar os tokens falsos para recuperação posterior
    for provider, data in fake_tokens.items():
        token_id = data["token_id"]
        tokens[token_id] = data

    logger.info("Tokens de teste gerados")
    return jsonify(fake_tokens)


if __name__ == "__main__":
    # Iniciar servidor Flask
    logger.info(f"Iniciando OAuth Standalone em http://{HOST}:{PORT}")

    # Verificar se as credenciais estão configuradas
    for provider, config in OAUTH_PROVIDERS.items():
        if not config["client_id"] or not config["client_secret"]:
            logger.warning(
                f"ATENÇÃO: Credenciais para {provider} não estão configuradas!")
            logger.warning(
                f"Defina as variáveis de ambiente {provider.upper()}_CLIENT_ID e {provider.upper()}_CLIENT_SECRET")

    app.run(host=HOST, port=PORT, debug=True)
