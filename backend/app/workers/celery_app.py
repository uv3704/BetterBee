"""
BetterBee — Celery Application Config.

Configures Celery with Redis broker and task routing for background document parsing/vectorization.
"""

from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "betterbee-workers",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks.process_document"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    worker_prefetch_multiplier=1,
)

from celery.signals import worker_ready


@worker_ready.connect
def on_worker_ready(**kwargs):
    print("\n✓ Celery Worker Ready\n")
