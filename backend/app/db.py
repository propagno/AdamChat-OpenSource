from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()  # Carrega as variáveis do .env


def get_db():
    # Tente usar a variável de ambiente, caso contrário, use "mongodb"
    uri = os.environ.get("MONGODB_URI", "mongodb://mongodb:27017/adamchat")
    client = MongoClient(uri)
    db = client.get_default_database()
    return db
