from flask import Blueprint, request, jsonify
from app.services.auth_service import validate_user

auth_bp = Blueprint("auth_bp", __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or request.form
    username = data.get('username')
    password = data.get('password')
    if validate_user(username, password):
        return jsonify({"message": "Login efetuado com sucesso", "token": "jwt-token-exemplo"}), 200
    return jsonify({"error": "Credenciais inválidas"}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados inválidos"}), 400
    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')
    # Validação e verificação de duplicidade aqui
    print(f"Cadastrando usuário: {nome}, {email}")
    return jsonify({"message": "Usuário criado com sucesso"}), 201

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados inválidos"}), 400
    email = data.get('email')
    nova_senha = data.get('nova_senha')
    # Validação do token e atualização da senha
    print(f"Redefinindo senha para: {email}")
    return jsonify({"message": "Senha redefinida com sucesso"}), 200
