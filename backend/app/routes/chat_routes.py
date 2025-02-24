from flask import Blueprint, request, jsonify

chat_bp = Blueprint("chat_bp", __name__, url_prefix='/chat')

@chat_bp.route('/send', methods=['POST'])
def send_message():
    data = request.get_json()
    if not data or not data.get('message'):
        return jsonify({"error": "Dados inválidos"}), 400
    message = data.get('message')
    resposta = process_message(message)
    return jsonify({"response": resposta}), 200

def process_message(message):
    if not isinstance(message, str):
        return "Mensagem inválida"
    return f"Recebido: {message}"
