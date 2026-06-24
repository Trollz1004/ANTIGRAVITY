"""Schema-aware access helpers for webhook_events.

Production has older webhook_events tables that still use `alternate processor_event_id`,
while newer local databases use `event_source_id` + `event_source`.
These helpers keep runtime behavior compatible with either layout.
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy import MetaData, Table, desc, insert, select, update
from sqlalchemy.exc import NoSuchTableError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import WebhookEvent


@dataclass(frozen=True)
class WebhookEventSchema:
    table: Table
    columns: frozenset[str]
    external_id_column: str

    @property
    def has_event_source(self) -> bool:
        return "event_source" in self.columns

    @property
    def has_created_at(self) -> bool:
        return "created_at" in self.columns


async def get_webhook_event_schema(
    db: AsyncSession,
) -> WebhookEventSchema | None:
    connection = await db.connection()

    def _load(sync_connection) -> WebhookEventSchema | None:
        metadata = MetaData()
        try:
            table = Table("webhook_events", metadata, autoload_with=sync_connection)
        except NoSuchTableError:
            return None

        columns = frozenset(column.name for column in table.columns)
        external_id_column = (
            "event_source_id"
            if "event_source_id" in columns
            else "alternate processor_event_id"
        )
        return WebhookEventSchema(
            table=table,
            columns=columns,
            external_id_column=external_id_column,
        )

    return await connection.run_sync(_load)


async def webhook_event_exists(db: AsyncSession, event_id: str) -> bool:
    schema = await get_webhook_event_schema(db)
    if not schema:
        return False
    if schema.external_id_column == "event_source_id":
        return (
            await db.scalar(
                select(WebhookEvent.id).where(WebhookEvent.event_source_id == event_id)
            )
        ) is not None

    stmt = (
        select(schema.table.c.id)
        .where(schema.table.c[schema.external_id_column] == event_id)
        .limit(1)
    )
    return (await db.execute(stmt)).scalar_one_or_none() is not None


async def create_webhook_event(
    db: AsyncSession,
    *,
    event_id: str,
    event_type: str,
    payload: dict[str, Any],
    processed: bool,
    event_source: str = "square",
    retry_parent_event_id: str | None = None,
) -> None:
    schema = await get_webhook_event_schema(db)
    if not schema:
        raise RuntimeError("webhook_events table is not available")
    if schema.external_id_column == "event_source_id":
        db.add(
            WebhookEvent(
                event_source_id=event_id,
                event_source=event_source,
                event_type=event_type,
                payload=payload,
                processed=processed,
                retry_parent_event_id=retry_parent_event_id,
            )
        )
        return

    id_value: object = uuid.uuid4()
    bind = db.get_bind()
    if bind is not None and bind.dialect.name == "sqlite":
        id_value = str(id_value)
    else:
        try:
            if schema.table.c.id.type.python_type is str:
                id_value = str(id_value)
        except (AttributeError, NotImplementedError):
            pass

    values: dict[str, Any] = {
        "id": id_value,
        schema.external_id_column: event_id,
        "event_type": event_type,
        "payload": payload,
        "processed": processed,
    }
    if schema.has_event_source:
        values["event_source"] = event_source

    await db.execute(insert(schema.table).values(**values))


async def mark_webhook_event_processed(db: AsyncSession, event_id: str) -> None:
    schema = await get_webhook_event_schema(db)
    if not schema:
        return
    if schema.external_id_column == "event_source_id":
        event = await db.scalar(
            select(WebhookEvent).where(WebhookEvent.event_source_id == event_id)
        )
        if event is not None:
            event.processed = True
        return

    stmt = (
        update(schema.table)
        .where(schema.table.c[schema.external_id_column] == event_id)
        .values(processed=True)
    )
    await db.execute(stmt)


def _coerce_payload(payload: object) -> dict[str, Any] | None:
    if isinstance(payload, dict):
        return payload
    if isinstance(payload, str):
        try:
            decoded = json.loads(payload)
        except json.JSONDecodeError:
            return None
        return decoded if isinstance(decoded, dict) else None
    return None


async def recent_processed_payment_payloads(
    db: AsyncSession,
    *,
    limit: int = 25,
    event_type: str = "payment.completed",
    event_source: str = "square",
) -> list[dict[str, Any]]:
    schema = await get_webhook_event_schema(db)
    if not schema:
        return []
    if schema.external_id_column == "event_source_id":
        rows = await db.scalars(
            select(WebhookEvent)
            .where(WebhookEvent.event_source == event_source)
            .where(WebhookEvent.event_type == event_type)
            .where(WebhookEvent.processed.is_(True))
            .order_by(desc(WebhookEvent.created_at))
            .limit(limit)
        )
        return [
            payload for event in rows if isinstance((payload := event.payload), dict)
        ]

    stmt = select(schema.table.c.payload).where(schema.table.c.event_type == event_type)
    if "processed" in schema.columns:
        stmt = stmt.where(schema.table.c.processed.is_(True))
    if schema.has_event_source:
        stmt = stmt.where(schema.table.c.event_source == event_source)
    if schema.has_created_at:
        stmt = stmt.order_by(desc(schema.table.c.created_at))
    stmt = stmt.limit(limit)

    payloads = (await db.execute(stmt)).scalars().all()
    coerced: list[dict[str, Any]] = []
    for payload in payloads:
        item = _coerce_payload(payload)
        if item is not None:
            coerced.append(item)
    return coerced
