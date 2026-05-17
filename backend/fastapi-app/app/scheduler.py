"""Background task scheduler for account purging and data export."""

import json
import logging
import os
from datetime import datetime, timezone

import aiofiles
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import delete, select

from app.database import SessionLocal
from app.models import (
    Comment,
    DataPrivacyLog,
    DoubleDateAcceptance,
    DoubleDateSession,
    Event,
    EventRSVP,
    Match,
    Message,
    Post,
    Profile,
    Swipe,
    User,
    VerificationEvent,
    VideoCall,
    VolunteerSignup,
)
from app.models import WebhookRetryQueue, WebhookDeadLetter
from app import webhook_retry
logger = logging.getLogger(__name__)

EXPORTS_DIR = "exports"
os.makedirs(EXPORTS_DIR, exist_ok=True)


async def purge_deleted_accounts():
    """Permanent deletion of accounts marked for deletion > 30 days ago."""
    now = datetime.now(timezone.utc)

    async with SessionLocal() as db:
        query = select(DataPrivacyLog).where(
            DataPrivacyLog.action == "delete_requested",
            DataPrivacyLog.status == "pending",
            DataPrivacyLog.scheduled_for.is_not(None),
            DataPrivacyLog.scheduled_for <= now,
        )
        logs = (await db.scalars(query)).all()

        if not logs:
            return

        logger.info(f"Purging {len(logs)} accounts scheduled for deletion.")

        for log in logs:
            user_id = log.user_id

            # Clear direct dependencies first
            await db.execute(delete(Message).where(Message.sender_id == user_id))
            await db.execute(delete(VideoCall).where(VideoCall.initiator_id == user_id))
            await db.execute(
                delete(VolunteerSignup).where(VolunteerSignup.user_id == user_id)
            )
            await db.execute(delete(EventRSVP).where(EventRSVP.user_id == user_id))
            await db.execute(delete(Swipe).where(Swipe.user_id == user_id))
            await db.execute(delete(Post).where(Post.author_id == user_id))
            await db.execute(delete(Comment).where(Comment.author_id == user_id))
            await db.execute(
                delete(VerificationEvent).where(VerificationEvent.user_id == user_id)
            )

            # Double date cascade
            match_ids_query = select(Match.id).where(
                (Match.user_a == user_id) | (Match.user_b == user_id)
            )
            match_ids = (await db.scalars(match_ids_query)).all()

            if match_ids:
                await db.execute(
                    delete(DoubleDateAcceptance).where(
                        DoubleDateAcceptance.match_id.in_(match_ids)
                    )
                )
                await db.execute(
                    delete(DoubleDateSession).where(
                        (DoubleDateSession.match_a_id.in_(match_ids))
                        | (DoubleDateSession.match_b_id.in_(match_ids))
                    )
                )
                await db.execute(delete(Match).where(Match.id.in_(match_ids)))

            await db.execute(delete(Event).where(Event.organizer_id == user_id))
            await db.execute(delete(Profile).where(Profile.user_id == user_id))
            await db.execute(delete(User).where(User.id == user_id))

            log.status = "completed"

        await db.commit()


async def process_data_exports():
    """Generate JSON data exports for users who requested them."""
    async with SessionLocal() as db:
        query = select(DataPrivacyLog).where(
            DataPrivacyLog.action == "export_requested",
            DataPrivacyLog.status == "pending",
        )
        logs = (await db.scalars(query)).all()

        for log in logs:
            user_id = log.user_id
            logger.info(f"Generating data export for user {user_id}")

            user = await db.get(User, user_id)
            if not user:
                log.status = "failed"
                continue

            profile = await db.scalar(select(Profile).where(Profile.user_id == user_id))
            messages = (
                await db.scalars(select(Message).where(Message.sender_id == user_id))
            ).all()
            matches = (
                await db.scalars(
                    select(Match).where(
                        (Match.user_a == user_id) | (Match.user_b == user_id)
                    )
                )
            ).all()

            export_data = {
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "display_name": user.display_name,
                    "created_at": (
                        user.created_at.isoformat() if user.created_at else None
                    ),
                },
                "profile": (
                    {
                        "bio": profile.bio if profile else None,
                        "interests": profile.interests if profile else [],
                        "location": profile.location if profile else None,
                    }
                    if profile
                    else None
                ),
                "messages_sent": [
                    {
                        "id": str(m.id),
                        "match_id": str(m.match_id),
                        "content": m.content,
                        "created_at": m.created_at.isoformat(),
                    }
                    for m in messages
                ],
                "matches": [
                    {
                        "id": str(m.id),
                        "user_a": str(m.user_a),
                        "user_b": str(m.user_b),
                        "matched_at": m.matched_at.isoformat(),
                    }
                    for m in matches
                ],
                "exported_at": datetime.now(timezone.utc).isoformat(),
            }

            filename = f"export_{user_id}_{log.id}.json"
            filepath = os.path.join(EXPORTS_DIR, filename)

            try:
                async with aiofiles.open(filepath, mode="w") as f:
                    await f.write(json.dumps(export_data, indent=2))
                log.status = "completed"
                logger.info(f"Export completed: {filepath}")
            except Exception as e:
                logger.error(f"Failed to write export file: {e}")
                log.status = "failed"

        await db.commit()


def setup_scheduler():
    """Initialize and start the background scheduler."""
    scheduler = AsyncIOScheduler()
    scheduler.add_job(purge_deleted_accounts, "cron", hour=3)
    scheduler.add_job(process_data_exports, "interval", hours=1)
    scheduler.add_job(webhook_retry.scheduled_retry_task, "interval", minutes=1)
    scheduler.start()
    logger.info("Background scheduler started.")
    return scheduler
