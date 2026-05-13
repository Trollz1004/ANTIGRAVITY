"""Compatibility tests for legacy webhook_events schemas."""

import asyncio
from pathlib import Path

from sqlalchemy import Boolean, Column, DateTime, JSON, MetaData, String, Table, func
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.webhook_event_store import (
    create_webhook_event,
    get_webhook_event_schema,
    mark_webhook_event_processed,
    recent_processed_payment_payloads,
    webhook_event_exists,
)


def test_legacy_webhook_event_schema_supports_payment_audit(tmp_path: Path):
    db_path = tmp_path / "legacy-webhook-events.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path.as_posix()}")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    legacy_table = Table(
        "webhook_events",
        MetaData(),
        Column("id", String(36), primary_key=True),
        Column("stripe_event_id", String(255), nullable=False, unique=True),
        Column("event_type", String(100), nullable=False),
        Column("payload", JSON, nullable=False),
        Column("processed", Boolean, nullable=False, server_default="0"),
        Column(
            "created_at",
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
        ),
    )

    async def scenario() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(legacy_table.metadata.create_all)

        async with session_factory() as session:
            schema = await get_webhook_event_schema(session)
            assert schema is not None
            assert schema.external_id_column == "stripe_event_id"
            assert schema.has_event_source is False

            assert await webhook_event_exists(session, "evt_legacy_1") is False

            await create_webhook_event(
                session,
                event_id="evt_legacy_1",
                event_type="payment.completed",
                payload={
                    "data": {
                        "object": {
                            "payment": {
                                "id": "pay_legacy_1",
                                "source_type": "CARD",
                                "card_details": {
                                    "card": {"card_brand": "VISA"},
                                },
                            }
                        }
                    }
                },
                processed=False,
            )
            await session.commit()

            assert await webhook_event_exists(session, "evt_legacy_1") is True

            await mark_webhook_event_processed(session, "evt_legacy_1")
            await session.commit()

            payloads = await recent_processed_payment_payloads(session)
            assert len(payloads) == 1
            assert payloads[0]["data"]["object"]["payment"]["id"] == "pay_legacy_1"

        await engine.dispose()

    asyncio.run(scenario())
