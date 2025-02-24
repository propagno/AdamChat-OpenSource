from flask import Blueprint, request, jsonify

agent_bp = Blueprint("agent_bp", __name__, url_prefix='/agent')

@agent_bp.route('/create', methods=['POST'])
def create_agent():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados inválidos"}), 400
    nome = data.get('nome')
    configuracoes = data.get('configuracoes')
    print(f"Criando agent: {nome}")
    return jsonify({"message": "Agent criado com sucesso"}), 201
