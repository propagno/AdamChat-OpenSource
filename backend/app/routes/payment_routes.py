from flask import Blueprint, request, jsonify

payment_bp = Blueprint("payment_bp", __name__, url_prefix='/payment')

@payment_bp.route('/webhook', methods=['POST'])
def payment_webhook():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados do pagamento não recebidos"}), 400
    atualizar_plano_usuario(data)
    return jsonify({"message": "Pagamento confirmado e plano atualizado"}), 200

def atualizar_plano_usuario(data):
    print("Atualizando plano do usuário com os dados:", data)
