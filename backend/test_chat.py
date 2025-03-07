#!/usr/bin/env python3
"""
Script de teste para verificar o funcionamento do chat

Este script testa:
1. Criação de uma nova conversa
2. Envio de mensagem para a conversa
3. Verificação da resposta da IA
4. Verificação do armazenamento no banco de dados
"""
import os
import sys
import json
import requests
import pymongo
from datetime import datetime
from bson import ObjectId

# URL base da API - ajuste conforme sua configuração
BASE_URL = "http://localhost:5000/api"
# ID de usuário para teste
TEST_USER_ID = "test_user_123"

# Configurações para conexão com MongoDB
MONGODB_URI = os.environ.get(
    'MONGODB_URI', 'mongodb://localhost:27017/adamchat')

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


def print_step(step_num, description):
    """Imprime um passo do teste de forma destacada"""
    print(f"\n{Colors.HEADER}Passo {step_num}: {description}{Colors.END}")


def print_success(message):
    """Imprime uma mensagem de sucesso"""
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")


def print_error(message):
    """Imprime uma mensagem de erro"""
    print(f"{Colors.FAIL}✗ {message}{Colors.END}")


def print_warning(message):
    """Imprime um aviso"""
    print(f"{Colors.WARNING}⚠ {message}{Colors.END}")


def print_info(message):
    """Imprime uma informação"""
    print(f"{Colors.BLUE}ℹ {message}{Colors.END}")


def print_json(data):
    """Imprime um objeto JSON formatado"""
    print(f"{Colors.CYAN}{json.dumps(data, indent=2, ensure_ascii=False)}{Colors.END}")


def connect_to_db():
    """Conecta ao MongoDB e retorna a instância do banco de dados"""
    try:
        client = pymongo.MongoClient(MONGODB_URI)
        db_name = MONGODB_URI.split('/')[-1]
        db = client[db_name]
        print_success(f"Conectado ao MongoDB: {db_name}")
        return db
    except Exception as e:
        print_error(f"Erro ao conectar ao MongoDB: {str(e)}")
        sys.exit(1)


def test_create_conversation():
    """Testa a criação de uma nova conversa"""
    print_step(1, "Criando uma nova conversa")

    url = f"{BASE_URL}/conversations"
    data = {
        "user_id": TEST_USER_ID,
        "title": f"Conversa de teste - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    }

    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
        result = response.json()

        print_success("Conversa criada com sucesso!")
        print_info("Detalhes da conversa:")
        print_json(result)

        return result["id"]
    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao criar conversa: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            print_json(e.response.json())
        sys.exit(1)


def test_send_message(conversation_id):
    """Testa o envio de uma mensagem para uma conversa"""
    print_step(2, "Enviando uma mensagem de teste")

    url = f"{BASE_URL}/conversations/{conversation_id}/messages"
    data = {
        "user_id": TEST_USER_ID,
        "message": "Olá! Como você está? Poderia me explicar o que é diabetes?",
        "gptProvider": "chatgpt",  # ou outro provider configurado
        "providerVersion": "v35_turbo",
        "stream": False,  # Adicionar parâmetro para indicar que não é streaming
        "temperature": 0.7,  # Adicionar temperatura
        "max_tokens": 800  # Adicionar max_tokens
    }

    try:
        print_info("Enviando a mensagem...")
        response = requests.post(url, json=data)
        response.raise_for_status()
        result = response.json()

        print_success("Mensagem enviada com sucesso!")
        print_info("Mensagem do usuário:")
        print_json(result["user_message"])

        print_info("Resposta da IA:")
        print_json(result["ai_response"])

        return result
    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao enviar mensagem: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            print_json(e.response.json())
        sys.exit(1)


def verify_mongodb_storage(conversation_id, db):
    """Verifica se os dados foram armazenados no MongoDB"""
    print_step(3, "Verificando o armazenamento no MongoDB")

    try:
        # Buscar a conversa no MongoDB
        conversation = db.conversations.find_one(
            {"_id": ObjectId(conversation_id)})

        if not conversation:
            print_error(
                f"Conversa {conversation_id} não encontrada no MongoDB!")
            return False

        print_success("Conversa encontrada no MongoDB!")
        print_info("Detalhes do objeto da conversa:")
        print(f"{Colors.CYAN}ID: {conversation['_id']}{Colors.END}")
        print(f"{Colors.CYAN}Título: {conversation.get('title', 'N/A')}{Colors.END}")
        print(f"{Colors.CYAN}Usuário: {conversation.get('user_id', 'N/A')}{Colors.END}")
        print(
            f"{Colors.CYAN}Criado em: {conversation.get('created_at', 'N/A')}{Colors.END}")
        print(
            f"{Colors.CYAN}Atualizado em: {conversation.get('updated_at', 'N/A')}{Colors.END}")

        # Verificar histórico de mensagens
        history = conversation.get('history', [])
        if not history:
            print_error("Histórico de mensagens está vazio!")
            return False

        print_success(
            f"Histórico de mensagens encontrado com {len(history)} mensagens!")

        # Mostrar a última mensagem do usuário e a resposta da IA
        for i, msg in enumerate(history[-2:], 1):
            sender = msg.get('sender', 'desconhecido')
            text_preview = msg.get('text', '')[
                :100] + '...' if len(msg.get('text', '')) > 100 else msg.get('text', '')
            print(f"{Colors.CYAN}Mensagem {i} - De: {sender}{Colors.END}")
            print(f"{Colors.CYAN}Texto: {text_preview}{Colors.END}")

        return True
    except Exception as e:
        print_error(f"Erro ao verificar MongoDB: {str(e)}")
        return False


def main():
    """Função principal do teste"""
    print(
        f"\n{Colors.BOLD}{Colors.HEADER}=== TESTE DO SISTEMA DE CHAT ==={Colors.END}\n")

    # Conectar ao MongoDB
    db = connect_to_db()

    # Verificar se há provedores configurados
    print_info("Verificando se há provedores configurados...")
    try:
        providers = db.providers.find()
        providers_list = list(providers)

        if not providers_list or len(providers_list) == 0:
            print_warning("Não há provedores configurados no sistema.")
            print_info(
                "Para testar o envio de mensagens, configure pelo menos um provedor no banco de dados.")
            print_info("Pulando os testes de envio de mensagens.")

            # Criar uma conversa apenas para testar a criação
            conversation_id = test_create_conversation()

            # Resultado final
            print(
                f"\n{Colors.BOLD}{Colors.HEADER}=== RESULTADO DO TESTE ==={Colors.END}")
            print(
                f"\n{Colors.WARNING}{Colors.BOLD}⚠ TESTE PARCIALMENTE EXECUTADO{Colors.END}")
            print(
                f"{Colors.WARNING}O teste de criação de conversa foi bem-sucedido, mas o teste de envio de mensagens foi pulado.{Colors.END}")
            print(
                f"{Colors.BLUE}Para testar todas as funcionalidades, configure os provedores no banco de dados.{Colors.END}")
            return

        print_success(
            f"Encontrados {len(providers_list)} provedores configurados.")
    except Exception as e:
        print_error(f"Erro ao verificar provedores: {str(e)}")
        print_info(
            "Continuando com os testes mesmo sem confirmação de provedores...")

    # Executar os testes
    try:
        # Criar uma nova conversa
        conversation_id = test_create_conversation()

        # Enviar uma mensagem
        message_result = test_send_message(conversation_id)

        # Verificar armazenamento no MongoDB
        db_verification = verify_mongodb_storage(conversation_id, db)

        # Resultado final
        print(
            f"\n{Colors.BOLD}{Colors.HEADER}=== RESULTADO DO TESTE ==={Colors.END}")
        if db_verification:
            print(
                f"\n{Colors.GREEN}{Colors.BOLD}✓ TESTE COMPLETO COM SUCESSO!{Colors.END}")
            print(
                f"{Colors.GREEN}O sistema de chat está funcionando corretamente.{Colors.END}")
        else:
            print(
                f"\n{Colors.WARNING}{Colors.BOLD}⚠ TESTE PARCIALMENTE BEM-SUCEDIDO{Colors.END}")
            print(
                f"{Colors.WARNING}A API respondeu, mas há problemas com o armazenamento no MongoDB.{Colors.END}")

    except Exception as e:
        print(f"\n{Colors.FAIL}{Colors.BOLD}✗ ERRO NO TESTE: {str(e)}{Colors.END}")
        print(f"{Colors.FAIL}O sistema de chat apresentou falhas.{Colors.END}")


if __name__ == "__main__":
    main()
