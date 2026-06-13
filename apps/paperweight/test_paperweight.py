#!/usr/bin/env python3
"""
Paperweight test suite — stdlib unittest, zero dependencies, real temp SQLite.

Run:
    python apps/paperweight/test_paperweight.py            # direct
    cd apps/paperweight && python -m unittest -v           # discovery

Covers the P0 risks from the testing strategy: the multi-company migration
(_ensure_column upgrading a pre-existing single-company DB without data loss),
the immutable audit log, company scoping, and the proposal vote tally — plus
the input-validation and secret-free invariants.
"""
import os
import sqlite3
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paperweight as pw  # noqa: E402


class PaperweightTestBase(unittest.TestCase):
    def setUp(self):
        fd, self.db = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        os.unlink(self.db)  # start clean; init_db creates it
        pw.DB_PATH = self.db
        pw.init_db()

    def tearDown(self):
        for ext in ("", "-wal", "-shm"):
            try:
                os.unlink(self.db + ext)
            except OSError:
                pass

    def _events(self, action=None):
        con = pw.connect()
        rows = [dict(r) for r in con.execute("SELECT * FROM events ORDER BY id")]
        con.close()
        return [e for e in rows if action is None or e["action"] == action]


class TestSeed(PaperweightTestBase):
    def test_company_workspaces_seeded(self):
        _, state = pw.get_state()
        ids = {c["id"] for c in state["companies"]}
        self.assertEqual(
            ids,
            {
                "youandinotai",
                "marketing",
                "ai-solutions",
                "business-exchange",
                "hermes-sideworld",
                "youtube",
                "onlinerecycle",
                "dao",
            },
        )

    def test_agents_seeded_once(self):
        # init_db is idempotent — re-running must not duplicate agents
        pw.init_db()
        _, state = pw.get_state()
        names = [a["name"] for a in state["agents"]]
        self.assertEqual(len(names), len(set(names)), "duplicate agents after re-init")
        self.assertIn("Opus", names)


class TestItems(PaperweightTestBase):
    def test_create_logs_audit_event(self):
        code, row = pw.create_item({"title": "ship it", "kind": "task", "company": "youandinotai"})
        self.assertEqual(code, 201)
        self.assertEqual(row["company"], "youandinotai")
        created = self._events("created")
        self.assertEqual(len(created), 1)
        self.assertEqual(created[0]["entity_id"], row["id"])

    def test_blank_title_rejected(self):
        code, _ = pw.create_item({"title": "   "})
        self.assertEqual(code, 400)

    def test_bad_kind_defaults_to_task(self):
        _, row = pw.create_item({"title": "x", "kind": "nonsense"})
        self.assertEqual(row["kind"], "task")

    def test_complete_sets_completed_at_and_logs(self):
        _, row = pw.create_item({"title": "finish me"})
        self.assertIsNone(row["completed_at"])
        code, done = pw.update_item(row["id"], {"status": "done"})
        self.assertEqual(code, 200)
        self.assertIsNotNone(done["completed_at"])
        self.assertEqual(len(self._events("completed")), 1)

    def test_reopen_clears_completed_at(self):
        _, row = pw.create_item({"title": "x"})
        pw.update_item(row["id"], {"status": "done"})
        _, reopened = pw.update_item(row["id"], {"status": "doing"})
        self.assertIsNone(reopened["completed_at"])

    def test_assign_logs_assigned(self):
        _, row = pw.create_item({"title": "x"})
        pw.update_item(row["id"], {"assignee": "Codex"})
        self.assertEqual(len(self._events("assigned")), 1)

    def test_invalid_status_ignored(self):
        _, row = pw.create_item({"title": "x"})
        _, updated = pw.update_item(row["id"], {"status": "bogus"})
        self.assertEqual(updated["status"], "todo")

    def test_update_missing_is_404(self):
        code, _ = pw.update_item("itm_does_not_exist", {"status": "done"})
        self.assertEqual(code, 404)


class TestProposalsAndVoting(PaperweightTestBase):
    def test_proposal_inits_tally(self):
        import json

        _, row = pw.create_item({"title": "ratify", "kind": "proposal", "company": "dao"})
        meta = json.loads(row["meta"])
        self.assertEqual(meta, {"for": 0, "against": 0, "vote_status": "open"})

    def test_vote_increments_and_logs(self):
        import json

        _, row = pw.create_item({"title": "p", "kind": "proposal", "company": "dao"})
        pw.vote_item(row["id"], {"dir": "for"})
        _, after = pw.vote_item(row["id"], {"dir": "against"})
        meta = json.loads(after["meta"])
        self.assertEqual((meta["for"], meta["against"]), (1, 1))
        self.assertEqual(len(self._events("voted")), 2)

    def test_vote_rejects_bad_direction(self):
        _, row = pw.create_item({"title": "p", "kind": "proposal", "company": "dao"})
        code, _ = pw.vote_item(row["id"], {"dir": "sideways"})
        self.assertEqual(code, 400)

    def test_vote_only_on_proposals(self):
        _, row = pw.create_item({"title": "a task", "kind": "task"})
        code, _ = pw.vote_item(row["id"], {"dir": "for"})
        self.assertEqual(code, 400)


class TestCompanyScoping(PaperweightTestBase):
    def test_scoping_and_counts(self):
        pw.create_item({"title": "y-open", "company": "youandinotai"})
        _, d = pw.create_item({"title": "y-done", "company": "youandinotai"})
        pw.update_item(d["id"], {"status": "done"})
        pw.create_item({"title": "m-open", "company": "marketing"})

        _, scoped = pw.get_state("youandinotai")
        self.assertTrue(all(i["company"] == "youandinotai" for i in scoped["items"]))
        self.assertEqual(len(scoped["items"]), 2)

        counts = {c["id"]: (c["open"], c["done"]) for c in scoped["companies"]}
        self.assertEqual(counts["youandinotai"], (1, 1))
        self.assertEqual(counts["marketing"], (1, 0))

    def test_archived_excluded_from_open_count(self):
        _, row = pw.create_item({"title": "x", "company": "marketing"})
        pw.update_item(row["id"], {"status": "archived"})
        _, state = pw.get_state()
        counts = {c["id"]: (c["open"], c["done"]) for c in state["companies"]}
        self.assertEqual(counts["marketing"], (0, 0))


class TestNotes(PaperweightTestBase):
    def test_note_lifecycle(self):
        code, note = pw.create_note({"body": "remember the kids", "color": "love", "company": "dao"})
        self.assertEqual(code, 201)
        _, state = pw.get_state("dao")
        self.assertEqual(len(state["notes"]), 1)
        code, _ = pw.delete_note(note["id"])
        self.assertEqual(code, 200)
        _, state2 = pw.get_state("dao")
        self.assertEqual(len(state2["notes"]), 0)

    def test_delete_missing_note_404(self):
        code, _ = pw.delete_note("note_nope")
        self.assertEqual(code, 404)


class TestMigration(PaperweightTestBase):
    """The P0 risk: upgrading a live pre-multi-company DB must not lose data."""

    def test_old_single_company_db_upgrades_cleanly(self):
        # Build a DB in the OLD shape: items without company/meta columns.
        fd, old = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        os.unlink(old)
        con = sqlite3.connect(old)
        con.executescript(
            """
            CREATE TABLE items (id TEXT PRIMARY KEY, kind TEXT, title TEXT NOT NULL,
              body TEXT, status TEXT, priority INTEGER, assignee TEXT, parent_id TEXT,
              created_at INTEGER, updated_at INTEGER, completed_at INTEGER);
            CREATE TABLE notes (id TEXT PRIMARY KEY, body TEXT NOT NULL, color TEXT,
              author TEXT, pinned INTEGER, created_at INTEGER, updated_at INTEGER);
            CREATE TABLE events (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER,
              entity TEXT, entity_id TEXT, action TEXT, detail TEXT);
            CREATE TABLE agents (id TEXT PRIMARY KEY, name TEXT UNIQUE, role TEXT, created_at INTEGER);
            INSERT INTO items (id,kind,title,status,priority,created_at,updated_at)
              VALUES ('itm_legacy','task','pre-migration work','doing',2,1,1);
            """
        )
        con.commit()
        con.close()

        try:
            pw.DB_PATH = old
            pw.init_db()  # must add company/meta columns without dropping the legacy row
            con = pw.connect()
            cols = {r["name"] for r in con.execute("PRAGMA table_info(items)")}
            self.assertIn("company", cols)
            self.assertIn("meta", cols)
            row = con.execute("SELECT * FROM items WHERE id='itm_legacy'").fetchone()
            con.close()
            self.assertIsNotNone(row, "legacy row lost during migration")
            self.assertEqual(row["title"], "pre-migration work")
            self.assertEqual(row["company"], pw.DEFAULT_COMPANY)  # backfilled default
        finally:
            for ext in ("", "-wal", "-shm"):
                try:
                    os.unlink(old + ext)
                except OSError:
                    pass


class TestInvariants(PaperweightTestBase):
    def test_source_is_secret_free(self):
        # Doctrine: this ops surface must hold zero credentials.
        with open(os.path.join(os.path.dirname(__file__), "paperweight.py"), encoding="utf-8") as f:
            src = f.read()
        import re

        for pat in (r"sk_live_[A-Za-z0-9]", r"AIza[0-9A-Za-z_-]{20}", r"ghp_[A-Za-z0-9]{20}"):
            self.assertIsNone(re.search(pat, src), f"possible secret matching {pat} in source")

    def test_loopback_default_bind(self):
        # Security: must not default to 0.0.0.0 (unauthenticated CRUD surface).
        self.assertEqual(os.environ.get("PAPERWEIGHT_HOST", pw.HOST), "127.0.0.1")


if __name__ == "__main__":
    unittest.main(verbosity=2)
