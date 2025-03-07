"""
Módulo de configuração da aplicação
"""
from .settings import *
from .database import *

# Exporta as configurações para facilitar a importação
__all__ = ['get_config', 'init_db', 'get_db']
