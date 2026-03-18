"""Background task scheduler for account purging and data export."""

import asyncio
from datetime import datetime, timedelta, timezone
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import SessionLocal
from app.models import User, DataPrivacyLog

logger = logging.getLogger(__name__)

async def purge_deleted_accounts():
    """Permanent deletion of accounts marked for deletion > 30 days ago."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    
    async with SessionLocal() as db:
        # Find logs for deletion requests older than 30 days
        query = select(DataPrivacyLog.user_id).where(
            DataPrivacyLog.action == "delete_requested",
            DataPrivacyLog.created_at <= cutoff
        )
        user_ids = (await db.scalars(query)).all()
        
        if user_ids:
            logger.info(f"Purging {len(user_ids)} accounts scheduled for deletion.")
            # Perform cascading delete or manual cleanup if needed
            # For now, we assume CASCADE on ForeignKey is set in models
            await db.execute(delete(User).where(User.id.in_(user_ids)))
            await db.commit()

async def process_data_exports():
    """Placeholder for data export generation worker."""
    # In a real app, this would query DataPrivacyLog for 'export_requested',
    # generate a JSON file, and send it via email.
    pass

def setup_scheduler():
    """Initialize and start the background scheduler."""
    scheduler = AsyncIOScheduler()
    
    # Run account purge check daily at 3 AM
    scheduler.add_job(purge_deleted_accounts, 'cron', hour=3)
    
    # Check for export requests every hour
    scheduler.add_job(process_data_exports, 'interval', hours=1)
    
    scheduler.start()
    logger.info("Background scheduler started.")
    return scheduler
