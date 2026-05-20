"""Secure file upload router with validation, size limits, virus scanning, and chunked uploads."""

import hashlib
import logging
import logging
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

import aiofiles
from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, Request, UploadFile
from fastapi.responses import JSONResponse

from app.auth import get_current_user
from app.config import get_settings
from app.upload_progress import (
    complete_upload,
    create_upload,
    fail_upload,
    get_progress,
    remove_upload,
    set_processing,
    set_uploaded_bytes,
    update_progress,
)

logger = logging.getLogger("youandinotai.api.uploads")
router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])
settings = get_settings()

# Directory for storing chunked upload temp files
_CHUNK_DIR = Path(tempfile.gettempdir()) / "upload_chunks"


def _get_chunk_dir(upload_id: str) -> Path:
    """Return (and create) the temporary directory for a chunked upload."""
    d = _CHUNK_DIR / upload_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def _get_file_magic_type(file_path: str) -> str | None:
    """Detect file MIME type using python-magic if available, else fallback to extension."""
    try:
        import magic

        return magic.from_file(file_path, mime=True)
    except ImportError:
        # Fallback to extension-based detection
        ext = Path(file_path).suffix.lower()
        mime_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".pdf": "application/pdf",
            ".txt": "text/plain",
        }
        return mime_map.get(ext)


async def _scan_virus(file_path: str) -> bool:
    """Scan file for viruses using ClamAV if enabled."""
    if not settings.clamav_enabled:
        logger.warning("Virus scanning disabled (ClamAV not enabled)")
        return True
    try:
        result = subprocess.run(
            ["clamscan", "--no-summary", file_path],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            return True
        logger.error("Virus detected in file", extra={"clamscan_output": result.stdout})
        return False
    except Exception as e:
        logger.error("Virus scan failed", extra={"error": str(e)})
        return False


def _parse_content_range(header_value: str | None) -> tuple[int, int, int] | None:
    """Parse a Content-Range header value.

    Expected format: bytes <start>-<end>/<total>
    Returns (start, end, total) or None if parsing fails.
    """
    if not header_value:
        return None
    m = re.match(r"bytes\s+(\d+)-(\d+)/(\d+|\*)", header_value.strip())
    if not m:
        return None
    start = int(m.group(1))
    end = int(m.group(2))
    total = int(m.group(3)) if m.group(3) != "*" else -1
    return start, end, total


# ---------------------------------------------------------------------------
# Standard (non-chunked) upload — now with progress tracking
# ---------------------------------------------------------------------------

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    user: dict[str, Any] = Depends(get_current_user),
) -> JSONResponse:
    """Secure file upload with validation, size limits, and virus scanning."""
    # Check file size (FastAPI doesn't enforce this automatically for streaming)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset pointer

    if file_size > settings.upload_max_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size: {settings.upload_max_size_mb}MB",
        )

    # Create progress tracker entry
    upload_id = create_upload(total_bytes=file_size, filename=file.filename or "unknown")

    # Create storage directory if not exists
    storage_path = Path(settings.upload_storage_path)
    storage_path.mkdir(parents=True, exist_ok=True)

    # Generate secure filename via streaming hash
    file_hash = hashlib.sha256()
    uploaded = 0
    while chunk := await file.read(8192):
        file_hash.update(chunk)
        uploaded += len(chunk)
        update_progress(upload_id, len(chunk))
    await file.seek(0)

    file_ext = Path(file.filename).suffix.lower() if file.filename else ""
    secure_filename = f"{file_hash.hexdigest()}{file_ext}"
    dest_path = storage_path / secure_filename

    # Save file temporarily for type detection and scanning
    temp_path = storage_path / f"temp_{secure_filename}"
    try:
        async with aiofiles.open(temp_path, "wb") as f:
            while chunk := await file.read(8192):
                await f.write(chunk)
    except Exception as e:
        fail_upload(upload_id, str(e))
        raise HTTPException(status_code=500, detail="Failed to save file") from e

    # Mark as processing (validation/scanning phase)
    set_processing(upload_id)

    # Validate file type
    detected_type = _get_file_magic_type(str(temp_path))
    if detected_type not in settings.upload_allowed_types_list:
        os.remove(temp_path)
        fail_upload(upload_id, f"File type {detected_type} not allowed")
        raise HTTPException(
            status_code=415,
            detail=f"File type {detected_type} not allowed. Allowed: {settings.upload_allowed_types}",
        )

    # Virus scan
    if not await _scan_virus(str(temp_path)):
        os.remove(temp_path)
        fail_upload(upload_id, "File failed virus scan")
        raise HTTPException(status_code=415, detail="File failed virus scan")

    # Move to final location
    os.rename(temp_path, dest_path)

    complete_upload(upload_id)

    logger.info(
        "File uploaded successfully",
        extra={
            "user_id": user.get("sub"),
            "secure_filename": secure_filename,
            "original_filename": file.filename,
            "size_bytes": file_size,
            "mime_type": detected_type,
        },
    )

    return JSONResponse(
        status_code=201,
        content={
            "id": secure_filename,
            "original_filename": file.filename,
            "size_bytes": file_size,
            "mime_type": detected_type,
            "storage_path": str(dest_path),
            "upload_id": upload_id,
        },
    )


# ---------------------------------------------------------------------------
# Chunked upload endpoints
# ---------------------------------------------------------------------------

@router.post("/chunked/init")
async def init_chunked_upload(
    filename: str = Query(..., description="Original filename"),
    total_bytes: int = Query(..., description="Total file size in bytes"),
    user: dict[str, Any] = Depends(get_current_user),
) -> JSONResponse:
    """Initialize a chunked upload session.

    Returns an upload_id to use for subsequent chunk uploads.
    """
    if total_bytes > settings.upload_max_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size: {settings.upload_max_size_mb}MB",
        )
    if total_bytes <= 0:
        raise HTTPException(status_code=400, detail="total_bytes must be positive")

    upload_id = create_upload(total_bytes=total_bytes, filename=filename)

    # Pre-create the chunk directory
    _get_chunk_dir(upload_id)

    logger.info(
        "Chunked upload initialized: %s for %s (%d bytes)",
        upload_id,
        filename,
        total_bytes,
    )

    return JSONResponse(
        status_code=201,
        content={
            "upload_id": upload_id,
            "filename": filename,
            "total_bytes": total_bytes,
            "status": "uploading",
        },
    )


@router.post("/chunked/{upload_id}")
async def upload_chunk(
    upload_id: str,
    request: Request,
    content_range: str | None = Header(None, alias="content-range"),
    user: dict[str, Any] = Depends(get_current_user),
) -> JSONResponse:
    """Upload a single chunk of a file.

    The Content-Range header must be present and follow the format:
        bytes <start>-<end>/<total>

    Chunks are stored in a temporary directory and combined on finalize.
    """
    prog = get_progress(upload_id)
    if prog is None:
        raise HTTPException(status_code=404, detail="Upload not found")
    if prog.status in ("done", "failed"):
        raise HTTPException(status_code=400, detail=f"Upload is already {prog.status}")

    parsed = _parse_content_range(content_range)
    if parsed is None:
        raise HTTPException(
            status_code=400,
            detail="Missing or invalid Content-Range header. Expected format: bytes <start>-<end>/<total>",
        )

    start, end, total = parsed
    chunk_size = end - start + 1

    # Read the raw body (the chunk bytes)
    body = await request.body()
    if len(body) != chunk_size:
        raise HTTPException(
            status_code=400,
            detail=f"Chunk size mismatch: expected {chunk_size} bytes, got {len(body)}",
        )

    chunk_dir = _get_chunk_dir(upload_id)
    chunk_path = chunk_dir / f"chunk_{start}_{end}"

    try:
        async with aiofiles.open(chunk_path, "wb") as f:
            await f.write(body)
    except Exception as e:
        fail_upload(upload_id, f"Failed to write chunk: {e}")
        raise HTTPException(status_code=500, detail="Failed to save chunk") from e

    # Update progress
    set_uploaded_bytes(upload_id, start + chunk_size)

    logger.debug(
        "Chunk received for %s: bytes %d-%d/%d (%d bytes)",
        upload_id,
        start,
        end,
        total,
        len(body),
    )

    return JSONResponse(
        status_code=200,
        content={
            "upload_id": upload_id,
            "received_start": start,
            "received_end": end,
            "uploaded_bytes": start + chunk_size,
            "total_bytes": prog.total_bytes,
        },
    )


@router.get("/progress/{upload_id}")
async def get_upload_progress(
    upload_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> JSONResponse:
    """Get the current progress of an upload."""
    prog = get_progress(upload_id)
    if prog is None:
        raise HTTPException(status_code=404, detail="Upload not found")

    percentage = (
        round(prog.uploaded_bytes / prog.total_bytes * 100, 1)
        if prog.total_bytes > 0
        else 0
    )

    return JSONResponse(
        status_code=200,
        content={
            "upload_id": prog.upload_id,
            "filename": prog.filename,
            "total_bytes": prog.total_bytes,
            "uploaded_bytes": prog.uploaded_bytes,
            "percentage": percentage,
            "status": prog.status,
            "error": prog.error,
            "started_at": prog.started_at,
            "updated_at": prog.updated_at,
        },
    )


@router.post("/chunked/{upload_id}/finalize")
async def finalize_chunked_upload(
    upload_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> JSONResponse:
    """Combine all uploaded chunks into the final file and run validation."""
    prog = get_progress(upload_id)
    if prog is None:
        raise HTTPException(status_code=404, detail="Upload not found")
    if prog.status in ("done", "failed"):
        raise HTTPException(status_code=400, detail=f"Upload is already {prog.status}")

    chunk_dir = _get_chunk_dir(upload_id)

    # Discover and sort chunks by start offset
    chunk_files = sorted(
        chunk_dir.glob("chunk_*_*"),
        key=lambda p: int(p.name.split("_")[1]),
    )

    if not chunk_files:
        fail_upload(upload_id, "No chunks found")
        raise HTTPException(status_code=400, detail="No chunks to finalize")

    # Verify contiguous coverage
    expected_offset = 0
    for cf in chunk_files:
        parts = cf.name.split("_")
        start = int(parts[1])
        end = int(parts[2])
        if start != expected_offset:
            fail_upload(upload_id, f"Missing chunk at offset {expected_offset}")
            raise HTTPException(
                status_code=400,
                detail=f"Missing chunk at offset {expected_offset} (gap detected)",
            )
        expected_offset = end + 1

    if expected_offset != prog.total_bytes:
        fail_upload(upload_id, "Incomplete upload: not all bytes received")
        raise HTTPException(
            status_code=400,
            detail=f"Incomplete upload: received {expected_offset} of {prog.total_bytes} bytes",
        )

    # Mark as processing
    set_processing(upload_id)

    # Combine chunks into a temp file
    storage_path = Path(settings.upload_storage_path)
    storage_path.mkdir(parents=True, exist_ok=True)

    file_hash = hashlib.sha256()
    file_ext = Path(prog.filename).suffix.lower()
    secure_filename = f"{file_hash.hexdigest()}{file_ext}"
    temp_path = storage_path / f"temp_{secure_filename}"
    dest_path = storage_path / secure_filename

    try:
        async with aiofiles.open(temp_path, "wb") as out:
            for cf in chunk_files:
                async with aiofiles.open(cf, "rb") as inp:
                    data = await inp.read()
                    await out.write(data)
                    file_hash.update(data)
    except Exception as e:
        fail_upload(upload_id, f"Failed to combine chunks: {e}")
        raise HTTPException(status_code=500, detail="Failed to combine chunks") from e

    # Re-hash with the correct filename
    secure_filename = f"{file_hash.hexdigest()}{file_ext}"
    dest_path = storage_path / secure_filename
    if temp_path.name != f"temp_{secure_filename}":
        os.rename(temp_path, storage_path / f"temp_{secure_filename}")
        temp_path = storage_path / f"temp_{secure_filename}"

    # Validate file type
    detected_type = _get_file_magic_type(str(temp_path))
    if detected_type not in settings.upload_allowed_types_list:
        os.remove(temp_path)
        shutil.rmtree(chunk_dir, ignore_errors=True)
        fail_upload(upload_id, f"File type {detected_type} not allowed")
        raise HTTPException(
            status_code=415,
            detail=f"File type {detected_type} not allowed. Allowed: {settings.upload_allowed_types}",
        )

    # Virus scan
    if not await _scan_virus(str(temp_path)):
        os.remove(temp_path)
        shutil.rmtree(chunk_dir, ignore_errors=True)
        fail_upload(upload_id, "File failed virus scan")
        raise HTTPException(status_code=415, detail="File failed virus scan")

    # Move to final location
    os.rename(temp_path, dest_path)

    # Cleanup chunk directory
    shutil.rmtree(chunk_dir, ignore_errors=True)

    complete_upload(upload_id)

    logger.info(
        "Chunked upload finalized: %s -> %s (%d bytes)",
        upload_id,
        secure_filename,
        prog.total_bytes,
    )

    return JSONResponse(
        status_code=201,
        content={
            "id": secure_filename,
            "original_filename": prog.filename,
            "size_bytes": prog.total_bytes,
            "mime_type": detected_type,
            "storage_path": str(dest_path),
            "upload_id": upload_id,
        },
    )


@router.delete("/chunked/{upload_id}")
async def cancel_chunked_upload(
    upload_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> JSONResponse:
    """Cancel a chunked upload and clean up all temporary data."""
    prog = get_progress(upload_id)
    if prog is None:
        raise HTTPException(status_code=404, detail="Upload not found")

    # Remove chunk directory
    chunk_dir = _get_chunk_dir(upload_id)
    shutil.rmtree(chunk_dir, ignore_errors=True)

    fail_upload(upload_id, "Cancelled by user")
    remove_upload(upload_id)

    logger.info("Chunked upload cancelled: %s", upload_id)

    return JSONResponse(
        status_code=200,
        content={
            "upload_id": upload_id,
            "status": "cancelled",
        },
    )


# Need to import Request for the chunk endpoint body reading

