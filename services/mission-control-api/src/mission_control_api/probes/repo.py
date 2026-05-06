import asyncio
from .shell import shell_probe

async def repo_probe():
    # get status
    status = await shell_probe("git status --porcelain")
    # get ahead/behind count
    ahead = await shell_probe("git rev-list --count @{u}..HEAD")
    behind = await shell_probe("git rev-list --count HEAD..@{u}")
    # last commit
    last = await shell_probe("git log -1 --pretty=format:'%H|%s|%an|%ad' --date=iso")
    # combine details
    details = {}
    if status.status == "ok":
        lines = status.details.get("stdout", "").splitlines()
        untracked = sum(1 for l in lines if l.startswith('??'))
        dirty = len(lines) - untracked
        details["dirty"] = dirty > 0
        details["untracked"] = untracked
    if ahead.status == "ok":
        details["ahead"] = int(ahead.details.get("stdout", "0").strip())
    if behind.status == "ok":
        details["behind"] = int(behind.details.get("stdout", "0").strip())
    if last.status == "ok":
        parts = last.details.get("stdout", "").strip().split('|')
        if len(parts) == 4:
            sha, subject, author, date = parts
            details["last_commit"] = {"sha": sha, "subject": subject, "author": author, "date": date}
    # Determine overall status
    overall = "ok" if not details.get("dirty") else "degraded"
    # latency placeholder 0
    from ..envelope import make_envelope
    return make_envelope(overall, 0, details)
