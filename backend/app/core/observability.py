"""
Inicialización de Sentry (errores): opcional, env-gated.

Variables:
- SENTRY_DSN          → activa Sentry. Sin esto, no se carga.
- SENTRY_TRACES_RATE  → fracción 0..1 de requests muestreados (default: 0).
- SENTRY_ENV          → tag de entorno (default: ENVIRONMENT).
"""
import os
import logging

logger = logging.getLogger(__name__)


def init_sentry() -> bool:
    """Retorna True si Sentry quedó activo."""
    dsn = os.getenv("SENTRY_DSN", "").strip()
    if not dsn:
        return False
    try:
        import sentry_sdk  # type: ignore
        from sentry_sdk.integrations.fastapi import FastApiIntegration  # type: ignore
        from sentry_sdk.integrations.starlette import StarletteIntegration  # type: ignore
    except ImportError:
        logger.warning("SENTRY_DSN configurado pero `sentry-sdk` no instalado")
        return False

    sentry_sdk.init(
        dsn=dsn,
        environment=os.getenv("SENTRY_ENV", os.getenv("ENVIRONMENT", "development")),
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_RATE", "0")),
        profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_RATE", "0")),
        send_default_pii=False,  # no PII por defecto
        integrations=[StarletteIntegration(), FastApiIntegration()],
    )
    logger.info("Sentry inicializado")
    return True
