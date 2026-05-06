"""Stack-integrity probe: runs Opus Guardian and returns STRUCTURED invariants
in details so the dashboard can render each check with its own status, instead
of a stdout blob the panel has to scrape.
"""
import asyncio
import re
from datetime import datetime, timezone
from pathlib import Path

from ..envelope import make_envelope, Envelope

REPO_ROOT = Path(__file__).resolve().parents[5]
GUARDIAN_SCRIPT = REPO_ROOT / "scripts" / "clawx-control" / "opus-guardian.py"

# Lines like "    [+] CHECK_NAME [— or - or just space] detail"
# Don't constrain the separator — Guardian uses em dash but stdout encoding can mangle it.
INVARIANT_LINE = re.compile(r"^\s*\[(?P<sym>[+!X])\]\s+(?P<name>[A-Z_]+)\b\s*(?P<detail>.*?)\s*$")
SCORE_LINE = re.compile(r"Score:\s*(?P<pct>\d+)%\s*\((?P<ratio>[^)]+)\)")
STATUS_LINE = re.compile(r"Status:\s*(?P<line>.+?)$")


def parse_guardian_output(stdout: str) -> dict:
    invariants = []
    score = None
    ratio = None
    status_line = None
    for raw in stdout.splitlines():
        m = INVARIANT_LINE.match(raw)
        if m:
            sym = m.group("sym")
            inv_status = "ok" if sym == "+" else "warn" if sym == "!" else "fail"
            invariants.append(
                {
                    "name": m.group("name"),
                    "status": inv_status,
                    "detail": (m.group("detail") or "").strip(),
                }
            )
            continue
        sm = SCORE_LINE.search(raw)
        if sm:
            score = int(sm.group("pct"))
            ratio = sm.group("ratio")
            continue
        ssm = STATUS_LINE.search(raw)
        if ssm:
            status_line = ssm.group("line").strip()
    return {
        "score": score,
        "ratio": ratio,
        "status_line": status_line,
        "invariants": invariants,
        "ok_count": sum(1 for i in invariants if i["status"] == "ok"),
        "warn_count": sum(1 for i in invariants if i["status"] == "warn"),
        "fail_count": sum(1 for i in invariants if i["status"] == "fail"),
    }


async def stack_probe() -> Envelope:
    started = datetime.now(timezone.utc)
    if not GUARDIAN_SCRIPT.exists():
        return make_envelope(
            "degraded",
            0,
            {"missing": str(GUARDIAN_SCRIPT)},
            error="guardian script missing",
        )
    proc = await asyncio.create_subprocess_exec(
        "python",
        str(GUARDIAN_SCRIPT),
        cwd=str(REPO_ROOT),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout_b, stderr_b = await asyncio.wait_for(proc.communicate(), 12.0)
    except asyncio.TimeoutError:
        proc.kill()
        await proc.communicate()
        return make_envelope("unreachable", 12000, {}, error="guardian timed out after 12s")
    finished = datetime.now(timezone.utc)
    latency = int((finished - started).total_seconds() * 1000)
    stdout = stdout_b.decode(errors="ignore")
    stderr = stderr_b.decode(errors="ignore")
    parsed = parse_guardian_output(stdout)
    parsed["returncode"] = proc.returncode
    if stderr.strip():
        parsed["stderr_tail"] = stderr.strip().splitlines()[-5:]
    if proc.returncode == 0 and parsed["fail_count"] == 0:
        return make_envelope("ok", latency, parsed)
    if parsed["fail_count"] > 0:
        return make_envelope("degraded", latency, parsed)
    return make_envelope("degraded", latency, parsed)
