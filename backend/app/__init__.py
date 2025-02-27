# backend/app/__init__.py
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
    Swagger(app)

    logging.basicConfig(level=app.config.get("LOG_LEVEL", "INFO"))
    logger = logging.getLogger(__name__)

    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.error("Erro interno: %s", e, exc_info=True)
        return jsonify({"error": "Erro interno no servidor"}), 500

    # Processar a consulta médica
    from app.routes.agent_routes import agent_bp
    app.register_blueprint(agent_bp)

    # consultar status da tarefa e atualizar histórico quando a resposta estiver pronta
    from app.routes.task_status import task_bp
    app.register_blueprint(task_bp)

    # Registre os endpoints de chat
    from app.routes.chat_routes import chat_bp
    app.register_blueprint(chat_bp)

    @app.route('/')
    def home():
        return app.send_static_file('login.html')

    return app
