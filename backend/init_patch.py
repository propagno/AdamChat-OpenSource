from flask import Flask, jsonify, redirect, url_for
from app.extensions import db, migrate, jwt
import logging
import os

# Imports para rotas
from app.routes.auth_endpoints import auth_bp


def create_app(config_class=None):
    app = Flask(__name__)

    # Configuração
    if config_class is None:
        # Se config_class não for fornecido, tenta importar do módulo config
        try:
            from app.config.development import DevelopmentConfig
            app.config.from_object(DevelopmentConfig)
        except ImportError:
            # Se falhar, usa configuração padrão
            app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
                'DATABASE_URL', 'sqlite:///app.db')
            app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
            app.config['SECRET_KEY'] = os.environ.get(
                'SECRET_KEY', 'um-segredo-muito-seguro')
    else:
        app.config.from_object(config_class)

    # Configuração de Logging
    if not app.debug:
        # Configurar logging para produção
        handler = logging.StreamHandler()
        handler.setLevel(logging.INFO)
        app.logger.addHandler(handler)

    # Inicializa extensões
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Registrar blueprint das novas rotas
    app.register_blueprint(auth_bp)

    # Handler para erros 404
    @app.errorhandler(404)
    def page_not_found(e):
        return jsonify({"error": "Endpoint não encontrado", "code": 404}), 404

    # Handler para erros gerais
    @app.errorhandler(Exception)
    def handle_exception(e):
        app.logger.error(f"Erro não tratado: {str(e)}")
        return jsonify({"error": "Erro interno do servidor", "code": 500}), 500

    # Redirecionamento para documentação da API
    @app.route('/apidocs')
    def apidocs_redirect():
        return redirect('/api/docs')

    # Rota para verificar a saúde da aplicação
    @app.route('/api/health')
    def health_check():
        return jsonify({
            "status": "ok",
            "version": os.environ.get('APP_VERSION', '1.0.0'),
            "service": "AdamChat Backend"
        })

    # Outras rotas existentes

    return app
