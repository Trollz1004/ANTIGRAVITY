"""
SQLite database for campaign tracking.
Tables: posts, emails, subscribers, analytics, reddit_alerts
"""
import sqlite3
from datetime import datetime
from pathlib import Path

DB_PATH = None

def init(db_path: Path):
    global DB_PATH
    DB_PATH = str(db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        content TEXT NOT NULL,
        image_path TEXT,
        scheduled_time TEXT NOT NULL,
        posted INTEGER DEFAULT 0,
        post_id TEXT,
        engagement INTEGER DEFAULT 0,
        error TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient TEXT NOT NULL,
        first_name TEXT,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        sent INTEGER DEFAULT 0,
        opened INTEGER DEFAULT 0,
        error TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        first_name TEXT,
        tier TEXT DEFAULT 'earlybird',
        signup_date TEXT DEFAULT CURRENT_TIMESTAMP,
        active INTEGER DEFAULT 1
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        metric TEXT NOT NULL,
        value INTEGER DEFAULT 0,
        notes TEXT
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS reddit_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subreddit TEXT,
        post_title TEXT,
        post_url TEXT,
        matched_keyword TEXT,
        discovered_at TEXT DEFAULT CURRENT_TIMESTAMP,
        responded INTEGER DEFAULT 0
    )""")

    conn.commit()
    conn.close()


def get_conn():
    return sqlite3.connect(DB_PATH)


def insert_post(platform, content, scheduled_time, image_path=None):
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "INSERT INTO posts (platform, content, scheduled_time, image_path) VALUES (?, ?, ?, ?)",
        (platform, content, scheduled_time, image_path)
    )
    conn.commit()
    conn.close()


def get_pending_posts():
    conn = get_conn()
    c = conn.cursor()
    now = datetime.now().isoformat()
    c.execute(
        "SELECT id, platform, content, image_path FROM posts WHERE scheduled_time <= ? AND posted = 0",
        (now,)
    )
    rows = c.fetchall()
    conn.close()
    return rows


def mark_post_done(post_id, external_id=None):
    conn = get_conn()
    c = conn.cursor()
    c.execute("UPDATE posts SET posted = 1, post_id = ? WHERE id = ?", (external_id, post_id))
    conn.commit()
    conn.close()


def mark_post_error(post_id, error_msg):
    conn = get_conn()
    c = conn.cursor()
    c.execute("UPDATE posts SET error = ? WHERE id = ?", (error_msg, post_id))
    conn.commit()
    conn.close()


def insert_email(recipient, first_name, subject, body, scheduled_time):
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "INSERT INTO emails (recipient, first_name, subject, body, scheduled_time) VALUES (?, ?, ?, ?, ?)",
        (recipient, first_name, subject, body, scheduled_time)
    )
    conn.commit()
    conn.close()


def get_pending_emails():
    conn = get_conn()
    c = conn.cursor()
    now = datetime.now().isoformat()
    c.execute(
        "SELECT id, recipient, first_name, subject, body FROM emails WHERE scheduled_time <= ? AND sent = 0",
        (now,)
    )
    rows = c.fetchall()
    conn.close()
    return rows


def mark_email_sent(email_id):
    conn = get_conn()
    c = conn.cursor()
    c.execute("UPDATE emails SET sent = 1 WHERE id = ?", (email_id,))
    conn.commit()
    conn.close()


def log_metric(metric, value, notes=None):
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "INSERT INTO analytics (timestamp, metric, value, notes) VALUES (?, ?, ?, ?)",
        (datetime.now().isoformat(), metric, value, notes)
    )
    conn.commit()
    conn.close()


def get_today_metrics():
    conn = get_conn()
    c = conn.cursor()
    today = datetime.now().date().isoformat()
    c.execute("SELECT metric, SUM(value) FROM analytics WHERE timestamp LIKE ? GROUP BY metric", (f"{today}%",))
    rows = c.fetchall()
    conn.close()
    return {m: v for m, v in rows}


def insert_reddit_alert(subreddit, title, url, keyword):
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "INSERT OR IGNORE INTO reddit_alerts (subreddit, post_title, post_url, matched_keyword) VALUES (?, ?, ?, ?)",
        (subreddit, title, url, keyword)
    )
    conn.commit()
    conn.close()


def add_subscriber(email, first_name="", tier="earlybird"):
    conn = get_conn()
    c = conn.cursor()
    try:
        c.execute(
            "INSERT INTO subscribers (email, first_name, tier) VALUES (?, ?, ?)",
            (email, first_name, tier)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        pass  # already exists
    conn.close()


def get_subscribers():
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT email, first_name, tier FROM subscribers WHERE active = 1")
    rows = c.fetchall()
    conn.close()
    return rows
