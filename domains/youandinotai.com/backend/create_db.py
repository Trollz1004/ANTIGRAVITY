import asyncio

import asyncpg


async def main():
    # Connect to the default postgres database to create a new one
    conn = await asyncpg.connect(
        user="uandinotai",
        password="yGKsX1ylhXCQkjr1H0F0SWYWWl_gxKPC",
        host="127.0.0.1",
        port=5432,
        database="postgres",
    )
    try:
        await conn.execute("CREATE DATABASE paperclip_db")
        print("Database created!")
    except asyncpg.exceptions.DuplicateDatabaseError:
        print("Database already exists.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
