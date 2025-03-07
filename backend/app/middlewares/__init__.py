"""
Pacote de middlewares para a aplicação AdamChat.
"""
from .auth import *

# Exporta os middlewares para facilitar a importação
__all__ = ['auth_required', 'admin_required']
