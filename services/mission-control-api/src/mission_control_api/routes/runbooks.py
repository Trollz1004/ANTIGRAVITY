from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException

from ..envelope import Envelope

router = APIRouter(prefix="/runbooks", tags=["runbooks"])

REPO_ROOT = Path(__file__).resolve().parents[5]
RUNBOOKS_DIR = REPO_ROOT / "briefings" / "runbooks"


@router.get("/list")
async def list_runbooks() -> Envelope:
    started = datetime.now(timezone.utc)
    if not RUNBOOKS_DIR.exists():
        return Envelope(
            status="degraded",
            checked_at=started,
            latency_ms=0,
            details=[],
            error=f"directory missing: {RUNBOOKS_DIR}",
        )
    files = []
    for p in sorted(RUNBOOKS_DIR.glob("*.md"), key=lambda x: x.stat().st_mtime, reverse=True):
        st = p.stat()
        files.append(
            {
                "filename": p.name,
                "size": st.st_size,
                "mtime": datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).isoformat(),
            }
        )
    finished = datetime.now(timezone.utc)
    return Envelope(
        status="ok",
        checked_at=finished,
        latency_ms=int((finished - started).total_seconds() * 1000),
        details=files,
        error=None,
    )


@router.get("/{filename}")
async def read_runbook(filename: str):
    import re

    if not re.fullmatch(r"[a-z0-9._-]+\.md", filename):
        raise HTTPException(status_code=400, detail="invalid filename")
    target = RUNBOOKS_DIR / filename
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="not found")
    return {"filename": filename, "content": target.read_text(encoding="utf-8")}
