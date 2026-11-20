#!/usr/bin/env python3
"""DateApp Two-Account Chat & 30-Minute Session Persistence E2E Verifier.

Modes:
  --dry-run (default): Prints the exact verification plan without mutating state.
  --apply:             Runs against the live T5500 stack (or supplied URLs/DB),
                       captures screenshots, and cleans up all test rows in finally.
  --local-sqlite-smoke: Boots an isolated FastAPI + Vite pair against a temporary
                       SQLite database in %TEMP%, runs the full headless Chromium
                       E2E flow, captures both 1440x900 screenshots, verifies zero
                       leftover test rows, and tears down the temporary servers/DB.
"""

from __future__ import annotations

import argparse
import asyncio
import contextlib
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import uuid
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Any

LOOPBACK_HOST = socket.inet_ntoa(b"\x7f\x00\x00\x01")
T5500_HOST = "192.168.0.15"


def _find_free_port(bind_host: str) -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind((bind_host, 0))
        return int(sock.getsockname()[1])


_NO_PROXY_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def _wait_for_http(url: str, timeout_sec: float = 45.0) -> bool:
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        with contextlib.suppress(OSError, urllib.error.URLError):
            req = urllib.request.Request(url, method="GET")
            with _NO_PROXY_OPENER.open(req, timeout=8.0) as resp:
                if 200 <= resp.status < 500:
                    return True
        time.sleep(0.5)
    return False


def _http_json(
    url: str,
    *,
    method: str = "GET",
    payload: dict[str, Any] | None = None,
    token: str | None = None,
) -> tuple[int, Any]:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with _NO_PROXY_OPENER.open(req, timeout=15.0) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw else None
        except ValueError:
            parsed = {"raw": raw}
        return exc.code, parsed


def print_dry_run_plan(
    *,
    repo_root: Path,
    api_base_url: str,
    frontend_base_url: str,
    screenshot_dir: Path,
) -> None:
    chat_shot = screenshot_dir / "two-account-chat-1440.png"
    session_shot = screenshot_dir / "session-after-30m-1440.png"
    print("==================================================================")
    print(" DateApp Two-Account Chat & 30-Minute Session Persistence Plan")
    print("==================================================================")
    print("Mode:               DRY-RUN (no accounts created, no servers touched)")
    print(f"Repository Root:    {repo_root}")
    print(f"Target API URL:     {api_base_url}")
    print(f"Target Frontend:    {frontend_base_url}")
    print(f"Screenshot 1:       {chat_shot}")
    print(f"Screenshot 2:       {session_shot}")
    print()
    print("-- Execution Steps (when run with -Apply or -LocalSqliteSmoke) --")
    print("  1. Seed 2 internal test accounts (Elena Vance & Marcus Sterling) marked")
    print("     bot_shield_verified=True, subscription_tier='founding_member',")
    print(
        "     subscription_active=True at $0 charge with ZERO RevenueAllocation rows."
    )
    print("  2. Authenticate both accounts via POST /api/v1/auth/login and execute")
    print("     mutual POST /api/v1/swipe ('like') ONLY between the two test user IDs.")
    print("  3. Launch headless Chromium at 1440x900, sign in both accounts, open")
    print(
        "     /app/chat/<match_id>, exchange 3 live messages across the two accounts,"
    )
    print("     verify message rendering, and capture two-account-chat-1440.png.")
    print("  4. Advance Account A past the 30-minute access-token window (minting an")
    print("     access token expired at 31m while keeping its active refresh token),")
    print("     confirm raw expired token gets HTTP 401, fire concurrent API calls")
    print("     to exercise single-flight /api/v1/auth/refresh rotation, send a")
    print("     post-30m chat message, verify the session stays signed in, and")
    print("     capture session-after-30m-1440.png.")
    print("  5. In finally: delete all messages, matches, swipes, refresh_tokens,")
    print("     verification_events, profiles, and users for both test accounts,")
    print("     and assert 0 leftover test rows + 0 RevenueAllocation rows.")
    print("==================================================================")


async def _seed_two_test_accounts(
    backend_dir: Path,
    database_url: str,
    jwt_secret: str,
    run_tag: str,
    password: str,
) -> dict[str, Any]:
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    os.environ["DATABASE_URL"] = database_url
    os.environ["JWT_SECRET"] = jwt_secret

    from app.auth import hash_password
    from app.database import Base
    from app.models import Profile, RevenueAllocation, User
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    engine = create_async_engine(database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    user_a_id = uuid.uuid4()
    user_b_id = uuid.uuid4()
    email_a = f"e2e-chat-alpha-{run_tag}@youandinotai.com"
    email_b = f"e2e-chat-beta-{run_tag}@youandinotai.com"
    now = datetime.now(UTC)

    async with session_factory() as session:
        user_a = User(
            id=user_a_id,
            email=email_a,
            password_hash=hash_password(password),
            display_name="Elena Vance",
            date_of_birth=date(1992, 4, 14),
            adult_verified_at=now,
            bot_shield_verified=True,
            subscription_tier="founding_member",
            subscription_active=True,
            is_active=True,
            engagement_score=5.0,
            member_badge="Founder",
        )
        user_b = User(
            id=user_b_id,
            email=email_b,
            password_hash=hash_password(password),
            display_name="Marcus Sterling",
            date_of_birth=date(1990, 9, 22),
            adult_verified_at=now,
            bot_shield_verified=True,
            subscription_tier="founding_member",
            subscription_active=True,
            is_active=True,
            engagement_score=5.0,
            member_badge="Founder",
        )
        profile_a = Profile(
            id=uuid.uuid4(),
            user_id=user_a_id,
            bio="Architect & weekend trail runner. Verified internal E2E test profile.",
            age=34,
            gender="woman",
            looking_for="man",
            location="Tampa Bay, FL",
            photos=[],
            interests=["Architecture", "Live Music", "Coffee"],
            verified=True,
            location_enabled=True,
        )
        profile_b = Profile(
            id=uuid.uuid4(),
            user_id=user_b_id,
            bio="Marine engineer & espresso nerd. Verified internal E2E test profile.",
            age=36,
            gender="man",
            looking_for="woman",
            location="St. Petersburg, FL",
            photos=[],
            interests=["Sailing", "Roasteries", "Cooking"],
            verified=True,
            location_enabled=True,
        )
        session.add_all([user_a, user_b, profile_a, profile_b])
        await session.commit()

        alloc_rows = (
            await session.scalars(
                select(RevenueAllocation).where(
                    RevenueAllocation.user_id.in_([user_a_id, user_b_id])
                )
            )
        ).all()
        assert (
            len(alloc_rows) == 0
        ), "Test accounts must create zero RevenueAllocation rows"

    await engine.dispose()
    return {
        "user_a_id": str(user_a_id),
        "user_b_id": str(user_b_id),
        "email_a": email_a,
        "email_b": email_b,
        "display_a": "Elena Vance",
        "display_b": "Marcus Sterling",
    }


async def _cleanup_and_verify_zero_rows(
    backend_dir: Path,
    database_url: str,
    user_ids: list[str],
) -> dict[str, int]:
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    from app.models import (
        Match,
        Message,
        Profile,
        RevenueAllocation,
        Swipe,
        User,
        VerificationEvent,
    )
    from app.models_refresh_token import RefreshToken
    from sqlalchemy import delete, func, or_, select
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    parsed_ids = [uuid.UUID(uid) for uid in user_ids]
    engine = create_async_engine(database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        match_ids = list(
            (
                await session.scalars(
                    select(Match.id).where(
                        or_(
                            Match.user_a.in_(parsed_ids),
                            Match.user_b.in_(parsed_ids),
                        )
                    )
                )
            ).all()
        )
        if match_ids:
            await session.execute(
                delete(Message).where(Message.match_id.in_(match_ids))
            )
        await session.execute(delete(Message).where(Message.sender_id.in_(parsed_ids)))
        await session.execute(
            delete(Match).where(
                or_(Match.user_a.in_(parsed_ids), Match.user_b.in_(parsed_ids))
            )
        )
        await session.execute(
            delete(Swipe).where(
                or_(
                    Swipe.user_id.in_(parsed_ids),
                    Swipe.target_id.in_(parsed_ids),
                )
            )
        )
        await session.execute(
            delete(RefreshToken).where(RefreshToken.user_id.in_(parsed_ids))
        )
        await session.execute(
            delete(VerificationEvent).where(VerificationEvent.user_id.in_(parsed_ids))
        )
        await session.execute(delete(Profile).where(Profile.user_id.in_(parsed_ids)))
        await session.execute(delete(User).where(User.id.in_(parsed_ids)))
        await session.commit()

        remaining = {
            "users": int(
                await session.scalar(
                    select(func.count(User.id)).where(User.id.in_(parsed_ids))
                )
                or 0
            ),
            "profiles": int(
                await session.scalar(
                    select(func.count(Profile.id)).where(
                        Profile.user_id.in_(parsed_ids)
                    )
                )
                or 0
            ),
            "swipes": int(
                await session.scalar(
                    select(func.count(Swipe.id)).where(
                        or_(
                            Swipe.user_id.in_(parsed_ids),
                            Swipe.target_id.in_(parsed_ids),
                        )
                    )
                )
                or 0
            ),
            "matches": int(
                await session.scalar(
                    select(func.count(Match.id)).where(
                        or_(
                            Match.user_a.in_(parsed_ids),
                            Match.user_b.in_(parsed_ids),
                        )
                    )
                )
                or 0
            ),
            "messages": int(
                await session.scalar(
                    select(func.count(Message.id)).where(
                        Message.sender_id.in_(parsed_ids)
                    )
                )
                or 0
            ),
            "refresh_tokens": int(
                await session.scalar(
                    select(func.count(RefreshToken.id)).where(
                        RefreshToken.user_id.in_(parsed_ids)
                    )
                )
                or 0
            ),
            "revenue_allocations": int(
                await session.scalar(
                    select(func.count(RevenueAllocation.id)).where(
                        RevenueAllocation.user_id.in_(parsed_ids)
                    )
                )
                or 0
            ),
        }

    await engine.dispose()
    return remaining


def _mint_expired_30m_access_token(user_id: str, jwt_secret: str) -> str:
    from jose import jwt

    now = datetime.now(UTC)
    issued_at = now - timedelta(minutes=31)
    expired_at = now - timedelta(minutes=1)
    return jwt.encode(
        {
            "sub": user_id,
            "iat": int(issued_at.timestamp()),
            "exp": int(expired_at.timestamp()),
        },
        jwt_secret,
        algorithm="HS256",
    )


def run_e2e_flow(
    *,
    repo_root: Path,
    api_base_url: str,
    frontend_base_url: str,
    database_url: str,
    jwt_secret: str,
    screenshot_dir: Path,
) -> dict[str, Any]:
    from playwright.sync_api import sync_playwright

    backend_dir = repo_root / "domains" / "youandinotai.com" / "backend"
    screenshot_dir.mkdir(parents=True, exist_ok=True)
    chat_shot_path = screenshot_dir / "two-account-chat-1440.png"
    session_shot_path = screenshot_dir / "session-after-30m-1440.png"

    run_tag = uuid.uuid4().hex[:10]
    password = f"E2ePass!{run_tag}"
    seeded: dict[str, Any] = {}

    try:
        seeded = asyncio.run(
            _seed_two_test_accounts(
                backend_dir=backend_dir,
                database_url=database_url,
                jwt_secret=jwt_secret,
                run_tag=run_tag,
                password=password,
            )
        )
        user_a_id = seeded["user_a_id"]
        user_b_id = seeded["user_b_id"]

        # 1. Authenticate both accounts via REST to perform mutual swipe ONLY on each other
        status_a, login_a = _http_json(
            f"{api_base_url}/api/v1/auth/login",
            method="POST",
            payload={"email": seeded["email_a"], "password": password},
        )
        assert status_a == 200, f"Login A failed: {status_a} {login_a}"

        status_b, login_b = _http_json(
            f"{api_base_url}/api/v1/auth/login",
            method="POST",
            payload={"email": seeded["email_b"], "password": password},
        )
        assert status_b == 200, f"Login B failed: {status_b} {login_b}"

        token_a = login_a["access_token"]
        token_b = login_b["access_token"]

        # Account A likes Account B
        sw1_status, sw1_body = _http_json(
            f"{api_base_url}/api/v1/swipe",
            method="POST",
            payload={"target_id": user_b_id, "direction": "like"},
            token=token_a,
        )
        assert (
            sw1_status == 200 and sw1_body["matched"] is False
        ), f"Unexpected first swipe result: {sw1_status} {sw1_body}"

        # Account B likes Account A -> creates mutual Match
        sw2_status, sw2_body = _http_json(
            f"{api_base_url}/api/v1/swipe",
            method="POST",
            payload={"target_id": user_a_id, "direction": "like"},
            token=token_b,
        )
        assert (
            sw2_status == 200 and sw2_body["matched"] is True
        ), f"Mutual swipe did not match: {sw2_status} {sw2_body}"
        match_id = str(sw2_body["match_id"])

        # 2. Launch headless Chromium at 1440x900 for two-account chat + 30m session test
        with sync_playwright() as p:
            launch_kwargs: dict[str, Any] = {"headless": True}
            default_exe: Path | None = None
            with contextlib.suppress(OSError, RuntimeError, TypeError):
                default_exe = Path(p.chromium.executable_path)
            if not default_exe or not default_exe.exists():
                ms_pw = Path(os.environ.get("LOCALAPPDATA", "")) / "ms-playwright"
                candidates = sorted(
                    list(ms_pw.glob("chromium-*/chrome-win64/chrome.exe"))
                    + list(
                        ms_pw.glob(
                            "chromium_headless_shell-*/chrome-headless-shell-win64/chrome-headless-shell.exe"
                        )
                    ),
                    reverse=True,
                )
                if candidates:
                    launch_kwargs["executable_path"] = str(candidates[0])
            browser = p.chromium.launch(**launch_kwargs)

            def attach_api_proxy(context):
                def _proxy_api(route):
                    req = route.request
                    parsed_path = req.url.split("/api/v1", 1)[1]
                    target_url = f"{api_base_url}/api/v1{parsed_path}"
                    if req.url.startswith(api_base_url):
                        route.continue_()
                        return
                    headers = dict(req.headers)
                    headers.pop("host", None)
                    body_bytes = req.post_data_buffer
                    data_Req = urllib.request.Request(
                        target_url,
                        data=body_bytes,
                        headers=headers,
                        method=req.method,
                    )
                    try:
                        with _NO_PROXY_OPENER.open(data_Req, timeout=15.0) as resp:
                            resp_body = resp.read()
                            resp_headers = {
                                k: v
                                for k, v in resp.headers.items()
                                if k.lower()
                                not in ("transfer-encoding", "content-encoding")
                            }
                            route.fulfill(
                                status=resp.status,
                                headers=resp_headers,
                                body=resp_body,
                            )
                    except urllib.error.HTTPError as exc:
                        err_body = exc.read()
                        route.fulfill(
                            status=exc.code,
                            headers={"Content-Type": "application/json"},
                            body=err_body,
                        )

                context.route("**/api/v1/**", _proxy_api)

            ctx_a = browser.new_context(viewport={"width": 1440, "height": 900})
            ctx_b = browser.new_context(viewport={"width": 1440, "height": 900})
            attach_api_proxy(ctx_a)
            attach_api_proxy(ctx_b)

            page_a = ctx_a.new_page()
            page_b = ctx_b.new_page()

            # Sign in Account A through the /login UI
            page_a.goto(
                f"{frontend_base_url}/login?next=%2Fapp%2Fchat%2F{match_id}",
                wait_until="networkidle",
            )
            page_a.fill('input[name="email"]', seeded["email_a"])
            page_a.fill('input[name="password"]', password)
            page_a.click('button[type="submit"]')
            page_a.wait_for_url(f"**/app/chat/{match_id}", timeout=20000)
            page_a.wait_for_selector(
                f'h2:has-text("{seeded["display_b"]}")', timeout=15000
            )

            # Sign in Account B through the /login UI
            page_b.goto(
                f"{frontend_base_url}/login?next=%2Fapp%2Fchat%2F{match_id}",
                wait_until="networkidle",
            )
            page_b.fill('input[name="email"]', seeded["email_b"])
            page_b.fill('input[name="password"]', password)
            page_b.click('button[type="submit"]')
            page_b.wait_for_url(f"**/app/chat/{match_id}", timeout=20000)
            page_b.wait_for_selector(
                f'h2:has-text("{seeded["display_a"]}")', timeout=15000
            )

            # Dismiss cookie banner if present so screenshots are unobstructed
            for pg in (page_a, page_b):
                with contextlib.suppress(OSError, RuntimeError):
                    accept_btn = pg.locator(
                        'button:has-text("Accept"), button:has-text("Got it"), button:has-text("Agree")'
                    )
                    if accept_btn.count() > 0 and accept_btn.first.is_visible():
                        accept_btn.first.click()

            msg_1 = "Hey Marcus! Excited we matched on YouAndINotAI — how is your week going?"
            msg_2 = "Hey Elena! Going great — let's grab espresso in St. Pete this Saturday."
            msg_3 = (
                "Saturday at 2 PM works for me. Verified human chat is crystal clear!"
            )

            # Account A sends msg_1
            input_a = page_a.locator('input[placeholder="Type a message..."]')
            input_a.fill(msg_1)
            input_a.press("Enter")
            page_a.wait_for_selector(f"text={msg_1}", timeout=10000)

            # Account B reloads/polls history, sees msg_1, and replies with msg_2
            page_b.reload(wait_until="networkidle")
            page_b.wait_for_selector(f"text={msg_1}", timeout=10000)
            input_b = page_b.locator('input[placeholder="Type a message..."]')
            input_b.fill(msg_2)
            input_b.press("Enter")
            page_b.wait_for_selector(f"text={msg_2}", timeout=10000)

            # Account A sees msg_2 and sends msg_3
            page_a.reload(wait_until="networkidle")
            page_a.wait_for_selector(f"text={msg_2}", timeout=10000)
            input_a = page_a.locator('input[placeholder="Type a message..."]')
            input_a.fill(msg_3)
            input_a.press("Enter")
            page_a.wait_for_selector(f"text={msg_3}", timeout=10000)
            page_a.wait_for_timeout(400)

            # Capture Screenshot 1: Two-account chat at 1440x900
            page_a.screenshot(path=str(chat_shot_path), full_page=False)

            # 3. 30-Minute Session Persistence Test via single-flight refresh rotation
            expired_31m_token = _mint_expired_30m_access_token(user_a_id, jwt_secret)
            expired_status, _ = _http_json(
                f"{api_base_url}/api/v1/auth/me",
                method="GET",
                token=expired_31m_token,
            )
            assert (
                expired_status == 401
            ), f"Expected 401 for 31-minute expired token, got {expired_status}"

            pre_refresh_token = page_a.evaluate(
                "() => localStorage.getItem('refresh_token')"
            )
            assert pre_refresh_token, "Account A missing refresh_token before 30m test"

            # Install the expired 30m+ access token into Account A's browser session
            page_a.evaluate(
                "(expiredTok) => { localStorage.setItem('access_token', expiredTok); }",
                expired_31m_token,
            )

            # Reload /app/chat/<match_id> — triggers concurrent API calls (/auth/me, /matches/<id>, /messages/<id>)
            # which all hit 401 simultaneously and share the single-flight refreshInFlight promise
            page_a.reload(wait_until="networkidle")
            page_a.wait_for_url(f"**/app/chat/{match_id}", timeout=15000)
            assert (
                "/login" not in page_a.url
            ), f"Session was logged out after 30m token expiry: {page_a.url}"

            post_access_token = page_a.evaluate(
                "() => localStorage.getItem('access_token')"
            )
            post_refresh_token = page_a.evaluate(
                "() => localStorage.getItem('refresh_token')"
            )
            assert (
                post_access_token and post_access_token != expired_31m_token
            ), "Access token was not rotated after 30-minute expiry"
            assert (
                post_refresh_token and post_refresh_token != pre_refresh_token
            ), "Refresh token was not rotated after 30-minute expiry"

            msg_4 = "31m+ session check passed: token rotated cleanly and chat stayed signed in."
            input_a = page_a.locator('input[placeholder="Type a message..."]')
            input_a.fill(msg_4)
            input_a.press("Enter")
            page_a.wait_for_selector(f"text={msg_4}", timeout=10000)
            page_a.wait_for_timeout(400)

            # Capture Screenshot 2: Session active past 30-minute mark at 1440x900
            page_a.screenshot(path=str(session_shot_path), full_page=False)

            ctx_a.close()
            ctx_b.close()
            browser.close()

        return {
            "ok": True,
            "match_id": match_id,
            "user_a_id": user_a_id,
            "user_b_id": user_b_id,
            "messages_exchanged": 4,
            "expired_token_http_status": expired_status,
            "token_rotated_after_30m": True,
            "chat_screenshot": str(chat_shot_path),
            "session_screenshot": str(session_shot_path),
        }
    finally:
        user_ids_to_clean = [
            uid for uid in (seeded.get("user_a_id"), seeded.get("user_b_id")) if uid
        ]
        if user_ids_to_clean:
            remaining = asyncio.run(
                _cleanup_and_verify_zero_rows(
                    backend_dir=backend_dir,
                    database_url=database_url,
                    user_ids=user_ids_to_clean,
                )
            )
            print(f"[cleanup] Remaining test rows by table: {json.dumps(remaining)}")
            assert all(
                v == 0 for v in remaining.values()
            ), f"Leftover test rows detected: {remaining}"


def run_local_sqlite_smoke(
    *,
    repo_root: Path,
    screenshot_dir: Path,
) -> int:
    backend_dir = repo_root / "domains" / "youandinotai.com" / "backend"
    frontend_dir = repo_root / "domains" / "youandinotai.com" / "frontend"

    api_port = _find_free_port(LOOPBACK_HOST)
    fe_port = _find_free_port(LOOPBACK_HOST)
    api_base_url = f"http://{LOOPBACK_HOST}:{api_port}"
    frontend_base_url = f"http://{LOOPBACK_HOST}:{fe_port}"

    temp_dir = Path(tempfile.mkdtemp(prefix="dateapp-chat-session-smoke-"))
    sqlite_path = temp_dir / "dateapp_e2e_smoke.sqlite3"
    database_url = f"sqlite+aiosqlite:///{sqlite_path.as_posix()}"
    jwt_secret = "e2e-local-sqlite-smoke-jwt-secret-key-minimum-32-chars"

    api_env = os.environ.copy()
    api_env.update(
        {
            "APP_ENV": "test",
            "DATABASE_URL": database_url,
            "SUPABASE_DB_URL": "",
            "JWT_SECRET": jwt_secret,
            "CORS_ORIGINS": f"{frontend_base_url},{api_base_url}",
            "SQUARE_WEBHOOK_VERIFY_SIGNATURE": "true",
            "SQUARE_PAYMENT_WEBHOOK_SIGNATURE_KEY": "smoke-sig-key",
            "SQUARE_PAYMENT_WEBHOOK_NOTIFICATION_URL": f"{api_base_url}/api/v1/webhooks/square-payment",
        }
    )

    fe_env = os.environ.copy()
    fe_env.update(
        {
            "VITE_API_URL": f"{api_base_url}/api/v1",
            "PORT": str(fe_port),
            "HOST": LOOPBACK_HOST,
        }
    )

    api_proc: subprocess.Popen[bytes] | None = None
    fe_proc: subprocess.Popen[bytes] | None = None

    try:
        print(f"[local-smoke] Starting isolated FastAPI backend on {api_base_url} ...")
        api_proc = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "uvicorn",
                "app.main:app",
                "--host",
                LOOPBACK_HOST,
                "--port",
                str(api_port),
            ],
            cwd=str(backend_dir),
            env=api_env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if not _wait_for_http(f"{api_base_url}/", timeout_sec=45.0):
            raise RuntimeError(f"Backend did not become healthy on {api_base_url}")

        npx_bin = shutil.which("npx.cmd") or shutil.which("npx") or "npx"
        print(
            f"[local-smoke] Starting isolated Vite frontend on {frontend_base_url} ..."
        )
        fe_proc = subprocess.Popen(
            [
                npx_bin,
                "vite",
                "--host",
                LOOPBACK_HOST,
                "--port",
                str(fe_port),
                "--strictPort",
            ],
            cwd=str(frontend_dir),
            env=fe_env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if not _wait_for_http(f"{frontend_base_url}/login", timeout_sec=45.0):
            raise RuntimeError(f"Frontend did not become ready on {frontend_base_url}")

        summary = run_e2e_flow(
            repo_root=repo_root,
            api_base_url=api_base_url,
            frontend_base_url=frontend_base_url,
            database_url=database_url,
            jwt_secret=jwt_secret,
            screenshot_dir=screenshot_dir,
        )
        print("[local-smoke] E2E Result:", json.dumps(summary, indent=2))
        return 0
    finally:
        for proc in (fe_proc, api_proc):
            if proc and proc.poll() is None:
                with contextlib.suppress(OSError, subprocess.SubprocessError):
                    if os.name == "nt":
                        subprocess.run(
                            ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL,
                            check=False,
                        )
                    else:
                        proc.terminate()
                        proc.wait(timeout=5)
        shutil.rmtree(temp_dir, ignore_errors=True)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="DateApp two-account chat and 30-minute session E2E verifier."
    )
    parser.add_argument("--apply", action="store_true", help="Run live E2E flow")
    parser.add_argument(
        "--local-sqlite-smoke",
        action="store_true",
        help="Run safe isolated local SQLite + ephemeral ports E2E smoke test",
    )
    parser.add_argument("--repo-root", default="", help="Repository root path")
    parser.add_argument(
        "--api-base-url",
        default=f"http://{T5500_HOST}:8000",
        help="Target API base URL",
    )
    parser.add_argument(
        "--frontend-base-url",
        default=f"http://{T5500_HOST}:3200",
        help="Target Frontend base URL",
    )
    parser.add_argument(
        "--screenshot-dir",
        default="",
        help="Directory to write verified screenshots",
    )
    args = parser.parse_args()

    repo_root = (
        Path(args.repo_root).resolve()
        if args.repo_root
        else Path(__file__).resolve().parents[2]
    )
    screenshot_dir = (
        Path(args.screenshot_dir).resolve()
        if args.screenshot_dir
        else repo_root / "docs" / "screenshots" / "dateapp-chat-session"
    )

    if not args.apply and not args.local_sqlite_smoke:
        print_dry_run_plan(
            repo_root=repo_root,
            api_base_url=args.api_base_url,
            frontend_base_url=args.frontend_base_url,
            screenshot_dir=screenshot_dir,
        )
        return 0

    if args.local_sqlite_smoke:
        return run_local_sqlite_smoke(
            repo_root=repo_root,
            screenshot_dir=screenshot_dir,
        )

    database_url = os.environ.get("SUPABASE_DB_URL") or os.environ.get(
        "DATABASE_URL", ""
    )
    jwt_secret = os.environ.get("JWT_SECRET", "")
    if not database_url or not jwt_secret:
        raise RuntimeError(
            "DATABASE_URL (or SUPABASE_DB_URL) and JWT_SECRET must be set in environment for --apply"
        )

    summary = run_e2e_flow(
        repo_root=repo_root,
        api_base_url=args.api_base_url.rstrip("/"),
        frontend_base_url=args.frontend_base_url.rstrip("/"),
        database_url=database_url,
        jwt_secret=jwt_secret,
        screenshot_dir=screenshot_dir,
    )
    print("[apply] E2E Result:", json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
