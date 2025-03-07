"""
Configuração dos provedores OAuth2 para autenticação social.

Este módulo contém as configurações necessárias para integração com provedores
de identidade social como Google, Facebook e GitHub.
"""
import os

# Definições de domínios padrão
BACKEND_DOMAIN = os.environ.get('BACKEND_DOMAIN', 'http://localhost:5000')
FRONTEND_DOMAIN = os.environ.get('FRONTEND_DOMAIN', 'http://localhost:3000')

# Configurações do Google OAuth2 (valores de exemplo para desenvolvimento)
GOOGLE_CLIENT_ID = os.environ.get(
    'GOOGLE_CLIENT_ID', '123456789-exemplo.apps.googleusercontent.com')
GOOGLE_CLIENT_SECRET = os.environ.get(
    'GOOGLE_CLIENT_SECRET', 'google-client-secret-example')
GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid-configuration'
GOOGLE_AUTH_URI = 'https://accounts.google.com/o/oauth2/auth'
GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token'
GOOGLE_USER_INFO = 'https://www.googleapis.com/oauth2/v3/userinfo'

# Configurações do Facebook OAuth2 (valores de exemplo para desenvolvimento)
FACEBOOK_CLIENT_ID = os.environ.get('FACEBOOK_CLIENT_ID', '123456789012345')
FACEBOOK_CLIENT_SECRET = os.environ.get(
    'FACEBOOK_CLIENT_SECRET', 'facebook-app-secret-example')
FACEBOOK_AUTH_URI = 'https://www.facebook.com/v16.0/dialog/oauth'
FACEBOOK_TOKEN_URI = 'https://graph.facebook.com/v16.0/oauth/access_token'
FACEBOOK_USER_INFO = 'https://graph.facebook.com/me?fields=id,name,email,picture.type(large)'

# Configurações do GitHub OAuth2 (valores de exemplo para desenvolvimento)
GITHUB_CLIENT_ID = os.environ.get(
    'GITHUB_CLIENT_ID', 'github-client-id-example')
GITHUB_CLIENT_SECRET = os.environ.get(
    'GITHUB_CLIENT_SECRET', 'github-client-secret-example')
GITHUB_AUTH_URI = 'https://github.com/login/oauth/authorize'
GITHUB_TOKEN_URI = 'https://github.com/login/oauth/access_token'
GITHUB_USER_INFO = 'https://api.github.com/user'

# URLs de redirecionamento - usando os domínios definidos acima
OAUTH_REDIRECT_URI = os.environ.get(
    'OAUTH_REDIRECT_URI', f'{BACKEND_DOMAIN}/api/auth/oauth/callback')

# Lista de URLs de redirecionamento de sucesso (para flexibilidade)
SUCCESS_REDIRECT_PATHS = [
    '/callback',
    '/auth/callback',
    '/oauth/callback',
    '/dashboard?login_success=true'
]
OAUTH_SUCCESS_REDIRECT = os.environ.get(
    'OAUTH_SUCCESS_REDIRECT', f'{FRONTEND_DOMAIN}/callback')

# Lista de URLs de redirecionamento de falha (para flexibilidade)
FAILURE_REDIRECT_PATHS = [
    '/login?error=auth_failed',
    '/login'
]
OAUTH_FAILURE_REDIRECT = os.environ.get(
    'OAUTH_FAILURE_REDIRECT', f'{FRONTEND_DOMAIN}/login?error=auth_failed')

# Lista de provedores suportados
SUPPORTED_PROVIDERS = ['google', 'facebook', 'github']

# Escopo padrão para cada provedor
PROVIDER_SCOPES = {
    'google': 'openid email profile',
    'facebook': 'email',
    'github': 'user:email'
}

# Ative/desative os provedores para desenvolvimento
ENABLE_MOCK_OAUTH = os.environ.get(
    'ENABLE_MOCK_OAUTH', 'true').lower() == 'true'
