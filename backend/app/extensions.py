from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Inicializa as extensões sem vincular a um app específico
# Elas serão inicializadas com o app na função create_app()
db = SQLAlchemy()
migrate = Migrate()
socketio = SocketIO()
jwt = JWTManager()
