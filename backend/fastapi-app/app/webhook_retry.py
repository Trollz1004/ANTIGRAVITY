"""Webhook retry queue with exponential backoff and dead-letter handling.

Provides:
  - Database-backed retry queue for failed webhook events
  - Exponential backoff: 1s, 2s, 4s, 8s, 16s (configurable max retries, default 5)
  - Dead-letter table for events that exhaust all retries
  - Background task (APScheduler) that processes the retry queue
  - Manual retry endpoint: POST /api/v1/webhooks/retry/{event_id}
  - Dead-letter list endpoint: GET /api/v1/webhooks/dead-letter
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy import (
    Boolean,
    DateTime,
    Index,
    Integer,
    String,
    Text,
    select,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, SessionLocal, get_db
from app.webhook_event_store import create_webhook_event

logger = logging.getLogger(__name__)

# ── Configuration ──

MAX_RETRIES = 5
BASE_BACKOFF_SECONDS = 1  # exponential: 1, 2, 4, 8, 16


# ── ORM Models ──


class WebhookRetryQueue(Base):
    """Database-backed retry queue for failed webhook events."""

    __tablename__ = "webhook_retry_queue"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_source: Mapped[str] = mapped_column(
        String(50), default="square", nullable=False
    )
    payload: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # JSON-serialized payload
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(
        Integer, default=MAX_RETRIES, nullable=False
    )
    next_retry_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    moved_to_dead_letter: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    __table_args__ = (
        Index(
            "ix_webhook_retry_queue_next_retry", "next_retry_at", "moved_to_dead_letter"
        ),
    )


class WebhookDeadLetter(Base):
    """Dead-letter table for webhook events that exhausted all retries."""

    __tablename__ = "webhook_dead_letter"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_source: Mapped[str] = mapped_column(
        String(50), default="square", nullable=False
    )
    payload: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # JSON-serialized payload
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False)
    final_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    moved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


# ── Pydantic Schemas ──


class RetryQueueEntryResponse(BaseModel):
    id: str
    event_id: str
    event_type: str
    event_source: str
    retry_count: int
    max_retries: int
    next_retry_at: datetime
    last_error: str | None
    created_at: datetime


class DeadLetterEntryResponse(BaseModel):
    id: str
    event_id: str
    event_type: str
    event_source: str
    retry_count: int
    final_error: str | None
    created_at: datetime
    moved_at: datetime


class RetryEnqueueResponse(BaseModel):
    enqueued: bool
    event_id: str
    retry_count: int
    next_retry_at: str


# ── Helper Functions ──


def _compute_next_retry_time(retry_count: int) -> datetime:
    """Compute the next retry time using exponential backoff."""
    delay = BASE_BACKOFF_SECONDS * (2**retry_count)
    return datetime.now(timezone.utc) + timedelta(seconds=delay)


# ── Core Operations ──


async def enqueue_retry(
    db: AsyncSession,
    *,
    event_id: str,
    event_type: str,
    payload: dict[str, Any],
    event_source: str = "square",
    error_message: str | None = None,
) -> WebhookRetryQueue:
    """Enqueue a failed webhook event for retry.

    If the event is already in the retry queue, increments the retry count.
    If max retries exceeded, moves to dead-letter.
    """
    import json

    # Check if already in queue
    existing = await db.scalar(
        select(WebhookRetryQueue).where(
            WebhookRetryQueue.event_id == event_id,
            WebhookRetryQueue.moved_to_dead_letter.is_(False),
        )
    )

    if existing:
        existing.retry_count += 1
        existing.last_error = error_message
        existing.updated_at = datetime.now(timezone.utc)

        if existing.retry_count >= existing.max_retries:
            # Move to dead-letter
            dead = WebhookDeadLetter(
                event_id=existing.event_id,
                event_type=existing.event_type,
                event_source=existing.event_source,
                payload=existing.payload,
                retry_count=existing.retry_count,
                final_error=error_message,
            )
            db.add(dead)
            existing.moved_to_dead_letter = True
            logger.warning(
                "Webhook event %s moved to dead-letter after %d retries: %s",
                event_id,
                existing.retry_count,
                error_message,
            )
        else:
            existing.next_retry_at = _compute_next_retry_time(existing.retry_count)
            logger.info(
                "Webhook event %s retry count incremented to %d, next retry at %s",
                event_id,
                existing.retry_count,
                existing.next_retry_at,
            )
        await db.flush()
        return existing

    # Create new retry entry
    retry_entry = WebhookRetryQueue(
        event_id=event_id,
        event_type=event_type,
        event_source=event_source,
        payload=json.dumps(payload),
        retry_count=0,
        max_retries=MAX_RETRIES,
        next_retry_at=_compute_next_retry_time(0),
        last_error=error_message,
    )
    db.add(retry_entry)
    await db.flush()
    logger.info(
        "Webhook event %s enqueued for retry (attempt 1/%d)", event_id, MAX_RETRIES
    )
    return retry_entry


async def process_retry_queue(db: AsyncSession) -> list[str]:
    """Process all due entries in the retry queue.

    Returns list of event_ids that were processed (success or moved to dead-letter).
    """
    import json

    now = datetime.now(timezone.utc)
    due_entries = await db.scalars(
        select(WebhookRetryQueue).where(
            WebhookRetryQueue.next_retry_at <= now,
            WebhookRetryQueue.moved_to_dead_letter.is_(False),
        )
    )

    processed: list[str] = []

    for entry in due_entries:
        try:
            # Attempt to re-process the webhook event
            payload_dict = json.loads(entry.payload)
            await create_webhook_event(
                db,
                event_id=f"{entry.event_id}_retry_{entry.retry_count + 1}",
                event_type=entry.event_type,
                payload=payload_dict,
                processed=False,
                event_source=entry.event_source,
            )

            # Success — remove from queue
            logger.info(
                "Retry succeeded for webhook event %s (attempt %d)",
                entry.event_id,
                entry.retry_count + 1,
            )
            await db.delete(entry)
            processed.append(entry.event_id)

        except Exception as exc:
            error_msg = str(exc)
            entry.retry_count += 1
            entry.last_error = error_msg
            entry.updated_at = datetime.now(timezone.utc)

            if entry.retry_count >= entry.max_retries:
                # Move to dead-letter
                dead = WebhookDeadLetter(
                    event_id=entry.event_id,
                    event_type=entry.event_type,
                    event_source=entry.event_source,
                    payload=entry.payload,
                    retry_count=entry.retry_count,
                    final_error=error_msg,
                )
                db.add(dead)
                entry.moved_to_dead_letter = True
                logger.warning(
                    "Webhook event %s exhausted retries (%d), moved to dead-letter: %s",
                    entry.event_id,
                    entry.retry_count,
                    error_msg,
                )
            else:
                entry.next_retry_at = _compute_next_retry_time(entry.retry_count)
                logger.info(
                    "Webhook event %s retry %d failed, next retry at %s: %s",
                    entry.event_id,
                    entry.retry_count,
                    entry.next_retry_at,
                    error_msg,
                )

            processed.append(entry.event_id)

    await db.flush()
    return processed


async def manual_retry(db: AsyncSession, event_id: str) -> WebhookRetryQueue:
    """Manually retry a webhook event by event_id.

    Works for events in the retry queue or dead-letter table.
    """

    # Check retry queue first
    entry = await db.scalar(
        select(WebhookRetryQueue).where(
            WebhookRetryQueue.event_id == event_id,
            WebhookRetryQueue.moved_to_dead_letter.is_(False),
        )
    )

    if not entry:
        # Check dead-letter
        dead = await db.scalar(
            select(WebhookDeadLetter).where(WebhookDeadLetter.event_id == event_id)
        )
        if dead:
            # Re-enqueue from dead-letter
            entry = WebhookRetryQueue(
                event_id=dead.event_id,
                event_type=dead.event_type,
                event_source=dead.event_source,
                payload=dead.payload,
                retry_count=0,
                max_retries=MAX_RETRIES,
                next_retry_at=_compute_next_retry_time(0),
                last_error=None,
            )
            db.add(entry)
            # Remove from dead-letter
            await db.delete(dead)
            await db.flush()
            logger.info(
                "Webhook event %s re-enqueued from dead-letter (manual retry)", event_id
            )
            return entry
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No retry queue or dead-letter entry found for event_id: {event_id}",
            )

    # Reset retry count and process immediately
    entry.retry_count = 0
    entry.next_retry_at = datetime.now(timezone.utc)
    entry.last_error = None
    entry.updated_at = datetime.now(timezone.utc)
    await db.flush()
    logger.info("Webhook event %s manually retried (reset to attempt 0)", event_id)
    return entry


async def get_dead_letter_entries(
    db: AsyncSession, *, limit: int = 50, offset: int = 0
) -> list[WebhookDeadLetter]:
    """List dead-letter entries, most recent first."""
    entries = await db.scalars(
        select(WebhookDeadLetter)
        .order_by(WebhookDeadLetter.moved_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(entries.all())


async def get_retry_queue_entries(
    db: AsyncSession, *, limit: int = 50, offset: int = 0
) -> list[WebhookRetryQueue]:
    """List active retry queue entries, ordered by next retry time."""
    entries = await db.scalars(
        select(WebhookRetryQueue)
        .where(WebhookRetryQueue.moved_to_dead_letter.is_(False))
        .order_by(WebhookRetryQueue.next_retry_at.asc())
        .limit(limit)
        .offset(offset)
    )
    return list(entries.all())


# ── Background Task ──


async def scheduled_retry_task():
    """Background task that processes the retry queue.

    Designed to be called from APScheduler.
    """

    async with SessionLocal() as db:
        try:
            processed = await process_retry_queue(db)
            if processed:
                await db.commit()
                logger.info("Retry task processed %d events", len(processed))
            else:
                await db.rollback()
        except Exception as exc:
            await db.rollback()
            logger.error("Retry task failed: %s", exc, exc_info=True)


# ── Router ──

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
security = HTTPBearer()


async def _require_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    from app.auth import get_current_user

    return await get_current_user(credentials=credentials, db=db)


@router.post("/retry/{event_id}")
async def retry_webhook_event(
    event_id: str,
    _current_user=Depends(_require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Manually retry a failed webhook event.

    Works for events in the retry queue or dead-letter table.
    Resets the retry count and schedules immediate processing.
    """
    entry = await manual_retry(db, event_id)
    await db.commit()
    return {
        "status": "ok",
        "event_id": entry.event_id,
        "retry_count": entry.retry_count,
        "next_retry_at": entry.next_retry_at.isoformat(),
    }


@router.get("/dead-letter")
async def list_dead_letter(
    limit: int = 50,
    offset: int = 0,
    _current_user=Depends(_require_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """List webhook events that exhausted all retries and were moved to dead-letter."""
    entries = await get_dead_letter_entries(db, limit=limit, offset=offset)
    return [
        {
            "id": str(e.id),
            "event_id": e.event_id,
            "event_type": e.event_type,
            "event_source": e.event_source,
            "retry_count": e.retry_count,
            "final_error": e.final_error,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "moved_at": e.moved_at.isoformat() if e.moved_at else None,
        }
        for e in entries
    ]


@router.get("/retry-queue")
async def list_retry_queue(
    limit: int = 50,
    offset: int = 0,
    _current_user=Depends(_require_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """List active webhook events in the retry queue."""
    entries = await get_retry_queue_entries(db, limit=limit, offset=offset)
    return [
        {
            "id": str(e.id),
            "event_id": e.event_id,
            "event_type": e.event_type,
            "event_source": e.event_source,
            "retry_count": e.retry_count,
            "max_retries": e.max_retries,
            "next_retry_at": e.next_retry_at.isoformat() if e.next_retry_at else None,
            "last_error": e.last_error,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in entries
    ]
