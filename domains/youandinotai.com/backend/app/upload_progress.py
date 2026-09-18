"""In-memory upload progress tracker for chunked and standard uploads."""

import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger("youandinotai.api.upload_progress")

# How long to keep completed/failed entries before auto-cleanup (seconds)
CLEANUP_THRESHOLD_SECONDS = 3600  # 1 hour


@dataclass
class UploadProgress:
    """Tracks the state of a single upload."""

    upload_id: str
    total_bytes: int
    uploaded_bytes: int = 0
    filename: str = ""
    status: str = "uploading"  # uploading | processing | done | failed
    started_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    error: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


# In-memory store: upload_id -> UploadProgress
_store: dict[str, UploadProgress] = {}
_cleanup_task: asyncio.Task | None = None


async def _periodic_cleanup() -> None:
    """Background task that purges entries older than CLEANUP_THRESHOLD_SECONDS."""
    while True:
        await asyncio.sleep(300)  # run every 5 minutes
        now = time.time()
        to_remove = [
            uid
            for uid, prog in _store.items()
            if prog.status in ("done", "failed")
            and (now - prog.updated_at) > CLEANUP_THRESHOLD_SECONDS
        ]
        for uid in to_remove:
            del _store[uid]
        if to_remove:
            logger.debug("Cleaned up %d stale upload progress entries", len(to_remove))


def _ensure_cleanup_started() -> None:
    """Lazily start the background cleanup coroutine."""
    global _cleanup_task
    if _cleanup_task is None:
        try:
            loop = asyncio.get_running_loop()
            _cleanup_task = loop.create_task(_periodic_cleanup())
        except RuntimeError:
            pass  # no running loop yet; cleanup will be best-effort


def create_upload(total_bytes: int, filename: str, **metadata: Any) -> str:
    """Register a new upload and return its unique ID.

    Args:
        total_bytes: Expected total size of the upload in bytes.
        filename: Original filename for display.
        **metadata: Optional extra metadata to attach.

    Returns:
        A unique upload_id string.
    """
    upload_id = str(uuid.uuid4())
    _store[upload_id] = UploadProgress(
        upload_id=upload_id,
        total_bytes=total_bytes,
        filename=filename,
        status="uploading",
        metadata=metadata,
    )
    _ensure_cleanup_started()
    logger.info("Created upload %s for %s (%d bytes)", upload_id, filename, total_bytes)
    return upload_id


def update_progress(upload_id: str, bytes_uploaded: int) -> UploadProgress | None:
    """Add *bytes_uploaded* to the running total for *upload_id*.

    Args:
        upload_id: The upload to update.
        bytes_uploaded: Number of bytes received in this chunk.

    Returns:
        The updated UploadProgress, or None if the ID is unknown.
    """
    prog = _store.get(upload_id)
    if prog is None:
        return None
    prog.uploaded_bytes += bytes_uploaded
    prog.updated_at = time.time()
    return prog


def set_uploaded_bytes(upload_id: str, uploaded_bytes: int) -> UploadProgress | None:
    """Set the absolute uploaded byte count for *upload_id*.

    Args:
        upload_id: The upload to update.
        uploaded_bytes: Absolute number of bytes received so far.

    Returns:
        The updated UploadProgress, or None if the ID is unknown.
    """
    prog = _store.get(upload_id)
    if prog is None:
        return None
    prog.uploaded_bytes = uploaded_bytes
    prog.updated_at = time.time()
    return prog


def get_progress(upload_id: str) -> UploadProgress | None:
    """Return the current progress for *upload_id*, or None if not found."""
    return _store.get(upload_id)


def complete_upload(upload_id: str) -> UploadProgress | None:
    """Mark an upload as successfully completed."""
    prog = _store.get(upload_id)
    if prog is None:
        return None
    prog.status = "done"
    prog.uploaded_bytes = prog.total_bytes
    prog.updated_at = time.time()
    logger.info("Upload %s completed", upload_id)
    return prog


def fail_upload(upload_id: str, error: str) -> UploadProgress | None:
    """Mark an upload as failed with the given error message."""
    prog = _store.get(upload_id)
    if prog is None:
        return None
    prog.status = "failed"
    prog.error = error
    prog.updated_at = time.time()
    logger.warning("Upload %s failed: %s", upload_id, error)
    return prog


def set_processing(upload_id: str) -> UploadProgress | None:
    """Mark an upload as processing (post-upload validation/scanning)."""
    prog = _store.get(upload_id)
    if prog is None:
        return None
    prog.status = "processing"
    prog.updated_at = time.time()
    return prog


def remove_upload(upload_id: str) -> bool:
    """Remove an upload entry from the store entirely.

    Returns True if the entry existed and was removed.
    """
    if upload_id in _store:
        del _store[upload_id]
        logger.info("Removed upload %s", upload_id)
        return True
    return False


def get_all_active() -> list[UploadProgress]:
    """Return a list of uploads that are still in progress."""
    return [p for p in _store.values() if p.status in ("uploading", "processing")]
