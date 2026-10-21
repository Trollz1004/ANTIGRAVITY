import asyncio
import os

# Load env file
env_path = r"C:\Users\joshi\.antigravity-vault\vault-handoff\env-stash-from-documents\.env-not-for-github.txt"
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.strip() and not line.startswith("#"):
                key, val = line.strip().split("=", 1)
                os.environ[key] = val

from app.database import database  # noqa: E402


async def run_migration():
    await database.connect()

    print("Running migration to add affiliate tracking...")
    try:
        # Add affiliate tracking to users table
        await database.execute("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS affiliate_id VARCHAR(255) NULL;
        """)

        # Create an index for fast lookups when calculating affiliate commissions
        await database.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_affiliate_id
            ON users(affiliate_id);
        """)
        print(
            "Migration successful: Added affiliate_id column and index to 'users' table."
        )
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        await database.disconnect()


if __name__ == "__main__":
    asyncio.run(run_migration())
