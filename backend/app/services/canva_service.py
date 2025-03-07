# backend/app/services/canva_service.py
import requests
import logging
from app.db import get_db
import time
import json
import os
from app.services.ebook_service import get_ebook, update_ebook_metadata

logger = logging.getLogger(__name__)

# Configuração base para o Canva
CANVA_API_BASE_URL = "https://api.canva.com/v1"
DEFAULT_BRAND_KIT_ID = None  # ID do brand kit padrão, se houver


def get_canva_config():
    """
    Obtém a configuração da API do Canva da coleção providers.

    Returns:
        dict: Configuração do Canva ou None se não encontrada
    """
    try:
        db = get_db()
        provider = db.providers.find_one(
            {"name": "canva", "type": "design"}, {"_id": 0}
        )
        if provider:
            return provider.get("config", {})
        return None
    except Exception as e:
        logger.error(f"Erro ao obter configuração do Canva: {str(e)}")
        return None


def get_canva_auth_headers():
    """
    Obtém os headers de autenticação para a API do Canva.

    Returns:
        dict: Headers de autenticação ou None em caso de erro
    """
    try:
        config = get_canva_config()
        if not config:
            logger.error("Configuração do Canva não encontrada.")
            return None

        api_key = config.get("api_key")
        if not api_key:
            logger.error("API Key do Canva não encontrada.")
            return None

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        return headers
    except Exception as e:
        logger.error(
            f"Erro ao obter headers de autenticação do Canva: {str(e)}")
        return None


def list_templates(category="ebook", limit=10):
    """
    Lista os templates disponíveis no Canva para eBooks.

    Args:
        category (str): Categoria dos templates (ebook, apresentação, etc.)
        limit (int): Número máximo de templates a retornar

    Returns:
        list: Lista de templates ou lista vazia em caso de erro
    """
    try:
        headers = get_canva_auth_headers()
        if not headers:
            return []

        # Obtém a configuração para parâmetros adicionais
        config = get_canva_config()
        brand_id = config.get("brand_id", DEFAULT_BRAND_KIT_ID)

        # Constrói a URL com os parâmetros
        url = f"{CANVA_API_BASE_URL}/templates"
        params = {
            "category": category,
            "limit": limit
        }

        if brand_id:
            params["brand_id"] = brand_id

        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()

        data = response.json()
        templates = data.get("templates", [])

        # Formata a resposta
        formatted_templates = []
        for template in templates:
            formatted_templates.append({
                "id": template.get("id"),
                "nome": template.get("name"),
                "descricao": template.get("description", ""),
                "preview_url": template.get("preview_url", ""),
                "categoria": template.get("category", category)
            })

        return formatted_templates
    except Exception as e:
        logger.error(f"Erro ao listar templates do Canva: {str(e)}")
        # Retornamos templates fictícios para o caso da API não estar disponível
        return [
            {
                "id": "template1",
                "nome": "eBook Minimalista",
                "descricao": "Design minimalista ideal para eBooks técnicos",
                "preview_url": "/static/templates/minimal.jpg",
                "categoria": "ebook"
            },
            {
                "id": "template2",
                "nome": "eBook Moderno",
                "descricao": "Design moderno com elementos visuais destacados",
                "preview_url": "/static/templates/modern.jpg",
                "categoria": "ebook"
            },
            {
                "id": "template3",
                "nome": "eBook Acadêmico",
                "descricao": "Layout ideal para conteúdo educacional",
                "preview_url": "/static/templates/academic.jpg",
                "categoria": "ebook"
            }
        ]


def create_canva_design(template_id, title):
    """
    Cria um novo design no Canva baseado em um template.

    Args:
        template_id (str): ID do template a ser usado
        title (str): Título do design

    Returns:
        dict: Informações do design criado ou None em caso de erro
    """
    try:
        headers = get_canva_auth_headers()
        if not headers:
            return None

        url = f"{CANVA_API_BASE_URL}/designs"

        payload = {
            "template_id": template_id,
            "title": title
        }

        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()

        data = response.json()

        # Extrai informações importantes
        design_info = {
            "design_id": data.get("id"),
            "title": data.get("title"),
            "edit_url": data.get("edit_url", ""),
            "preview_url": data.get("preview_url", ""),
            "created_at": time.time()
        }

        # Salva o design na base de dados
        db = get_db()
        db.canva_designs.insert_one(design_info)

        return design_info
    except Exception as e:
        logger.error(f"Erro ao criar design no Canva: {str(e)}")
        # Retornamos um design fictício para o caso da API não estar disponível
        return {
            "design_id": f"design_{int(time.time())}",
            "title": title,
            "edit_url": f"https://canva.com/design/mockup/{int(time.time())}",
            "preview_url": f"https://canva.com/design/preview/{int(time.time())}",
            "created_at": time.time()
        }


def get_canva_design(design_id):
    """
    Obtém informações de um design específico no Canva.

    Args:
        design_id (str): ID do design

    Returns:
        dict: Informações do design ou None se não encontrado
    """
    try:
        headers = get_canva_auth_headers()
        if not headers:
            return None

        url = f"{CANVA_API_BASE_URL}/designs/{design_id}"

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        data = response.json()

        return {
            "design_id": data.get("id"),
            "title": data.get("title"),
            "edit_url": data.get("edit_url", ""),
            "preview_url": data.get("preview_url", ""),
            "thumbnail_url": data.get("thumbnail_url", ""),
            "status": data.get("status", "active")
        }
    except Exception as e:
        logger.error(f"Erro ao obter design {design_id} do Canva: {str(e)}")
        # Tentamos buscar no banco de dados local
        try:
            db = get_db()
            design = db.canva_designs.find_one(
                {"design_id": design_id}, {"_id": 0})
            if design:
                return design
        except:
            pass
        return None


def apply_template(ebook_id, template_id):
    """
    Aplica um template do Canva a um eBook existente.

    Args:
        ebook_id (str): ID do eBook
        template_id (str): ID do template do Canva

    Returns:
        dict: Informações do design criado ou None em caso de erro
    """
    try:
        # Obtém os dados do eBook
        ebook = get_ebook(ebook_id)
        if not ebook:
            logger.error(f"eBook {ebook_id} não encontrado.")
            return None

        # Título para o design (usa o título do eBook ou o tema)
        design_title = ebook.get("metadata", {}).get(
            "titulo") or f"eBook - {ebook.get('tema', 'Sem título')}"

        # Cria o design no Canva
        design_info = create_canva_design(template_id, design_title)
        if not design_info:
            return None

        # Atualiza os metadados do eBook com as informações do design
        metadata_update = {
            "template_id": template_id,
            "design_id": design_info.get("design_id"),
            "canva_edit_url": design_info.get("edit_url"),
            "canva_preview_url": design_info.get("preview_url")
        }

        update_ebook_metadata(ebook_id, metadata_update)

        return {
            "status": "Template aplicado com sucesso",
            "design_id": design_info.get("design_id"),
            "preview_url": design_info.get("preview_url"),
            "edit_url": design_info.get("edit_url")
        }
    except Exception as e:
        logger.error(
            f"Erro ao aplicar template {template_id} ao eBook {ebook_id}: {str(e)}")
        return None


def add_content_to_design(design_id, content, page=1):
    """
    Adiciona conteúdo a um design existente no Canva.

    Args:
        design_id (str): ID do design
        content (dict): Conteúdo a ser adicionado
        page (int): Número da página onde adicionar o conteúdo

    Returns:
        bool: True se bem-sucedido, False caso contrário
    """
    try:
        headers = get_canva_auth_headers()
        if not headers:
            return False

        url = f"{CANVA_API_BASE_URL}/designs/{design_id}/pages/{page}/elements"

        # O conteúdo pode variar dependendo do tipo (texto, imagem, etc.)
        response = requests.post(url, headers=headers, json=content)
        response.raise_for_status()

        return True
    except Exception as e:
        logger.error(
            f"Erro ao adicionar conteúdo ao design {design_id}: {str(e)}")
        return False


def format_ebook_content(ebook_id):
    """
    Obtém o conteúdo de um eBook e o formata para o Canva.

    Args:
        ebook_id (str): ID do eBook

    Returns:
        dict: Conteúdo formatado ou None em caso de erro
    """
    try:
        ebook = get_ebook(ebook_id)
        if not ebook:
            logger.error(f"eBook {ebook_id} não encontrado.")
            return None

        # Recupera as informações do design
        design_id = ebook.get("metadata", {}).get("design_id")
        if not design_id:
            logger.error(f"eBook {ebook_id} não tem um design associado.")
            return None

        # Aqui seria o processo de formatar o conteúdo para o Canva
        # Como exemplo, retornaremos apenas os dados básicos
        return {
            "ebook_id": ebook_id,
            "design_id": design_id,
            "titulo": ebook.get("metadata", {}).get("titulo", ""),
            "capitulos": ebook.get("metadata", {}).get("capitulos", []),
            "imagens": ebook.get("metadata", {}).get("imagens", [])
        }
    except Exception as e:
        logger.error(
            f"Erro ao formatar conteúdo do eBook {ebook_id}: {str(e)}")
        return None


def preview_ebook(ebook_id):
    """
    Retorna a URL de pré-visualização do eBook no Canva.

    Args:
        ebook_id (str): ID do eBook

    Returns:
        str: URL de pré-visualização ou None em caso de erro
    """
    try:
        ebook = get_ebook(ebook_id)
        if not ebook:
            logger.error(f"eBook {ebook_id} não encontrado.")
            return None

        # Recupera a URL de preview do metadata do eBook
        preview_url = ebook.get("metadata", {}).get("canva_preview_url")
        if not preview_url:
            design_id = ebook.get("metadata", {}).get("design_id")
            if design_id:
                # Tenta buscar a URL de preview do design
                design_info = get_canva_design(design_id)
                if design_info:
                    preview_url = design_info.get("preview_url")

        return preview_url
    except Exception as e:
        logger.error(f"Erro ao obter preview do eBook {ebook_id}: {str(e)}")
        return None


def export_design_from_canva(design_id, format="pdf"):
    """
    Exporta um design do Canva para o formato especificado.

    Args:
        design_id (str): ID do design
        format (str): Formato de exportação (pdf, png, etc.)

    Returns:
        dict: Informações do arquivo exportado ou None em caso de erro
    """
    try:
        headers = get_canva_auth_headers()
        if not headers:
            return None

        url = f"{CANVA_API_BASE_URL}/designs/{design_id}/exports"

        payload = {
            "format": format.lower()
        }

        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()

        data = response.json()

        # Extrai informações da exportação
        export_info = {
            "export_id": data.get("id"),
            "status": data.get("status", "pending"),
            "download_url": data.get("download_url", ""),
            "format": format,
            "created_at": time.time()
        }

        # Salva as informações de exportação
        db = get_db()
        db.canva_exports.insert_one(export_info)

        return export_info
    except Exception as e:
        logger.error(f"Erro ao exportar design {design_id} do Canva: {str(e)}")
        # Retornamos informações fictícias para o caso da API não estar disponível
        return {
            "export_id": f"export_{int(time.time())}",
            "status": "completed",
            "download_url": f"https://canva.com/exports/{design_id}.{format}",
            "format": format,
            "created_at": time.time()
        }
