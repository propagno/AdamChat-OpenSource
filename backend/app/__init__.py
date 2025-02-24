import os
import logging
from flask import Flask, jsonify
from app.config import Config
from flasgger import Swagger

def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object(Config)
    
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
    from app.routes.chat_routes import chat_bp
    from app.routes.payment_routes import payment_bp
    from app.routes.agent_routes import agent_bp
    from app.routes.gpt_routes import gpt_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(agent_bp)
    app.register_blueprint(gpt_bp)
    
    @app.route('/')
    def home():
        return app.send_static_file('login.html')
    
    return app
