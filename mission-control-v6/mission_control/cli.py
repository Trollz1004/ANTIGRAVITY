"""Command line interface: ``python -m mission_control <command>``.

Commands:
    serve          run the dashboard + API + monitor loop (default port 8787)
    check          probe every service once and print a table (CI-friendly:
                   exit code 1 when any *expected* service is down)
    fix <id>       run the easy button for one service from a terminal
    status         one-shot snapshot (JSON or table)
    notify-test    fire a test message through every configured notifier
    list-services  show the configured registry
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from typing import Any, Dict, List, Optional

from . import __version__
from .config import ConfigError, load_config
from .models import ServiceState, describe_target
from .monitor import Monitor
from .notify import NotifyMessage, build_hub
from .store import Store


def _load(args: argparse.Namespace):
    return load_config(getattr(args, "config", None))


def _monitor(cfg) -> Monitor:
    store = Store(cfg.state_db_abs())
    hub = build_hub(cfg.notifiers, resolve_path=cfg.notifier_path_abs)
    cfg.server.monitor_enabled = False  # CLI never spawns background loops
    return Monitor(cfg, store, hub)


# --------------------------------------------------------------------------- #

def cmd_serve(args: argparse.Namespace) -> int:
    cfg = _load(args)
    import uvicorn

    from .api import create_app

    app = create_app(config=cfg)
    url = cfg.server.resolved_base_url()
    print(f"[mission-control {__version__}] dashboard: {url}")
    print(f"[mission-control {__version__}] api      : {url}/api/status")
    print(f"[mission-control {__version__}] watching : "
          f"{sum(1 for s in cfg.services if s.expected)} expected services, "
          f"{sum(1 for s in cfg.services if not s.expected)} standby")
    uvicorn.run(app, host=cfg.server.host, port=cfg.server.port, log_level="info")
    return 0


async def _check_async(cfg) -> Dict[str, Any]:
    monitor = _monitor(cfg)
    results = await monitor.run_once_all()
    return {"results": results, "monitor": monitor}


def cmd_check(args: argparse.Namespace) -> int:
    cfg = _load(args)
    data = asyncio.run(_check_async(cfg))
    results = data["results"]
    monitor: Monitor = data["monitor"]
    rows: List[tuple] = []
    worst = 0
    for spec in cfg.services:
        rt = monitor.runtimes[spec.id]
        result = results.get(spec.id)
        if result is None:
            continue
        state = rt.state.value
        if spec.expected and not result.ok and not result.skipped:
            worst = 1  # an expected service is DOWN — caller (CI/cron) needs to know
        rows.append((state, spec.name, describe_target(spec), result.detail, f"{result.latency_ms:.0f}ms"))
    if getattr(args, "json", False):
        print(json.dumps({spec.id: results[spec.id].to_dict() for spec in cfg.services
                          if spec.id in results}, indent=2))
    else:
        for state, name, target, detail, latency in rows:
            flag = {"up": "🟢", "degraded": "🟡", "down": "🔴"}.get(state, "⚪")
            print(f"{flag} {name:<26} {target:<46} {latency:>8}  {detail}")
    monitor.store.close()
    return worst


def cmd_fix(args: argparse.Namespace) -> int:
    cfg = _load(args)
    spec = cfg.service(args.service_id)
    if spec is None:
        print(f"unknown service: {args.service_id}", file=sys.stderr)
        return 2
    if not spec.playbook:
        print(f"service {args.service_id} has no fix playbook", file=sys.stderr)
        return 2
    monitor = _monitor(cfg)

    async def _run():
        return await monitor.fix(args.service_id, requested_by="cli")

    outcome = asyncio.run(_run())
    fix = outcome["fix"]
    print(fix.get("output") or fix.get("detail") or "")
    print(f"→ service now: {outcome['state']} ({outcome['result']['detail']})")
    monitor.store.close()
    return 0 if fix.get("ok") else 1


def cmd_status(args: argparse.Namespace) -> int:
    cfg = _load(args)
    code = cmd_check(args)
    return code


def cmd_notify_test(args: argparse.Namespace) -> int:
    cfg = _load(args)
    hub = build_hub(cfg.notifiers, resolve_path=cfg.notifier_path_abs)
    message = NotifyMessage(
        subject="TEST: Mission Control notification pipeline",
        text=("This is a live test of every configured notifier.\n\n"
              f"Dashboard: {cfg.server.resolved_base_url()}\n"
              "Real DOWN alerts reach you the same way — each with its easy-button fix inside."),
        level="test",
    )
    report = asyncio.run(hub.broadcast(message))
    print(json.dumps(report, indent=2))
    return 0 if all(v == "ok" or v.startswith("skipped") for v in report.values()) else 1


def cmd_list_services(args: argparse.Namespace) -> int:
    cfg = _load(args)
    for spec in cfg.services:
        expected = "expected " if spec.expected else "standby  "
        auto = " [auto-fix]" if spec.auto_fix else ""
        fix = f" (fix: {spec.playbook})" if spec.playbook else ""
        print(f"• {spec.id:<20} [{spec.group:<10}] {expected} {describe_target(spec)}{fix}{auto}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="mission_control",
        description=f"ANTIGRAVITY Mission Control v{__version__}",
    )
    parser.add_argument("-c", "--config", default=None, help="path to mission-control JSON config")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("serve", help="run dashboard + API + monitor loop")
    p.set_defaults(func=cmd_serve)

    p = sub.add_parser("check", help="probe every service once (exit 1 if an expected service is down)")
    p.add_argument("--json", action="store_true")
    p.set_defaults(func=cmd_check)

    p = sub.add_parser("status", help="alias for check")
    p.add_argument("--json", action="store_true")
    p.set_defaults(func=cmd_status)

    p = sub.add_parser("fix", help="run the allow-listed fix playbook for one service")
    p.add_argument("service_id")
    p.set_defaults(func=cmd_fix)

    p = sub.add_parser("notify-test", help="send a test message through every notifier")
    p.set_defaults(func=cmd_notify_test)

    p = sub.add_parser("list-services", help="print the configured service registry")
    p.set_defaults(func=cmd_list_services)
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return int(args.func(args) or 0)
    except ConfigError as exc:
        print(f"config error: {exc}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        return 130
