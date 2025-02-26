import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from flasgger import Swagger


def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object(Config)
    CORS(app)

    # Configuração do Swagger
    Swagger(app)

    logging.basicConfig(level=app.config.get("LOG_LEVEL", "INFO"))
    logger = logging.getLogger(__name__)

    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.error("Erro interno: %s", e, exc_info=True)
        return jsonify({"error": "Erro interno no servidor"}), 500

    from app.routes.auth_routes import auth_bp
    from app.routes.dashboard_routes import dashboard_bp
    # Outros blueprints...

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)

    # Inicialize o Keycloak e armazene na configuração ou em um objeto global, conforme sua preferência.
    from app.services.keycloak_client import init_keycloak
    keycloak = init_keycloak(app)
    # Exemplo de armazenamento na configuração do app
    app.config['KEYCLOAK_CLIENT'] = keycloak

    @app.route('/')
    def home():
        return app.send_static_file('login.html')

    @app.route('/favicon.ico')
    def favicon():
        return app.send_static_file('favicon.ico')

    return app
