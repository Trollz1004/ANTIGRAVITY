import sys

with open('C:/ANTIGRAVITY/youandinotai-api/app/routers/health.py', 'r') as f:
    code = f.read()

target = '''@router.delete("/health/wipe-users")
async def wipe_all_users(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    try:
        await db.execute(text("TRUNCATE TABLE users RESTART IDENTITY CASCADE;"))
        await db.commit()
        return {"status": "success", "message": "All users and cascading tables have been wiped."}
    except Exception as e:
        await db.rollback()
        return {"error": str(e)}'''

replacement = '''# Temporarily removed wipe-users endpoint'''

if target in code:
    code = code.replace(target, replacement, 1)
    with open('C:/ANTIGRAVITY/youandinotai-api/app/routers/health.py', 'w') as f:
        f.write(code)
    print("Patched.")
else:
    print("Target not found.")

