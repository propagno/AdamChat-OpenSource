from pymongo import MongoClient
from decouple import config
from werkzeug.security import generate_password_hash, check_password_hash

# Obter a URI do MongoDB a partir das variáveis de ambiente
MONGODB_URI = config(
    'MONGODB_URI', default='mongodb://localhost:27017/adamchat')

# Cria uma conexão com o MongoDB
client = MongoClient(MONGODB_URI)
# Seleciona o banco de dados (pode ser o banco definido na URI ou um nome específico)
db = client.get_default_database()  # ou: db = client['adamchat']


def register_user(nome, email, senha):
    users_collection = db.users
    if users_collection.find_one({'email': email}):
        return None, "Usuário já existe"
    # Força o uso do algoritmo 'pbkdf2:sha256'
    hashed_password = generate_password_hash(senha, method="pbkdf2:sha256")
    user = {
        'nome': nome,
        'email': email,
        'senha': hashed_password
    }
    result = users_collection.insert_one(user)
    user['_id'] = str(result.inserted_id)
    return user, None


def validate_user(email, senha):
    users_collection = db.users
    user = users_collection.find_one({'email': email})
    if user and check_password_hash(user['senha'], senha):
        return user
    return None
