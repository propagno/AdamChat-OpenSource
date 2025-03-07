# backend/app/services/export_service.py
import os
import logging
import requests
import time
import uuid
from app.db import get_db
from app.services.ebook_service import get_ebook, update_ebook_status
from app.services.canva_service import export_design_from_canva

logger = logging.getLogger(__name__)

# Configurações para exportação
EXPORT_FORMATS = ["pdf", "epub", "docx", "html"]
EXPORT_STORAGE_PATH = "static/exports"


def ensure_export_directory():
    """
    Garante que o diretório para armazenamento de exportações exista.
    """
    os.makedirs(EXPORT_STORAGE_PATH, exist_ok=True)
    return EXPORT_STORAGE_PATH


def export_ebook(ebook_id, formato="pdf", options=None):
    """
    Exporta um eBook para o formato especificado.

    Args:
        ebook_id (str): ID do eBook
        formato (str): Formato de exportação (pdf, epub, docx, html)
        options (dict, optional): Opções adicionais de exportação

    Returns:
        dict: Informações sobre a exportação ou None em caso de erro
    """
    try:
        # Validação do formato
        formato = formato.lower()
        if formato not in EXPORT_FORMATS:
            logger.error(f"Formato de exportação inválido: {formato}")
            return None

        # Obtém os dados do eBook
        ebook = get_ebook(ebook_id)
        if not ebook:
            logger.error(f"eBook {ebook_id} não encontrado.")
            return None

        # Verifica se o eBook está pronto para exportação
        if ebook.get("status") != "finalizado":
            logger.warning(
                f"eBook {ebook_id} não está finalizado para exportação.")
            # Continuamos mesmo assim, mas com aviso

        # Atualiza o status da etapa de exportação
        update_ebook_status(ebook_id, "Exportação", "em_andamento")

        # Obtém as informações do design no Canva (se disponível)
        design_id = ebook.get("metadata", {}).get("design_id")

        # Define um ID único para a exportação
        export_id = str(uuid.uuid4())
        filename = f"{export_id}.{formato}"
        filepath = os.path.join(EXPORT_STORAGE_PATH, filename)

        # Cria o diretório de exportação se não existir
        ensure_export_directory()

        # Inicializa o registro da exportação
        db = get_db()
        export_record = {
            "export_id": export_id,
            "ebook_id": ebook_id,
            "format": formato,
            "filepath": filepath,
            "status": "em_andamento",
            "download_url": None,  # Será preenchido após a exportação
            "created_at": time.time(),
            "completed_at": None
        }

        db.exports.insert_one(export_record)

        # Método de exportação depende do formato e da existência de design no Canva
        if design_id:
            # Se temos um design no Canva, usamos a API do Canva para exportar
            export_info = export_design_from_canva(design_id, format=formato)

            if export_info and export_info.get("download_url"):
                # Baixa o arquivo do Canva e salva localmente
                download_url = export_info.get("download_url")
                response = requests.get(download_url)
                response.raise_for_status()

                with open(filepath, "wb") as f:
                    f.write(response.content)

                # Atualiza o registro com as informações da exportação concluída
                download_url = f"/static/exports/{filename}"
                db.exports.update_one(
                    {"export_id": export_id},
                    {"$set": {
                        "status": "concluido",
                        "download_url": download_url,
                        "completed_at": time.time()
                    }}
                )

                # Atualiza o status da etapa de exportação no eBook
                update_ebook_status(ebook_id, "Exportação", "concluido")

                return {
                    "export_id": export_id,
                    "status": "concluido",
                    "download_url": download_url,
                    "format": formato
                }
            else:
                # Falha na exportação via Canva
                logger.error(f"Falha ao exportar design {design_id} do Canva.")
                update_export_status(export_id, "falha")
                update_ebook_status(ebook_id, "Exportação", "falha")
                return None
        else:
            # Sem design do Canva, usamos o método local de exportação
            # Implementação dependeria do formato e do conteúdo disponível
            success = export_ebook_local(ebook, filepath, formato, options)

            if success:
                # Atualiza o registro com as informações da exportação concluída
                download_url = f"/static/exports/{filename}"
                db.exports.update_one(
                    {"export_id": export_id},
                    {"$set": {
                        "status": "concluido",
                        "download_url": download_url,
                        "completed_at": time.time()
                    }}
                )

                # Atualiza o status da etapa de exportação no eBook
                update_ebook_status(ebook_id, "Exportação", "concluido")

                return {
                    "export_id": export_id,
                    "status": "concluido",
                    "download_url": download_url,
                    "format": formato
                }
            else:
                # Falha na exportação local
                logger.error(f"Falha ao exportar eBook {ebook_id} localmente.")
                update_export_status(export_id, "falha")
                update_ebook_status(ebook_id, "Exportação", "falha")
                return None

    except Exception as e:
        logger.error(f"Erro ao exportar eBook {ebook_id}: {str(e)}")
        # Tentamos atualizar o status em caso de erro
        try:
            if 'export_id' in locals():
                update_export_status(export_id, "falha")
            update_ebook_status(ebook_id, "Exportação", "falha")
        except:
            pass
        return None


def export_ebook_local(ebook, filepath, formato, options=None):
    """
    Exporta um eBook localmente para o formato especificado.
    Esta é uma implementação simplificada. Em um sistema real,
    você utilizaria bibliotecas específicas para cada formato.

    Args:
        ebook (dict): Dados do eBook
        filepath (str): Caminho de destino do arquivo
        formato (str): Formato de exportação
        options (dict, optional): Opções adicionais

    Returns:
        bool: True se exportado com sucesso, False caso contrário
    """
    try:
        # Obtém os dados necessários do eBook
        titulo = ebook.get("metadata", {}).get("titulo", "eBook Sem Título")
        tema = ebook.get("tema", "")
        capitulos = ebook.get("metadata", {}).get("capitulos", [])

        # Cria uma exportação fictícia (em um sistema real, usaria as bibliotecas adequadas)
        if formato == "pdf":
            # Em um sistema real: use uma biblioteca como reportlab, PyPDF2 ou weasyprint
            generate_pdf_mockup(filepath, titulo, tema, capitulos)
        elif formato == "epub":
            # Em um sistema real: use uma biblioteca como ebooklib
            generate_epub_mockup(filepath, titulo, tema, capitulos)
        elif formato == "docx":
            # Em um sistema real: use uma biblioteca como python-docx
            generate_docx_mockup(filepath, titulo, tema, capitulos)
        elif formato == "html":
            # Em um sistema real: use uma biblioteca como jinja2 para templates HTML
            generate_html_mockup(filepath, titulo, tema, capitulos)
        else:
            return False

        return os.path.exists(filepath)

    except Exception as e:
        logger.error(f"Erro na exportação local: {str(e)}")
        return False


def generate_pdf_mockup(filepath, titulo, tema, capitulos):
    """Gera um arquivo PDF fictício (em um sistema real, use reportlab ou similar)"""
    with open(filepath, "w") as f:
        f.write(f"MOCKUP PDF: {titulo}\n\n")
        f.write(f"Tema: {tema}\n\n")
        for capitulo in capitulos:
            f.write(f"Capítulo: {capitulo.get('titulo', '')}\n")
            for subtema in capitulo.get("subtemas", []):
                f.write(f"  - {subtema}\n")


def generate_epub_mockup(filepath, titulo, tema, capitulos):
    """Gera um arquivo EPUB fictício (em um sistema real, use ebooklib)"""
    with open(filepath, "w") as f:
        f.write(f"MOCKUP EPUB: {titulo}\n\n")
        f.write(f"Tema: {tema}\n\n")
        for capitulo in capitulos:
            f.write(f"Capítulo: {capitulo.get('titulo', '')}\n")


def generate_docx_mockup(filepath, titulo, tema, capitulos):
    """Gera um arquivo DOCX fictício (em um sistema real, use python-docx)"""
    with open(filepath, "w") as f:
        f.write(f"MOCKUP DOCX: {titulo}\n\n")
        f.write(f"Tema: {tema}\n\n")
        for capitulo in capitulos:
            f.write(f"Capítulo: {capitulo.get('titulo', '')}\n")


def generate_html_mockup(filepath, titulo, tema, capitulos):
    """Gera um arquivo HTML fictício (em um sistema real, use jinja2 ou similar)"""
    with open(filepath, "w") as f:
        f.write(f"<html><head><title>{titulo}</title></head>")
        f.write("<body>")
        f.write(f"<h1>{titulo}</h1>")
        f.write(f"<p>Tema: {tema}</p>")
        for capitulo in capitulos:
            f.write(f"<h2>{capitulo.get('titulo', '')}</h2>")
            f.write("<ul>")
            for subtema in capitulo.get("subtemas", []):
                f.write(f"<li>{subtema}</li>")
            f.write("</ul>")
        f.write("</body></html>")


def update_export_status(export_id, status):
    """
    Atualiza o status de uma exportação.

    Args:
        export_id (str): ID da exportação
        status (str): Novo status (em_andamento, concluido, falha)

    Returns:
        bool: True se atualizado com sucesso, False caso contrário
    """
    try:
        db = get_db()
        update_data = {"status": status}

        if status == "concluido":
            update_data["completed_at"] = time.time()

        result = db.exports.update_one(
            {"export_id": export_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(
            f"Erro ao atualizar status da exportação {export_id}: {str(e)}")
        return False


def get_export_status(ebook_id=None, export_id=None):
    """
    Obtém o status da exportação de um eBook.

    Args:
        ebook_id (str, optional): ID do eBook
        export_id (str, optional): ID da exportação

    Returns:
        dict: Informações da exportação ou None se não encontrada
    """
    try:
        db = get_db()
        query = {}

        if export_id:
            query["export_id"] = export_id
        elif ebook_id:
            query["ebook_id"] = ebook_id
        else:
            return None

        # Obtém a exportação mais recente
        export = db.exports.find_one(
            query,
            {"_id": 0},
            sort=[("created_at", -1)]
        )

        return export
    except Exception as e:
        logger.error(f"Erro ao obter status da exportação: {str(e)}")
        return None


def list_exports(ebook_id=None, limit=10):
    """
    Lista as exportações disponíveis, opcionalmente filtradas por eBook.

    Args:
        ebook_id (str, optional): ID do eBook para filtrar
        limit (int): Número máximo de resultados

    Returns:
        list: Lista de exportações
    """
    try:
        db = get_db()
        query = {}

        if ebook_id:
            query["ebook_id"] = ebook_id

        exports = list(db.exports.find(
            query,
            {"_id": 0},
            sort=[("created_at", -1)],
            limit=limit
        ))

        return exports
    except Exception as e:
        logger.error(f"Erro ao listar exportações: {str(e)}")
        return []
