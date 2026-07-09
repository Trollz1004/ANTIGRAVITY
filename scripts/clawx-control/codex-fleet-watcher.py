#!/usr/bin/env python3
"""
CodeX Fleet Watcher
===================

Daily watcher for Sabretooth. It audits:
- git/main cleanliness and branch drift
- critical CodeX scheduled tasks
- SSH reachability to T5500 / 9020 aliases
- profit-side public surfaces and security headers
- optional Cloudflare zone status
- existing platform audits (`opus-guardian.py`, `scan-public-copy-policy.py`)
- source-of-truth file hashes

Outputs:
- append-only NDJSON audit log under CodeX/logs
- latest JSON/Markdown summary under CodeX/state/runtime
- optional escalation brief + webhook + Twilio SMS when critical failures remain unresolved
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent.parent
CODEX_DIR = ROOT / "CodeX"
LOG_DIR = CODEX_DIR / "logs"
RUNTIME_DIR = CODEX_DIR / "state" / "runtime"

AUDIT_LOG = LOG_DIR / "codex-fleet-watch.ndjson"
SUMMARY_JSON = RUNTIME_DIR / "codex-fleet-watch-latest.json"
SUMMARY_MD = RUNTIME_DIR / "codex-fleet-watch-latest.md"
ESCALATION_MD = RUNTIME_DIR / "codex-fleet-watch-escalation.md"

DEFAULT_DOMAINS = [
    "https://youandinotai.com",
    "https://onlinerecycle.net",
]

DEFAULT_ZONES = [
    "youandinotai.com",
    "onlinerecycle.net",
]

DEFAULT_TASKS = [
    "CodeX-Mission-Guardian",
    "CodeX-Brain-Checkpoint",
    "CodeX-Task-Sentry",
    "CodeX-SABRETOOTH-Safe-Control",
]

DEFAULT_SSH_ALIASES = {
    "t5500": "OK-T5500",
    "9020": "OK-9020",
}

HASH_TARGETS = [
    ROOT / "AGENTS.md",
    ROOT / "CLAUDE.md",
    ROOT / ".mcp.json",
    ROOT / "memory" / "activeContext.md",
    ROOT / "memory" / "sessionHandoff.md",
    ROOT / "briefings" / "LIVE-PAYMENT-SOURCE-OF-TRUTH.md",
    ROOT / "briefings" / "HISTORICAL-ONCHAIN-STATUS.md",
]

HEADER_RULES = [
    ("strict-transport-security", lambda v: "max-age=" in v.lower(), "missing_or_invalid"),
    (
        "content-security-policy",
        lambda v: "unsafe-inline" not in v.lower() and "unsafe-eval" not in v.lower(),
        "missing_or_invalid",
    ),
    ("x-frame-options", lambda v: v.lower() in {"deny", "sameorigin"}, "missing_or_invalid"),
    (
        "referrer-policy",
        lambda v: "no-referrer" in v.lower() or "strict-origin" in v.lower(),
        "missing_or_invalid",
    ),
    ("permissions-policy", lambda v: bool(v.strip()), "missing_or_invalid"),
    ("x-content-type-options", lambda v: v.lower() == "nosniff", "missing_or_invalid"),
]


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def ensure_dirs() -> None:
    for path in (LOG_DIR, RUNTIME_DIR):
        path.mkdir(parents=True, exist_ok=True)


def read_env(name: str, *fallbacks: str) -> str | None:
    for key in (name, *fallbacks):
        value = os.getenv(key)
        if value and value.strip():
            return value.strip()
    return None


def parse_csv_env(name: str, default: list[str]) -> list[str]:
    raw = os.getenv(name)
    if not raw:
        return default
    items = [item.strip() for item in raw.split(",")]
    return [item for item in items if item]


def append_audit(event: str, payload: dict[str, Any]) -> None:
    ensure_dirs()
    entry = {
        "timestamp": iso_now(),
        "event": event,
        **payload,
    }
    canonical = json.dumps(entry, sort_keys=True, separators=(",", ":"))
    entry["hash"] = sha256_text(canonical)
    with AUDIT_LOG.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, sort_keys=True) + "\n")


@dataclass
class CommandResult:
    ok: bool
    code: int
    stdout: str
    stderr: str


def run_command(
    args: list[str],
    *,
    cwd: Path | None = None,
    timeout: int = 30,
) -> CommandResult:
    try:
        completed = subprocess.run(
            args,
            cwd=str(cwd) if cwd else None,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
        return CommandResult(
            ok=completed.returncode == 0,
            code=completed.returncode,
            stdout=(completed.stdout or "").strip(),
            stderr=(completed.stderr or "").strip(),
        )
    except FileNotFoundError as exc:
        return CommandResult(False, 127, "", str(exc))
    except subprocess.TimeoutExpired as exc:
        stdout = exc.stdout.decode() if isinstance(exc.stdout, bytes) else (exc.stdout or "")
        stderr = exc.stderr.decode() if isinstance(exc.stderr, bytes) else (exc.stderr or "")
        return CommandResult(False, 124, stdout.strip(), stderr.strip() or "timeout")


class FleetWatcher:
    def __init__(self, args: argparse.Namespace):
        self.args = args
        self.now = iso_now()
        self.critical_failures: list[dict[str, Any]] = []
        self.warnings: list[dict[str, Any]] = []
        self.passes: list[dict[str, Any]] = []

    def add_pass(self, check: str, detail: str, **extra: Any) -> None:
        payload = {"check": check, "detail": detail, **extra}
        self.passes.append(payload)
        append_audit("PASS", payload)

    def add_warning(self, check: str, detail: str, **extra: Any) -> None:
        payload = {"check": check, "detail": detail, **extra}
        self.warnings.append(payload)
        append_audit("WARN", payload)

    def add_failure(self, check: str, detail: str, **extra: Any) -> None:
        payload = {"check": check, "detail": detail, **extra}
        self.critical_failures.append(payload)
        append_audit("FAIL", payload)

    def check_git(self) -> dict[str, Any]:
        branch = run_command(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=ROOT)
        head = run_command(["git", "rev-parse", "HEAD"], cwd=ROOT)
        origin_main = run_command(["git", "rev-parse", "origin/main"], cwd=ROOT)
        status = run_command(["git", "status", "--short"], cwd=ROOT)
        divergence = run_command(
            ["git", "rev-list", "--left-right", "--count", "origin/main...HEAD"],
            cwd=ROOT,
        )

        payload: dict[str, Any] = {
            "branch": branch.stdout or "unknown",
            "head": head.stdout or "unknown",
            "origin_main": origin_main.stdout or "unknown",
            "dirty": bool(status.stdout.strip()),
            "dirty_lines": status.stdout.splitlines() if status.stdout else [],
            "ahead": 0,
            "behind": 0,
        }

        if divergence.ok and divergence.stdout:
            left, right = divergence.stdout.split()
            payload["behind"] = int(left)
            payload["ahead"] = int(right)

        if not branch.ok or not head.ok:
            self.add_failure("git", "Unable to resolve local git state", stderr=branch.stderr or head.stderr)
        elif payload["branch"] != "main":
            self.add_failure("git", f"Current branch is {payload['branch']} instead of main", **payload)
        elif payload["dirty"]:
            self.add_failure("git", "Repo is dirty", **payload)
        elif payload["ahead"] or payload["behind"]:
            self.add_warning(
                "git",
                f"main is not perfectly aligned (ahead={payload['ahead']} behind={payload['behind']})",
                **payload,
            )
        else:
            self.add_pass("git", "main is clean and aligned with origin/main", **payload)

        return payload

    def check_tasks(self) -> list[dict[str, Any]]:
        if platform.system() != "Windows":
            self.add_warning("tasks", "Scheduled task audit skipped because host is not Windows")
            return []
        tasks: list[dict[str, Any]] = []
        for task_name in self.args.tasks:
            result = run_command(
                ["schtasks", "/Query", "/TN", task_name, "/V", "/FO", "LIST"],
                cwd=ROOT,
                timeout=20,
            )
            if not result.ok:
                tasks.append(
                    {
                        "name": task_name,
                        "exists": False,
                        "state": "Missing",
                        "lastRunTime": None,
                        "lastTaskResult": None,
                        "raw": result.stdout or result.stderr,
                    }
                )
                continue

            parsed: dict[str, Any] = {
                "name": task_name,
                "exists": True,
                "state": "Unknown",
                "lastRunTime": None,
                "lastTaskResult": None,
            }
            for line in (result.stdout or "").splitlines():
                if ":" not in line:
                    continue
                key, value = line.split(":", 1)
                key = key.strip().lower()
                value = value.strip()
                if key == "status":
                    parsed["state"] = value
                elif key == "last run time":
                    parsed["lastRunTime"] = value
                elif key == "last result":
                    parsed["lastTaskResult"] = value
            tasks.append(parsed)

        missing = [task["name"] for task in tasks if not task.get("exists")]
        degraded = [
            task["name"]
            for task in tasks
            if task.get("exists") and str(task.get("state", "")).lower() not in {"ready", "running", "queued"}
        ]

        if missing:
            self.add_failure("tasks", f"Critical scheduled tasks missing: {', '.join(missing)}", tasks=tasks)
        elif degraded:
            self.add_warning("tasks", f"Scheduled tasks not in a healthy state: {', '.join(degraded)}", tasks=tasks)
        else:
            self.add_pass("tasks", "Critical scheduled tasks are installed", tasks=tasks)

        return tasks

    def check_ssh(self) -> list[dict[str, Any]]:
        ssh_results: list[dict[str, Any]] = []
        ssh_cmd = run_command(["ssh", "-V"], cwd=ROOT, timeout=10)
        if not ssh_cmd.ok and not ssh_cmd.stderr:
            self.add_warning("ssh", "ssh.exe is not available in PATH")
            return ssh_results

        for alias, expected in self.args.ssh_aliases.items():
            result = run_command(
                [
                    "ssh",
                    "-o",
                    "BatchMode=yes",
                    "-o",
                    "ConnectTimeout=8",
                    alias,
                    f"echo {expected} && hostname && whoami",
                ],
                cwd=ROOT,
                timeout=20,
            )
            text = result.stdout or result.stderr
            success = result.ok and expected in text
            row = {
                "alias": alias,
                "success": success,
                "output": text,
                "exit_code": result.code,
            }
            ssh_results.append(row)
            if success:
                self.add_pass("ssh", f"{alias} reachable", alias=alias, output=text)
            else:
                self.add_warning("ssh", f"{alias} unreachable or not trusted for non-interactive probe", alias=alias, output=text)

        return ssh_results

    def audit_headers(self) -> list[dict[str, Any]]:
        findings: list[dict[str, Any]] = []
        for url in self.args.domains:
            row: dict[str, Any] = {
                "url": url,
                "ok": False,
                "status": None,
                "failures": [],
            }
            try:
                request = urllib.request.Request(
                    url,
                    headers={
                        "User-Agent": "CodeX-Fleet-Watcher/1.0",
                        "Accept": "text/html,application/xhtml+xml",
                    },
                )
                with urllib.request.urlopen(request, timeout=20) as response:
                    body = response.read().decode("utf-8", errors="ignore")
                    headers = {k.lower(): v for k, v in response.headers.items()}
                    row["status"] = getattr(response, "status", None)
                    row["headers"] = headers

                    for name, predicate, issue in HEADER_RULES:
                        value = headers.get(name)
                        if not value or not predicate(value):
                            row["failures"].append({"item": name, "issue": issue, "value": value})

                    for match in re.finditer(r"<script[^>]+src=['\"]https?://[^'\"]+['\"][^>]*>", body, flags=re.I):
                        tag = match.group(0)
                        if "integrity=" not in tag.lower():
                            row["failures"].append({"item": "sri", "issue": "external_script_missing_integrity"})

                    row["ok"] = not row["failures"]
            except urllib.error.HTTPError as exc:
                row["status"] = exc.code
                row["failures"].append({"item": "request", "issue": f"http_{exc.code}"})
            except Exception as exc:  # noqa: BLE001
                row["failures"].append({"item": "request", "issue": str(exc)})

            findings.append(row)

        failures = [row for row in findings if row["failures"]]
        if failures:
            self.add_failure("public_headers", f"Header/CSP audit found issues on {len(failures)} domain(s)", findings=findings)
        else:
            self.add_pass("public_headers", "Public header audit passed for all configured domains", findings=findings)
        return findings

    def audit_cloudflare(self) -> list[dict[str, Any]]:
        token = read_env("CF_API_TOKEN", "CLOUDFLARE_API_TOKEN")
        if not token:
            self.add_warning("cloudflare", "Cloudflare token not set; zone checks skipped")
            return []

        headers = {"Authorization": f"Bearer {token}"}
        results: list[dict[str, Any]] = []
        for zone_name in self.args.zones:
            row: dict[str, Any] = {"zone": zone_name}
            try:
                zone_url = f"https://api.cloudflare.com/client/v4/zones?name={urllib.parse.quote(zone_name)}"
                with urllib.request.urlopen(
                    urllib.request.Request(zone_url, headers=headers),
                    timeout=20,
                ) as response:
                    zone_payload = json.loads(response.read().decode("utf-8"))

                if not zone_payload.get("success") or not zone_payload.get("result"):
                    row["error"] = "zone_not_found"
                    results.append(row)
                    continue

                zone_id = zone_payload["result"][0]["id"]
                row["zone_id"] = zone_id

                def cf_get(path: str) -> dict[str, Any]:
                    with urllib.request.urlopen(
                        urllib.request.Request(
                            f"https://api.cloudflare.com/client/v4/zones/{zone_id}/{path}",
                            headers=headers,
                        ),
                        timeout=20,
                    ) as response:
                        return json.loads(response.read().decode("utf-8"))

                dnssec = cf_get("dnssec")
                ssl = cf_get("settings/ssl")
                hsts = cf_get("settings/hsts")
                row["dnssec"] = dnssec.get("result", {}).get("status")
                row["ssl"] = ssl.get("result", {}).get("value")
                row["hsts"] = hsts.get("result", {}).get("enabled")
            except Exception as exc:  # noqa: BLE001
                row["error"] = str(exc)
            results.append(row)

        errors = [row for row in results if row.get("error")]
        if errors:
            self.add_warning("cloudflare", f"Cloudflare zone audit incomplete for {len(errors)} zone(s)", zones=results)
        else:
            self.add_pass("cloudflare", "Cloudflare zone audit completed", zones=results)
        return results

    def run_script_audit(self, label: str, args: list[str], cwd: Path | None = None) -> dict[str, Any]:
        result = run_command(args, cwd=cwd or ROOT, timeout=120)
        return {
            "label": label,
            "ok": result.ok,
            "exit_code": result.code,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }

    def audit_existing_tools(self) -> dict[str, Any]:
        audits: dict[str, Any] = {}

        guardian = self.run_script_audit(
            "opus_guardian",
            [sys.executable, str(ROOT / "scripts" / "clawx-control" / "opus-guardian.py")],
        )
        audits["opus_guardian"] = guardian
        if guardian["ok"]:
            self.add_pass("opus_guardian", "opus-guardian.py passed", stdout=guardian["stdout"])
        else:
            self.add_failure(
                "opus_guardian",
                "opus-guardian.py reported integrity violations",
                stdout=guardian["stdout"],
                stderr=guardian["stderr"],
            )

        if self.args.run_public_copy_audit:
            copy_audit = self.run_script_audit(
                "public_copy_policy",
                [sys.executable, str(ROOT / "scripts" / "scan-public-copy-policy.py")],
            )
            audits["public_copy_policy"] = copy_audit

            findings_match = re.search(r"FINDINGS=(\d+)", copy_audit["stdout"])
            finding_count = int(findings_match.group(1)) if findings_match else None
            copy_audit["findings"] = finding_count

            if not copy_audit["ok"]:
                self.add_warning(
                    "public_copy_policy",
                    "scan-public-copy-policy.py did not complete cleanly",
                    stdout=copy_audit["stdout"],
                    stderr=copy_audit["stderr"],
                )
            elif finding_count and finding_count > 0:
                self.add_failure(
                    "public_copy_policy",
                    f"Public copy audit found {finding_count} issue(s)",
                    stdout=copy_audit["stdout"],
                )
            else:
                self.add_pass("public_copy_policy", "Public copy audit found no issues", stdout=copy_audit["stdout"])

        return audits

    def hash_targets(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        missing_paths: list[str] = []
        for path in HASH_TARGETS:
            row = {
                "path": str(path),
                "exists": path.exists(),
                "sha256": None,
            }
            if path.exists():
                row["sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
            else:
                missing_paths.append(str(path))
            rows.append(row)
        if missing_paths:
            self.add_warning("hash_targets", f"Some source-of-truth files are missing: {', '.join(missing_paths)}", files=rows)
        else:
            self.add_pass("hash_targets", "Source-of-truth file hashes refreshed", files=rows)
        return rows

    def post_webhook(self, payload: dict[str, Any]) -> dict[str, Any]:
        webhook = read_env("CODEX_WATCHER_ALERT_WEBHOOK", "CODEX_WATCHER_ESCALATION_WEBHOOK")
        if not webhook:
            return {"delivered": False, "reason": "missing_webhook"}

        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            webhook,
            data=data,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                raw = response.read().decode("utf-8", errors="ignore").strip()
                parsed: dict[str, Any] = {}
                if raw:
                    try:
                        parsed = json.loads(raw)
                    except json.JSONDecodeError:
                        parsed = {"raw": raw}
                return {
                    "delivered": True,
                    "status": getattr(response, "status", None),
                    "resolved": bool(parsed.get("resolved", parsed.get("ack", False))),
                    "response": parsed,
                }
        except Exception as exc:  # noqa: BLE001
            return {"delivered": False, "reason": str(exc)}

    def send_sms(self, message: str) -> dict[str, Any]:
        sid = read_env("TWILIO_ACCOUNT_SID")
        token = read_env("TWILIO_AUTH_TOKEN")
        from_number = read_env("TWILIO_FROM_NUMBER")
        to_number = read_env("TWILIO_TO_NUMBER")

        if not sid or not token or not from_number or not to_number:
            return {"sent": False, "reason": "missing_twilio_env"}

        body = urllib.parse.urlencode(
            {
                "Body": message,
                "From": from_number,
                "To": to_number,
            }
        ).encode("utf-8")
        request = urllib.request.Request(
            f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
            data=body,
            method="POST",
        )
        auth = urllib.request.HTTPBasicAuthHandler()
        auth.add_password("twilio", request.full_url, sid, token)
        opener = urllib.request.build_opener(auth)
        request.add_header("Content-Type", "application/x-www-form-urlencoded")

        try:
            with opener.open(request, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
                return {
                    "sent": True,
                    "sid": payload.get("sid"),
                    "status": payload.get("status"),
                }
        except Exception as exc:  # noqa: BLE001
            return {"sent": False, "reason": str(exc)}

    def build_summary(self, data: dict[str, Any]) -> dict[str, Any]:
        return {
            "generated_at": self.now,
            "host": os.getenv("COMPUTERNAME") or platform.node(),
            "critical_failures": len(self.critical_failures),
            "warnings": len(self.warnings),
            "passes": len(self.passes),
            "data": data,
        }

    def write_summary_files(self, summary: dict[str, Any]) -> None:
        ensure_dirs()
        SUMMARY_JSON.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

        lines = [
            "# CodeX Fleet Watcher",
            "",
            f"- Generated: {summary['generated_at']}",
            f"- Host: {summary['host']}",
            f"- Critical failures: {summary['critical_failures']}",
            f"- Warnings: {summary['warnings']}",
            f"- Passes: {summary['passes']}",
            "",
            "## Critical Failures",
        ]
        if self.critical_failures:
            for item in self.critical_failures:
                lines.append(f"- {item['check']}: {item['detail']}")
        else:
            lines.append("- None")

        lines.extend(["", "## Warnings"])
        if self.warnings:
            for item in self.warnings:
                lines.append(f"- {item['check']}: {item['detail']}")
        else:
            lines.append("- None")

        lines.extend(["", "## Passes"])
        for item in self.passes[:12]:
            lines.append(f"- {item['check']}: {item['detail']}")
        if len(self.passes) > 12:
            lines.append(f"- ... {len(self.passes) - 12} more")

        SUMMARY_MD.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")

    def escalate_if_needed(self, summary: dict[str, Any]) -> dict[str, Any]:
        if not self.critical_failures:
            append_audit("ESCALATION_SKIP", {"reason": "no_critical_failures"})
            return {"needed": False}

        reason = self.critical_failures[0]["check"]
        escalation = {
            "generated_at": self.now,
            "reason": reason,
            "critical_failures": self.critical_failures,
            "warnings": self.warnings,
            "summary": {
                "critical_failures": len(self.critical_failures),
                "warnings": len(self.warnings),
                "passes": len(self.passes),
            },
        }

        ESCALATION_MD.write_text(
            "# CodeX Fleet Watcher Escalation\n\n"
            f"- Generated: {self.now}\n"
            f"- Reason: {reason}\n"
            f"- Critical failures: {len(self.critical_failures)}\n"
            f"- Warnings: {len(self.warnings)}\n\n"
            "## Critical Failures\n"
            + "\n".join(f"- {item['check']}: {item['detail']}" for item in self.critical_failures)
            + "\n",
            encoding="utf-8",
        )

        webhook_result = self.post_webhook(escalation)
        append_audit("ESCALATION_WEBHOOK", webhook_result)

        sms_result = {"sent": False, "reason": "not_needed"}
        if not webhook_result.get("resolved"):
            message = (
                "CodeX Fleet Watcher: unresolved critical failures. "
                f"Reason={reason} Critical={len(self.critical_failures)} Warnings={len(self.warnings)}"
            )
            if not self.args.no_sms:
                sms_result = self.send_sms(message)
                append_audit("ESCALATION_SMS", sms_result)
            else:
                sms_result = {"sent": False, "reason": "disabled_by_flag"}
                append_audit("ESCALATION_SMS", sms_result)

        return {
            "needed": True,
            "webhook": webhook_result,
            "sms": sms_result,
        }

    def run(self) -> int:
        ensure_dirs()
        append_audit("WATCHER_START", {"host": os.getenv("COMPUTERNAME") or platform.node()})

        data: dict[str, Any] = {}
        data["git"] = self.check_git()
        data["tasks"] = self.check_tasks()
        data["ssh"] = self.check_ssh()
        data["headers"] = self.audit_headers()
        if not self.args.skip_cloudflare:
            data["cloudflare"] = self.audit_cloudflare()
        data["audits"] = self.audit_existing_tools()
        data["hashes"] = self.hash_targets()

        summary = self.build_summary(data)
        self.write_summary_files(summary)
        escalation = self.escalate_if_needed(summary)
        append_audit("WATCHER_COMPLETE", {"summary": summary, "escalation": escalation})
        print(json.dumps(summary, indent=2))
        return 1 if self.critical_failures else 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="CodeX Fleet Watcher")
    parser.add_argument(
        "--domains",
        nargs="*",
        default=parse_csv_env("CODEX_WATCHER_DOMAINS", DEFAULT_DOMAINS),
        help="Public URLs to audit",
    )
    parser.add_argument(
        "--zones",
        nargs="*",
        default=parse_csv_env("CODEX_WATCHER_ZONES", DEFAULT_ZONES),
        help="Cloudflare zones to inspect when a token is available",
    )
    parser.add_argument(
        "--tasks",
        nargs="*",
        default=parse_csv_env("CODEX_WATCHER_TASKS", DEFAULT_TASKS),
        help="Scheduled tasks to snapshot",
    )
    parser.add_argument("--skip-cloudflare", action="store_true", help="Skip Cloudflare API checks")
    parser.add_argument(
        "--skip-public-copy-audit",
        dest="run_public_copy_audit",
        action="store_false",
        help="Skip scan-public-copy-policy.py",
    )
    parser.add_argument("--no-sms", action="store_true", help="Do not send Twilio SMS")
    args = parser.parse_args()
    args.ssh_aliases = DEFAULT_SSH_ALIASES
    return args


def main() -> int:
    args = parse_args()
    watcher = FleetWatcher(args)
    return watcher.run()


if __name__ == "__main__":
    raise SystemExit(main())
