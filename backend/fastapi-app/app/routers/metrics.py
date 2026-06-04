"""Prometheus metrics endpoint for the ANTIGRAVITY platform."""

import logging

from fastapi import APIRouter

from app.monitoring import get_metrics_response

logger = logging.getLogger("youandinotai.metrics")

router = APIRouter()


@router.get("/metrics")
async def prometheus_metrics():
    """Expose Prometheus metrics for scraping.

    Returns metrics in Prometheus text format including:
    - youandinotai_http_requests_total: Total HTTP requests (labeled by method, endpoint, status_code)
    - youandinotai_http_request_duration_seconds: Request duration histogram (labeled by method, endpoint)
    - youandinotai_http_requests_in_progress: Currently in-flight requests gauge
    """
    response = get_metrics_response()
    if response is None:
        from fastapi.responses import PlainTextResponse

        return PlainTextResponse(
            content="# Prometheus metrics not available (prometheus-client not installed)\n",
            status_code=503,
        )
    return response
