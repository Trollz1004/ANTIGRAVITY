"""Tests for OpenTelemetry setup and tracer status."""

from unittest.mock import MagicMock, patch

import pytest

from app.telemetry import get_tracer_status, setup_telemetry


@patch("app.telemetry.FastAPIInstrumentor")
@patch("app.telemetry.SQLAlchemyInstrumentor")
@patch("app.telemetry.BatchSpanProcessor")
@patch("app.telemetry.OTLPSpanExporter")
@patch("app.telemetry.TracerProvider")
@patch("app.telemetry.trace")
def test_setup_telemetry_with_app_and_engine(
    mock_trace,
    mock_tracer_provider_cls,
    mock_exporter_cls,
    mock_processor_cls,
    mock_sqlalchemy_instr_cls,
    mock_fastapi_instr_cls,
):
    mock_tracer_provider = MagicMock()
    mock_tracer_provider_cls.return_value = mock_tracer_provider

    mock_app = MagicMock()
    mock_engine = MagicMock()
    mock_engine.sync_engine = MagicMock()

    result = setup_telemetry(app=mock_app, engine=mock_engine)

    mock_tracer_provider_cls.assert_called_once()
    mock_exporter_cls.assert_called_once_with(
        endpoint="http://localhost:4318/v1/traces"
    )
    mock_processor_cls.assert_called_once_with(mock_exporter_cls.return_value)
    mock_tracer_provider.add_span_processor.assert_called_once_with(
        mock_processor_cls.return_value
    )
    mock_trace.set_tracer_provider.assert_called_once_with(mock_tracer_provider)
    mock_fastapi_instr_cls.instrument_app.assert_called_once_with(mock_app)
    mock_sqlalchemy_instr_cls.return_value.instrument.assert_called_once_with(
        engine=mock_engine.sync_engine, enable_commenter=True
    )

    assert result["instrumented"]["fastapi"] is True
    assert result["instrumented"]["sqlalchemy"] is True


@patch("app.telemetry.FastAPIInstrumentor")
@patch("app.telemetry.SQLAlchemyInstrumentor")
@patch("app.telemetry.BatchSpanProcessor")
@patch("app.telemetry.OTLPSpanExporter")
@patch("app.telemetry.TracerProvider")
@patch("app.telemetry.trace")
def test_setup_telemetry_without_app_and_engine(
    mock_trace,
    mock_tracer_provider_cls,
    mock_exporter_cls,
    mock_processor_cls,
    mock_sqlalchemy_instr_cls,
    mock_fastapi_instr_cls,
):
    mock_tracer_provider = MagicMock()
    mock_tracer_provider_cls.return_value = mock_tracer_provider

    result = setup_telemetry()

    mock_fastapi_instr_cls.instrument_app.assert_not_called()
    mock_sqlalchemy_instr_cls.return_value.instrument.assert_not_called()

    assert result["instrumented"]["fastapi"] is False
    assert result["instrumented"]["sqlalchemy"] is False


@patch("app.telemetry.FastAPIInstrumentor")
@patch("app.telemetry.SQLAlchemyInstrumentor")
@patch("app.telemetry.BatchSpanProcessor")
@patch("app.telemetry.OTLPSpanExporter")
@patch("app.telemetry.TracerProvider")
@patch("app.telemetry.trace")
def test_setup_telemetry_engine_no_sync_engine(
    mock_trace,
    mock_tracer_provider_cls,
    mock_exporter_cls,
    mock_processor_cls,
    mock_sqlalchemy_instr_cls,
    mock_fastapi_instr_cls,
):
    mock_tracer_provider = MagicMock()
    mock_tracer_provider_cls.return_value = mock_tracer_provider

    mock_engine = MagicMock()
    del mock_engine.sync_engine

    setup_telemetry(engine=mock_engine)

    mock_sqlalchemy_instr_cls.return_value.instrument.assert_called_once_with(
        engine=mock_engine, enable_commenter=True
    )


@patch("app.telemetry.trace")
def test_get_tracer_status(mock_trace):
    mock_tracer_provider = MagicMock()
    mock_trace.get_tracer_provider.return_value = mock_tracer_provider
    mock_tracer_provider._active_span_processor = MagicMock()

    status = get_tracer_status()

    assert status["tracer_provider_type"] == "MagicMock"
    assert status["has_span_processor"] is True
