"""
Inicialização do módulo de esquemas.
Este arquivo contém a inicialização para os esquemas utilizados na documentação da API.
"""

from app.schemas.common_schema import *
from app.schemas.payment_schema import *
from app.schemas.error_schema import *
from app.schemas.auth_schema import *
from app.schemas.user_schema import *
from flask_marshmallow import Marshmallow

# Inicialização do Marshmallow
ma = Marshmallow()

# Importação dos esquemas
