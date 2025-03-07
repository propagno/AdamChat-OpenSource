# backend/app/routes/upload_routes.py
from flask import Blueprint, request, jsonify, current_app, send_file
from app.db import get_db
from bson import ObjectId
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import uuid
import mimetypes
from functools import wraps

upload_bp = Blueprint("upload_bp", __name__)

# Configurações para upload
ALLOWED_FILE_EXTENSIONS = {'pdf', 'doc', 'docx',
                           'txt', 'csv', 'xls', 'xlsx', 'json', 'xml'}
ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'}
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB limite

# Configurar diretório de upload
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
FILE_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, 'files')
IMAGE_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, 'images')

# Criar diretórios se não existirem
os.makedirs(FILE_UPLOAD_FOLDER, exist_ok=True)
os.makedirs(IMAGE_UPLOAD_FOLDER, exist_ok=True)


def validate_request_data(f):
    """Decorator para validar dados da requisição"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not request.files:
            return jsonify({"error": "Nenhum arquivo enviado."}), 400

        return f(*args, **kwargs)
    return decorated


def allowed_file(filename, allowed_extensions):
    """Verifica se o arquivo tem uma extensão permitida"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def format_upload(upload):
    """Formata um registro de upload para retorno na API"""
    if upload and '_id' in upload:
        upload['id'] = str(upload['_id'])
        del upload['_id']
    return upload


@upload_bp.route("/uploads/files", methods=["POST"])
@validate_request_data
def upload_file():
    """
    Realiza upload de um arquivo.

    ---
    tags:
      - Uploads
    parameters:
      - name: file
        in: formData
        type: file
        required: true
        description: Arquivo para upload
      - name: user_id
        in: formData
        type: string
        required: true
        description: ID do usuário
      - name: conversation_id
        in: formData
        type: string
        required: false
        description: ID da conversa a associar o arquivo (opcional)
    responses:
      201:
        description: Arquivo enviado com sucesso
      400:
        description: Erro de validação ou arquivo não permitido
    """
    if 'file' not in request.files:
        return jsonify({"error": "Campo 'file' não encontrado na requisição."}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Nenhum arquivo selecionado."}), 400

    user_id = request.form.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id é obrigatório."}), 400

    conversation_id = request.form.get('conversation_id')

    # Verificar se o arquivo tem uma extensão permitida
    if not allowed_file(file.filename, ALLOWED_FILE_EXTENSIONS):
        return jsonify({
            "error": f"Tipo de arquivo não permitido. Extensões permitidas: {', '.join(ALLOWED_FILE_EXTENSIONS)}"
        }), 400

    # Gerar um nome único para o arquivo
    original_filename = secure_filename(file.filename)
    file_extension = original_filename.rsplit(
        '.', 1)[1].lower() if '.' in original_filename else ''
    unique_filename = f"{uuid.uuid4().hex}.{file_extension}" if file_extension else f"{uuid.uuid4().hex}"
    file_path = os.path.join(FILE_UPLOAD_FOLDER, unique_filename)

    # Salvar o arquivo
    file.save(file_path)

    # Registrar no banco de dados
    db = get_db()
    upload_record = {
        "user_id": user_id,
        "original_filename": original_filename,
        "filename": unique_filename,
        "file_path": file_path,
        "file_type": file.content_type or mimetypes.guess_type(original_filename)[0],
        "file_size": os.path.getsize(file_path),
        "upload_type": "file",
        "created_at": datetime.utcnow().isoformat(),
        "conversation_id": conversation_id
    }

    result = db.uploads.insert_one(upload_record)

    # Se a conversa foi especificada, adicionar referência do arquivo à conversa
    if conversation_id:
        try:
            file_reference = {
                "file_id": str(result.inserted_id),
                "original_filename": original_filename,
                "upload_type": "file",
                "added_at": datetime.utcnow().isoformat()
            }

            db.conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {"$push": {"files": file_reference}}
            )
        except Exception as e:
            current_app.logger.error(
                f"Erro ao associar arquivo à conversa: {str(e)}")

    # Retornar informações sobre o upload
    upload = format_upload(upload_record)
    upload["id"] = str(result.inserted_id)

    return jsonify(upload), 201


@upload_bp.route("/uploads/images", methods=["POST"])
@validate_request_data
def upload_image():
    """
    Realiza upload de uma imagem.

    ---
    tags:
      - Uploads
    parameters:
      - name: image
        in: formData
        type: file
        required: true
        description: Imagem para upload
      - name: user_id
        in: formData
        type: string
        required: true
        description: ID do usuário
      - name: conversation_id
        in: formData
        type: string
        required: false
        description: ID da conversa a associar a imagem (opcional)
    responses:
      201:
        description: Imagem enviada com sucesso
      400:
        description: Erro de validação ou tipo de imagem não permitido
    """
    if 'image' not in request.files:
        return jsonify({"error": "Campo 'image' não encontrado na requisição."}), 400

    image = request.files['image']
    if image.filename == '':
        return jsonify({"error": "Nenhuma imagem selecionada."}), 400

    user_id = request.form.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id é obrigatório."}), 400

    conversation_id = request.form.get('conversation_id')

    # Verificar se a imagem tem uma extensão permitida
    if not allowed_file(image.filename, ALLOWED_IMAGE_EXTENSIONS):
        return jsonify({
            "error": f"Tipo de imagem não permitido. Extensões permitidas: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        }), 400

    # Gerar um nome único para a imagem
    original_filename = secure_filename(image.filename)
    file_extension = original_filename.rsplit(
        '.', 1)[1].lower() if '.' in original_filename else ''
    unique_filename = f"{uuid.uuid4().hex}.{file_extension}" if file_extension else f"{uuid.uuid4().hex}"
    file_path = os.path.join(IMAGE_UPLOAD_FOLDER, unique_filename)

    # Salvar a imagem
    image.save(file_path)

    # Registrar no banco de dados
    db = get_db()
    upload_record = {
        "user_id": user_id,
        "original_filename": original_filename,
        "filename": unique_filename,
        "file_path": file_path,
        "file_type": image.content_type or mimetypes.guess_type(original_filename)[0],
        "file_size": os.path.getsize(file_path),
        "upload_type": "image",
        "created_at": datetime.utcnow().isoformat(),
        "conversation_id": conversation_id
    }

    result = db.uploads.insert_one(upload_record)

    # Se a conversa foi especificada, adicionar referência da imagem à conversa
    if conversation_id:
        try:
            image_reference = {
                "file_id": str(result.inserted_id),
                "original_filename": original_filename,
                "upload_type": "image",
                "added_at": datetime.utcnow().isoformat()
            }

            db.conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {"$push": {"files": image_reference}}
            )
        except Exception as e:
            current_app.logger.error(
                f"Erro ao associar imagem à conversa: {str(e)}")

    # Retornar informações sobre o upload
    upload = format_upload(upload_record)
    upload["id"] = str(result.inserted_id)

    return jsonify(upload), 201


@upload_bp.route("/uploads", methods=["GET"])
def list_uploads():
    """
    Lista todos os uploads do usuário.

    ---
    tags:
      - Uploads
    parameters:
      - name: user_id
        in: query
        type: string
        required: true
        description: ID do usuário
      - name: upload_type
        in: query
        type: string
        required: false
        description: Tipo de upload (file, image)
      - name: conversation_id
        in: query
        type: string
        required: false
        description: ID da conversa para filtrar uploads específicos
      - name: limit
        in: query
        type: integer
        required: false
        description: Limite de uploads a retornar (padrão 20)
      - name: offset
        in: query
        type: integer
        required: false
        description: Offset para paginação
    responses:
      200:
        description: Lista de uploads
      400:
        description: Erro de validação
    """
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id é obrigatório."}), 400

    upload_type = request.args.get("upload_type")
    conversation_id = request.args.get("conversation_id")
    limit = int(request.args.get("limit", 20))
    offset = int(request.args.get("offset", 0))

    # Construir o filtro
    filter_query = {"user_id": user_id}
    if upload_type:
        filter_query["upload_type"] = upload_type
    if conversation_id:
        filter_query["conversation_id"] = conversation_id

    db = get_db()
    uploads = list(db.uploads.find(filter_query).sort(
        "created_at", -1).skip(offset).limit(limit))

    # Formatar os resultados
    formatted_uploads = []
    for upload in uploads:
        formatted_uploads.append(format_upload(upload))

    return jsonify({"uploads": formatted_uploads, "total": len(formatted_uploads)}), 200


@upload_bp.route("/uploads/<upload_id>", methods=["GET"])
def get_upload(upload_id):
    """
    Obtém detalhes de um upload específico.

    ---
    tags:
      - Uploads
    parameters:
      - name: upload_id
        in: path
        type: string
        required: true
        description: ID do upload
    responses:
      200:
        description: Detalhes do upload
      404:
        description: Upload não encontrado
    """
    try:
        db = get_db()
        upload = db.uploads.find_one({"_id": ObjectId(upload_id)})

        if not upload:
            return jsonify({"error": "Upload não encontrado."}), 404

        return jsonify(format_upload(upload)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@upload_bp.route("/uploads/<upload_id>/download", methods=["GET"])
def download_upload(upload_id):
    """
    Faz o download de um arquivo ou imagem.

    ---
    tags:
      - Uploads
    parameters:
      - name: upload_id
        in: path
        type: string
        required: true
        description: ID do upload
    responses:
      200:
        description: Arquivo para download
      404:
        description: Upload não encontrado
    """
    try:
        db = get_db()
        upload = db.uploads.find_one({"_id": ObjectId(upload_id)})

        if not upload:
            return jsonify({"error": "Upload não encontrado."}), 404

        file_path = upload.get("file_path")
        if not os.path.exists(file_path):
            return jsonify({"error": "Arquivo não encontrado no servidor."}), 404

        return send_file(
            file_path,
            download_name=upload.get("original_filename"),
            as_attachment=True,
            mimetype=upload.get("file_type")
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@upload_bp.route("/uploads/<upload_id>", methods=["DELETE"])
def delete_upload(upload_id):
    """
    Exclui um upload.

    ---
    tags:
      - Uploads
    parameters:
      - name: upload_id
        in: path
        type: string
        required: true
        description: ID do upload
    responses:
      200:
        description: Upload excluído com sucesso
      404:
        description: Upload não encontrado
    """
    try:
        db = get_db()
        upload = db.uploads.find_one({"_id": ObjectId(upload_id)})

        if not upload:
            return jsonify({"error": "Upload não encontrado."}), 404

        # Excluir o arquivo do sistema de arquivos
        file_path = upload.get("file_path")
        if os.path.exists(file_path):
            os.remove(file_path)

        # Remover referência do arquivo nas conversas
        conversation_id = upload.get("conversation_id")
        if conversation_id:
            db.conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {"$pull": {"files": {"file_id": upload_id}}}
            )

        # Excluir o registro do banco
        db.uploads.delete_one({"_id": ObjectId(upload_id)})

        return jsonify({"message": "Upload excluído com sucesso."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@upload_bp.route("/conversations/<conversation_id>/uploads", methods=["GET"])
def list_conversation_uploads(conversation_id):
    """
    Lista todos os uploads associados a uma conversa.

    ---
    tags:
      - Uploads
    parameters:
      - name: conversation_id
        in: path
        type: string
        required: true
        description: ID da conversa
    responses:
      200:
        description: Lista de uploads da conversa
      404:
        description: Conversa não encontrada
    """
    try:
        db = get_db()
        conversation = db.conversations.find_one(
            {"_id": ObjectId(conversation_id)})

        if not conversation:
            return jsonify({"error": "Conversa não encontrada."}), 404

        # Recuperar os uploads associados à conversa
        uploads = list(db.uploads.find({"conversation_id": conversation_id}))

        # Formatar os resultados
        formatted_uploads = []
        for upload in uploads:
            formatted_uploads.append(format_upload(upload))

        return jsonify({"uploads": formatted_uploads}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
