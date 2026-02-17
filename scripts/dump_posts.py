import sqlite3
import os

db_path = 'marketing-automation/data/campaign.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print(f"Tables: {tables}")

    if ('posts',) in tables:
        cursor.execute("SELECT platform, city, url FROM posts WHERE url IS NOT NULL")
        posts = cursor.fetchall()
        print(f"Total posts with URLs: {len(posts)}")
        for platform, city, url in posts:
            print(f"{platform}|{city}|{url}")
    else:
        print("Table 'posts' not found.")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
