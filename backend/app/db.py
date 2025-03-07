# Compatibilidade para importações legadas
from app.config.database import get_db
from app.extensions import db

# Função para inicializar o banco de dados


def init_db(app):
    """
    Inicializa o banco de dados com a aplicação Flask

    Args:
        app: Aplicação Flask
    """
    db.init_app(app)


# Exportar db para que possa ser importado de app.db
__all__ = ['get_db', 'db', 'init_db']
