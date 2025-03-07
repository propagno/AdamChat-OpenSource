"""
Rotas para autenticação OAuth com provedores de identidade social.
"""
import urllib.parse
import logging
from flask import Blueprint, request, jsonify, redirect, session, current_app, url_for
from werkzeug.exceptions import BadRequest
from app.services.oauth_service import oauth_service
from app.config.oauth_config import (
    SUPPORTED_PROVIDERS,
    OAUTH_SUCCESS_REDIRECT,
    OAUTH_FAILURE_REDIRECT,
    ENABLE_MOCK_OAUTH
)

# Configuração de logging
logger = logging.getLogger(__name__)

# Criar blueprint para rotas OAuth
oauth_bp = Blueprint('oauth', __name__, url_prefix='/api/auth/oauth')


@oauth_bp.route('/providers', methods=['GET'])
def get_providers():
    """
    Retorna a lista de provedores OAuth disponíveis e configurados.

    Returns:
        200 JSON: Lista de provedores disponíveis.
    """
    logger.info("Solicitação de lista de provedores OAuth")

    try:
        available_providers = []

        for provider in SUPPORTED_PROVIDERS:
            if oauth_service.is_provider_configured(provider):
                available_providers.append(provider)

        logger.info(f"Provedores disponíveis: {available_providers}")
        return jsonify({
            'status': 'success',
            'providers': available_providers
        }), 200
    except Exception as e:
        logger.exception(f"Erro ao obter provedores OAuth: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Erro ao obter provedores: {str(e)}"
        }), 500


@oauth_bp.route('/authorize/<provider>', methods=['GET'])
def authorize(provider):
    """
    Inicia o fluxo de autorização OAuth para o provedor especificado.

    Args:
        provider (str): Nome do provedor (google, facebook, github)

    Returns:
        302 Redirect: Redireciona para a página de autorização do provedor
        400 JSON: Erro se o provedor não estiver configurado ou for inválido
    """
    logger.info(f"Iniciando autorização OAuth para provedor: {provider}")

    # Verificar se o provedor é válido
    if provider not in SUPPORTED_PROVIDERS:
        logger.warning(f"Provedor não suportado: {provider}")
        return jsonify({
            'status': 'error',
            'message': f'Provedor não suportado: {provider}'
        }), 400

    # Obter URL de autorização
    auth_url_result = oauth_service.get_authorization_url(provider)

    if auth_url_result['status'] == 'error':
        logger.error(
            f"Erro ao obter URL de autorização: {auth_url_result['message']}")
        return jsonify(auth_url_result), 400

    # Registrar a URL de autorização para debug
    logger.info(
        f"Redirecionando para URL de autorização: {auth_url_result['auth_url']}")

    # Redirecionar para a URL de autorização
    return redirect(auth_url_result['auth_url'])


@oauth_bp.route('/callback', methods=['GET'])
def callback():
    """
    Processa o callback de autorização OAuth.

    Query Parameters:
        code (str): Código de autorização retornado pelo provedor
        state (str): Estado para validação CSRF
        error (str, opcional): Mensagem de erro se a autorização falhar

    Returns:
        302 Redirect: Redireciona para a aplicação frontend após o processamento
    """
    logger.info(f"Processando callback OAuth. Query params: {request.args}")

    # Verificar se há erro na resposta
    error = request.args.get('error')
    if error:
        error_description = request.args.get(
            'error_description', 'Autorização negada ou cancelada')
        logger.error(f"Erro no callback OAuth: {error} - {error_description}")

        # Codificar a mensagem de erro para evitar problemas na URL
        encoded_error = urllib.parse.quote(error)
        encoded_description = urllib.parse.quote(error_description)
        redirect_url = f"{OAUTH_FAILURE_REDIRECT}?error={encoded_error}&error_description={encoded_description}"

        logger.info(f"Redirecionando para: {redirect_url}")
        return redirect(redirect_url)

    # Obter código de autorização e estado
    code = request.args.get('code')
    state = request.args.get('state')

    if not code or not state:
        logger.error("Código ou estado ausente no callback")
        redirect_url = f"{OAUTH_FAILURE_REDIRECT}?error=invalid_request&error_description=Parâmetros%20necessários%20ausentes"
        logger.info(f"Redirecionando para: {redirect_url}")
        return redirect(redirect_url)

    # Recuperar o provedor da sessão
    provider = session.get('oauth_provider')
    if not provider:
        logger.error("Provedor não encontrado na sessão")
        redirect_url = f"{OAUTH_FAILURE_REDIRECT}?error=invalid_state&error_description=Sessão%20OAuth%20expirada"
        logger.info(f"Redirecionando para: {redirect_url}")
        return redirect(redirect_url)

    # Processar o callback
    logger.info(f"Processando callback OAuth para provedor: {provider}")
    result = oauth_service.handle_callback(provider, code, state)

    if result['status'] == 'error':
        logger.error(f"Erro no processamento do callback: {result['message']}")
        encoded_message = urllib.parse.quote(result['message'])
        redirect_url = f"{OAUTH_FAILURE_REDIRECT}?error=authentication_failed&error_description={encoded_message}"
        logger.info(f"Redirecionando para: {redirect_url}")
        return redirect(redirect_url)

    # Se autenticação bem-sucedida, redirecionar para o frontend com tokens
    logger.info("Autenticação OAuth bem-sucedida, redirecionando com tokens")
    access_token = result['tokens']['access_token']
    refresh_token = result['tokens']['refresh_token']

    # Redirecionar para o frontend com tokens na URL (melhor seria usar cookies HttpOnly em produção)
    redirect_url = f"{OAUTH_SUCCESS_REDIRECT}?access_token={urllib.parse.quote(access_token)}&refresh_token={urllib.parse.quote(refresh_token)}"
    logger.info(f"Redirecionando para: {redirect_url}")
    return redirect(redirect_url)


@oauth_bp.route('/mock-callback', methods=['GET'])
def mock_callback():
    """
    Endpoint de mock para callbacks OAuth em ambiente de desenvolvimento.

    Query Parameters:
        provider (str): Nome do provedor simulado
        state (str): Estado para validação CSRF

    Returns:
        302 Redirect: Redireciona para a aplicação frontend após o processamento

    Note:
        Esta rota só está disponível em ambiente de desenvolvimento com ENABLE_MOCK_OAUTH=true
    """
    logger.info(
        f"Processando mock callback OAuth. Query params: {request.args}")

    # Verificar se o mock está habilitado
    if not ENABLE_MOCK_OAUTH or not current_app.config.get('DEBUG', False):
        logger.error(
            "Tentativa de acessar mock callback em ambiente não-desenvolvimento")
        return jsonify({
            'status': 'error',
            'message': 'Mock OAuth não está disponível neste ambiente'
        }), 403

    # Obter provedor e estado
    provider = request.args.get('provider')
    state = request.args.get('state')

    if not provider or not state:
        logger.error("Provedor ou estado ausente no mock callback")
        redirect_url = f"{OAUTH_FAILURE_REDIRECT}?error=invalid_request&error_description=Parâmetros%20necessários%20ausentes"
        logger.info(f"Redirecionando para: {redirect_url}")
        return redirect(redirect_url)

    if provider not in SUPPORTED_PROVIDERS:
        logger.error(f"Provedor não suportado no mock callback: {provider}")
        redirect_url = f"{OAUTH_FAILURE_REDIRECT}?error=invalid_provider&error_description=Provedor%20não%20suportado"
        logger.info(f"Redirecionando para: {redirect_url}")
        return redirect(redirect_url)

    # Código fictício para o mock
    code = 'mock_auth_code'

    # Processar o callback usando o mesmo fluxo do callback real
    logger.info(f"Processando mock callback para provedor: {provider}")
    result = oauth_service.handle_callback(provider, code, state)

    if result['status'] == 'error':
        logger.error(
            f"Erro no processamento do mock callback: {result['message']}")
        encoded_message = urllib.parse.quote(result['message'])
        redirect_url = f"{OAUTH_FAILURE_REDIRECT}?error=authentication_failed&error_description={encoded_message}"
        logger.info(f"Redirecionando para: {redirect_url}")
        return redirect(redirect_url)

    # Se autenticação bem-sucedida, redirecionar para o frontend com tokens
    logger.info(
        "Autenticação mock OAuth bem-sucedida, redirecionando com tokens")
    access_token = result['tokens']['access_token']
    refresh_token = result['tokens']['refresh_token']

    # Redirecionar para o frontend com tokens na URL
    redirect_url = f"{OAUTH_SUCCESS_REDIRECT}?access_token={urllib.parse.quote(access_token)}&refresh_token={urllib.parse.quote(refresh_token)}"
    logger.info(f"Redirecionando para: {redirect_url}")
    return redirect(redirect_url)


@oauth_bp.route('/link/<provider>', methods=['POST'])
def link_account(provider):
    """
    Vincula uma conta de provedor social a um usuário existente.

    Args:
        provider (str): Nome do provedor (google, facebook, github)

    Returns:
        200 JSON: Resultado do processo de vinculação
        400 JSON: Erro se o provedor não estiver configurado ou for inválido
    """
    # Implementar na próxima fase
    return jsonify({
        'status': 'error',
        'message': 'Funcionalidade não implementada'
    }), 501


@oauth_bp.route('/unlink/<provider>', methods=['POST'])
def unlink_account(provider):
    """
    Desvincula uma conta de provedor social de um usuário.

    Args:
        provider (str): Nome do provedor (google, facebook, github)

    Returns:
        200 JSON: Resultado do processo de desvinculação
        400 JSON: Erro se o provedor não estiver configurado ou for inválido
    """
    # Implementar na próxima fase
    return jsonify({
        'status': 'error',
        'message': 'Funcionalidade não implementada'
    }), 501


@oauth_bp.route('/diagnostic', methods=['GET'])
def oauth_diagnostic():
    """
    Fornece informações de diagnóstico sobre a configuração OAuth.

    Returns:
        200 JSON: Informações de diagnóstico sobre a configuração OAuth.
    """
    logger.info("Solicitação de diagnóstico OAuth")

    try:
        diagnostic_info = {
            'blueprint_registered': True,
            'blueprint_url_prefix': oauth_bp.url_prefix,
            'blueprint_name': oauth_bp.name,
            'supported_providers': SUPPORTED_PROVIDERS,
            'configured_providers': {},
            'oauth_success_redirect': OAUTH_SUCCESS_REDIRECT,
            'oauth_failure_redirect': OAUTH_FAILURE_REDIRECT,
            'mock_enabled': ENABLE_MOCK_OAUTH,
            'session_enabled': bool(current_app.secret_key)
        }

        # Verificar provedores configurados
        for provider in SUPPORTED_PROVIDERS:
            is_configured = oauth_service.is_provider_configured(provider)
            diagnostic_info['configured_providers'][provider] = is_configured

        # Lista de rotas registradas neste blueprint
        routes = []
        for rule in current_app.url_map.iter_rules():
            if rule.endpoint.startswith('oauth.'):
                routes.append({
                    'route': str(rule),
                    'methods': list(rule.methods - {'HEAD', 'OPTIONS'}),
                    'endpoint': rule.endpoint
                })
        diagnostic_info['routes'] = routes

        return jsonify({
            'status': 'success',
            'diagnostic': diagnostic_info
        }), 200
    except Exception as e:
        logger.exception(f"Erro ao realizar diagnóstico OAuth: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Erro ao realizar diagnóstico: {str(e)}"
        }), 500
