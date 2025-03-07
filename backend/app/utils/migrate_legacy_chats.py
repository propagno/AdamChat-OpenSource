#!/usr/bin/env python3
"""
Script de migração para converter conversas do formato antigo para o novo formato.

Este script lê todas as conversas no formato antigo do MongoDB e as converte para
o novo formato, preservando todo o histórico de mensagens.

Uso:
    python migrate_legacy_chats.py

Nota: Certifique-se de fazer um backup do banco de dados antes de executar este script.
"""
import sys
import os
import datetime
import logging
from pymongo import MongoClient
from bson import ObjectId

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('migration.log')
    ]
)
logger = logging.getLogger('migration')

# Conexão com o MongoDB


def get_db():
    """Conecta ao MongoDB e retorna a instância do banco de dados"""
    mongo_uri = os.environ.get(
        'MONGODB_URI', 'mongodb://localhost:27017/adamchat')
    client = MongoClient(mongo_uri)
    db_name = mongo_uri.split('/')[-1]
    return client[db_name]


def migrate_conversations():
    """Migra as conversas do formato antigo para o novo formato"""
    db = get_db()

    # Cria uma coleção temporária para backup
    logger.info("Criando backup das conversas...")
    db.conversations_backup = db.conversations.aggregate(
        [{'$match': {}}, {'$out': 'conversations_backup'}])

    # Conta o número de conversas
    total_conversations = db.conversations.count_documents({})
    logger.info(f"Total de {total_conversations} conversas para migrar")

    # Verifica se já existe o campo 'files' nas conversas
    sample = db.conversations.find_one({})
    if sample and 'files' in sample:
        logger.info(
            "As conversas já parecem estar no novo formato. Verificando...")
        new_format_count = db.conversations.count_documents(
            {'files': {'$exists': True}})
        if new_format_count == total_conversations:
            logger.info(
                "Todas as conversas já estão no novo formato. Nada a fazer.")
            return

    # Processo de migração
    migrated = 0
    for conversation in db.conversations.find({}):
        try:
            # Verifica se a conversa já está no novo formato
            if 'files' in conversation:
                continue

            conversation_id = conversation['_id']
            user_id = conversation.get('user_id')

            # Ajusta o histórico de mensagens
            history = conversation.get('history', [])

            # Adiciona timestamps se não existirem
            now = datetime.datetime.utcnow().isoformat()
            for message in history:
                if 'timestamp' not in message:
                    message['timestamp'] = now

            # Campos adicionais para o novo formato
            updates = {
                'files': [],
                'updated_at': now,
                'created_at': conversation.get('created_at', now),
            }

            # Define um título se não existir
            if 'title' not in conversation:
                # Tenta extrair um título da primeira mensagem do usuário
                for msg in history:
                    if msg.get('sender') == 'user' or msg.get('sender', '').startswith('user'):
                        text = msg.get('text', '')
                        title = text[:40] + '...' if len(text) > 40 else text
                        updates['title'] = title
                        break

                # Caso não tenha encontrado uma mensagem do usuário
                if 'title' not in updates:
                    updates['title'] = f"Conversa {conversation_id}"

            # Adiciona o last_message (última mensagem do histórico)
            if history:
                last_message = history[-1].get('text', '')
                updates['last_message'] = last_message[:100] + \
                    '...' if len(last_message) > 100 else last_message
            else:
                updates['last_message'] = ""

            # Atualiza a conversa
            db.conversations.update_one(
                {'_id': conversation_id},
                {'$set': updates}
            )

            migrated += 1
            if migrated % 100 == 0:
                logger.info(
                    f"Migradas {migrated} de {total_conversations} conversas")

        except Exception as e:
            logger.error(
                f"Erro ao migrar conversa {conversation.get('_id')}: {str(e)}")

    logger.info(f"Migração concluída. {migrated} conversas foram atualizadas.")


def validate_migration():
    """Valida se a migração foi bem-sucedida"""
    db = get_db()

    total = db.conversations.count_documents({})
    migrated = db.conversations.count_documents({
        'files': {'$exists': True},
        'last_message': {'$exists': True},
        'updated_at': {'$exists': True},
        'created_at': {'$exists': True},
        'title': {'$exists': True}
    })

    logger.info(
        f"Validação: {migrated} de {total} conversas estão no novo formato")
    if migrated < total:
        logger.warning(
            f"Atenção: {total - migrated} conversas não foram completamente migradas")
    else:
        logger.info("Todas as conversas foram migradas com sucesso!")


if __name__ == "__main__":
    try:
        logger.info("Iniciando migração de conversas...")
        migrate_conversations()
        validate_migration()
        logger.info("Processo de migração concluído!")
    except Exception as e:
        logger.error(f"Erro durante a migração: {str(e)}")
        sys.exit(1)
