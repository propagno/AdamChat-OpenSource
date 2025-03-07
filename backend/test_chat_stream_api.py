#!/usr/bin/env python3
"""
Script de teste para a API de Chat com suporte a streaming

Este script testa:
1. O endpoint de streaming de respostas
2. O processamento das partes da resposta em tempo real

Importante: Este script requer uma conexão com o backend funcionando
para conseguir testar o streaming de respostas corretamente.
"""
import os
import sys
import json
import requests
import time
from datetime import datetime
from sseclient import SSEClient

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


def create_test_conversation():
    """Cria uma conversa de teste para os testes de streaming"""
    print_step(1, "Criando uma nova conversa para testes de streaming")

    url = f"{BASE_URL}/conversations"
    data = {
        "user_id": TEST_USER_ID,
        "title": f"Teste de Streaming - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    }

    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
        result = response.json()

        print_success("Conversa para streaming criada com sucesso!")
        print_info("ID da conversa:")
        print(f"{Colors.CYAN}{result['id']}{Colors.END}")

        return result["id"]
    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao criar conversa para streaming: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            print_json(e.response.json())
        sys.exit(1)


def test_stream_response(conversation_id):
    """Testa o streaming de respostas da IA"""
    print_step(2, "Testando streaming de respostas")

    url = f"{BASE_URL}/conversations/{conversation_id}/stream"
    data = {
        "user_id": TEST_USER_ID,
        "message": "Me explique de forma detalhada como funciona a inteligência artificial generativa. Dê exemplos e fale sobre suas aplicações.",
        "gptProvider": "chatgpt",
        "providerVersion": "v35_turbo",
        "stream": True,  # Assegurar que o streaming está habilitado
        "temperature": 0.7,
        "max_tokens": 1000
    }

    try:
        print_info("Iniciando o streaming da resposta...")
        # Usar o SSEClient para processar eventos Server-Sent Events
        response = requests.post(url, json=data, stream=True)
        response.raise_for_status()

        client = SSEClient(response)

        # Inicializar contadores e buffer
        total_chunks = 0
        full_response = ""
        print_info("Recebendo chunks da resposta...")

        # Processar cada evento de streaming
        start_time = time.time()
        for event in client.events():
            if event.data:
                try:
                    # Tentar decodificar como JSON
                    data = json.loads(event.data)

                    if 'token' in data:
                        chunk = data['token']
                        total_chunks += 1
                        full_response += chunk

                        # Mostrar progresso a cada 10 chunks
                        if total_chunks % 10 == 0:
                            print(
                                f"{Colors.CYAN}Recebidos {total_chunks} chunks até agora...{Colors.END}")

                    elif 'error' in data:
                        print_error(f"Erro no streaming: {data['error']}")
                        break

                    elif 'done' in data and data['done']:
                        print_success("Streaming concluído pelo servidor.")
                        break

                except json.JSONDecodeError:
                    # Se não for JSON, tratar como texto simples
                    chunk = event.data
                    total_chunks += 1
                    full_response += chunk

                    # Mostrar progresso a cada 10 chunks
                    if total_chunks % 10 == 0:
                        print(
                            f"{Colors.CYAN}Recebidos {total_chunks} chunks até agora (formato texto)...{Colors.END}")

        # Calcular tempo total
        total_time = time.time() - start_time

        print_success(f"Streaming concluído em {total_time:.2f} segundos!")
        print_info(f"Total de chunks recebidos: {total_chunks}")
        print_info("Trecho da resposta completa (primeiros 200 caracteres):")
        print(f"{Colors.CYAN}{full_response[:200]}...{Colors.END}")

        if total_chunks > 0:
            return True
        else:
            print_warning("Nenhum chunk foi recebido durante o streaming")
            return False

    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao iniciar streaming: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            try:
                print_json(e.response.json())
            except:
                print(f"{Colors.CYAN}{e.response.text}{Colors.END}")
        return False
    except Exception as e:
        print_error(f"Erro durante o streaming: {str(e)}")
        return False


def delete_test_conversation(conversation_id):
    """Exclui a conversa de teste após os testes"""
    print_step(3, "Excluindo conversa de teste")

    url = f"{BASE_URL}/conversations/{conversation_id}"

    try:
        response = requests.delete(url)
        response.raise_for_status()
        result = response.json()

        print_success("Conversa de teste excluída com sucesso!")
        return True
    except requests.exceptions.RequestException as e:
        print_error(f"Erro ao excluir conversa de teste: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print_info("Resposta do servidor:")
            print_json(e.response.json())
        return False


def main():
    """Função principal do teste"""
    print_header("=== TESTE DA API DE STREAMING DE CHAT ===")

    try:
        # Verificar dependências
        try:
            import sseclient
        except ImportError:
            print_error("A biblioteca 'sseclient' não está instalada.")
            print_info("Por favor, instale-a usando: pip install sseclient")
            return

        # Verificar se há provedores configurados
        print_info("Verificando se há provedores configurados...")
        try:
            response = requests.get(f"{BASE_URL}/providers")
            providers = response.json()

            if not providers or len(providers) == 0:
                print_warning("Não há provedores configurados no sistema.")
                print_info(
                    "Para testar o streaming, configure pelo menos um provedor no banco de dados.")
                print_info("Pulando os testes de streaming.")
                return

            print_success(
                f"Encontrados {len(providers)} provedores configurados.")
        except Exception as e:
            print_error(f"Erro ao verificar provedores: {str(e)}")
            print_info(
                "Continuando com os testes mesmo sem confirmação de provedores...")

        # Criar conversa de teste
        conversation_id = create_test_conversation()

        # Testar streaming
        streaming_success = test_stream_response(conversation_id)

        # Limpar (excluir a conversa de teste)
        cleanup_success = delete_test_conversation(conversation_id)

        # Resultado final
        print_header("=== RESULTADO DO TESTE DE STREAMING ===")

        if streaming_success:
            print(
                f"\n{Colors.GREEN}{Colors.BOLD}✓ TESTE DE STREAMING BEM-SUCEDIDO!{Colors.END}")
            print(
                f"{Colors.GREEN}A API de streaming de Chat está funcionando corretamente.{Colors.END}")
        else:
            print(
                f"\n{Colors.FAIL}{Colors.BOLD}✗ TESTE DE STREAMING FALHOU{Colors.END}")
            print(
                f"{Colors.FAIL}A API de streaming de Chat apresentou problemas.{Colors.END}")

    except Exception as e:
        print(
            f"\n{Colors.FAIL}{Colors.BOLD}✗ ERRO DURANTE TESTE: {str(e)}{Colors.END}")


if __name__ == "__main__":
    main()
