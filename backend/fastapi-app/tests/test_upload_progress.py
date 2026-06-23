"""Tests for app.upload_progress — in-memory upload tracking."""

from app.upload_progress import (
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
)


class TestCreateUpload:
    def test_returns_string_id(self):
        uid = create_upload(1024, "test.png")
        assert isinstance(uid, str)
        remove_upload(uid)

    def test_progress_tracked(self):
        uid = create_upload(2048, "doc.pdf")
        prog = get_progress(uid)
        assert prog is not None
        assert prog.total_bytes == 2048
        assert prog.filename == "doc.pdf"
        assert prog.status == "uploading"
        assert prog.uploaded_bytes == 0
        remove_upload(uid)


class TestUpdateProgress:
    def test_increments_bytes(self):
        uid = create_upload(1000, "f.bin")
        result = update_progress(uid, 500)
        assert result is not None
        assert result.uploaded_bytes == 500
        update_progress(uid, 300)
        assert get_progress(uid).uploaded_bytes == 800
        remove_upload(uid)

    def test_unknown_id_returns_none(self):
        assert update_progress("nonexistent-id", 100) is None


class TestSetUploadedBytes:
    def test_sets_absolute(self):
        uid = create_upload(5000, "big.zip")
        set_uploaded_bytes(uid, 3000)
        assert get_progress(uid).uploaded_bytes == 3000
        remove_upload(uid)

    def test_unknown_id_returns_none(self):
        assert set_uploaded_bytes("nope", 100) is None


class TestCompleteUpload:
    def test_marks_done(self):
        uid = create_upload(100, "small.txt")
        result = complete_upload(uid)
        assert result is not None
        assert result.status == "done"
        assert result.uploaded_bytes == result.total_bytes
        remove_upload(uid)

    def test_unknown_id(self):
        assert complete_upload("nope") is None


class TestFailUpload:
    def test_marks_failed(self):
        uid = create_upload(100, "bad.txt")
        result = fail_upload(uid, "disk full")
        assert result is not None
        assert result.status == "failed"
        assert result.error == "disk full"
        remove_upload(uid)

    def test_unknown_id(self):
        assert fail_upload("nope", "err") is None


class TestSetProcessing:
    def test_marks_processing(self):
        uid = create_upload(100, "scan.bin")
        result = set_processing(uid)
        assert result is not None
        assert result.status == "processing"
        remove_upload(uid)

    def test_unknown_id(self):
        assert set_processing("nope") is None


class TestRemoveUpload:
    def test_removes_existing(self):
        uid = create_upload(100, "del.txt")
        assert remove_upload(uid) is True
        assert get_progress(uid) is None

    def test_unknown_returns_false(self):
        assert remove_upload("nope") is False


class TestGetAllActive:
    def test_only_active(self):
        uid1 = create_upload(100, "a.txt")
        uid2 = create_upload(200, "b.txt")
        uid3 = create_upload(300, "c.txt")
        complete_upload(uid2)
        fail_upload(uid3, "err")

        active = get_all_active()
        active_ids = [p.upload_id for p in active]
        assert uid1 in active_ids
        assert uid2 not in active_ids
        assert uid3 not in active_ids

        # Processing counts as active
        set_processing(uid1)
        active = get_all_active()
        assert any(p.upload_id == uid1 for p in active)

        remove_upload(uid1)
        remove_upload(uid2)
        remove_upload(uid3)


class TestUploadProgressDataclass:
    def test_defaults(self):
        prog = UploadProgress(upload_id="x", total_bytes=100)
        assert prog.uploaded_bytes == 0
        assert prog.status == "uploading"
        assert prog.error is None
        assert prog.metadata == {}
        assert prog.filename == ""
