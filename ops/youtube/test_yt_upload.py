#!/usr/bin/env python3
"""
Unit tests for ops/youtube/yt_upload.py (Verdict item 13).
Verifies that:
1. --privacy defaults to 'private' and offers no other choice.
2. 'public' and 'unlisted' are rejected both by the CLI parser and by build_upload_body/validate_privacy_and_schedule.
3. publishAt is never set in the upload status payload and is rejected if passed.
4. containsSyntheticMedia is set truthfully in the upload status payload.
"""
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
import yt_upload


class TestYtUploadPrivacyAndSyntheticMedia(unittest.TestCase):
    def test_default_privacy_is_private_and_only_choice(self):
        parser = yt_upload.build_parser()
        args = parser.parse_args(["upload", "video.mp4", "--title", "Test Short"])
        self.assertEqual(args.privacy, "private")
        self.assertEqual(tuple(yt_upload.ALLOWED_PRIVACY_CHOICES), ("private",))

    def test_cli_rejects_public_and_unlisted(self):
        parser = yt_upload.build_parser()
        for forbidden in ("public", "unlisted", "PUBLIC", "UNLISTED", "scheduled"):
            with self.subTest(privacy=forbidden):
                with self.assertRaises(SystemExit):
                    parser.parse_args(
                        ["upload", "video.mp4", "--title", "Test Short", "--privacy", forbidden]
                    )

    def test_build_upload_body_rejects_public_and_unlisted(self):
        for forbidden in ("public", "unlisted", "PUBLIC", "UNLISTED", ""):
            with self.subTest(privacy=forbidden):
                with self.assertRaises(ValueError):
                    yt_upload.build_upload_body(
                        title="Test Short",
                        description="Desc",
                        privacy=forbidden,
                    )

    def test_never_sets_publish_at(self):
        body = yt_upload.build_upload_body(
            title="Test Short",
            description="Desc",
            tags="shorts,test",
        )
        self.assertEqual(body["status"]["privacyStatus"], "private")
        self.assertNotIn("publishAt", body["status"])
        self.assertFalse(body["status"]["selfDeclaredMadeForKids"])

        with self.assertRaises(ValueError):
            yt_upload.build_upload_body(
                title="Test Short",
                description="Desc",
                publish_at="2026-12-01T00:00:00Z",
            )

        parser = yt_upload.build_parser()
        with self.assertRaises(SystemExit):
            parser.parse_args(
                ["upload", "video.mp4", "--title", "Test Short", "--publish-at", "2026-12-01T00:00:00Z"]
            )

    def test_sets_contains_synthetic_media_truthfully(self):
        body_default = yt_upload.build_upload_body(title="AI Short")
        self.assertIs(body_default["status"]["containsSyntheticMedia"], True)

        body_false = yt_upload.build_upload_body(
            title="Camera Recording",
            contains_synthetic_media=False,
        )
        self.assertIs(body_false["status"]["containsSyntheticMedia"], False)

        parser = yt_upload.build_parser()
        args_true = parser.parse_args(
            ["upload", "video.mp4", "--title", "AI Short", "--contains-synthetic-media"]
        )
        self.assertIs(args_true.contains_synthetic_media, True)

        args_false = parser.parse_args(
            ["upload", "video.mp4", "--title", "Real Clip", "--no-contains-synthetic-media"]
        )
        self.assertIs(args_false.contains_synthetic_media, False)


if __name__ == "__main__":
    unittest.main(verbosity=2)
