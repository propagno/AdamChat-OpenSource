from flask import Blueprint, request, jsonify

gpt_bp = Blueprint("gpt_bp", __name__, url_prefix='/gpt')

@gpt_bp.route('/create', methods=['POST'])
def create_gpt():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados inválidos"}), 400
    version = data.get('version')
    parametros = data.get('parametros')
    print(f"Criando GPT: versão {version}")
    return jsonify({"message": "Configuração de GPT criada com sucesso"}), 201
