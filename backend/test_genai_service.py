#!/usr/bin/env python3
"""
Script para testar diretamente o GenAIService com as variáveis de ambiente

Este script testa:
1. A classe GenAIService com as variáveis de ambiente
2. A obtenção de API keys do arquivo .env
3. A geração de respostas de diferentes provedores
"""
import os
import sys
import json
from app.services.genai_service import GenAIService, ENV_API_KEYS

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


def check_env_variables():
    """Verifica se as variáveis de ambiente necessárias estão configuradas"""
    print_header("Verificando variáveis de ambiente")

    missing_vars = []
    available_vars = []

    for provider, env_var in ENV_API_KEYS.items():
        if os.environ.get(env_var):
            available_vars.append((provider, env_var))
        else:
            missing_vars.append((provider, env_var))

    if available_vars:
        print_success(
            f"Encontradas {len(available_vars)} variáveis de API keys configuradas:")
        for provider, env_var in available_vars:
            key_preview = os.environ.get(
                env_var)[:10] + "..." if os.environ.get(env_var) else "Não configurada"
            print(f"  - {provider} → {env_var}: {key_preview}")

    if missing_vars:
        print_info(f"Variáveis de ambiente não configuradas:")
        for provider, env_var in missing_vars:
            print(f"  - {provider} → {env_var}")

    # Verificar USE_ENV_API_KEYS
    use_env_keys = os.environ.get('USE_ENV_API_KEYS', 'true').lower() == 'true'
    if use_env_keys:
        print_success("USE_ENV_API_KEYS está ativado (valor: true)")
    else:
        print_warning("USE_ENV_API_KEYS está desativado (valor: false)")

    return len(available_vars) > 0


def test_genai_service():
    """Testa a funcionalidade principal do GenAIService"""
    print_header("Testando GenAIService")

    # Criar uma instância sem configuração para usar .env
    genai = GenAIService()

    # Testar obtenção de API key
    for provider in ['chatgpt', 'gemini', 'claude']:
        try:
            if os.environ.get(ENV_API_KEYS.get(provider, '')):
                api_key = genai.get_api_key(provider)
                if api_key:
                    print_success(
                        f"API key para {provider} obtida com sucesso: {api_key[:5]}...")
                else:
                    print_error(
                        f"API key para {provider} não foi obtida (retornou None/vazio)")
        except Exception as e:
            print_error(f"Erro ao obter API key para {provider}: {str(e)}")

    return True


def test_chat_with_provider(provider_name="chatgpt"):
    """Testa a geração de resposta com um provedor específico"""
    print_header(f"Testando chat com provedor: {provider_name}")

    # Cria uma instância do GenAIService
    genai = GenAIService()

    # Verifica se a variável de ambiente para este provedor está configurada
    env_var = ENV_API_KEYS.get(provider_name)
    if not env_var or not os.environ.get(env_var):
        print_info(
            f"Variável de ambiente {env_var} não configurada. Pulando teste.")
        return False

    # Prompt de teste
    prompt = "Por favor, explique o que é inteligência artificial em um parágrafo curto."
    print_info(f"Prompt: '{prompt}'")

    try:
        # Chamar o método apropriado com base no provedor
        if provider_name == "chatgpt":
            response = genai.chat_with_chatgpt(prompt)
        elif provider_name == "gemini":
            response = genai.chat_with_gemini(prompt)
        elif provider_name == "claude":
            response = genai.chat_with_claude(prompt)
        elif provider_name == "deepseek":
            response = genai.chat_with_deepseek(prompt)
        elif provider_name == "llama":
            response = genai.chat_with_llama(prompt)
        elif provider_name == "copilot":
            response = genai.chat_with_copilot(prompt)
        else:
            print_error(f"Provedor não suportado: {provider_name}")
            return False

        print_success("Resposta gerada com sucesso!")
        print_info("Resposta:")
        print(f"{Colors.CYAN}{response}{Colors.END}")
        return True
    except Exception as e:
        print_error(f"Erro ao gerar resposta com {provider_name}: {str(e)}")
        return False


def main():
    """Função principal"""
    print(
        f"\n{Colors.BOLD}{Colors.HEADER}=== TESTE DO GENAI SERVICE ===\n{Colors.END}")

    # Verificar variáveis de ambiente
    env_check = check_env_variables()

    # Testar GenAIService
    service_check = test_genai_service()

    # Determinar qual provedor testar
    # Prioridade: chatgpt > gemini > claude
    test_provider = None
    for provider in ["chatgpt", "gemini", "claude"]:
        env_var = ENV_API_KEYS.get(provider)
        if env_var and os.environ.get(env_var):
            test_provider = provider
            break

    # Testar chat com o provedor selecionado
    chat_check = False
    if test_provider:
        chat_check = test_chat_with_provider(test_provider)
    else:
        print_info("Nenhum provedor configurado para teste de chat.")

    # Resultado final
    print(f"\n{Colors.BOLD}{Colors.HEADER}=== RESULTADO DO TESTE ===\n{Colors.END}")
    if env_check and service_check and chat_check:
        print(f"{Colors.GREEN}{Colors.BOLD}✓ TESTE COMPLETO COM SUCESSO!{Colors.END}")
        print(f"{Colors.GREEN}O GenAIService está funcionando corretamente com as variáveis de ambiente.{Colors.END}")
    elif env_check and service_check:
        print(
            f"{Colors.WARNING}{Colors.BOLD}⚠ TESTE PARCIALMENTE BEM-SUCEDIDO{Colors.END}")
        print(f"{Colors.WARNING}O GenAIService está configurado, mas houve problemas na geração de resposta.{Colors.END}")
    else:
        print(f"{Colors.FAIL}{Colors.BOLD}✗ TESTE FALHOU{Colors.END}")
        print(
            f"{Colors.FAIL}Há problemas na configuração ou funcionamento do GenAIService.{Colors.END}")


if __name__ == "__main__":
    main()
