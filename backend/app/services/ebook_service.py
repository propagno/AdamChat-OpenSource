# backend/app/services/ebook_service.py
import uuid
import time
from app.db import get_db
import logging

logger = logging.getLogger(__name__)


def create_ebook(tema):
    """
    Cria um novo eBook com o tema especificado.

    Args:
        tema (str): O tema principal do eBook

    Returns:
        str: ID único do eBook criado
    """
    ebook_id = str(uuid.uuid4())
    ebook = {
        "ebook_id": ebook_id,
        "tema": tema,
        "status": "em_andamento",
        "etapas": [
            {"etapa": "Título", "status": "pendente"},
            {"etapa": "Capítulos", "status": "pendente"},
            {"etapa": "Conteúdo", "status": "pendente"},
            {"etapa": "Imagens", "status": "pendente"},
            {"etapa": "Design", "status": "pendente"},
            {"etapa": "Exportação", "status": "pendente"}
        ],
        "metadata": {
            "titulo": None,
            "capitulos": [],
            "imagens": [],
            "template_id": None
        },
        "created_at": time.time(),
        "updated_at": time.time()
    }

    try:
        db = get_db()
        db.ebooks.insert_one(ebook)
        logger.info(f"eBook criado com ID: {ebook_id}")
        return ebook_id
    except Exception as e:
        logger.error(f"Erro ao criar eBook: {str(e)}")
        raise


def get_ebook(ebook_id):
    """
    Obtém os detalhes completos de um eBook específico.

    Args:
        ebook_id (str): ID do eBook

    Returns:
        dict: Documento do eBook ou None se não encontrado
    """
    try:
        db = get_db()
        ebook = db.ebooks.find_one({"ebook_id": ebook_id}, {"_id": 0})
        return ebook
    except Exception as e:
        logger.error(f"Erro ao buscar eBook {ebook_id}: {str(e)}")
        return None


def get_ebook_status(ebook_id):
    """
    Obtém apenas o status e o progresso das etapas de um eBook.

    Args:
        ebook_id (str): ID do eBook

    Returns:
        dict: Status e etapas do eBook ou None se não encontrado
    """
    try:
        db = get_db()
        ebook = db.ebooks.find_one(
            {"ebook_id": ebook_id},
            {"_id": 0, "status": 1, "etapas": 1}
        )
        if ebook:
            return {
                "status": ebook.get("status"),
                "etapas": ebook.get("etapas", [])
            }
        return None
    except Exception as e:
        logger.error(f"Erro ao buscar status do eBook {ebook_id}: {str(e)}")
        return None


def update_ebook_status(ebook_id, etapa, novo_status):
    """
    Atualiza o status de uma etapa específica do eBook.

    Args:
        ebook_id (str): ID do eBook
        etapa (str): Nome da etapa a ser atualizada
        novo_status (str): Novo status (pendente, em_andamento, concluído)

    Returns:
        bool: True se atualizado com sucesso, False caso contrário
    """
    try:
        db = get_db()
        result = db.ebooks.update_one(
            {"ebook_id": ebook_id, "etapas.etapa": etapa},
            {"$set": {"etapas.$.status": novo_status, "updated_at": time.time()}}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(
            f"Erro ao atualizar status da etapa {etapa} do eBook {ebook_id}: {str(e)}")
        return False


def update_ebook_metadata(ebook_id, metadata):
    """
    Atualiza os metadados do eBook (título, capítulos, etc).

    Args:
        ebook_id (str): ID do eBook
        metadata (dict): Dicionário com os metadados a serem atualizados

    Returns:
        bool: True se atualizado com sucesso, False caso contrário
    """
    try:
        update_data = {"updated_at": time.time()}

        # Adiciona cada campo de metadata ao objeto de atualização
        for key, value in metadata.items():
            update_data[f"metadata.{key}"] = value

        db = get_db()
        result = db.ebooks.update_one(
            {"ebook_id": ebook_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(
            f"Erro ao atualizar metadata do eBook {ebook_id}: {str(e)}")
        return False


def finalize_ebook(ebook_id):
    """
    Finaliza o eBook, marcando seu status como 'finalizado'.

    Args:
        ebook_id (str): ID do eBook

    Returns:
        bool: True se finalizado com sucesso, False caso contrário
    """
    try:
        db = get_db()
        result = db.ebooks.update_one(
            {"ebook_id": ebook_id},
            {"$set": {"status": "finalizado", "updated_at": time.time()}}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Erro ao finalizar eBook {ebook_id}: {str(e)}")
        return False


def list_ebooks(limit=10, skip=0):
    """
    Lista os eBooks criados, com paginação.

    Args:
        limit (int): Número máximo de resultados
        skip (int): Número de registros a pular

    Returns:
        list: Lista de eBooks
    """
    try:
        db = get_db()
        ebooks = list(db.ebooks.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit))
        return ebooks
    except Exception as e:
        logger.error(f"Erro ao listar eBooks: {str(e)}")
        return []
