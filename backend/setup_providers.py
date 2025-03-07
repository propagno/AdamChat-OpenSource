#!/usr/bin/env python3
"""
Script para configurar provedores de IA no banco de dados MongoDB.
Este script é usado para configurar os provedores OpenAI e Gemini para execução completa dos testes.
"""
import os
import sys
import json
import pymongo
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Cores para melhorar a legibilidade no terminal


class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_header(message):
    """Imprime um cabeçalho"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{message}{Colors.END}")


def print_success(message):
    """Imprime uma mensagem de sucesso"""
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")


def print_error(message):
    """Imprime uma mensagem de erro"""
    print(f"{Colors.FAIL}✗ {message}{Colors.END}")


def print_info(message):
    """Imprime uma informação"""
    print(f"{Colors.BLUE}ℹ {message}{Colors.END}")


def connect_to_db():
    """Conecta ao MongoDB e retorna a instância do banco de dados"""
    # URL base do MongoDB - usando localhost para desenvolvimento local
    MONGODB_URI = 'mongodb://localhost:27017/adamchat'

    try:
        client = pymongo.MongoClient(MONGODB_URI)
        db_name = MONGODB_URI.split('/')[-1]
        db = client[db_name]
        print_success(f"Conectado ao MongoDB: {db_name}")
        return db
    except Exception as e:
        print_error(f"Erro ao conectar ao MongoDB: {str(e)}")
        sys.exit(1)


def setup_openai_provider(db):
    """Configura o provedor OpenAI no banco de dados"""
    print_info("Configurando provedor OpenAI...")

    # Obter a chave da API do OpenAI do ambiente
    openai_api_key = os.environ.get('OPENAI_API_KEY')
    if not openai_api_key:
        print_error("Chave de API do OpenAI não encontrada no .env")
        return False

    # Definir configurações para o provedor ChatGPT
    provider_data = {
        "name": "chatgpt",
        "display_name": "OpenAI ChatGPT",
        "description": "API da OpenAI para ChatGPT",
        "active": True,
        "versions": {
            "v35_turbo": {
                "model": "gpt-3.5-turbo",
                "endpoint": "https://api.openai.com/v1/chat/completions",
                "api_key": openai_api_key,
                "max_tokens": 1100,
                "temperature": 0.7,
                "display_name": "GPT-3.5 Turbo"
            },
            "v4": {
                "model": "gpt-4",
                "endpoint": "https://api.openai.com/v1/chat/completions",
                "api_key": openai_api_key,
                "max_tokens": 1500,
                "temperature": 0.7,
                "display_name": "GPT-4"
            }
        }
    }

    # Verificar se o provedor já existe
    existing_provider = db.providers.find_one({"name": "chatgpt"})
    if existing_provider:
        db.providers.update_one({"name": "chatgpt"}, {"$set": provider_data})
        print_success("Provedor OpenAI atualizado com sucesso")
    else:
        db.providers.insert_one(provider_data)
        print_success("Provedor OpenAI adicionado com sucesso")

    return True


def setup_gemini_provider(db):
    """Configura o provedor Gemini no banco de dados"""
    print_info("Configurando provedor Gemini...")

    # Obter a chave da API do Google (Gemini) do ambiente
    google_api_key = os.environ.get('GOOGLE_API_KEY')
    if not google_api_key:
        print_error("Chave de API do Google não encontrada no .env")
        return False

    # Definir configurações para o provedor Gemini
    provider_data = {
        "name": "gemini",
        "display_name": "Google Gemini",
        "description": "API do Google para modelos Gemini",
        "active": True,
        "versions": {
            "default": {
                "model": "gemini-pro",
                "endpoint": "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
                "api_key": google_api_key,
                "max_tokens": 1100,
                "temperature": 0.7,
                "display_name": "Gemini Pro"
            }
        }
    }

    # Verificar se o provedor já existe
    existing_provider = db.providers.find_one({"name": "gemini"})
    if existing_provider:
        db.providers.update_one({"name": "gemini"}, {"$set": provider_data})
        print_success("Provedor Gemini atualizado com sucesso")
    else:
        db.providers.insert_one(provider_data)
        print_success("Provedor Gemini adicionado com sucesso")

    return True


def main():
    """Função principal"""
    print_header("=== CONFIGURAÇÃO DE PROVEDORES PARA TESTES ===")

    # Conectar ao MongoDB
    db = connect_to_db()

    # Configurar provedores
    openai_success = setup_openai_provider(db)
    gemini_success = setup_gemini_provider(db)

    # Verificar resultados
    if openai_success and gemini_success:
        print_header("=== CONFIGURAÇÃO CONCLUÍDA COM SUCESSO ===")
        print_success("Todos os provedores foram configurados com sucesso.")
        print_info(
            "Agora você pode executar os testes com provedores reais usando:")
        print(f"{Colors.CYAN}python run_tests.py all{Colors.END}")
    else:
        print_header("=== CONFIGURAÇÃO PARCIALMENTE CONCLUÍDA ===")
        print_info("Alguns provedores não puderam ser configurados.")
        if openai_success:
            print_success("Provedor OpenAI configurado com sucesso.")
        else:
            print_error("Falha ao configurar o provedor OpenAI.")

        if gemini_success:
            print_success("Provedor Gemini configurado com sucesso.")
        else:
            print_error("Falha ao configurar o provedor Gemini.")


if __name__ == "__main__":
    main()
