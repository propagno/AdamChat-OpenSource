from flask import Blueprint, request, jsonify
from app.services.auth_service import register_user, validate_user

auth_bp = Blueprint("auth_bp", __name__, url_prefix='/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Endpoint para registro de novo usuário.
    Exemplo de payload:
    {
      "nome": "João Silva",
      "email": "joao@example.com",
      "senha": "senha123"
    }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados inválidos"}), 400

    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')

    if not nome or not email or not senha:
        return jsonify({"error": "Todos os campos são obrigatórios"}), 400

    user, error = register_user(nome, email, senha)
    if error:
        return jsonify({"error": error}), 400

    return jsonify({"message": "Usuário criado com sucesso", "user": user}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint para login do usuário.
    Exemplo de payload:
    {
      "email": "joao@example.com",
      "senha": "senha123"
    }
    """
    data = request.get_json() or request.form
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({"error": "Email e senha são obrigatórios"}), 400

    user = validate_user(email, senha)
    if user:
        # Aqui você pode gerar um token JWT para o usuário. Exemplo:
        # token = generate_jwt(user)  (Função a ser implementada)
        return jsonify({"message": "Login efetuado com sucesso", "user": user}), 200

    return jsonify({"error": "Credenciais inválidas"}), 401
