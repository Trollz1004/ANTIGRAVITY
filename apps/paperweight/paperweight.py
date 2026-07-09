#!/usr/bin/env python3
"""
Paperweight — self-owned mission-control task/issue/sticky-note tracker for ANTIGRAVITY.

A non-third-party "Paperclip clone": your own SQLite database, your data, zero
external services and zero pip installs (Python stdlib only). Issues and tasks live
on one board; sticky notes are a freeform wall; every create/update/vote is written
to an immutable `events` audit log so everything is logged + tracked.

Multi-surface: work is scoped to workspaces (companies) so each surface is separate:
  - agent-hub    : Sabretooth orchestration and cross-AI dispatch
  - youandinotai  : date app + Customer Support tickets
  - marketing     : cross-platform, serves all surfaces
  - ai-solutions  : ai-solutions.store products
  - business-exchange : 9020-hosted business marketplace / operator workflow
  - hermes-sideworld  : Hermes orchestration, node control, and side-work backlog
  - dream-online : DREAM ONLINE drive and game work

SECRET-FREE BY DESIGN: never store API keys, tokens, or credentials here. This is an
ops board; multiple AI platforms may read it, so it must hold zero secrets and no
private owner/accounting doctrine.

Run:
    python apps/paperweight/paperweight.py            # http://127.0.0.1:4200
    PAPERWEIGHT_PORT=4200 PAPERWEIGHT_DB=path.db python apps/paperweight/paperweight.py
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
# Loopback by default: this is an unauthenticated CRUD surface meant to sit behind a
# Cloudflare-Access-gated tunnel. Set PAPERWEIGHT_HOST=0.0.0.0 only when LAN exposure
# is intended AND the Access gate is in place.
HOST = os.environ.get("PAPERWEIGHT_HOST", "127.0.0.1")
PORT = int(os.environ.get("PAPERWEIGHT_PORT", "4200"))
STATIC = ROOT / "static"

STATUSES = ("todo", "doing", "blocked", "done", "archived")
KINDS = ("task", "issue", "bug", "idea", "support", "proposal", "goal", "routine")
NOTE_COLORS = ("amber", "love", "ukid", "green", "agrav")
DEFAULT_COMPANY = "agent-hub"

# Workspaces (id, name, description, color).
SEED_COMPANIES = [
    ("agent-hub", "Agent Hub", "Sabretooth orchestration and cross-AI dispatch", "agrav"),
    ("youandinotai", "YouAndINotAI", "Date app + customer support", "love"),
    ("marketing", "Marketing", "Cross-platform — serves all surfaces", "amber"),
    ("ai-solutions", "AI-Solutions", "ai-solutions.store products", "ukid"),
    ("business-exchange", "Business Exchange", "9020-hosted business marketplace and operator workflow", "copper"),
    ("hermes-sideworld", "Hermes Sideworld", "Hermes orchestration, node control, and side-work backlog", "agrav"),
    ("dream-online", "DREAM Online", "DREAM ONLINE MMORPG drive and Agent Hub lanes", "ukid"),
    ("youtube", "YouTube", "Content engine — many buckets per video (CTA, subs, Super Thanks, membership, merch, affiliate)", "youtube"),
    ("onlinerecycle", "OnlineRecycle", "onlinerecycle.net cross-lister — eBay cross-listing, e-waste, resale", "green"),
]
# Standing Paperweight assignees. Other runtimes are tools/subagents under these CEOs,
# not permanent dashboard seats.
SEED_AGENTS = [
    ("Claude CEO", "code, compliance, doctrine, payments, merge/push"),
    ("Hermes CEO", "growth, support, research, external APIs, leads"),
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
    return con


def _ensure_column(con: sqlite3.Connection, table: str, col: str, decl: str) -> None:
    """Idempotent ADD COLUMN — upgrades an existing single-company DB cleanly."""
    cols = {r["name"] for r in con.execute(f"PRAGMA table_info({table})")}
    if col not in cols:
        con.execute(f"ALTER TABLE {table} ADD COLUMN {col} {decl}")


def init_db() -> None:
    con = connect()
    con.executescript(
        """
        CREATE TABLE IF NOT EXISTS companies (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
          color TEXT NOT NULL DEFAULT 'amber', created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS items (
          id TEXT PRIMARY KEY, kind TEXT NOT NULL DEFAULT 'task', title TEXT NOT NULL,
          body TEXT, status TEXT NOT NULL DEFAULT 'todo', priority INTEGER NOT NULL DEFAULT 3,
          assignee TEXT, parent_id TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
          completed_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY, body TEXT NOT NULL, color TEXT NOT NULL DEFAULT 'amber',
          author TEXT, pinned INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, entity TEXT NOT NULL,
          entity_id TEXT, action TEXT NOT NULL, detail TEXT
        );
        CREATE TABLE IF NOT EXISTS agents (
          id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, role TEXT, created_at INTEGER NOT NULL
        );
        """
    )
    # Multi-company migration (idempotent — existing DBs upgrade cleanly).
    _ensure_column(con, "items", "company", f"TEXT NOT NULL DEFAULT '{DEFAULT_COMPANY}'")
    _ensure_column(con, "items", "meta", "TEXT NOT NULL DEFAULT '{}'")
    _ensure_column(con, "notes", "company", f"TEXT NOT NULL DEFAULT '{DEFAULT_COMPANY}'")
    _ensure_column(con, "events", "company", "TEXT")
    con.execute("CREATE INDEX IF NOT EXISTS idx_items_company ON items(company)")
    con.execute("CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)")
    con.execute("CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts)")

    canonical_companies = {cid for cid, *_ in SEED_COMPANIES}
    placeholders = ",".join("?" for _ in canonical_companies)
    con.execute("UPDATE items SET company=? WHERE company='dao'", (DEFAULT_COMPANY,))
    con.execute("UPDATE notes SET company=? WHERE company='dao'", (DEFAULT_COMPANY,))
    con.execute("UPDATE events SET company=? WHERE company='dao'", (DEFAULT_COMPANY,))

    # Always upsert seed companies so newly-added workspaces land on existing DBs
    # without wiping data, then prune obsolete surface chips that cause drift.
    for cid, name, desc, color in SEED_COMPANIES:
        con.execute("INSERT OR IGNORE INTO companies (id,name,description,color,created_at) VALUES (?,?,?,?,?)",
                    (cid, name, desc, color, now_ms()))
        con.execute("UPDATE companies SET name=?, description=?, color=? WHERE id=?", (name, desc, color, cid))
    con.execute(f"DELETE FROM companies WHERE id NOT IN ({placeholders})", tuple(canonical_companies))

    canonical_agents = {name for name, _ in SEED_AGENTS}
    agent_placeholders = ",".join("?" for _ in canonical_agents)
    for name, role in SEED_AGENTS:
        con.execute("INSERT OR IGNORE INTO agents (id,name,role,created_at) VALUES (?,?,?,?)",
                    (new_id("agent"), name, role, now_ms()))
        con.execute("UPDATE agents SET role=? WHERE name=?", (role, name))
    con.execute(f"DELETE FROM agents WHERE name NOT IN ({agent_placeholders})", tuple(canonical_agents))
    con.execute(
        f"UPDATE items SET assignee=NULL WHERE assignee IS NOT NULL AND assignee NOT IN ({agent_placeholders})",
        tuple(canonical_agents),
    )
    con.commit()
    con.close()


def log_event(con, company, entity, entity_id, action, detail=None):
    con.execute("INSERT INTO events (ts,company,entity,entity_id,action,detail) VALUES (?,?,?,?,?,?)",
                (now_ms(), company, entity, entity_id, action, json.dumps(detail or {})))


# ---------------------------------------------------------------------------
def get_state(company=None) -> tuple[int, dict]:
    con = connect()
    scoped = company and company != "all"
    where, params = (" WHERE company=?", [company]) if scoped else ("", [])
    items = [dict(r) for r in con.execute(f"SELECT * FROM items{where} ORDER BY priority ASC, updated_at DESC", params)]
    notes = [dict(r) for r in con.execute(f"SELECT * FROM notes{where} ORDER BY pinned DESC, updated_at DESC", params)]
    ev_where, ev_params = (" WHERE company=?", [company]) if scoped else ("", [])
    events = [dict(r) for r in con.execute(f"SELECT * FROM events{ev_where} ORDER BY id DESC LIMIT 100", ev_params)]
    agents = [dict(r) for r in con.execute("SELECT * FROM agents ORDER BY name ASC")]
    # per-company counts for switcher badges
    counts: dict[str, dict] = {}
    for r in con.execute("SELECT company, status, COUNT(*) c FROM items GROUP BY company, status"):
        d = counts.setdefault(r["company"], {"open": 0, "done": 0})
        if r["status"] == "done":
            d["done"] += r["c"]
        elif r["status"] != "archived":
            d["open"] += r["c"]
    companies = []
    for r in con.execute("SELECT * FROM companies ORDER BY rowid ASC"):
        c = dict(r)
        c["open"] = counts.get(c["id"], {}).get("open", 0)
        c["done"] = counts.get(c["id"], {}).get("done", 0)
        companies.append(c)
    con.close()
    return 200, {"company": company or "all", "companies": companies,
                 "items": items, "notes": notes, "events": events, "agents": agents}


def create_item(b: dict) -> tuple[int, dict]:
    title = (b.get("title") or "").strip()
    if not title:
        return 400, {"error": "title required"}
    kind = b.get("kind") if b.get("kind") in KINDS else "task"
    status = b.get("status") if b.get("status") in STATUSES else "todo"
    company = b.get("company") or DEFAULT_COMPANY
    iid, ts = new_id("itm"), now_ms()
    meta = {}
    if kind == "proposal":
        meta = {"for": 0, "against": 0, "vote_status": "open"}
    elif kind == "routine":
        days = max(1, int(b.get("every_days") or 7))
        meta = {"every_days": days, "next_due": ts + days * 86400000, "runs": 0}
    elif kind == "goal":
        meta = {"target": b.get("target")}
    con = connect()
    con.execute(
        "INSERT INTO items (id,company,kind,title,body,status,priority,assignee,parent_id,meta,created_at,updated_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        (iid, company, kind, title, b.get("body"), status, int(b.get("priority") or 3),
         b.get("assignee") or None, b.get("parent_id") or None, json.dumps(meta), ts, ts),
    )
    log_event(con, company, "item", iid, "created", {"kind": kind, "title": title, "assignee": b.get("assignee")})
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
    for col in ("title", "body", "kind", "status", "priority", "assignee", "parent_id", "company"):
        if col in b and b[col] != cur[col]:
            if col == "status" and b[col] not in STATUSES:
                continue
            if col == "kind" and b[col] not in KINDS:
                continue
            fields.append(f"{col}=?"); vals.append(b[col]); changes[col] = b[col]
    if "status" in changes:
        fields.append("completed_at=?")
        vals.append(now_ms() if changes["status"] == "done" else None)
    if not fields:
        con.close()
        return 200, dict(cur)
    fields.append("updated_at=?"); vals.append(now_ms()); vals.append(iid)
    con.execute(f"UPDATE items SET {', '.join(fields)} WHERE id=?", vals)
    action = "completed" if changes.get("status") == "done" else ("assigned" if "assignee" in changes else "updated")
    log_event(con, cur["company"], "item", iid, action, changes)
    con.commit()
    row = dict(con.execute("SELECT * FROM items WHERE id=?", (iid,)).fetchone())
    con.close()
    return 200, row


def vote_item(iid: str, b: dict) -> tuple[int, dict]:
    direction = b.get("dir")
    if direction not in ("for", "against"):
        return 400, {"error": "dir must be 'for' or 'against'"}
    con = connect()
    cur = con.execute("SELECT * FROM items WHERE id=?", (iid,)).fetchone()
    if not cur:
        con.close()
        return 404, {"error": "not found"}
    if cur["kind"] != "proposal":
        con.close()
        return 400, {"error": "only proposals can be voted on"}
    meta = json.loads(cur["meta"] or "{}")
    meta.setdefault("for", 0); meta.setdefault("against", 0); meta.setdefault("vote_status", "open")
    meta[direction] += 1
    con.execute("UPDATE items SET meta=?, updated_at=? WHERE id=?", (json.dumps(meta), now_ms(), iid))
    log_event(con, cur["company"], "item", iid, "voted",
              {"dir": direction, "for": meta["for"], "against": meta["against"]})
    con.commit()
    row = dict(con.execute("SELECT * FROM items WHERE id=?", (iid,)).fetchone())
    con.close()
    return 200, row


def tick_item(iid: str) -> tuple[int, dict]:
    """Mark a routine run once — advances next_due, increments runs (the wheel turning)."""
    con = connect()
    cur = con.execute("SELECT * FROM items WHERE id=?", (iid,)).fetchone()
    if not cur:
        con.close()
        return 404, {"error": "not found"}
    if cur["kind"] != "routine":
        con.close()
        return 400, {"error": "only routines can be ticked"}
    meta = json.loads(cur["meta"] or "{}")
    days = max(1, int(meta.get("every_days") or 7))
    meta["runs"] = int(meta.get("runs") or 0) + 1
    meta["last_run"] = now_ms()
    meta["next_due"] = now_ms() + days * 86400000
    con.execute("UPDATE items SET meta=?, updated_at=? WHERE id=?", (json.dumps(meta), now_ms(), iid))
    log_event(con, cur["company"], "item", iid, "ran", {"runs": meta["runs"]})
    con.commit()
    row = dict(con.execute("SELECT * FROM items WHERE id=?", (iid,)).fetchone())
    con.close()
    return 200, row


def create_note(b: dict) -> tuple[int, dict]:
    body = (b.get("body") or "").strip()
    if not body:
        return 400, {"error": "body required"}
    color = b.get("color") if b.get("color") in NOTE_COLORS else "amber"
    company = b.get("company") or DEFAULT_COMPANY
    nid, ts = new_id("note"), now_ms()
    con = connect()
    con.execute("INSERT INTO notes (id,company,body,color,author,pinned,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
                (nid, company, body, color, b.get("author") or None, 1 if b.get("pinned") else 0, ts, ts))
    log_event(con, company, "note", nid, "created", {"color": color})
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
                fields.append(f"{col}=?"); vals.append(v); changes[col] = v
    if not fields:
        con.close()
        return 200, dict(cur)
    fields.append("updated_at=?"); vals.append(now_ms()); vals.append(nid)
    con.execute(f"UPDATE notes SET {', '.join(fields)} WHERE id=?", vals)
    log_event(con, cur["company"], "note", nid, "updated", changes)
    con.commit()
    row = dict(con.execute("SELECT * FROM notes WHERE id=?", (nid,)).fetchone())
    con.close()
    return 200, row


def delete_note(nid: str) -> tuple[int, dict]:
    con = connect()
    cur = con.execute("SELECT * FROM notes WHERE id=?", (nid,)).fetchone()
    if not cur:
        con.close()
        return 404, {"error": "not found"}
    con.execute("DELETE FROM notes WHERE id=?", (nid,))
    log_event(con, cur["company"], "note", nid, "deleted", {})
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
        con.execute("INSERT INTO agents (id,name,role,created_at) VALUES (?,?,?,?)", (aid, name, b.get("role"), now_ms()))
        log_event(con, None, "agent", aid, "created", {"name": name})
        con.commit()
    except sqlite3.IntegrityError:
        con.close()
        return 409, {"error": "agent name exists"}
    row = dict(con.execute("SELECT * FROM agents WHERE id=?", (aid,)).fetchone())
    con.close()
    return 201, row


# ---------------------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    server_version = "Paperweight/2.0"

    def _send(self, code, payload, ctype="application/json"):
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

    def _query(self) -> dict:
        from urllib.parse import urlparse, parse_qs
        return {k: v[0] for k, v in parse_qs(urlparse(self.path).query).items()}

    def do_OPTIONS(self):
        self._send(204, b"")

    def do_GET(self):
        path = self.path.split("?")[0]
        if path in ("/", "/index.html"):
            f = STATIC / "index.html"
            return self._send(200, f.read_bytes(), "text/html; charset=utf-8") if f.exists() else self._send(404, {"error": "UI not found"})
        if path == "/api/state":
            return self._send(*get_state(self._query().get("company")))
        if path == "/api/health":
            return self._send(200, {"ok": True, "db": DB_PATH})
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        b = self._body()
        path = self.path.split("?")[0]
        m = re.match(r"^/api/items/([\w-]+)/vote$", path)
        if m:
            return self._send(*vote_item(m.group(1), b))
        m = re.match(r"^/api/items/([\w-]+)/tick$", path)
        if m:
            return self._send(*tick_item(m.group(1)))
        if path == "/api/items":
            return self._send(*create_item(b))
        if path == "/api/notes":
            return self._send(*create_note(b))
        if path == "/api/agents":
            return self._send(*create_agent(b))
        return self._send(404, {"error": "not found"})

    def do_PATCH(self):
        b = self._body()
        path = self.path.split("?")[0]
        m = re.match(r"^/api/items/([\w-]+)$", path)
        if m:
            return self._send(*update_item(m.group(1), b))
        m = re.match(r"^/api/notes/([\w-]+)$", path)
        if m:
            return self._send(*update_note(m.group(1), b))
        return self._send(404, {"error": "not found"})

    def do_DELETE(self):
        m = re.match(r"^/api/notes/([\w-]+)$", self.path.split("?")[0])
        if m:
            return self._send(*delete_note(m.group(1)))
        return self._send(404, {"error": "not found"})

    def log_message(self, *a):
        pass


def main():
    init_db()
    print(f"[paperweight] DB: {DB_PATH}")
    print(f"[paperweight] http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
