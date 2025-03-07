"""
Logger para o backend que envia logs estruturados para o Loki
"""

import os
import json
import logging
import time
from datetime import datetime
from functools import wraps
from logging.handlers import RotatingFileHandler

# Configurações do Logger
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO').upper()
LOG_DIR = os.environ.get('LOG_DIR', 'logs')
LOG_FILENAME = os.environ.get('LOG_FILENAME', 'backend.log')

# Certifique-se de que o diretório de logs existe
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE_PATH = os.path.join(LOG_DIR, LOG_FILENAME)

# Mapeamento de níveis de log
LOG_LEVELS = {
    'DEBUG': logging.DEBUG,
    'INFO': logging.INFO,
    'WARNING': logging.WARNING,
    'ERROR': logging.ERROR,
    'CRITICAL': logging.CRITICAL
}

# Configurar logger raiz
logger = logging.getLogger('backend')
logger.setLevel(LOG_LEVELS.get(LOG_LEVEL, logging.INFO))

# Remover handlers existentes para evitar duplicação
if logger.handlers:
    logger.handlers.clear()

# Handler para arquivo com rotação (10MB, manter 5 backups)
file_handler = RotatingFileHandler(
    LOG_FILE_PATH,
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5,
    encoding='utf-8'
)


class JsonFormatter(logging.Formatter):
    """Formata logs como JSON para Loki processar via pipeline de estágio JSON"""

    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname.lower(),
            'logger': record.name,
            'message': record.getMessage(),
        }

        # Adicionar dados extras se fornecidos
        if hasattr(record, 'data') and record.data:
            log_data.update(record.data)

        return json.dumps(log_data)


# Aplicar formatador JSON ao handler
file_handler.setFormatter(JsonFormatter())
logger.addHandler(file_handler)

# Opcionalmente, adicionar console handler em ambiente de desenvolvimento
if os.environ.get('FLASK_ENV') == 'development':
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(JsonFormatter())
    logger.addHandler(console_handler)


def log_with_context(level=logging.INFO, **kwargs):
    """
    Adiciona contexto adicional aos logs
    """
    def add_context(message, **ctx):
        record = logging.LogRecord(
            name=logger.name,
            level=level,
            pathname=__file__,
            lineno=0,
            msg=message,
            args=(),
            exc_info=None
        )
        record.data = ctx
        return logger.handle(record)

    return add_context

# Funções de log para diferentes níveis


def debug(message, **kwargs):
    log_with_context(logging.DEBUG, **kwargs)(message)


def info(message, **kwargs):
    log_with_context(logging.INFO, **kwargs)(message)


def warning(message, **kwargs):
    log_with_context(logging.WARNING, **kwargs)(message)


def error(message, **kwargs):
    log_with_context(logging.ERROR, **kwargs)(message)


def critical(message, **kwargs):
    log_with_context(logging.CRITICAL, **kwargs)(message)


def log_request(func):
    """
    Decorator para registrar requisições HTTP com latência
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        from flask import request

        start_time = time.time()

        try:
            response = func(*args, **kwargs)
            status_code = response.status_code
        except Exception as e:
            # Em caso de exceção, registrar erro e re-lançar
            end_time = time.time()
            # Converter para milissegundos
            latency = (end_time - start_time) * 1000

            error(
                f"Erro na requisição {request.method} {request.path}",
                method=request.method,
                path=request.path,
                latency=latency,
                error=str(e),
                status=500
            )
            raise

        # Calcular latência após a resposta
        end_time = time.time()
        # Converter para milissegundos
        latency = (end_time - start_time) * 1000

        # Registrar informações da requisição
        log_level = logging.WARNING if status_code >= 400 else logging.INFO
        log_with_context(
            log_level,
            method=request.method,
            path=request.path,
            status=status_code,
            latency=latency,
            ip=request.remote_addr,
            user_agent=request.user_agent.string if request.user_agent else None
        )(f"{request.method} {request.path} {status_code} - {latency:.2f}ms")

        return response

    return wrapper
