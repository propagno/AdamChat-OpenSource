"""
Configurações da aplicação AdamChat.
"""
import os


class Config:
    """Configuração base"""
    SECRET_KEY = os.environ.get(
        'SECRET_KEY', 'adamchat_secure_key_change_in_production')
    DEBUG = False
    TESTING = False
    MONGO_URI = os.environ.get(
        'MONGO_URI', 'mongodb://localhost:27017/adamchat')
    JWT_SECRET_KEY = os.environ.get(
        'JWT_SECRET_KEY', 'adamchat_jwt_secret_key_change_in_production')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get(
        'JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hora
    JWT_REFRESH_TOKEN_EXPIRES = int(os.environ.get(
        'JWT_REFRESH_TOKEN_EXPIRES', 2592000))  # 30 dias
    MAINTENANCE_MODE = os.environ.get(
        'MAINTENANCE_MODE', 'false').lower() == 'true'
    EMERGENCY_MODE = os.environ.get(
        'EMERGENCY_MODE', 'false').lower() == 'true'
    EMERGENCY_TOKEN = os.environ.get(
        'EMERGENCY_TOKEN', 'emergency_token_change_in_production')


class DevelopmentConfig(Config):
    """Configuração de desenvolvimento"""
    DEBUG = True
    TESTING = False


class TestingConfig(Config):
    """Configuração de testes"""
    DEBUG = True
    TESTING = True
    MONGO_URI = os.environ.get(
        'MONGO_URI', 'mongodb://localhost:27017/adamchat_test')


class ProductionConfig(Config):
    """Configuração de produção"""
    DEBUG = False
    TESTING = False


# Mapeamento de configurações
config_map = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


def get_config(config_name='default'):
    """
    Retorna a configuração apropriada com base no nome

    Args:
        config_name (str): Nome da configuração (development, testing, production)

    Returns:
        Config: Classe de configuração
    """
    return config_map.get(config_name, config_map['default'])
