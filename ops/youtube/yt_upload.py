#!/usr/bin/env python3
"""
YouTube Data API v3 Uploader for ANTIGRAVITY.
Handles OAuth authentication, resumable video uploads, metadata, and dry-run validation.
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

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
]

def get_authenticated_service(client_file=None):
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build

    creds = None
    if OAUTH_TOKEN_FILE.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(OAUTH_TOKEN_FILE), SCOPES)
        except Exception as e:
            print(f"[WARN] Failed to load cached credentials: {e}", file=sys.stderr)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                with open(OAUTH_TOKEN_FILE, "w", encoding="utf-8") as f:
                    f.write(creds.to_json())
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
    if not OAUTH_TOKEN_FILE.exists():
        print(f"[STATUS] No credentials found at {OAUTH_TOKEN_FILE}. Status: NOT_AUTHENTICATED")
        sys.exit(0)
    service = get_authenticated_service()
    if not service:
        print(f"[STATUS] Token exists at {OAUTH_TOKEN_FILE} but is invalid/expired and could not be refreshed.")
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
    video_path = Path(args.video_file).resolve()
    if not video_path.exists():
        print(f"[ERROR] Video file does not exist: {video_path}")
        sys.exit(1)

    file_size_mb = video_path.stat().st_size / (1024 * 1024)
    print(f"[INFO] Target: {video_path.name} ({file_size_mb:.2f} MB)")
    print(f"[INFO] Title: {args.title}")
    print(f"[INFO] Privacy: {args.privacy}")

    if args.dry_run:
        print("[INFO] DRY RUN: Validating metadata and payload...")
        assert len(args.title) <= 100, "Title exceeds 100 characters"
        assert len(args.description) <= 5000, "Description exceeds 5000 characters"
        print("[SUCCESS] DRY RUN PASSED. Video is ready for upload.")
        return

    service = get_authenticated_service()
    if not service:
        print(f"[ERROR] YouTube OAuth is not configured. Missing credentials at {OAUTH_TOKEN_FILE}")
        sys.exit(2)

    from googleapiclient.http import MediaFileUpload

    tags = [t.strip() for t in args.tags.split(",") if t.strip()] if args.tags else []

    body = {
        "snippet": {
            "title": args.title[:100],
            "description": args.description[:5000],
            "tags": tags[:500],
            "categoryId": args.category_id,
        },
        "status": {
            "privacyStatus": args.privacy,
            "selfDeclaredMadeForKids": False,
        }
    }

    media = MediaFileUpload(str(video_path), mimetype="video/mp4", resumable=True, chunksize=1024*1024*4)
    request = service.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    print("[INFO] Uploading in chunks...")
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"[UPLOAD] {int(status.progress() * 100)}% completed...")

    video_id = response.get("id")
    print(f"[SUCCESS] Video published! Video ID: {video_id}")
    print(f"[URL] https://youtu.be/{video_id}")

    if args.thumbnail and Path(args.thumbnail).exists():
        try:
            print(f"[INFO] Uploading custom thumbnail: {args.thumbnail}")
            service.thumbnails().set(videoId=video_id, media_body=MediaFileUpload(args.thumbnail)).execute()
            print("[SUCCESS] Custom thumbnail uploaded.")
        except Exception as e:
            print(f"[WARN] Thumbnail upload failed: {e}")

    # Output machine-readable result
    result = {
        "status": "success",
        "video_id": video_id,
        "url": f"https://youtu.be/{video_id}",
        "title": args.title,
        "privacy": args.privacy,
    }
    print(json.dumps(result))

def main():
    parser = argparse.ArgumentParser(description="YouTube Automation Uploader")
    subparsers = parser.add_subparsers(dest="command", required=True)

    auth_p = subparsers.add_parser("auth", help="Authenticate with YouTube")
    auth_p.add_argument("--client-file", help="Path to client_secret.json")

    subparsers.add_parser("status", help="Check YouTube authorization status")

    upload_p = subparsers.add_parser("upload", help="Upload a video to YouTube")
    upload_p.add_argument("video_file", help="Path to MP4 video")
    upload_p.add_argument("--title", required=True, help="Video title")
    upload_p.add_argument("--description", default="", help="Video description")
    upload_p.add_argument("--tags", default="", help="Comma-separated tags")
    upload_p.add_argument("--category-id", default="25", help="Category ID (25=News, 28=Tech)")
    upload_p.add_argument("--privacy", default="public", choices=["public", "unlisted", "private"])
    upload_p.add_argument("--thumbnail", help="Path to thumbnail image")
    upload_p.add_argument("--dry-run", action="store_true", help="Validate without uploading")

    args = parser.parse_args()
    if args.command == "auth":
        cmd_auth(args)
    elif args.command == "status":
        cmd_status(args)
    elif args.command == "upload":
        cmd_upload(args)

if __name__ == "__main__":
    main()
