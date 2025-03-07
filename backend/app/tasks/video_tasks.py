import os
import time
import logging
import requests
import json
from app.extensions import db, celery
from app.models.user import User
from app.models.video import Video
from app.models.storage import StorageItem
from app.utils.token_manager import consume_tokens, refund_tokens
from flask import current_app
from datetime import datetime
from werkzeug.utils import secure_filename
import uuid

logger = logging.getLogger(__name__)

# Constantes e configurações
STABILITY_API_KEY = os.environ.get('STABILITY_AI_KEY', '')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
REPLICATE_API_KEY = os.environ.get('REPLICATE_API_KEY', '')

# URLs das APIs
STABILITY_URL = "https://api.stability.ai/v1"
OPENAI_URL = "https://api.openai.com/v1"
REPLICATE_URL = "https://api.replicate.com/v1"


@celery.task(name="process_video_generation", bind=True, max_retries=3)
def process_video_generation(self, video_id):
    """
    Processa a geração de vídeo com Stability AI

    Args:
        video_id: ID do vídeo a ser processado
    """
    try:
        # Obtém o registro do vídeo do banco de dados
        video = Video.query.get(video_id)
        if not video:
            logger.error(f"Vídeo não encontrado: {video_id}")
            return {"success": False, "error": "Vídeo não encontrado"}

        # Se o vídeo já estiver em processamento ou concluído, não continua
        if video.status not in ['pending', 'failed']:
            logger.info(f"Vídeo {video_id} já está em status: {video.status}")
            return {"success": True, "status": video.status}

        # Atualiza o status para processamento
        video.status = 'processing'
        db.session.commit()

        # Consome os tokens do usuário
        user = User.query.get(video.user_id)
        token_cost = get_video_token_cost(video.duration)

        success = consume_tokens(
            user.id,
            token_cost,
            f"Geração de vídeo: {video.prompt[:30]}..."
        )

        if not success:
            video.status = 'failed'
            video.error_message = "Tokens insuficientes para geração do vídeo"
            db.session.commit()
            return {"success": False, "error": "Tokens insuficientes"}

        # Chama a API da Stability AI
        response = call_stability_api(video)

        if not response.get('success'):
            # Caso falhe, estorna os tokens
            refund_tokens(user.id, token_cost,
                          "Falha na geração de vídeo - estorno")

            video.status = 'failed'
            video.error_message = response.get(
                'error', 'Erro desconhecido na API externa')
            db.session.commit()
            return response

        # Atualiza o vídeo com dados da resposta da API
        video.external_id = response.get('id')
        db.session.commit()

        # Inicia polling para verificar o status periodicamente
        check_video_status.apply_async(
            args=[video_id],
            countdown=15,  # Primeiro check após 15 segundos
            queue='video_processing'
        )

        return {"success": True, "status": "processing", "external_id": video.external_id}

    except Exception as e:
        logger.exception(
            f"Erro no processamento do vídeo {video_id}: {str(e)}")
        try:
            # Em caso de erro, marca o vídeo como falho e tenta estornar os tokens
            video = Video.query.get(video_id)
            if video:
                video.status = 'failed'
                video.error_message = str(e)
                db.session.commit()

                try:
                    token_cost = get_video_token_cost(video.duration)
                    refund_tokens(video.user_id, token_cost,
                                  "Erro na geração - estorno")
                except Exception as refund_error:
                    logger.error(
                        f"Erro ao estornar tokens: {str(refund_error)}")
        except Exception as db_error:
            logger.error(
                f"Erro ao atualizar vídeo após falha: {str(db_error)}")

        # Tenta novamente se possível
        self.retry(exc=e, countdown=60)

        return {"success": False, "error": str(e)}


@celery.task(name="check_video_status", bind=True, max_retries=10)
def check_video_status(self, video_id):
    """
    Verifica o status de um vídeo em processamento

    Args:
        video_id: ID do vídeo a verificar
    """
    try:
        # Obtém o registro do vídeo
        video = Video.query.get(video_id)
        if not video:
            logger.error(f"Vídeo não encontrado para verificação: {video_id}")
            return {"success": False, "error": "Vídeo não encontrado"}

        # Se já estiver concluído ou falho, não prossegue
        if video.status in ['completed', 'failed']:
            return {"success": True, "status": video.status}

        # Verifica na API da Stability AI
        response = check_stability_video_status(video.external_id)

        if not response.get('success'):
            # Se não conseguimos verificar, vai tentar novamente mais tarde
            check_video_status.apply_async(
                args=[video_id],
                countdown=30,  # Tenta novamente em 30 segundos
                queue='video_processing'
            )
            return response

        api_status = response.get('status')

        # Atualiza o status no banco de dados
        video.status = api_status

        if api_status == 'completed':
            # Se concluído, salva os detalhes do vídeo
            video.url = response.get('url')
            video.thumbnail_url = response.get('thumbnail_url')
            video.completed_at = datetime.utcnow()

            # Criação do item de armazenamento
            try:
                # Baixa o vídeo e salva no armazenamento
                save_video_to_storage(video, response.get('url'))
            except Exception as storage_error:
                logger.error(
                    f"Erro ao salvar vídeo no armazenamento: {str(storage_error)}")

        elif api_status == 'failed':
            video.error_message = response.get(
                'error_message', 'Falha na geração do vídeo')

            # Estorna os tokens ao usuário
            token_cost = get_video_token_cost(video.duration)
            refund_tokens(video.user_id, token_cost,
                          "Falha na geração de vídeo - estorno")

        elif api_status == 'processing':
            # Verifica novamente mais tarde
            check_video_status.apply_async(
                args=[video_id],
                countdown=30,  # Tenta novamente em 30 segundos
                queue='video_processing'
            )

        db.session.commit()

        return {"success": True, "status": api_status}

    except Exception as e:
        logger.exception(
            f"Erro ao verificar status do vídeo {video_id}: {str(e)}")

        # Tenta novamente, com intervalo crescente
        retry_count = self.request.retries
        countdown = 30 * (2 ** retry_count)  # Backoff exponencial
        self.retry(exc=e, countdown=min(countdown, 300))

        return {"success": False, "error": str(e)}


@celery.task(name="cleanup_old_videos", bind=True)
def cleanup_old_videos(self, days=30):
    """
    Limpa vídeos antigos que já foram baixados ou que falharam

    Args:
        days: Número de dias para considerar um vídeo antigo
    """
    try:
        from datetime import datetime, timedelta

        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Busca vídeos antigos completados ou falhos
        old_videos = Video.query.filter(
            Video.created_at < cutoff_date,
            Video.status.in_(['completed', 'failed'])
        ).all()

        for video in old_videos:
            # Marca como expirado, mantendo referência na base
            video.status = 'expired'
            video.url = None  # Remove URL externa

            # Não exclui o StorageItem, apenas o vídeo em si

        db.session.commit()

        return {"success": True, "cleaned_count": len(old_videos)}

    except Exception as e:
        logger.exception(f"Erro na limpeza de vídeos antigos: {str(e)}")
        return {"success": False, "error": str(e)}

# Funções auxiliares -------------------------------------------------


def call_stability_api(video):
    """
    Faz a chamada à API da Stability AI para gerar um vídeo

    Args:
        video: Objeto Video com as informações da requisição

    Returns:
        Dicionário com o resultado da chamada
    """
    if not STABILITY_API_KEY:
        return {"success": False, "error": "Chave da API Stability não configurada"}

    try:
        headers = {
            "Authorization": f"Bearer {STABILITY_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        # Preparação dos dados conforme documentação da Stability AI
        payload = {
            "text_prompts": [{"text": video.prompt}],
            "cfg_scale": 7.0,
            "motion_bucket_id": 40,  # Parâmetro de movimento
            "seconds": duration_to_seconds(video.duration),
        }

        # Adiciona estilo se especificado
        if video.style:
            payload["style_preset"] = video.style

        # Envio da requisição
        response = requests.post(
            f"{STABILITY_URL}/generation/text-to-video",
            headers=headers,
            json=payload
        )

        # Verifica a resposta
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "id": data.get("id"),
                "status": "processing"
            }
        else:
            error_message = response.json().get(
                "message", "Erro desconhecido") if response.text else "Sem resposta"
            return {
                "success": False,
                "error": f"Erro na API Stability ({response.status_code}): {error_message}",
                "status_code": response.status_code
            }

    except Exception as e:
        logger.exception(f"Erro ao chamar API Stability: {str(e)}")
        return {"success": False, "error": str(e)}


def check_stability_video_status(external_id):
    """
    Verifica o status de um vídeo na API da Stability AI

    Args:
        external_id: ID externo do vídeo na Stability

    Returns:
        Dicionário com status e informações do vídeo
    """
    if not STABILITY_API_KEY:
        return {"success": False, "error": "Chave da API Stability não configurada"}

    try:
        headers = {
            "Authorization": f"Bearer {STABILITY_API_KEY}",
            "Accept": "application/json"
        }

        # Envio da requisição
        response = requests.get(
            f"{STABILITY_URL}/generation/text-to-video/{external_id}",
            headers=headers
        )

        # Verifica a resposta
        if response.status_code == 200:
            data = response.json()
            status = data.get("status")

            result = {"success": True, "status": status.lower()}

            if status.lower() == "succeeded":
                result["status"] = "completed"  # Normaliza o status
                result["url"] = data.get("video_url")
                result["thumbnail_url"] = data.get("thumbnail_url", "")
            elif status.lower() == "failed":
                result["error_message"] = data.get(
                    "error", "Falha na geração do vídeo")

            return result
        else:
            error_message = response.json().get(
                "message", "Erro desconhecido") if response.text else "Sem resposta"
            return {
                "success": False,
                "error": f"Erro ao verificar status ({response.status_code}): {error_message}"
            }

    except Exception as e:
        logger.exception(
            f"Erro ao verificar status na API Stability: {str(e)}")
        return {"success": False, "error": str(e)}


def save_video_to_storage(video, url):
    """
    Baixa o vídeo da URL externa e salva no armazenamento

    Args:
        video: Objeto Video com as informações
        url: URL do vídeo para download
    """
    try:
        # Baixa o vídeo
        response = requests.get(url, stream=True)
        response.raise_for_status()

        # Gera um nome de arquivo único
        filename = f"video_{uuid.uuid4().hex}.mp4"
        safe_filename = secure_filename(filename)

        # Configurações de armazenamento
        USE_S3 = current_app.config.get('USE_S3', False)

        if USE_S3:
            # Implementação para S3
            import boto3
            from botocore.exceptions import NoCredentialsError

            S3_BUCKET = current_app.config.get('S3_BUCKET')
            S3_REGION = current_app.config.get('S3_REGION')

            s3_client = boto3.client(
                's3',
                region_name=S3_REGION,
                aws_access_key_id=current_app.config.get('AWS_ACCESS_KEY'),
                aws_secret_access_key=current_app.config.get('AWS_SECRET_KEY')
            )

            # Upload para o S3
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=safe_filename,
                Body=response.content,
                ContentType='video/mp4'
            )

            storage_path = f"s3://{S3_BUCKET}/{safe_filename}"

            # Gera URL pré-assinada
            public_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET, 'Key': safe_filename},
                ExpiresIn=3600 * 24 * 7  # 7 dias
            )
        else:
            # Armazenamento local
            LOCAL_UPLOAD_FOLDER = os.path.join(os.path.dirname(
                os.path.dirname(os.path.dirname(__file__))), 'static', 'uploads')

            if not os.path.exists(LOCAL_UPLOAD_FOLDER):
                os.makedirs(LOCAL_UPLOAD_FOLDER)

            local_path = os.path.join(LOCAL_UPLOAD_FOLDER, safe_filename)

            # Salva o arquivo localmente
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            storage_path = local_path
            public_url = f"/api/storage/file/{safe_filename}"

        # Cria o item de armazenamento
        content_length = len(response.content) if not response.headers.get(
            'content-length') else int(response.headers.get('content-length'))

        storage_item = StorageItem(
            filename=filename,
            storage_path=storage_path,
            public_url=public_url,
            content_type='video',
            size_bytes=content_length,
            metadata=json.dumps({
                "video_id": video.id,
                "prompt": video.prompt,
                "style": video.style,
                "duration": video.duration
            }),
            user_id=video.user_id
        )

        db.session.add(storage_item)

        # Atualiza o vídeo com referência ao armazenamento
        video.storage_id = storage_item.id
        db.session.commit()

        return {"success": True, "storage_id": storage_item.id, "url": public_url}

    except Exception as e:
        logger.exception(f"Erro ao salvar vídeo no armazenamento: {str(e)}")
        raise


def get_video_token_cost(duration):
    """
    Calcula o custo em tokens para um vídeo baseado na duração

    Args:
        duration: String com a duração ('5sec', '10sec', etc)

    Returns:
        Número de tokens a serem consumidos
    """
    cost_map = {
        '5sec': 1000,
        '10sec': 1800,
        '15sec': 2500,
        '30sec': 4000
    }

    return cost_map.get(duration, 1000)  # Valor padrão de 1000 tokens


def duration_to_seconds(duration):
    """
    Converte string de duração para segundos

    Args:
        duration: String no formato '5sec', '10sec', etc

    Returns:
        Duração em segundos (int)
    """
    duration_map = {
        '5sec': 5,
        '10sec': 10,
        '15sec': 15,
        '30sec': 30
    }

    # 5 segundos padrão se não reconhecido
    return duration_map.get(duration, 5)
