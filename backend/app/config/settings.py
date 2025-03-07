from decouple import config


class Config:
    SECRET_KEY = config('SECRET_KEY', default='sua-chave-secreta')
    LOG_LEVEL = config('LOG_LEVEL', default='INFO')
    MONGODB_URI = config(
        'MONGODB_URI', default='mongodb://mongodb:27017/adamchat')

    # Configuração SQLAlchemy
    SQLALCHEMY_DATABASE_URI = config(
        'SQLALCHEMY_DATABASE_URI',
        default='sqlite:////tmp/app.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
