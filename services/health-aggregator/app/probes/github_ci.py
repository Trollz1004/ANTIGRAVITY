from __future__ import annotations

import httpx

from ..status import Check


API = "https://api.github.com/repos/Trollz1004/ANTIGRAVITY"


def probe_github() -> list[Check]:
    checks: list[Check] = []
    try:
        runs = httpx.get(f"{API}/actions/workflows/ci-validate.yml/runs?branch=main&per_page=1", timeout=8)
        if runs.status_code == 200:
            data = runs.json().get("workflow_runs", [])
            if data:
                run = data[0]
                conclusion = run.get("conclusion") or run.get("status")
                status = "green" if conclusion == "success" else "yellow" if conclusion in {"queued", "in_progress"} else "red"
                checks.append(Check("ci-validate main", status, str(conclusion), {"url": run.get("html_url")}))
            else:
                checks.append(Check("ci-validate main", "yellow", "no runs returned", {}))
        else:
            checks.append(Check("ci-validate main", "yellow", f"GitHub API HTTP {runs.status_code}", {}))
    except httpx.HTTPError as exc:
        checks.append(Check("ci-validate main", "yellow", "GitHub API unavailable", {"error": str(exc)}))

    try:
        prs = httpx.get(f"{API}/pulls?state=open&per_page=100", timeout=8)
        if prs.status_code == 200:
            checks.append(Check("open PRs", "green", "GitHub pull request count", {"count": len(prs.json())}))
        else:
            checks.append(Check("open PRs", "yellow", f"GitHub API HTTP {prs.status_code}", {}))
    except httpx.HTTPError as exc:
        checks.append(Check("open PRs", "yellow", "GitHub API unavailable", {"error": str(exc)}))
    return checks
