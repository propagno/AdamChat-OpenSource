from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import uuid
import boto3
from botocore.exceptions import NoCredentialsError
from werkzeug.utils import secure_filename
import mimetypes
from datetime import datetime, timedelta
from app.models.user import User
from app.models.storage import StorageItem
from app.utils.token_manager import consume_tokens
from app.extensions import db
import logging

storage_bp = Blueprint('storage', __name__)
logger = logging.getLogger(__name__)

# Constantes para o sistema de armazenamento
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'webm', 'webp'}
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
LOCAL_UPLOAD_FOLDER = os.path.join(os.path.dirname(
    os.path.dirname(__file__)), 'static', 'uploads')

# Garantir que a pasta de uploads local exista
if not os.path.exists(LOCAL_UPLOAD_FOLDER):
    os.makedirs(LOCAL_UPLOAD_FOLDER)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def generate_presigned_url(object_name, expiration=3600):
    """Gera uma URL pré-assinada para o S3"""
    # Verificamos se o S3 está habilitado dentro da função
    if not current_app.config.get('USE_S3', False):
        return None

    # Inicializamos o cliente S3 se necessário
    s3_client = boto3.client(
        's3',
        region_name=current_app.config.get('S3_REGION'),
        aws_access_key_id=current_app.config.get('AWS_ACCESS_KEY'),
        aws_secret_access_key=current_app.config.get('AWS_SECRET_KEY')
    )

    try:
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': current_app.config.get('S3_BUCKET'),
                'Key': object_name
            },
            ExpiresIn=expiration
        )
        return response
    except Exception as e:
        logger.error(f"Erro ao gerar URL pré-assinada: {str(e)}")
        return None


@storage_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """
    Endpoint para upload de arquivos
    ---
    Requer autenticação JWT
    Suporta arquivos de imagem e vídeo
    Retorna informações do arquivo armazenado
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404

    # Verifica se o arquivo foi incluído na requisição
    if 'file' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Nenhum arquivo selecionado"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": f"Tipo de arquivo não permitido. Use apenas: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    # Valida tamanho do arquivo
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reposiciona o ponteiro do arquivo para o início

    if file_size > MAX_CONTENT_LENGTH:
        return jsonify({"error": f"Arquivo muito grande. Tamanho máximo: {MAX_CONTENT_LENGTH/(1024*1024)}MB"}), 400

    # Cria um nome de arquivo único
    file_extension = file.filename.rsplit('.', 1)[1].lower()
    safe_filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{safe_filename}"

    # Determina o tipo de conteúdo (imagem ou vídeo)
    mime_type = mimetypes.guess_type(file.filename)[0]
    if mime_type:
        content_type = mime_type.split('/')[0]  # 'image' ou 'video'
    else:
        content_type = 'unknown'

    # Metadados adicionais da requisição
    metadata = request.form.get('metadata', '{}')

    storage_path = None
    public_url = None

    try:
        # Armazenamento no S3 se habilitado
        if current_app.config.get('USE_S3', False):
            # Inicializa o cliente S3
            s3_client = boto3.client(
                's3',
                region_name=current_app.config.get('S3_REGION'),
                aws_access_key_id=current_app.config.get('AWS_ACCESS_KEY'),
                aws_secret_access_key=current_app.config.get('AWS_SECRET_KEY')
            )

            # Upload para o S3
            s3_client.upload_fileobj(
                file,
                current_app.config.get('S3_BUCKET'),
                unique_filename,
                ExtraArgs={
                    'ContentType': mime_type,
                    'ACL': 'private'  # Armazenamento privado
                }
            )

            storage_path = f"s3://{current_app.config.get('S3_BUCKET')}/{unique_filename}"
            public_url = generate_presigned_url(unique_filename)
        else:
            # Armazenamento local
            local_path = os.path.join(LOCAL_UPLOAD_FOLDER, unique_filename)
            file.save(local_path)
            storage_path = local_path
            public_url = f"/api/storage/file/{unique_filename}"

        # Criar registro no banco de dados
        storage_item = StorageItem(
            filename=safe_filename,
            storage_path=storage_path,
            public_url=public_url,
            content_type=content_type,
            size_bytes=file_size,
            file_metadata=metadata,
            user_id=user_id
        )

        db.session.add(storage_item)
        db.session.commit()

        # Consumir tokens se necessário (opcional)
        if request.form.get('consume_tokens') == 'true':
            token_cost = int(request.form.get('token_cost', 0))
            if token_cost > 0:
                consume_tokens(user_id, token_cost,
                               f"Upload de {content_type}")

        return jsonify({
            "message": "Arquivo enviado com sucesso",
            "storage_id": storage_item.id,
            "filename": storage_item.filename,
            "url": public_url,
            "content_type": content_type,
            "size_bytes": file_size
        }), 201

    except Exception as e:
        logger.error(f"Erro ao fazer upload do arquivo: {str(e)}")
        return jsonify({"error": f"Erro ao fazer upload: {str(e)}"}), 500


@storage_bp.route('/file/<filename>', methods=['GET'])
def get_file(filename):
    """
    Endpoint para acessar arquivos armazenados localmente
    ---
    Retorna o arquivo solicitado
    Usado apenas quando o S3 não está habilitado
    """
    if USE_S3:
        return jsonify({"error": "Este endpoint não está disponível quando o S3 está habilitado"}), 404

    return send_from_directory(LOCAL_UPLOAD_FOLDER, filename)


@storage_bp.route('/items', methods=['GET'])
@jwt_required()
def list_user_items():
    """
    Lista os arquivos do usuário
    ---
    Requer autenticação JWT
    Retorna lista de arquivos e suas informações
    """
    user_id = get_jwt_identity()

    try:
        # Paginação
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        # Filtros
        content_type = request.args.get('content_type')

        # Query base
        query = StorageItem.query.filter_by(user_id=user_id, deleted=False)

        # Aplicar filtros se presentes
        if content_type:
            query = query.filter_by(content_type=content_type)

        # Ordenação por data de criação (mais recente primeiro)
        query = query.order_by(StorageItem.created_at.desc())

        # Executar query paginada
        pagination = query.paginate(page=page, per_page=per_page)

        # Processar resultados
        items = []
        for item in pagination.items:
            # Renovar URL pré-assinada se necessário
            url = item.public_url
            if USE_S3 and item.storage_path.startswith('s3://'):
                # Extrair o nome do objeto do caminho de armazenamento
                object_name = item.storage_path.replace(
                    f"s3://{S3_BUCKET}/", "")
                url = generate_presigned_url(object_name)

            items.append({
                "id": item.id,
                "filename": item.filename,
                "url": url,
                "content_type": item.content_type,
                "size_bytes": item.size_bytes,
                "file_metadata": item.file_metadata,
                "created_at": item.created_at.isoformat()
            })

        return jsonify({
            "items": items,
            "total": pagination.total,
            "pages": pagination.pages,
            "current_page": page
        }), 200

    except Exception as e:
        logger.error(f"Erro ao listar arquivos: {str(e)}")
        return jsonify({"error": f"Erro ao listar arquivos: {str(e)}"}), 500


@storage_bp.route('/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    """
    Exclui um arquivo
    ---
    Requer autenticação JWT
    Suporta exclusão lógica ou física
    """
    user_id = get_jwt_identity()

    try:
        item = StorageItem.query.filter_by(id=item_id, user_id=user_id).first()

        if not item:
            return jsonify({"error": "Arquivo não encontrado ou não pertence ao usuário"}), 404

        # Tipo de exclusão (lógica por padrão)
        physical_delete = request.args.get(
            'physical', 'false').lower() == 'true'

        if physical_delete:
            # Exclusão física do arquivo
            if USE_S3 and item.storage_path.startswith('s3://'):
                # Extrai o nome do objeto do S3
                object_name = item.storage_path.replace(
                    f"s3://{S3_BUCKET}/", "")

                # Exclui o objeto do S3
                s3_client.delete_object(
                    Bucket=S3_BUCKET,
                    Key=object_name
                )
            else:
                # Exclusão local
                local_path = item.storage_path
                if os.path.exists(local_path):
                    os.remove(local_path)

            # Exclui registro do banco
            db.session.delete(item)
        else:
            # Exclusão lógica (marcação como excluído)
            item.deleted = True
            item.deleted_at = datetime.utcnow()

        db.session.commit()

        return jsonify({"message": "Arquivo excluído com sucesso"}), 200

    except Exception as e:
        logger.error(f"Erro ao excluir arquivo: {str(e)}")
        return jsonify({"error": f"Erro ao excluir arquivo: {str(e)}"}), 500


@storage_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def storage_dashboard():
    """
    Fornece um resumo do armazenamento do usuário
    ---
    Requer autenticação JWT
    Retorna estatísticas de uso de armazenamento
    """
    user_id = get_jwt_identity()

    try:
        # Contagem total de arquivos
        total_files = StorageItem.query.filter_by(
            user_id=user_id, deleted=False).count()

        # Uso total de armazenamento em bytes
        storage_usage = db.session.query(db.func.sum(StorageItem.size_bytes))\
            .filter_by(user_id=user_id, deleted=False).scalar() or 0

        # Contagem por tipo de conteúdo
        content_types = db.session.query(
            StorageItem.content_type,
            db.func.count(StorageItem.id),
            db.func.sum(StorageItem.size_bytes)
        ).filter_by(user_id=user_id, deleted=False)\
            .group_by(StorageItem.content_type).all()

        # Arquivos recentes
        recent_files = StorageItem.query.filter_by(user_id=user_id, deleted=False)\
            .order_by(StorageItem.created_at.desc()).limit(5).all()

        recent_files_data = []
        for item in recent_files:
            # Renovar URL pré-assinada se necessário
            url = item.public_url
            if USE_S3 and item.storage_path.startswith('s3://'):
                object_name = item.storage_path.replace(
                    f"s3://{S3_BUCKET}/", "")
                url = generate_presigned_url(object_name)

            recent_files_data.append({
                "id": item.id,
                "filename": item.filename,
                "url": url,
                "content_type": item.content_type,
                "size_bytes": item.size_bytes,
                "created_at": item.created_at.isoformat()
            })

        # Preparar resultado por tipo de conteúdo
        type_stats = []
        for content_type, count, size in content_types:
            type_stats.append({
                "content_type": content_type,
                "count": count,
                "size_bytes": size
            })

        return jsonify({
            "total_files": total_files,
            "storage_usage_bytes": storage_usage,
            "storage_usage_mb": round(storage_usage / (1024 * 1024), 2),
            "type_stats": type_stats,
            "recent_files": recent_files_data
        }), 200

    except Exception as e:
        logger.error(f"Erro ao gerar estatísticas de armazenamento: {str(e)}")
        return jsonify({"error": f"Erro ao gerar estatísticas: {str(e)}"}), 500
