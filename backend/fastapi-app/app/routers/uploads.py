"""Secure file upload router with validation, size limits, and virus scanning."""
import hashlib
import json
import logging
import os
import subprocess
from pathlib import Path
from typing import Any

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.auth import get_current_user

logger = logging.getLogger("youandinotai.api.uploads")
router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])
settings = get_settings()


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

    # Create storage directory if not exists
    storage_path = Path(settings.upload_storage_path)
    storage_path.mkdir(parents=True, exist_ok=True)

    # Generate secure filename
    file_hash = hashlib.sha256()
    while chunk := await file.read(8192):
        file_hash.update(chunk)
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
        raise HTTPException(status_code=500, detail="Failed to save file") from e

    # Validate file type
    detected_type = _get_file_magic_type(str(temp_path))
    if detected_type not in settings.upload_allowed_types_list:
        os.remove(temp_path)
        raise HTTPException(
            status_code=415,
            detail=f"File type {detected_type} not allowed. Allowed: {settings.upload_allowed_types}",
        )

    # Virus scan
    if not await _scan_virus(str(temp_path)):
        os.remove(temp_path)
        raise HTTPException(status_code=415, detail="File failed virus scan")

    # Move to final location
    os.rename(temp_path, dest_path)

    logger.info(
        "File uploaded successfully",
        extra={
            "user_id": user.get("sub"),
            "filename": secure_filename,
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
        },
    )
