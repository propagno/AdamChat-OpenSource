# backend/app/services/image_service.py
import uuid
import os
import logging
import requests
import base64
from io import BytesIO
from PIL import Image
import time
from app.db import get_db

logger = logging.getLogger(__name__)

# Configurações para serviços de geração de imagem
DEFAULT_IMAGE_MODEL = "dall-e-3"  # Modelo padrão para o OpenAI
IMAGE_STORAGE_PATH = "static/images"  # Pasta para armazenar imagens


def ensure_image_directory():
    """
    Garante que o diretório para armazenamento de imagens exista.
    """
    os.makedirs(IMAGE_STORAGE_PATH, exist_ok=True)
    return IMAGE_STORAGE_PATH


def get_image_service_config(service_name="openai"):
    """
    Obtém a configuração do serviço de geração de imagem da coleção providers.

    Args:
        service_name (str): Nome do serviço (openai, stability, etc.)

    Returns:
        dict: Configuração do serviço ou None se não encontrado
    """
    try:
        db = get_db()
        provider = db.providers.find_one(
            {"name": service_name.lower(), "type": "image"}, {"_id": 0}
        )
        if provider:
            return provider.get("config", {})
        return None
    except Exception as e:
        logger.error(
            f"Erro ao obter configuração do serviço de imagem: {str(e)}")
        return None


def generate_image_openai(prompt, size="1024x1024", quality="standard", model=DEFAULT_IMAGE_MODEL):
    """
    Gera uma imagem com a OpenAI DALL-E.

    Args:
        prompt (str): Descrição da imagem a ser gerada
        size (str): Tamanho da imagem (1024x1024, 512x512, etc.)
        quality (str): Qualidade da imagem (standard, hd)
        model (str): Modelo da OpenAI (dall-e-3, dall-e-2, etc.)

    Returns:
        tuple: (imagem_id, imagem_url) ou (None, None) em caso de erro
    """
    try:
        config = get_image_service_config("openai")
        if not config:
            logger.error("Configuração para OpenAI DALL-E não encontrada.")
            return None, None

        api_key = config.get("api_key")
        endpoint = config.get(
            "endpoint", "https://api.openai.com/v1/images/generations")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model,
            "prompt": prompt,
            "n": 1,
            "size": size,
            "quality": quality,
            "response_format": "url"  # Pode ser "url" ou "b64_json"
        }

        response = requests.post(endpoint, json=payload, headers=headers)
        response.raise_for_status()

        data = response.json()
        if "data" in data and len(data["data"]) > 0:
            image_url = data["data"][0].get("url")
            if image_url:
                # Baixa a imagem e salva localmente
                image_id = save_image_from_url(image_url)
                return image_id, image_url

        logger.error(f"Resposta inválida da API OpenAI DALL-E: {data}")
        return None, None

    except Exception as e:
        logger.error(f"Erro ao gerar imagem com OpenAI DALL-E: {str(e)}")
        return None, None


def generate_image_stability(prompt, engine_id="stable-diffusion-v1-5", width=1024, height=1024):
    """
    Gera uma imagem com a Stability AI.

    Args:
        prompt (str): Descrição da imagem a ser gerada
        engine_id (str): ID do motor de geração da Stability
        width (int): Largura da imagem
        height (int): Altura da imagem

    Returns:
        tuple: (imagem_id, imagem_url) ou (None, None) em caso de erro
    """
    try:
        config = get_image_service_config("stability")
        if not config:
            logger.error("Configuração para Stability AI não encontrada.")
            return None, None

        api_key = config.get("api_key")
        endpoint = config.get(
            "endpoint", f"https://api.stability.ai/v1/generation/{engine_id}/text-to-image")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        payload = {
            "text_prompts": [{"text": prompt}],
            "cfg_scale": 7,
            "height": height,
            "width": width,
            "samples": 1,
            "steps": 50
        }

        response = requests.post(endpoint, json=payload, headers=headers)
        response.raise_for_status()

        data = response.json()
        if "artifacts" in data and len(data["artifacts"]) > 0:
            # A Stability retorna a imagem em base64
            b64_image = data["artifacts"][0].get("base64")
            if b64_image:
                # Converte base64 para imagem e salva localmente
                image_id = save_image_from_base64(b64_image)

                # Cria uma URL para a imagem local
                image_url = f"/static/images/{image_id}.png"
                return image_id, image_url

        logger.error(f"Resposta inválida da API Stability AI: {data}")
        return None, None

    except Exception as e:
        logger.error(f"Erro ao gerar imagem com Stability AI: {str(e)}")
        return None, None


def save_image_from_url(image_url):
    """
    Baixa uma imagem da URL e salva localmente.

    Args:
        image_url (str): URL da imagem

    Returns:
        str: ID único da imagem salva
    """
    try:
        # Garante que o diretório existe
        ensure_image_directory()

        # Gera um ID único para a imagem
        image_id = str(uuid.uuid4())

        # Baixa a imagem
        response = requests.get(image_url)
        response.raise_for_status()

        # Salva localmente
        image_path = os.path.join(IMAGE_STORAGE_PATH, f"{image_id}.png")
        with open(image_path, "wb") as f:
            f.write(response.content)

        logger.info(f"Imagem salva em: {image_path}")
        return image_id

    except Exception as e:
        logger.error(f"Erro ao salvar imagem da URL {image_url}: {str(e)}")
        return None


def save_image_from_base64(b64_image):
    """
    Salva uma imagem em base64 localmente.

    Args:
        b64_image (str): String base64 da imagem

    Returns:
        str: ID único da imagem salva
    """
    try:
        # Garante que o diretório existe
        ensure_image_directory()

        # Gera um ID único para a imagem
        image_id = str(uuid.uuid4())

        # Decodifica o base64
        image_data = base64.b64decode(b64_image)

        # Salva localmente
        image_path = os.path.join(IMAGE_STORAGE_PATH, f"{image_id}.png")
        with open(image_path, "wb") as f:
            f.write(image_data)

        logger.info(f"Imagem salva em: {image_path}")
        return image_id

    except Exception as e:
        logger.error(f"Erro ao salvar imagem de base64: {str(e)}")
        return None


def generate_image(description, service="openai", size="1024x1024"):
    """
    Função principal que gera uma imagem usando o serviço especificado.

    Args:
        description (str): Descrição da imagem a ser gerada
        service (str): Serviço a utilizar (openai, stability)
        size (str): Tamanho da imagem

    Returns:
        dict: Informações da imagem (id, url, service)
    """
    try:
        image_id = None
        image_url = None

        # Escolhe o serviço de geração
        if service.lower() == "openai":
            image_id, image_url = generate_image_openai(description, size=size)
        elif service.lower() == "stability":
            # Converte o tamanho para dimensões (apenas para Stability)
            dimensions = size.split("x")
            width = int(dimensions[0]) if len(dimensions) > 0 else 1024
            height = int(dimensions[1]) if len(dimensions) > 1 else 1024

            image_id, image_url = generate_image_stability(
                description, width=width, height=height)
        else:
            # Serviço padrão (fallback para OpenAI)
            image_id, image_url = generate_image_openai(description, size=size)

        if not image_id or not image_url:
            logger.error(f"Falha ao gerar imagem com serviço {service}")
            return None

        # Salva o registro da imagem no MongoDB
        db = get_db()
        image_record = {
            "image_id": image_id,
            "url": image_url,
            "description": description,
            "service": service,
            "size": size,
            "created_at": time.time()
        }

        db.images.insert_one(image_record)

        return {
            "image_id": image_id,
            "url": image_url,
            "service": service
        }

    except Exception as e:
        logger.error(f"Erro ao gerar imagem: {str(e)}")
        return None


def regenerate_image(image_id=None, description=None, service="openai", size="1024x1024"):
    """
    Regenera uma imagem com base na descrição anterior ou uma nova.

    Args:
        image_id (str, optional): ID da imagem a regenerar
        description (str, optional): Nova descrição para a imagem
        service (str): Serviço a utilizar
        size (str): Tamanho da imagem

    Returns:
        dict: Informações da nova imagem (id, url, service)
    """
    try:
        # Se temos um image_id mas não uma descrição, recuperamos a descrição original
        if image_id and not description:
            db = get_db()
            image_record = db.images.find_one(
                {"image_id": image_id}, {"_id": 0})

            if image_record:
                description = image_record.get("description")
                service = image_record.get("service", service)
                size = image_record.get("size", size)

        if not description:
            logger.error(
                "Não foi possível regenerar a imagem: descrição ausente.")
            return None

        # Gera uma nova imagem com os mesmos parâmetros
        return generate_image(description, service, size)

    except Exception as e:
        logger.error(f"Erro ao regenerar imagem: {str(e)}")
        return None


def get_image(image_id):
    """
    Recupera informações de uma imagem pelo ID.

    Args:
        image_id (str): ID da imagem

    Returns:
        dict: Informações da imagem ou None se não encontrada
    """
    try:
        db = get_db()
        image = db.images.find_one({"image_id": image_id}, {"_id": 0})
        return image
    except Exception as e:
        logger.error(f"Erro ao buscar imagem {image_id}: {str(e)}")
        return None
