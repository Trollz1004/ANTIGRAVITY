from pathlib import Path
from .shell import shell_probe

REPO_ROOT = Path(__file__).resolve().parents[5]
GUARDIAN_SCRIPT = REPO_ROOT / "scripts" / "clawx-control" / "opus-guardian.py"


async def guardian_probe():
    if not GUARDIAN_SCRIPT.exists():
        from ..envelope import make_envelope
        return make_envelope("degraded", 0, {"missing": str(GUARDIAN_SCRIPT)}, error="guardian script missing")
    return await shell_probe(f'python "{GUARDIAN_SCRIPT}"', cwd=str(REPO_ROOT))
