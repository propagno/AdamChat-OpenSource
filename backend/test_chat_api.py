#!/usr/bin/env python3
"""
Script de teste para a API de Chat

Este script testa todos os endpoints da API de Chat:
1. Listar conversas
2. Criar conversas
3. Obter detalhes de uma conversa
4. Atualizar uma conversa
5. Excluir uma conversa
6. Listar mensagens de uma conversa
7. Enviar mensagem para uma conversa
8. Limpar mensagens de uma conversa
9. Listar provedores disponíveis
10. Listar versões de um provedor
11. Obter configurações do usuário
12. Atualizar configurações do usuário
"""
import os
import sys
import json
import requests
import time
from datetime import datetime

# URL base da API - ajuste conforme sua configuração
BASE_URL = "http://localhost:5000/api"
# ID de usuário para teste
TEST_USER_ID = "test_user_123"

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


def test_list_conversations():
    """Testa a listagem de conversas"""
    print_step(1, "Listando conversas existentes")

    url = f"{BASE_URL}/conversations?user_id={TEST_USER_ID}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        result = response.json()

        # Verificar o formato da resposta
        if isinstance(result, dict) and 'conversations' in result:
            conversations = result['conversations']
        else:
            conversations = result

        print_success(
            f"Conversas listadas com sucesso! Total: {len(conversations)}")
        print_info("Exemplo de conversas:")

        # Mostrar até 3 exemplos de conversas
        for i, conv in enumerate(conversations[:3]):
            print(
                f"{Colors.CYAN}Conversa {i+1}: {conv.get('title', 'Sem título')} (ID: {conv.get('id', 'N/A')}){Colors.END}")

        return conversations
    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao listar conversas: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            print_json(e.response.json())
        return []


def test_create_conversation():
    """Testa a criação de uma nova conversa"""
    print_step(2, "Criando uma nova conversa")

    url = f"{BASE_URL}/conversations"
    data = {
        "user_id": TEST_USER_ID,
        "title": f"Conversa de teste API - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
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


def test_get_conversation(conversation_id):
    """Testa a obtenção de detalhes de uma conversa"""
    print_step(3, f"Obtendo detalhes da conversa: {conversation_id}")

    url = f"{BASE_URL}/conversations/{conversation_id}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        result = response.json()

        print_success("Detalhes da conversa obtidos com sucesso!")
        print_info("Conversa:")
        print_json(result)

        return result
    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao obter detalhes da conversa: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            print_json(e.response.json())
        return None


def test_update_conversation(conversation_id):
    """Testa a atualização de uma conversa"""
    print_step(4, f"Atualizando conversa: {conversation_id}")

    url = f"{BASE_URL}/conversations/{conversation_id}"
    data = {
        "user_id": TEST_USER_ID,
        "title": f"Conversa atualizada - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    }

    try:
        response = requests.put(url, json=data)
        response.raise_for_status()
        result = response.json()

        print_success("Conversa atualizada com sucesso!")
        print_info("Detalhes atualizados:")
        print_json(result)

        return result
    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao atualizar conversa: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            print_json(e.response.json())
        return None


def test_send_message(conversation_id):
    """Testa o envio de uma mensagem para uma conversa"""
    print_step(5, f"Enviando mensagem para a conversa: {conversation_id}")

    url = f"{BASE_URL}/conversations/{conversation_id}/messages"
    data = {
        "user_id": TEST_USER_ID,
        "message": "Olá! Esta é uma mensagem de teste da API. Qual é o seu nome?",
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
        return None


def test_get_messages(conversation_id):
    """Testa a obtenção de mensagens de uma conversa"""
    print_step(6, f"Obtendo mensagens da conversa: {conversation_id}")

    url = f"{BASE_URL}/conversations/{conversation_id}/messages"

    try:
        response = requests.get(url)
        response.raise_for_status()
        result = response.json()

        # Verificar o formato da resposta
        if isinstance(result, dict) and 'messages' in result:
            messages = result['messages']
        else:
            messages = result

        print_success(f"Mensagens obtidas com sucesso! Total: {len(messages)}")

        # Mostrar até 3 exemplos de mensagens
        for i, msg in enumerate(messages[:3]):
            sender = msg.get('sender', 'desconhecido')
            text_preview = msg.get('text', '')[
                :100] + '...' if len(msg.get('text', '')) > 100 else msg.get('text', '')
            print(f"{Colors.CYAN}Mensagem {i+1} - De: {sender}{Colors.END}")
            print(f"{Colors.CYAN}Texto: {text_preview}{Colors.END}")

        return messages
    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao obter mensagens: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            print_json(e.response.json())
        return []


def test_list_providers():
    """Testa a listagem de provedores disponíveis"""
    print_step(7, "Listando provedores disponíveis")

    url = f"{BASE_URL}/providers"

    try:
        response = requests.get(url)
        response.raise_for_status()
        result = response.json()

        print_success(f"Provedores listados com sucesso! Total: {len(result)}")
        print_info("Provedores disponíveis:")
        print_json(result)

        return result
    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao listar provedores: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            print_json(e.response.json())
        return []


def test_list_provider_versions(provider_name):
    """Testa a listagem de versões de um provedor"""
    print_step(8, f"Listando versões do provedor: {provider_name}")

    url = f"{BASE_URL}/providers/{provider_name}/versions"

    try:
        response = requests.get(url)
        response.raise_for_status()
        result = response.json()

        print_success(f"Versões listadas com sucesso! Total: {len(result)}")
        print_info(f"Versões de {provider_name}:")
        print_json(result)

        return result
    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao listar versões: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            print_json(e.response.json())
        return []


def test_get_user_settings():
    """Testa a obtenção de configurações do usuário"""
    print_step(9, f"Obtendo configurações do usuário: {TEST_USER_ID}")

    url = f"{BASE_URL}/settings?user_id={TEST_USER_ID}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        result = response.json()

        print_success("Configurações obtidas com sucesso!")
        print_info("Configurações do usuário:")
        print_json(result)

        return result
    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao obter configurações: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            print_json(e.response.json())
        return None


def test_update_user_settings():
    """Testa a atualização de configurações do usuário"""
    print_step(10, f"Atualizando configurações do usuário: {TEST_USER_ID}")

    url = f"{BASE_URL}/settings"
    data = {
        "user_id": TEST_USER_ID,
        "default_provider": "chatgpt",
        "default_version": "v35_turbo",
        "max_tokens": 1000,
        "temperature": 0.7
    }

    try:
        response = requests.put(url, json=data)
        response.raise_for_status()
        result = response.json()

        print_success("Configurações atualizadas com sucesso!")
        print_info("Novas configurações:")
        print_json(result)

        return result
    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao atualizar configurações: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            print_json(e.response.json())
        return None


def test_clear_messages(conversation_id):
    """Testa a limpeza de mensagens de uma conversa"""
    print_step(11, f"Limpando mensagens da conversa: {conversation_id}")

    url = f"{BASE_URL}/conversations/{conversation_id}/messages"

    try:
        response = requests.delete(url)
        response.raise_for_status()
        result = response.json()

        print_success("Mensagens limpas com sucesso!")
        print_info("Resultado:")
        print_json(result)

        return result
    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao limpar mensagens: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            print_json(e.response.json())
        return None


def test_delete_conversation(conversation_id):
    """Testa a exclusão de uma conversa"""
    print_step(12, f"Excluindo conversa: {conversation_id}")

    url = f"{BASE_URL}/conversations/{conversation_id}"

    try:
        response = requests.delete(url)
        response.raise_for_status()
        result = response.json()

        print_success("Conversa excluída com sucesso!")
        print_info("Resultado:")
        print_json(result)

        return result
    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao excluir conversa: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            print_json(e.response.json())
        return None


def main():
    """Função principal do teste"""
    print_header("=== TESTE COMPLETO DA API DE CHAT ===")

    success_count = 0
    failure_count = 0
    total_steps = 12
    skip_count = 0

    # Passo 1: Listar conversas existentes
    print_header("Fase 1: Gerenciamento de Conversas")
    conversations = test_list_conversations()
    if conversations is not None:
        success_count += 1
    else:
        failure_count += 1

    # Passo 2: Criar uma nova conversa
    conversation_id = test_create_conversation()
    if conversation_id:
        success_count += 1
    else:
        failure_count += 1
        print_error(
            "Não foi possível continuar o teste sem uma conversa válida")
        return

    # Passo 3: Obter detalhes da conversa
    conversation = test_get_conversation(conversation_id)
    if conversation:
        success_count += 1
    else:
        failure_count += 1

    # Passo 4: Atualizar a conversa
    updated_conversation = test_update_conversation(conversation_id)
    if updated_conversation:
        success_count += 1
    else:
        failure_count += 1

    # Passo 7: Listar provedores (antecipado para verificar se podemos testar mensagens)
    print_header("Fase 3: Configurações e Provedores")
    providers = test_list_providers()
    if providers:
        success_count += 1
        has_providers = len(providers) > 0
    else:
        failure_count += 1
        has_providers = False

    # Passo 5 e 6: Testes de mensagens (apenas se houver provedores configurados)
    print_header("Fase 2: Mensagens")
    if has_providers:
        # Passo 5: Enviar mensagem
        message_result = test_send_message(conversation_id)
        if message_result:
            success_count += 1
        else:
            failure_count += 1

        # Passo 6: Listar mensagens
        messages = test_get_messages(conversation_id)
        if messages is not None:
            success_count += 1
        else:
            failure_count += 1
    else:
        print_warning(
            "Pulando testes de mensagens pois não há provedores configurados")
        print_info(
            "Para testar o envio de mensagens, configure pelo menos um provedor no banco de dados")
        skip_count += 2
        total_steps -= 2

    # Passo 8: Listar versões de um provedor (apenas se houver provedores)
    if has_providers:
        provider_name = providers[0].get('name', 'chatgpt')
        versions = test_list_provider_versions(provider_name)
        if versions is not None:
            success_count += 1
        else:
            failure_count += 1
    else:
        print_warning(
            "Pulando teste de versões pois não há provedores disponíveis")
        skip_count += 1
        total_steps -= 1

    # Passo 9: Obter configurações do usuário
    settings = test_get_user_settings()
    if settings is not None:
        success_count += 1
    else:
        failure_count += 1

    # Passo 10: Atualizar configurações do usuário
    updated_settings = test_update_user_settings()
    if updated_settings is not None:
        success_count += 1
    else:
        failure_count += 1

    # Passo 11: Limpar mensagens
    print_header("Fase 4: Limpeza e Finalização")
    clear_result = test_clear_messages(conversation_id)
    if clear_result is not None:
        success_count += 1
    else:
        failure_count += 1

    # Passo 12: Excluir conversa
    delete_result = test_delete_conversation(conversation_id)
    if delete_result is not None:
        success_count += 1
    else:
        failure_count += 1

    # Resultado final
    print_header("=== RESULTADO DO TESTE ===")
    print(f"Total de passos: {total_steps}")
    print(f"{Colors.GREEN}Passos bem-sucedidos: {success_count}{Colors.END}")
    print(f"{Colors.FAIL}Passos com falha: {failure_count}{Colors.END}")
    if skip_count > 0:
        print(f"{Colors.WARNING}Passos pulados: {skip_count}{Colors.END}")

    if success_count == total_steps:
        print(
            f"\n{Colors.GREEN}{Colors.BOLD}✓ TESTE COMPLETO COM SUCESSO!{Colors.END}")
        print(f"{Colors.GREEN}A API de Chat está funcionando corretamente em todos os endpoints testados.{Colors.END}")
    elif success_count > total_steps / 2:
        print(
            f"\n{Colors.WARNING}{Colors.BOLD}⚠ TESTE PARCIALMENTE BEM-SUCEDIDO{Colors.END}")
        print(f"{Colors.WARNING}A API de Chat está funcionando, mas alguns endpoints apresentaram problemas.{Colors.END}")
    else:
        print(
            f"\n{Colors.FAIL}{Colors.BOLD}✗ TESTE COM FALHAS SIGNIFICATIVAS{Colors.END}")
        print(
            f"{Colors.FAIL}A API de Chat apresentou problemas em vários endpoints.{Colors.END}")

    if skip_count > 0:
        print(f"\n{Colors.BLUE}Nota: {skip_count} testes foram pulados porque não há provedores configurados.{Colors.END}")
        print(f"{Colors.BLUE}Para testar todas as funcionalidades, configure os provedores no banco de dados.{Colors.END}")


if __name__ == "__main__":
    main()
