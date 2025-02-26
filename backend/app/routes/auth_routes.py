from flask import Blueprint, redirect, url_for, request, session, jsonify
from authlib.integrations.flask_client import OAuth
import os

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/auth")

# Configure o OAuth usando variáveis de ambiente
oauth = OAuth()
oauth.register(
    name='keycloak',
    server_metadata_url=os.getenv("KEYCLOAK_DISCOVERY_URL"),
    client_id=os.getenv("KEYCLOAK_CLIENT_ID"),
    client_secret=os.getenv("KEYCLOAK_CLIENT_SECRET"),
    client_kwargs={'scope': 'openid profile email'},
)


@auth_bp.route("/login")
def login():
    redirect_uri = url_for("auth_bp.callback", _external=True)
    return oauth.keycloak.authorize_redirect(redirect_uri)


@auth_bp.route("/callback")
def callback():
    token = oauth.keycloak.authorize_access_token()
    userinfo = oauth.keycloak.parse_id_token(token)
    session["user"] = userinfo  # Armazene as informações do usuário na sessão
    # Você pode criar uma sessão customizada ou gerar um JWT para o frontend
    return redirect("http://localhost:3002/dashboard")


@auth_bp.route("/logout")
def logout():
    session.clear()
    return redirect("http://localhost:3002")
