"""OpenTelemetry setup for the YouAndINotAI backend."""

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor


def setup_telemetry(app=None, engine=None):
    """Configure OpenTelemetry tracing for the application.

    Args:
        app: Optional FastAPI app instance to auto-instrument.
        engine: Optional SQLAlchemy async engine to instrument.

    Returns:
        dict with tracer status information.
    """
    resource = Resource.create({SERVICE_NAME: "youandinotai-api"})
    tracer_provider = TracerProvider(resource=resource)

    otlp_exporter = OTLPSpanExporter(
        endpoint="http://localhost:4318/v1/traces",
    )
    span_processor = BatchSpanProcessor(otlp_exporter)
    tracer_provider.add_span_processor(span_processor)

    trace.set_tracer_provider(tracer_provider)

    if app is not None:
        FastAPIInstrumentor.instrument_app(app)

    if engine is not None:
        # AsyncEngine cannot take event listeners directly; instrument its
        # underlying synchronous engine instead.
        target_engine = getattr(engine, "sync_engine", engine)
        SQLAlchemyInstrumentor().instrument(
            engine=target_engine,
            enable_commenter=True,
        )

    return {
        "service_name": "youandinotai-api",
        "endpoint": "http://localhost:4318/v1/traces",
        "instrumented": {
            "fastapi": app is not None,
            "sqlalchemy": engine is not None,
        },
    }


def get_tracer_status():
    """Return current tracer provider status for health checks."""
    tracer_provider = trace.get_tracer_provider()
    return {
        "tracer_provider_type": type(tracer_provider).__name__,
        "has_span_processor": hasattr(tracer_provider, "_active_span_processor"),
    }
