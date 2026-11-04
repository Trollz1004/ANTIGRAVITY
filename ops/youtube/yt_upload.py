#!/usr/bin/env python3
"""
YouTube Data API v3 Uploader for ANTIGRAVITY.
Handles OAuth authentication, resumable video uploads, metadata, and dry-run validation.
Enforces private-only uploads, no publishAt scheduling, and truthful containsSyntheticMedia disclosure.
"""
import argparse
import json
import os
import sys
from pathlib import Path

# Paths
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CREDENTIALS_DIR = Path(__file__).resolve().parent / ".credentials"
CLIENT_SECRETS_FILE = CREDENTIALS_DIR / "client_secret.json"
OAUTH_TOKEN_FILE = CREDENTIALS_DIR / "youtube-oauth.json"

ALLOWED_PRIVACY_CHOICES = ("private",)

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
]


def validate_privacy_and_schedule(privacy: str, publish_at=None) -> str:
    """Enforce that every upload is strictly 'private' and never sets publishAt."""
    if privacy != "private":
        raise ValueError(
            f"PRIVACY_VIOLATION: Only 'private' uploads are allowed (got {privacy!r}). "
            "Public and unlisted uploads are forbidden."
        )
    if publish_at is not None:
        raise ValueError(
            "PUBLISH_AT_FORBIDDEN: Setting publishAt is forbidden. "
            "Videos must remain private until published manually in YouTube Studio."
        )
    return "private"


def build_upload_body(
    title: str,
    description: str = "",
    tags=None,
    category_id: str = "25",
    privacy: str = "private",
    contains_synthetic_media: bool = True,
    publish_at=None,
) -> dict:
    """Build and validate the YouTube Data API v3 videos.insert request body."""
    validated_privacy = validate_privacy_and_schedule(privacy, publish_at=publish_at)
    if not isinstance(contains_synthetic_media, bool):
        raise ValueError("containsSyntheticMedia must be a boolean value.")

    if isinstance(tags, str):
        parsed_tags = [t.strip() for t in tags.split(",") if t.strip()]
    elif tags:
        parsed_tags = [str(t).strip() for t in tags if str(t).strip()]
    else:
        parsed_tags = []

    status_body = {
        "privacyStatus": validated_privacy,
        "selfDeclaredMadeForKids": False,
        "containsSyntheticMedia": contains_synthetic_media,
    }
    assert "publishAt" not in status_body, "publishAt must never be set in status body"

    return {
        "snippet": {
            "title": (title or "")[:100],
            "description": (description or "")[:5000],
            "tags": parsed_tags[:500],
            "categoryId": str(category_id or "25"),
        },
        "status": status_body,
    }


def get_authenticated_service(client_file=None):
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build

    creds = None
    refresh_token = os.environ.get("YOUTUBE_OAUTH_REFRESH_TOKEN")
    client_id = os.environ.get("YOUTUBE_CLIENT_ID")
    client_secret = os.environ.get("YOUTUBE_CLIENT_SECRET")

    if refresh_token and client_id and client_secret:
        creds = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
            scopes=SCOPES,
        )
        try:
            creds.refresh(Request())
        except Exception as e:
            print(f"[WARN] Env token refresh failed: {e}", file=sys.stderr)
            creds = None

    if not creds and OAUTH_TOKEN_FILE.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(OAUTH_TOKEN_FILE), SCOPES)
        except Exception as e:
            print(f"[WARN] Failed to load cached credentials: {e}", file=sys.stderr)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                print("[INFO] Successfully refreshed YouTube OAuth token.")
            except Exception as e:
                print(f"[WARN] Token refresh failed: {e}", file=sys.stderr)
                creds = None

        if not creds:
            cfile = client_file or (CLIENT_SECRETS_FILE if CLIENT_SECRETS_FILE.exists() else None)
            if not cfile or not Path(cfile).exists():
                return None
            flow = InstalledAppFlow.from_client_secrets_file(str(cfile), SCOPES)
            creds = flow.run_local_server(port=0)
            CREDENTIALS_DIR.mkdir(parents=True, exist_ok=True)
            with open(OAUTH_TOKEN_FILE, "w", encoding="utf-8") as f:
                f.write(creds.to_json())
            print("[INFO] OAuth credentials saved to", OAUTH_TOKEN_FILE)

    return build("youtube", "v3", credentials=creds)


def cmd_auth(args):
    service = get_authenticated_service(args.client_file)
    if not service:
        print("[ERROR] Could not authenticate. Provide --client-file with Google OAuth client secrets JSON.")
        sys.exit(1)
    try:
        channels_response = service.channels().list(mine=True, part="snippet,contentDetails,statistics").execute()
        items = channels_response.get("items", [])
        if items:
            title = items[0]["snippet"]["title"]
            cid = items[0]["id"]
            print(f"[SUCCESS] Authenticated to YouTube Channel: {title} (ID: {cid})")
        else:
            print("[SUCCESS] Authenticated, but no YouTube channel found for this account.")
    except Exception as e:
        print(f"[ERROR] Failed to query channel details: {e}")
        sys.exit(1)


def cmd_status(args):
    if not OAUTH_TOKEN_FILE.exists() and not os.environ.get("YOUTUBE_OAUTH_REFRESH_TOKEN"):
        print("[STATUS] No credentials found in env or local credentials dir. Status: NOT_AUTHENTICATED")
        sys.exit(0)
    service = get_authenticated_service()
    if not service:
        print("[STATUS] Credentials exist but are invalid/expired and could not be refreshed.")
        sys.exit(1)
    try:
        channels_response = service.channels().list(mine=True, part="snippet,statistics").execute()
        items = channels_response.get("items", [])
        if items:
            title = items[0]["snippet"]["title"]
            cid = items[0]["id"]
            subs = items[0]["statistics"].get("subscriberCount", "N/A")
            vids = items[0]["statistics"].get("videoCount", "N/A")
            print(f"[STATUS] Ready. Channel: {title} (ID: {cid}) | Subscribers: {subs} | Videos: {vids}")
        else:
            print("[STATUS] Ready, but no channel attached to credentials.")
    except Exception as e:
        print(f"[STATUS] Error contacting YouTube API: {e}")
        sys.exit(1)


def cmd_upload(args):
    validate_privacy_and_schedule(getattr(args, "privacy", "private"), getattr(args, "publish_at", None))

    video_path = Path(args.video_file).resolve()
    if not video_path.exists():
        print(f"[ERROR] Video file does not exist: {video_path}")
        sys.exit(1)

    body = build_upload_body(
        title=args.title,
        description=args.description,
        tags=args.tags,
        category_id=args.category_id,
        privacy=args.privacy,
        contains_synthetic_media=args.contains_synthetic_media,
        publish_at=getattr(args, "publish_at", None),
    )

    file_size_mb = video_path.stat().st_size / (1024 * 1024)
    print(f"[INFO] Target: {video_path.name} ({file_size_mb:.2f} MB)")
    print(f"[INFO] Title: {args.title}")
    print(f"[INFO] Privacy: {body['status']['privacyStatus']}")
    print(f"[INFO] containsSyntheticMedia: {body['status']['containsSyntheticMedia']}")

    if args.dry_run:
        print("[INFO] DRY RUN: Validating metadata and payload...")
        assert len(args.title) <= 100, "Title exceeds 100 characters"
        assert len(args.description) <= 5000, "Description exceeds 5000 characters"
        assert body["status"]["privacyStatus"] == "private", "Privacy must be private"
        assert "publishAt" not in body["status"], "publishAt must never be set"
        assert isinstance(body["status"]["containsSyntheticMedia"], bool), "containsSyntheticMedia must be bool"
        print("[SUCCESS] DRY RUN PASSED. Video is ready for private upload.")
        return body

    service = get_authenticated_service()
    if not service:
        print("[ERROR] YouTube OAuth is not configured. Missing credentials in env or local credentials dir.")
        sys.exit(2)

    from googleapiclient.http import MediaFileUpload

    media = MediaFileUpload(str(video_path), mimetype="video/mp4", resumable=True, chunksize=1024 * 1024 * 4)
    dashboard_flag_synthetic_disclosure = False

    try:
        request = service.videos().insert(part="snippet,status", body=body, media_body=media)
        response = None
        print("[INFO] Uploading in chunks...")
        while response is None:
            status, response = request.next_chunk()
            if status:
                print(f"[UPLOAD] {int(status.progress() * 100)}% completed...")
    except Exception as exc:
        if "containsSyntheticMedia" in str(exc):
            print(
                "[WARN] API rejected containsSyntheticMedia; retrying without field and flagging on dashboard for Studio disclosure.",
                file=sys.stderr,
            )
            fallback_body = json.loads(json.dumps(body))
            fallback_body["status"].pop("containsSyntheticMedia", None)
            dashboard_flag_synthetic_disclosure = True
            request = service.videos().insert(part="snippet,status", body=fallback_body, media_body=media)
            response = None
            while response is None:
                status, response = request.next_chunk()
                if status:
                    print(f"[UPLOAD] {int(status.progress() * 100)}% completed...")
        else:
            raise

    video_id = response.get("id")
    print(f"[SUCCESS] Video uploaded as private! Video ID: {video_id}")
    print(f"[URL] https://youtu.be/{video_id}")

    if args.thumbnail and Path(args.thumbnail).exists():
        try:
            print(f"[INFO] Uploading custom thumbnail: {args.thumbnail}")
            service.thumbnails().set(videoId=video_id, media_body=MediaFileUpload(args.thumbnail)).execute()
            print("[SUCCESS] Custom thumbnail uploaded.")
        except Exception as e:
            print(f"[WARN] Thumbnail upload failed: {e}")

    result = {
        "status": "success",
        "video_id": video_id,
        "url": f"https://youtu.be/{video_id}",
        "title": args.title,
        "privacy": "private",
        "containsSyntheticMedia": body["status"]["containsSyntheticMedia"],
        "dashboard_flag_synthetic_media_disclosure_required": dashboard_flag_synthetic_disclosure,
    }
    print(json.dumps(result))
    return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="YouTube Automation Uploader (Private-Only)")
    subparsers = parser.add_subparsers(dest="command", required=True)

    auth_p = subparsers.add_parser("auth", help="Authenticate with YouTube")
    auth_p.add_argument("--client-file", help="Path to client_secret.json")

    subparsers.add_parser("status", help="Check YouTube authorization status")

    upload_p = subparsers.add_parser("upload", help="Upload a video to YouTube (private only)")
    upload_p.add_argument("video_file", help="Path to MP4 video")
    upload_p.add_argument("--title", required=True, help="Video title")
    upload_p.add_argument("--description", default="", help="Video description")
    upload_p.add_argument("--tags", default="", help="Comma-separated tags")
    upload_p.add_argument("--category-id", default="25", help="Category ID (25=News, 28=Tech)")
    upload_p.add_argument(
        "--privacy",
        default="private",
        choices=list(ALLOWED_PRIVACY_CHOICES),
        help="Privacy status (locked to 'private'; Josh publishes manually in YouTube Studio)",
    )
    upload_p.add_argument(
        "--contains-synthetic-media",
        dest="contains_synthetic_media",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Truthfully declare whether the video contains synthetic/AI-generated media (default: True)",
    )
    upload_p.add_argument("--thumbnail", help="Path to thumbnail image")
    upload_p.add_argument("--dry-run", action="store_true", help="Validate without uploading")
    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command == "auth":
        cmd_auth(args)
    elif args.command == "status":
        cmd_status(args)
    elif args.command == "upload":
        cmd_upload(args)


if __name__ == "__main__":
    main()
