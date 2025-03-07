#!/usr/bin/env python3
"""
Script para executar todos os testes da API de Chat

Este script permite executar:
- Todos os testes de uma vez
- Testes individuais selecionados

Uso:
    python run_tests.py all                  # Executa todos os testes
    python run_tests.py chat                 # Executa apenas teste_chat.py
    python run_tests.py api                  # Executa apenas teste_chat_api.py
    python run_tests.py stream               # Executa apenas teste_chat_stream_api.py
    python run_tests.py genai                # Executa apenas teste_genai_service.py
    python run_tests.py chat api stream      # Executa múltiplos testes selecionados
"""
import os
import sys
import subprocess
import time
from datetime import datetime

# Mapeamento de opções de teste para arquivos
TEST_FILES = {
    "chat": "test_chat.py",
    "api": "test_chat_api.py",
    "stream": "test_chat_stream_api.py",
    "genai": "test_genai_service.py",
}

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


def run_test(test_file):
    """Executa um arquivo de teste e retorna o código de saída"""
    print_header(f"Executando teste: {test_file}")

    start_time = time.time()
    result = subprocess.run([sys.executable, test_file],
                            cwd=os.path.dirname(os.path.abspath(__file__)))
    duration = time.time() - start_time

    print_info(f"Duração do teste: {duration:.2f} segundos")

    if result.returncode == 0:
        print_success(f"Teste {test_file} concluído com sucesso!")
    else:
        print_error(
            f"Teste {test_file} falhou (código de saída: {result.returncode})")

    return result.returncode


def print_usage():
    """Imprime as instruções de uso"""
    print("\nUso:")
    print(
        f"    {sys.executable} run_tests.py all                  # Executa todos os testes")
    print(
        f"    {sys.executable} run_tests.py chat                 # Executa apenas test_chat.py")
    print(
        f"    {sys.executable} run_tests.py api                  # Executa apenas test_chat_api.py")
    print(f"    {sys.executable} run_tests.py stream               # Executa apenas test_chat_stream_api.py")
    print(f"    {sys.executable} run_tests.py genai                # Executa apenas test_genai_service.py")
    print(f"    {sys.executable} run_tests.py chat api stream      # Executa múltiplos testes selecionados")


def main():
    """Função principal"""
    print_header(
        f"=== EXECUÇÃO DE TESTES DO CHAT - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")

    if len(sys.argv) < 2:
        print_error("Erro: Nenhum teste especificado.")
        print_usage()
        sys.exit(1)

    # Verificar quais testes executar
    tests_to_run = []
    if "all" in sys.argv[1:]:
        tests_to_run = list(TEST_FILES.values())
    else:
        for arg in sys.argv[1:]:
            if arg in TEST_FILES:
                tests_to_run.append(TEST_FILES[arg])
            else:
                print_error(f"Opção desconhecida: {arg}")
                print_usage()
                sys.exit(1)

    if not tests_to_run:
        print_error("Nenhum teste válido selecionado.")
        print_usage()
        sys.exit(1)

    print_info(
        f"Executando {len(tests_to_run)} testes: {', '.join(tests_to_run)}")

    # Executar os testes
    results = {}
    for test_file in tests_to_run:
        # Adicionar uma pequena pausa entre os testes para garantir que os recursos sejam liberados
        if results:
            time.sleep(1)

        results[test_file] = run_test(test_file)

    # Resumo final
    print_header("=== RESUMO DOS TESTES ===")
    success_count = sum(1 for code in results.values() if code == 0)
    failure_count = len(results) - success_count

    print(f"Total de testes executados: {len(results)}")
    print(f"{Colors.GREEN}Testes bem-sucedidos: {success_count}{Colors.END}")
    print(f"{Colors.FAIL}Testes com falha: {failure_count}{Colors.END}")

    if failure_count > 0:
        print_info("Testes que falharam:")
        for test_file, code in results.items():
            if code != 0:
                print(f"  - {test_file} (código: {code})")

    if failure_count > 0:
        sys.exit(1)  # Retornar código de erro se algum teste falhou


if __name__ == "__main__":
    main()
