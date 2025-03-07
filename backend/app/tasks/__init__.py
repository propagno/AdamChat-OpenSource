from celery import Celery
import os
from flask import Flask


def make_celery(app: Flask):
    """
    Cria e configura um objeto Celery para tarefas assíncronas

    Args:
        app: A aplicação Flask

    Returns:
        Uma instância de Celery configurada
    """
    celery = Celery(
        app.import_name,
        backend=os.environ.get('CELERY_RESULT_BACKEND',
                               'redis://localhost:6379/0'),
        broker=os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    )

    celery.conf.update(
        result_expires=3600,  # Resultados expiram após 1 hora
        worker_prefetch_multiplier=1,  # 1 tarefa por worker por vez
        task_acks_late=True,  # Ack após execução para evitar perda em caso de falha
        task_time_limit=1800,  # Tempo limite de 30 minutos por tarefa
        task_soft_time_limit=1500,  # Aviso de tempo limite em 25 minutos
        # Número de workers simultâneos
        worker_concurrency=os.environ.get('CELERY_CONCURRENCY', 4),
    )

    # Adiciona a app Flask como contexto para as tarefas
    TaskBase = celery.Task

    class ContextTask(TaskBase):
        abstract = True

        def __call__(self, *args, **kwargs):
            with app.app_context():
                return TaskBase.__call__(self, *args, **kwargs)

    celery.Task = ContextTask

    return celery
