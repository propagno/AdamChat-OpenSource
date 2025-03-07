"""
Inicialização da aplicação AdamChat.
"""
import os
import logging
from flask import Flask, jsonify, redirect, url_for, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flasgger import Swagger, swag_from
from werkzeug.exceptions import HTTPException
from app.config.app_config import get_config
from app.extensions import socketio, db, migrate, jwt
from app.middlewares.system_middleware import system_middleware, check_maintenance_mode
from app.middlewares.swagger_middleware import swagger_middleware
from app.db import init_db
from app.swagger_config import init_swagger
from datetime import datetime

# Inicialização das extensões
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_name='development'):
    """
    Cria e inicializa a aplicação Flask

    Args:
        config_name (str): Nome da configuração a ser usada

    Returns:
        Flask: Aplicação Flask configurada
    """
    # Configuração de logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(name)s - %(message)s',
        handlers=[
            logging.StreamHandler()
        ]
    )

    app = Flask(__name__)
    app.config.from_object(get_config(config_name))

    # Inicializar CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}},
         supports_credentials=True)

    # Inicializar banco de dados
    init_db(app)

    # Registrar middlewares
    app.wsgi_app = system_middleware(app.wsgi_app)
    app.wsgi_app = swagger_middleware(app.wsgi_app)

    # Registrar middleware de verificação de modo de manutenção
    app.before_request(check_maintenance_mode)

    # Inicializar SocketIO
    socketio.init_app(app, cors_allowed_origins="*")

    # Inicializar extensões
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Inicializar Swagger
    init_swagger(app)

    # Rota para verificação de saúde
    @app.route('/api/health')
    @swag_from({
        'tags': ['Health'],
        'summary': 'Verifica a saúde do sistema',
        'responses': {
            200: {
                'description': 'Sistema saudável',
                'schema': {
                    'type': 'object',
                    'properties': {
                        'status': {'type': 'string'},
                        'version': {'type': 'string'},
                        'service': {'type': 'string'}
                    }
                }
            }
        }
    })
    def health_check():
        """Verifica se o sistema está funcionando corretamente"""
        return jsonify({
            'status': 'ok',
            'version': '1.0.0',
            'service': 'AdamChat API'
        }), 200

    @app.route('/apidocs')
    def apidocs():
        return redirect('/apidocs/')

    @app.route('/swagger.json')
    def swagger_json():
        return redirect('/apispec.json')

    @app.route('/static/<path:path>')
    def send_static(path):
        return send_from_directory('static', path)

    # Importar e registrar blueprints existentes
    try:
        from app.routes.auth_routes import auth_bp
        app.register_blueprint(auth_bp)
    except ImportError:
        app.logger.warning("Blueprint 'auth_bp' não encontrado")

    # Importar e registrar o blueprint OAuth
    try:
        from app.routes.oauth_routes import oauth_bp
        app.register_blueprint(oauth_bp)
    except ImportError:
        app.logger.warning("Blueprint 'oauth_bp' não encontrado")

    # Importar e registrar o blueprint de Chat
    try:
        from app.routes.chat_routes import chat_bp
        app.register_blueprint(chat_bp, url_prefix='/api')
    except ImportError:
        app.logger.warning("Blueprint 'chat_bp' não encontrado")

    # Importar e registrar o blueprint de Agents
    try:
        from app.routes.agent_routes import agent_bp
        app.register_blueprint(agent_bp, url_prefix='/api')
    except ImportError:
        app.logger.warning("Blueprint 'agent_bp' não encontrado")

    # Importar e registrar o blueprint de Uploads
    try:
        from app.routes.upload_routes import upload_bp
        app.register_blueprint(upload_bp, url_prefix='/api')
    except ImportError:
        app.logger.warning("Blueprint 'upload_bp' não encontrado")

    # Importar e registrar o blueprint de Providers
    try:
        from app.routes.providers_routes import providers_bp
        app.register_blueprint(providers_bp, url_prefix='/api')
    except ImportError:
        app.logger.warning("Blueprint 'providers_bp' não encontrado")

    @app.route('/api/debug/routes')
    def list_routes():
        """Lista todas as rotas disponíveis na aplicação"""
        routes = []
        for rule in app.url_map.iter_rules():
            route = {
                'endpoint': rule.endpoint,
                'methods': [method for method in rule.methods if method not in ['HEAD', 'OPTIONS']],
                'path': str(rule)
            }
            routes.append(route)
        return jsonify(routes)

    @app.errorhandler(404)
    def page_not_found(e):
        """Handler para erro 404 que registra informações detalhadas sobre a requisição"""
        # Extrair informações da requisição
        url = request.url
        method = request.method
        headers = dict(request.headers)
        args = dict(request.args)
        remote_addr = request.remote_addr
        user_agent = request.user_agent.string

        # Filtrar informações sensíveis dos cabeçalhos
        if 'Authorization' in headers:
            headers['Authorization'] = 'REDACTED'
        if 'Cookie' in headers:
            headers['Cookie'] = 'REDACTED'

        # Registrar informações detalhadas
        app.logger.error(
            f"404 Error: URL '{url}' não encontrada\n"
            f"Método: {method}\n"
            f"Cabeçalhos: {headers}\n"
            f"Args: {args}\n"
            f"IP: {remote_addr}\n"
            f"User Agent: {user_agent}"
        )

        # Retornar resposta JSON para API
        if request.path.startswith('/api/'):
            return jsonify({
                'status': 'error',
                'message': 'A rota solicitada não foi encontrada',
                'code': 404,
                'path': request.path,
                'help': '/api/routes'
            }), 404

        # Retornar mensagem para páginas normais
        return "Rota não encontrada. Consulte a documentação da API ou verifique o URL.", 404

    @app.route('/api/routes', methods=['GET'])
    def list_routes_api():
        """Lista todas as rotas disponíveis na API"""
        routes = []
        for rule in app.url_map.iter_rules():
            # Filtrar rotas de sistema e estáticas
            if not str(rule).startswith('/static') and not str(rule).startswith('/swagger'):
                routes.append({
                    'route': str(rule),
                    'methods': list(rule.methods - {'HEAD', 'OPTIONS'}),
                    'endpoint': rule.endpoint
                })

        return jsonify({
            'status': 'success',
            'routes': routes,
            'total_routes': len(routes)
        })

    # Manipulador de erros global
    @app.errorhandler(Exception)
    def handle_error(e):
        """Manipulador de exceções global"""
        logging.error(f"Erro não tratado: {str(e)}", exc_info=True)

        # Para exceções HTTP, retornar o código de status específico
        if isinstance(e, HTTPException):
            return jsonify({
                'status': 'error',
                'message': str(e),
                'code': e.code
            }), e.code

        # Para outras exceções, retornar 500
        return jsonify({
            'status': 'error',
            'message': 'Erro interno do servidor',
            'code': 500
        }), 500

    # Rota de teste direta para OAuth sem usar blueprint
    @app.route('/direct-oauth-test')
    def direct_oauth_test():
        """Rota de teste direta para OAuth"""
        logging.info("Acessando rota de teste direta OAuth")
        return jsonify({
            'status': 'success',
            'message': 'Rota de teste OAuth direta funcionando!',
            'timestamp': datetime.now().isoformat()
        })

    # Rota de mock para OAuth
    @app.route('/direct-oauth-mock')
    def direct_oauth_mock():
        """Mock para OAuth sem usar blueprint"""
        logging.info("Recebida solicitação para mock OAuth direto")

        # Gerar tokens de teste
        import secrets
        access_token = secrets.token_hex(32)
        refresh_token = secrets.token_hex(32)

        # URL de redirecionamento de teste
        from app.config.oauth_config import FRONTEND_DOMAIN
        redirect_url = f"{FRONTEND_DOMAIN}/callback?access_token={access_token}&refresh_token={refresh_token}"

        logging.info(f"Redirecionando para: {redirect_url}")
        return redirect(redirect_url)

    return app
