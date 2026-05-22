#!/usr/bin/env python3
"""
Paperweight — self-owned task/issue/sticky-note tracker for ANTIGRAVITY.

A non-third-party "Paperclip clone": your own SQLite database, your data, zero
external services and zero pip installs (Python stdlib only). Issues and tasks
live on one board; sticky notes are a freeform wall; every create/update is
written to an immutable `events` audit log so everything is logged + tracked
(assigned, completed, who/when).

Run:
    python apps/paperweight/paperweight.py            # serves http://127.0.0.1:4200
    PAPERWEIGHT_PORT=4200 PAPERWEIGHT_DB=path.db python apps/paperweight/paperweight.py

Schema mirrors services/mission-mcp (tasks/issues/events/agents) so it stays
familiar; default DB is apps/paperweight/data/paperweight.db (its own file).
Point PAPERWEIGHT_DB at ~/.hermes/state.db to share the live mission kernel.
"""
from __future__ import annotations

import json
import os
import re
import sqlite3
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_PATH = os.environ.get("PAPERWEIGHT_DB", str(ROOT / "data" / "paperweight.db"))
# Loopback by default: this is an unauthenticated CRUD surface fronted by a
# Cloudflare-Access-gated tunnel (127.0.0.1:4200). Set PAPERWEIGHT_HOST=0.0.0.0
# only when LAN exposure is intended and the Access gate is in place.
HOST = os.environ.get("PAPERWEIGHT_HOST", "127.0.0.1")
PORT = int(os.environ.get("PAPERWEIGHT_PORT", "4200"))
STATIC = ROOT / "static"

STATUSES = ("todo", "doing", "blocked", "done", "archived")
KINDS = ("task", "issue", "bug", "idea")
NOTE_COLORS = ("amber", "love", "ukid", "green", "agrav")
# Real team roster (per CLAUDE.md) — seeded as available assignees, not fabricated.
SEED_AGENTS = [
    ("Opus", "architect"), ("Codex", "executor"), ("Hermes", "orchestrator"),
    ("CEO", "strategy"), ("CFO", "ledger"), ("CMO", "marketing"),
    ("CTO", "backend"), ("INTERN", "audits"),
    ("Gemini", "co-founder"), ("Perplexity", "research"), ("Grok", "adversarial/X"),
]


def now_ms() -> int:
    return int(time.time() * 1000)


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def connect() -> sqlite3.Connection:
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA foreign_keys=ON")
    return con


def init_db() -> None:
    con = connect()
    con.executescript(
        """
        CREATE TABLE IF NOT EXISTS items (
          id TEXT PRIMARY KEY,
          kind TEXT NOT NULL DEFAULT 'task',
          title TEXT NOT NULL,
          body TEXT,
          status TEXT NOT NULL DEFAULT 'todo',
          priority INTEGER NOT NULL DEFAULT 3,
          assignee TEXT,
          parent_id TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          completed_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          body TEXT NOT NULL,
          color TEXT NOT NULL DEFAULT 'amber',
          author TEXT,
          pinned INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ts INTEGER NOT NULL,
          entity TEXT NOT NULL,
          entity_id TEXT,
          action TEXT NOT NULL,
          detail TEXT
        );
        CREATE TABLE IF NOT EXISTS agents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          role TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
        CREATE INDEX IF NOT EXISTS idx_items_assignee ON items(assignee);
        CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
        """
    )
    if con.execute("SELECT COUNT(*) c FROM agents").fetchone()["c"] == 0:
        for name, role in SEED_AGENTS:
            con.execute(
                "INSERT OR IGNORE INTO agents (id, name, role, created_at) VALUES (?,?,?,?)",
                (new_id("agent"), name, role, now_ms()),
            )
    con.commit()
    con.close()


def log_event(con: sqlite3.Connection, entity: str, entity_id: str, action: str, detail: dict | None = None) -> None:
    con.execute(
        "INSERT INTO events (ts, entity, entity_id, action, detail) VALUES (?,?,?,?,?)",
        (now_ms(), entity, entity_id, action, json.dumps(detail or {})),
    )


# ---------------------------------------------------------------------------
# Handlers (return (status_code, payload))
# ---------------------------------------------------------------------------
def get_state() -> tuple[int, dict]:
    con = connect()
    items = [dict(r) for r in con.execute("SELECT * FROM items ORDER BY priority ASC, updated_at DESC")]
    notes = [dict(r) for r in con.execute("SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC")]
    events = [dict(r) for r in con.execute("SELECT * FROM events ORDER BY id DESC LIMIT 100")]
    agents = [dict(r) for r in con.execute("SELECT * FROM agents ORDER BY name ASC")]
    con.close()
    return 200, {"items": items, "notes": notes, "events": events, "agents": agents}


def create_item(b: dict) -> tuple[int, dict]:
    title = (b.get("title") or "").strip()
    if not title:
        return 400, {"error": "title required"}
    kind = b.get("kind") if b.get("kind") in KINDS else "task"
    status = b.get("status") if b.get("status") in STATUSES else "todo"
    iid = new_id("itm")
    ts = now_ms()
    con = connect()
    con.execute(
        "INSERT INTO items (id,kind,title,body,status,priority,assignee,parent_id,created_at,updated_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?)",
        (iid, kind, title, b.get("body"), status, int(b.get("priority") or 3),
         b.get("assignee") or None, b.get("parent_id") or None, ts, ts),
    )
    log_event(con, "item", iid, "created", {"kind": kind, "title": title, "assignee": b.get("assignee")})
    con.commit()
    row = dict(con.execute("SELECT * FROM items WHERE id=?", (iid,)).fetchone())
    con.close()
    return 201, row


def update_item(iid: str, b: dict) -> tuple[int, dict]:
    con = connect()
    cur = con.execute("SELECT * FROM items WHERE id=?", (iid,)).fetchone()
    if not cur:
        con.close()
        return 404, {"error": "not found"}
    fields, vals, changes = [], [], {}
    for col in ("title", "body", "kind", "status", "priority", "assignee", "parent_id"):
        if col in b and b[col] != cur[col]:
            if col == "status" and b[col] not in STATUSES:
                continue
            if col == "kind" and b[col] not in KINDS:
                continue
            fields.append(f"{col}=?")
            vals.append(b[col])
            changes[col] = b[col]
    completed = None
    if "status" in changes:
        completed = now_ms() if changes["status"] == "done" else None
        fields.append("completed_at=?")
        vals.append(completed)
    if not fields:
        con.close()
        return 200, dict(cur)
    fields.append("updated_at=?")
    vals.append(now_ms())
    vals.append(iid)
    con.execute(f"UPDATE items SET {', '.join(fields)} WHERE id=?", vals)
    action = "completed" if changes.get("status") == "done" else (
        "assigned" if "assignee" in changes else "updated")
    log_event(con, "item", iid, action, changes)
    con.commit()
    row = dict(con.execute("SELECT * FROM items WHERE id=?", (iid,)).fetchone())
    con.close()
    return 200, row


def create_note(b: dict) -> tuple[int, dict]:
    body = (b.get("body") or "").strip()
    if not body:
        return 400, {"error": "body required"}
    color = b.get("color") if b.get("color") in NOTE_COLORS else "amber"
    nid = new_id("note")
    ts = now_ms()
    con = connect()
    con.execute(
        "INSERT INTO notes (id,body,color,author,pinned,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
        (nid, body, color, b.get("author") or None, 1 if b.get("pinned") else 0, ts, ts),
    )
    log_event(con, "note", nid, "created", {"color": color})
    con.commit()
    row = dict(con.execute("SELECT * FROM notes WHERE id=?", (nid,)).fetchone())
    con.close()
    return 201, row


def update_note(nid: str, b: dict) -> tuple[int, dict]:
    con = connect()
    cur = con.execute("SELECT * FROM notes WHERE id=?", (nid,)).fetchone()
    if not cur:
        con.close()
        return 404, {"error": "not found"}
    fields, vals, changes = [], [], {}
    for col in ("body", "color", "author", "pinned"):
        if col in b:
            v = (1 if b[col] else 0) if col == "pinned" else b[col]
            if v != cur[col]:
                fields.append(f"{col}=?")
                vals.append(v)
                changes[col] = v
    if not fields:
        con.close()
        return 200, dict(cur)
    fields.append("updated_at=?")
    vals.append(now_ms())
    vals.append(nid)
    con.execute(f"UPDATE notes SET {', '.join(fields)} WHERE id=?", vals)
    log_event(con, "note", nid, "updated", changes)
    con.commit()
    row = dict(con.execute("SELECT * FROM notes WHERE id=?", (nid,)).fetchone())
    con.close()
    return 200, row


def delete_note(nid: str) -> tuple[int, dict]:
    con = connect()
    cur = con.execute("SELECT id FROM notes WHERE id=?", (nid,)).fetchone()
    if not cur:
        con.close()
        return 404, {"error": "not found"}
    con.execute("DELETE FROM notes WHERE id=?", (nid,))
    log_event(con, "note", nid, "deleted", {})
    con.commit()
    con.close()
    return 200, {"ok": True}


def create_agent(b: dict) -> tuple[int, dict]:
    name = (b.get("name") or "").strip()
    if not name:
        return 400, {"error": "name required"}
    aid = new_id("agent")
    con = connect()
    try:
        con.execute("INSERT INTO agents (id,name,role,created_at) VALUES (?,?,?,?)",
                    (aid, name, b.get("role"), now_ms()))
        log_event(con, "agent", aid, "created", {"name": name})
        con.commit()
    except sqlite3.IntegrityError:
        con.close()
        return 409, {"error": "agent name exists"}
    row = dict(con.execute("SELECT * FROM agents WHERE id=?", (aid,)).fetchone())
    con.close()
    return 201, row


# ---------------------------------------------------------------------------
# HTTP server
# ---------------------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    server_version = "Paperweight/1.0"

    def _send(self, code: int, payload, ctype="application/json"):
        body = payload if isinstance(payload, bytes) else json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _body(self) -> dict:
        try:
            n = int(self.headers.get("Content-Length") or 0)
            return json.loads(self.rfile.read(n) or b"{}") if n else {}
        except Exception:
            return {}

    def do_OPTIONS(self):
        self._send(204, b"")

    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            f = STATIC / "index.html"
            if f.exists():
                return self._send(200, f.read_bytes(), "text/html; charset=utf-8")
            return self._send(404, {"error": "UI not found"})
        if self.path == "/api/state":
            return self._send(*get_state())
        if self.path == "/api/health":
            return self._send(200, {"ok": True, "db": DB_PATH})
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        b = self._body()
        if self.path == "/api/items":
            return self._send(*create_item(b))
        if self.path == "/api/notes":
            return self._send(*create_note(b))
        if self.path == "/api/agents":
            return self._send(*create_agent(b))
        return self._send(404, {"error": "not found"})

    def do_PATCH(self):
        b = self._body()
        m = re.match(r"^/api/items/([\w-]+)$", self.path)
        if m:
            return self._send(*update_item(m.group(1), b))
        m = re.match(r"^/api/notes/([\w-]+)$", self.path)
        if m:
            return self._send(*update_note(m.group(1), b))
        return self._send(404, {"error": "not found"})

    def do_DELETE(self):
        m = re.match(r"^/api/notes/([\w-]+)$", self.path)
        if m:
            return self._send(*delete_note(m.group(1)))
        return self._send(404, {"error": "not found"})

    def log_message(self, fmt, *args):
        pass  # quiet


def main():
    init_db()
    print(f"[paperweight] DB: {DB_PATH}")
    print(f"[paperweight] http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
