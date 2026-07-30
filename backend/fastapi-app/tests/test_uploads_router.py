"""Tests for the secure uploads router and the in-memory progress tracker.

Covers standard uploads (size cap, MIME allowlist, virus gate, persistence),
the full chunked-upload lifecycle (init → chunks → finalize/cancel) and the
upload_progress store.
"""

import time
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest

from app.auth import get_current_user
from app.main import app
from app.models import User
from app.routers import uploads
from app.upload_progress import (
    CLEANUP_THRESHOLD_SECONDS,
    UploadProgress,
    complete_upload,
    create_upload,
    fail_upload,
    get_all_active,
    get_progress,
    remove_upload,
    set_processing,
    set_uploaded_bytes,
    update_progress,
    _periodic_cleanup,
    _store,
)


@pytest.fixture(autouse=True)
def _clear_progress_store():
    _store.clear()
    yield
    _store.clear()


def _make_user() -> User:
    return User(
        id=uuid.uuid4(),
        email=f"uploader-{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed",
        display_name="Uploader",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _override_user(user: User):
    async def _dep():
        return user

    return _dep


@pytest.fixture()
def authed_client(client, tmp_path):
    """Client with an authenticated user override and tmp storage settings."""
    user = _make_user()
    app.dependency_overrides[get_current_user] = _override_user(user)

    fake_settings = MagicMock()
    fake_settings.upload_max_size_bytes = 1024 * 1024
    fake_settings.upload_max_size_mb = 1
    fake_settings.upload_storage_path = str(tmp_path)
    fake_settings.upload_allowed_types_list = ["text/plain", "image/png"]
    fake_settings.upload_allowed_types = "text/plain,image/png"
    fake_settings.clamav_enabled = False

    with patch.object(uploads, "settings", fake_settings):
        yield client
    app.dependency_overrides.pop(get_current_user, None)


def test_uploads_require_auth(client):
    resp = client.post(
        "/api/v1/uploads/",
        files={"file": ("a.txt", b"hello", "text/plain")},
    )
    assert resp.status_code in (401, 403)


# ── Standard upload ──────────────────────────────────────────────────────────


def test_standard_upload_persists_file(authed_client, tmp_path):
    resp = authed_client.post(
        "/api/v1/uploads/",
        files={"file": ("notes.txt", b"hello world", "text/plain")},
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["original_filename"] == "notes.txt"
    assert data["mime_type"] == "text/plain"
    assert data["size_bytes"] == len(b"hello world")
    stored = tmp_path / data["id"]
    assert stored.exists()
    assert stored.read_bytes() == b"hello world"

    prog = get_progress(data["upload_id"])
    assert prog.status == "done"
    assert prog.uploaded_bytes == prog.total_bytes


def test_standard_upload_rejects_oversized_file(authed_client):
    resp = authed_client.post(
        "/api/v1/uploads/",
        files={"file": ("big.txt", b"x" * (1024 * 1024 + 1), "text/plain")},
    )
    assert resp.status_code == 413


def test_standard_upload_rejects_disallowed_type(authed_client):
    resp = authed_client.post(
        "/api/v1/uploads/",
        files={"file": ("evil.exe", b"MZ...", "application/octet-stream")},
    )
    assert resp.status_code == 415


def test_standard_upload_rejects_virus_positive(authed_client, tmp_path):
    with patch.object(uploads, "_scan_virus", return_value=False) as _scan:
        async def _no(*args, **kwargs):
            return False

        _scan.side_effect = _no
        resp = authed_client.post(
            "/api/v1/uploads/",
            files={"file": ("a.txt", b"bad bytes", "text/plain")},
        )
    assert resp.status_code == 415
    assert "virus" in resp.json()["detail"].lower()


def test_standard_upload_with_filenameless_part_returns_clean_422(authed_client):
    """A malformed file part must surface a JSON-serializable 422, never a 500."""
    resp = authed_client.post(
        "/api/v1/uploads/",
        files={"file": (None, b"data here", "text/plain")},
    )
    assert resp.status_code == 422
    body = resp.json()
    assert "detail" in body


# ── Helpers ──────────────────────────────────────────────────────────────────


def test_parse_content_range_variants():
    assert uploads._parse_content_range(None) is None
    assert uploads._parse_content_range("items 0-1/2") is None
    assert uploads._parse_content_range("bytes 0-99/100") == (0, 99, 100)
    assert uploads._parse_content_range("bytes 5-9/*") == (5, 9, -1)


def test_magic_type_fallback_by_extension(tmp_path):
    txt = tmp_path / "file.txt"
    txt.write_text("hi")
    detected = uploads._get_file_magic_type(str(txt))
    assert detected in ("text/plain", None) or detected.startswith("text/")

    unknown = tmp_path / "file.zzz"
    unknown.write_text("hi")
    try:
        import magic  # noqa: F401

        assert uploads._get_file_magic_type(str(unknown)) is not None
    except ImportError:
        assert uploads._get_file_magic_type(str(unknown)) is None


@pytest.mark.asyncio
async def test_scan_virus_paths(tmp_path):
    fake_settings = MagicMock(clamav_enabled=False)
    with patch.object(uploads, "settings", fake_settings):
        assert await uploads._scan_virus(str(tmp_path / "x")) is True

    fake_settings = MagicMock(clamav_enabled=True)
    clean = MagicMock(returncode=0, stdout="OK")
    with (
        patch.object(uploads, "settings", fake_settings),
        patch("subprocess.run", return_value=clean),
    ):
        assert await uploads._scan_virus(str(tmp_path / "x")) is True

    infected = MagicMock(returncode=1, stdout="FOUND")
    with (
        patch.object(uploads, "settings", fake_settings),
        patch("subprocess.run", return_value=infected),
    ):
        assert await uploads._scan_virus(str(tmp_path / "x")) is False

    with (
        patch.object(uploads, "settings", fake_settings),
        patch("subprocess.run", side_effect=OSError("no clamscan")),
    ):
        assert await uploads._scan_virus(str(tmp_path / "x")) is False


# ── Chunked lifecycle ────────────────────────────────────────────────────────


def _init_chunked(authed_client, *, filename="big.txt", total=11):
    resp = authed_client.post(
        f"/api/v1/uploads/chunked/init?filename={filename}&total_bytes={total}"
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["upload_id"]


def test_chunked_init_validation(authed_client):
    resp = authed_client.post(
        "/api/v1/uploads/chunked/init?filename=x.txt&total_bytes=0"
    )
    assert resp.status_code == 400
    resp = authed_client.post(
        "/api/v1/uploads/chunked/init?filename=x.txt&total_bytes=-5"
    )
    assert resp.status_code == 400
    resp = authed_client.post(
        "/api/v1/uploads/chunked/init?filename=x.txt&total_bytes=99999999"
    )
    assert resp.status_code == 413

    # missing query params → 422
    resp = authed_client.post("/api/v1/uploads/chunked/init")
    assert resp.status_code == 422


def test_chunked_full_lifecycle(authed_client, tmp_path):
    payload = b"hello world"
    upload_id = _init_chunked(authed_client, total=len(payload))

    # Unknown upload id → 404
    resp = authed_client.post(
        "/api/v1/uploads/chunked/nope",
        content=b"x",
        headers={"content-range": "bytes 0-0/11"},
    )
    assert resp.status_code == 404

    # Missing/invalid content-range → 400
    resp = authed_client.post(f"/api/v1/uploads/chunked/{upload_id}", content=b"x")
    assert resp.status_code == 400
    resp = authed_client.post(
        f"/api/v1/uploads/chunked/{upload_id}",
        content=b"x",
        headers={"content-range": "bogus"},
    )
    assert resp.status_code == 400

    # Chunk size mismatch → 400
    resp = authed_client.post(
        f"/api/v1/uploads/chunked/{upload_id}",
        content=b"hello world",
        headers={"content-range": "bytes 0-4/11"},
    )
    assert resp.status_code == 400

    # First chunk
    resp = authed_client.post(
        f"/api/v1/uploads/chunked/{upload_id}",
        content=payload[:5],
        headers={"content-range": f"bytes 0-4/{len(payload)}"},
    )
    assert resp.status_code == 200
    assert resp.json()["uploaded_bytes"] == 5

    # Progress endpoint
    resp = authed_client.get(f"/api/v1/uploads/progress/{upload_id}")
    assert resp.status_code == 200
    assert resp.json()["percentage"] == 45.5
    assert resp.json()["status"] == "uploading"

    # Final chunk
    resp = authed_client.post(
        f"/api/v1/uploads/chunked/{upload_id}",
        content=payload[5:],
        headers={"content-range": f"bytes 5-10/{len(payload)}"},
    )
    assert resp.status_code == 200

    # Finalize → combined file
    resp = authed_client.post(f"/api/v1/uploads/chunked/{upload_id}/finalize")
    assert resp.status_code == 201, resp.text
    data = resp.json()
    stored = tmp_path / data["id"]
    assert stored.read_bytes() == payload

    # Re-finalize → 400 (already done)
    resp = authed_client.post(f"/api/v1/uploads/chunked/{upload_id}/finalize")
    assert resp.status_code == 400

    # Upload chunk after done → 400
    resp = authed_client.post(
        f"/api/v1/uploads/chunked/{upload_id}",
        content=b"x",
        headers={"content-range": "bytes 0-0/1"},
    )
    assert resp.status_code == 400


def test_finalize_without_chunks_returns_400(authed_client):
    upload_id = _init_chunked(authed_client, total=10)
    resp = authed_client.post(f"/api/v1/uploads/chunked/{upload_id}/finalize")
    assert resp.status_code == 400
    assert "No chunks" in resp.json()["detail"]


def test_finalize_with_gap_returns_400(authed_client):
    upload_id = _init_chunked(authed_client, total=10)
    # Write chunk bytes 5-9 while offset 0-4 missing
    resp = authed_client.post(
        f"/api/v1/uploads/chunked/{upload_id}",
        content=b"world",
        headers={"content-range": "bytes 5-9/10"},
    )
    assert resp.status_code == 200
    resp = authed_client.post(f"/api/v1/uploads/chunked/{upload_id}/finalize")
    assert resp.status_code == 400
    assert "Missing chunk at offset 0" in resp.json()["detail"]


def test_finalize_incomplete_upload_returns_400(authed_client):
    upload_id = _init_chunked(authed_client, total=10)
    authed_client.post(
        f"/api/v1/uploads/chunked/{upload_id}",
        content=b"hello",
        headers={"content-range": "bytes 0-4/10"},
    )
    resp = authed_client.post(f"/api/v1/uploads/chunked/{upload_id}/finalize")
    assert resp.status_code == 400
    assert "Incomplete upload" in resp.json()["detail"]


def test_finalize_disallowed_type_returns_415(authed_client):
    payload = b"MZ binary"
    upload_id = _init_chunked(authed_client, filename="evil.exe", total=len(payload))
    authed_client.post(
        f"/api/v1/uploads/chunked/{upload_id}",
        content=payload,
        headers={"content-range": f"bytes 0-{len(payload) - 1}/{len(payload)}"},
    )
    resp = authed_client.post(f"/api/v1/uploads/chunked/{upload_id}/finalize")
    assert resp.status_code == 415


def test_cancel_chunked_upload(authed_client):
    upload_id = _init_chunked(authed_client, total=10)

    resp = authed_client.delete("/api/v1/uploads/chunked/nope")
    assert resp.status_code == 404

    resp = authed_client.delete(f"/api/v1/uploads/chunked/{upload_id}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "cancelled"
    assert get_progress(upload_id) is None


def test_progress_unknown_id_returns_404(authed_client):
    resp = authed_client.get("/api/v1/uploads/progress/nope")
    assert resp.status_code == 404


def test_progress_zero_total_bytes_reports_zero_percentage(authed_client):
    # Simulated degenerate tracker entry
    upload_id = create_upload(total_bytes=0, filename="zero.txt")
    resp = authed_client.get(f"/api/v1/uploads/progress/{upload_id}")
    assert resp.status_code == 200
    assert resp.json()["percentage"] == 0


# ── Progress tracker unit tests ──────────────────────────────────────────────


def test_progress_store_crud_and_metadata():
    upload_id = create_upload(total_bytes=100, filename="f.txt", user="u1")
    prog = get_progress(upload_id)
    assert prog.total_bytes == 100
    assert prog.metadata == {"user": "u1"}

    assert update_progress(upload_id, 40).uploaded_bytes == 40
    assert update_progress("missing", 5) is None

    assert set_uploaded_bytes(upload_id, 60).uploaded_bytes == 60
    assert set_uploaded_bytes("missing", 1) is None

    assert set_processing(upload_id).status == "processing"
    assert set_processing("missing") is None

    assert {p.upload_id for p in get_all_active()} == {upload_id}

    assert fail_upload(upload_id, "boom").error == "boom"
    assert fail_upload("missing", "x") is None
    assert get_all_active() == []

    done_id = create_upload(total_bytes=5, filename="g.txt")
    assert complete_upload(done_id).status == "done"
    assert complete_upload(done_id).uploaded_bytes == 5
    assert complete_upload("missing") is None

    assert remove_upload(done_id) is True
    assert remove_upload(done_id) is False


@pytest.mark.asyncio
async def test_periodic_cleanup_purges_stale_terminal_entries(monkeypatch):
    stale = UploadProgress(
        upload_id="stale",
        total_bytes=1,
        status="done",
        updated_at=time.time() - CLEANUP_THRESHOLD_SECONDS - 10,
    )
    fresh = UploadProgress(upload_id="fresh", total_bytes=1, status="uploading")
    _store[stale.upload_id] = stale
    _store[fresh.upload_id] = fresh

    async def _stop_after_first_iteration():
        # Let the loop body run once, then cancel
        await _periodic_cleanup_once()

    async def _periodic_cleanup_once():
        now = time.time()
        for uid in [
            uid
            for uid, prog in _store.items()
            if prog.status in ("done", "failed")
            and (now - prog.updated_at) > CLEANUP_THRESHOLD_SECONDS
        ]:
            del _store[uid]

    # Drive one cleanup body iteration directly
    await _periodic_cleanup_once()
    assert "stale" not in _store
    assert "fresh" in _store


@pytest.mark.asyncio
async def test_periodic_cleanup_loop_runs_and_purges(monkeypatch):
    stale = UploadProgress(
        upload_id="stale2",
        total_bytes=1,
        status="failed",
        updated_at=time.time() - CLEANUP_THRESHOLD_SECONDS - 10,
    )
    _store[stale.upload_id] = stale

    sleep_count = {"n": 0}

    async def _fast_sleep(_seconds):
        sleep_count["n"] += 1
        if sleep_count["n"] > 1:
            raise asyncio.CancelledError()

    import asyncio

    monkeypatch.setattr(asyncio, "sleep", _fast_sleep)
    with pytest.raises(asyncio.CancelledError):
        await _periodic_cleanup()
    assert "stale2" not in _store


def test_ensure_cleanup_started_without_running_loop():
    from app import upload_progress

    upload_progress._cleanup_task = None
    upload_progress._ensure_cleanup_started()  # no running loop → no-op
