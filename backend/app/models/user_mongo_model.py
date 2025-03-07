from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
import os
from datetime import datetime
import bcrypt
import json

# Configuração da conexão com MongoDB


def get_mongo_client():
    # Tentar usar variável de ambiente, caso contrário usar o padrão
    uri = os.environ.get("MONGODB_URI", "mongodb://mongodb:27017/adamchat")
    return MongoClient(uri)


def get_users_collection():
    client = get_mongo_client()
    db = client.get_default_database()

    # Garantir que a coleção de usuários tenha os índices corretos
    if 'users' not in db.list_collection_names():
        users = db.users
        # Criar índices únicos para email e username
        users.create_index([("email", 1)], unique=True)
        users.create_index([("username", 1)], unique=True)
    else:
        users = db.users

    return users


class MongoUser:
    """
    Modelo de usuário para MongoDB
    """

    @staticmethod
    def hash_password(password):
        """
        Cria um hash seguro da senha
        """
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    @staticmethod
    def check_password(hashed_password, password):
        """
        Verifica se a senha corresponde ao hash
        """
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

    @staticmethod
    def create_user(email, password, name=None, username=None):
        """
        Cria um novo usuário
        """
        if not username:
            username = email.split('@')[0]

        users = get_users_collection()

        # Verificar se o email ou username já existem
        if users.find_one({"email": email}):
            return {"success": False, "message": "Email já cadastrado"}

        if users.find_one({"username": username}):
            return {"success": False, "message": "Nome de usuário já cadastrado"}

        # Criar o documento do usuário
        user_doc = {
            "email": email,
            "username": username,
            "name": name or username,
            "password_hash": MongoUser.hash_password(password),
            "subscription_level": "free",
            "theme": "light",
            "language": "pt-BR",
            "is_active": True,
            "is_confirmed": False,
            "is_admin": False,
            "preferences": json.dumps({}),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        try:
            result = users.insert_one(user_doc)
            user_doc["_id"] = str(result.inserted_id)

            # Remover campos sensíveis
            if "password_hash" in user_doc:
                del user_doc["password_hash"]

            return {"success": True, "user": user_doc}
        except DuplicateKeyError:
            return {"success": False, "message": "Usuário já existe"}
        except Exception as e:
            return {"success": False, "message": f"Erro ao criar usuário: {str(e)}"}

    @staticmethod
    def authenticate(email, password):
        """
        Autentica um usuário com email e senha
        """
        users = get_users_collection()
        user = users.find_one({"email": email})

        if not user:
            return {"success": False, "message": "Usuário não encontrado"}

        if not MongoUser.check_password(user["password_hash"], password):
            return {"success": False, "message": "Senha incorreta"}

        # Atualizar último login
        users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )

        # Preparar dados do usuário para retorno (sem a senha)
        user_data = {**user}
        del user_data["password_hash"]
        # Converter ObjectId para string
        user_data["_id"] = str(user_data["_id"])

        return {
            "success": True,
            "user": user_data,
            # Na prática, aqui você geraria um token JWT
            "token": str(user_data["_id"])
        }

    @staticmethod
    def get_user_by_id(user_id):
        """
        Busca um usuário pelo ID
        """
        users = get_users_collection()

        try:
            from bson.objectid import ObjectId
            user = users.find_one({"_id": ObjectId(user_id)})

            if user:
                user["_id"] = str(user["_id"])
                if "password_hash" in user:
                    del user["password_hash"]
                return {"success": True, "user": user}
            else:
                return {"success": False, "message": "Usuário não encontrado"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    @staticmethod
    def get_user_by_email(email):
        """
        Busca um usuário pelo email
        """
        users = get_users_collection()
        user = users.find_one({"email": email})

        if user:
            user["_id"] = str(user["_id"])
            if "password_hash" in user:
                del user["password_hash"]
            return {"success": True, "user": user}
        else:
            return {"success": False, "message": "Usuário não encontrado"}
