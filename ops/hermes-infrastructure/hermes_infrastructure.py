"""Hermes Infrastructure Velocity — Python orchestration layer.

Surface conventions:
- Function/method names: snake_case
- Module names: snake_case
- Class names: PascalCase
- Filenames: snake_case
- Docstrings: Google style
- Error handling: raise on unrecoverable config issues; return sentinels on recoverable circuit breaks
- Return codes: avoid exit() in libraries; return status objects instead
"""

from __future__ import annotations

import json
import logging
import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logger = logging.getLogger("hermes.infrastructure")


# ---------------------------------------------------------------------------
# Configuration loader
# ---------------------------------------------------------------------------
class InfrastructureConfigError(Exception):
    """Raised when Sol.md or required config values are missing/invalid."""


@dataclass(frozen=True)
class SolConfig:
    agent_name: str = "Hermes-Infrastructure-Velocity"
    version: str = "4.0.0-Canonical"
    framework: str = "Hermes-Core"
    omni_auth_mode: str = "OMNIROUTE_KEY_ONLY"
    omni_fail_closed: bool = True
    max_concurrent_nodes: int = 6
    primary_node: str = "T5500 (192.168.0.15:20128 - GTX 1070)"
    secondary_node: str = ""
    paperclip_node: str = "T5500 (paperclip-local)"
    cloud_wrapper: str = "VS Code CLI (glm-5.2:cloud)"
    max_load_threshold_percent: int = 80
    block_direct_model_fallback: bool = True
    enforce_lap_drift_protection: bool = True
    compliance_monitoring_mode: str = "strict-enforcement"


def load_sol_config(path: str | os.PathLike[str]) -> SolConfig:
    """Load a Sol.md-style TOML-ish config block into a SolConfig dataclass.

    This is intentionally conservative: it only reads the known `[agent]`
    and `[omnirout.config]` / `[hardware.node_registry]` sections, so a
    partial config file does not break validation.
    """
    p = Path(path)
    if not p.exists():
        raise InfrastructureConfigError(f"Sol.md config missing: {path}")

    text = p.read_text(encoding="utf-8")
    kv: Dict[str, str] = {}
    in_section = False
    section_targets = {"[agent]", "[omnirout.config]", "[hardware.node_registry]"}
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line in section_targets:
            in_section = True
            continue
        if line.startswith("[") and line.endswith("]"):
            in_section = False
            continue
        if in_section and "=" in line:
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"')
            if key and value:
                kv[key] = value

    return SolConfig(
        agent_name=kv.get("name", SolConfig.agent_name),
        version=kv.get("version", SolConfig.version),
        framework=kv.get("framework", SolConfig.framework),
        omni_auth_mode=kv.get("auth_mode", SolConfig.omni_auth_mode),
        omni_fail_closed=kv.get("fail_closed", "true").lower() == "true",
        max_concurrent_nodes=int(kv.get("max_concurrent_nodes", str(SolConfig.max_concurrent_nodes))),
        primary_node=kv.get("primary_node", SolConfig.primary_node),
        secondary_node=kv.get("secondary_node", ""),
        paperclip_node=kv.get("paperclip_node", SolConfig.paperclip_node),
        cloud_wrapper=kv.get("cloud_wrapper", SolConfig.cloud_wrapper),
        max_load_threshold_percent=int(kv.get("max_load_threshold_percent", str(SolConfig.max_load_threshold_percent))),
        block_direct_model_fallback=kv.get("block_direct_model_fallback", "true").lower() == "true",
        enforce_lap_drift_protection=kv.get("enforce_lap_drift_protection", "true").lower() == "true",
        compliance_monitoring_mode=kv.get("compliance_monitoring_mode", SolConfig.compliance_monitoring_mode),
    )


# ---------------------------------------------------------------------------
# Circuit breaker — mirrors electrical breaker behavior
# ---------------------------------------------------------------------------
@dataclass
class BreakerState:
    name: str
    failure_threshold: int = 3
    recovery_time_seconds: float = 30.0
    consecutive_failures: int = 0
    last_failure_utc: Optional[datetime] = None
    tripped: bool = False
    warmup_until_utc: Optional[datetime] = None

    def record_success(self) -> None:
        """Reset breaker after a successful operation."""
        self.consecutive_failures = 0
        self.tripped = False
        self.last_failure_utc = None
        self.warmup_until_utc = None

    def record_failure(self, now: Optional[datetime] = None) -> None:
        """Record a failure and trip if threshold exceeded."""
        now = now or datetime.now(timezone.utc)
        self.consecutive_failures += 1
        self.last_failure_utc = now
        if self.consecutive_failures >= self.failure_threshold:
            self.tripped = True
            self.warmup_until_utc = datetime.fromtimestamp(
                now.timestamp() + self.recovery_time_seconds, tz=timezone.utc
            )

    def is_closed(self, now: Optional[datetime] = None) -> bool:
        """Return True if current may flow; False if breaker is open."""
        if not self.tripped:
            return True
        now = now or datetime.now(timezone.utc)
        if self.warmup_until_utc and now >= self.warmup_until_utc:
            # Half-open: allow one probe, but do not mark recovered yet.
            return True
        return False

    def state_label(self) -> str:
        if self.is_closed():
            return "CLOSED" if not self.tripped else "HALF-OPEN"
        return "OPEN"


class CircuitBreakerRegistry:
    """Track breakers for every execution loop / API route / node."""

    def __init__(self) -> None:
        self._breakers: Dict[str, BreakerState] = {}

    def get(self, name: str) -> BreakerState:
        if name not in self._breakers:
            self._breakers[name] = BreakerState(name=name)
        return self._breakers[name]

    def snapshot(self) -> Dict[str, Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        return {
            name: {
                "state": b.state_label(),
                "consecutive_failures": b.consecutive_failures,
                "last_failure_utc": b.last_failure_utc.isoformat() if b.last_failure_utc else None,
                "warmup_until_utc": b.warmup_until_utc.isoformat() if b.warmup_until_utc else None,
                "tripped": b.tripped,
            }
            for name, b in self._breakers.items()
        }


# ---------------------------------------------------------------------------
# Compliance voltage regulator — blocks disallowed transaction shapes
# ---------------------------------------------------------------------------
class ComplianceViolation(Exception):
    """Raised when a transaction/comms pattern would violate ToS."""


class ComplianceVoltageRegulator:
    """Current-limiting compliance guard.

    If any input matches known disallowed patterns, the regulator raises
    before the operation is allowed to continue. No exceptions.
    """

    DISALLOWED_SIGNALS = [
        "front_running",
        "front-running",
        "frontrunning",
        "sandwich",
        "mev",
        "arbitrage_opportunity",
        "flash_loan",
        "liquidat",
        "toS_bypass",
        "tos_bypass",
        "predatory",
    ]

    def __init__(self) -> None:
        self.block_count = 0
        self.last_blocked_utc: Optional[datetime] = None
        self.block_log: List[Dict[str, str]] = []

    def inspect(self, operation_name: str, payload: Dict[str, Any]) -> None:
        """Mirror the payload against disallowed signals."""
        if not isinstance(payload, dict):
            return
        flattened = json.dumps(payload, sort_keys=True).lower()
        for signal in self.ComplianceVoltageRegulator.DISALLOWED_SIGNALS:
            if signal in flattened:
                self.block_count += 1
                self.last_blocked_utc = datetime.now(timezone.utc)
                entry = {
                    "operation": operation_name,
                    "signal": signal,
                    "blocked_utc": self.last_blocked_utc.isoformat(),
                }
                self.block_log.append(entry)
                raise ComplianceViolation(
                    f"Compliance block on {operation_name}: matched disallowed pattern '{signal}'."
                )

    def snapshot(self) -> Dict[str, Any]:
        return {
            "block_count": self.block_count,
            "last_blocked_utc": self.last_blocked_utc.isoformat() if self.last_blocked_utc else None,
            "recent_blocks": self.block_log[-10:],
        }


# ---------------------------------------------------------------------------
# Milestone Distribution Box — auto-routes earned funds by threshold
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class MilestoneGate:
    name: str
    threshold_usd: float
    destination_label: str
    priority: int


class MilestoneDistributionBox:
    """Release funds only when upstream balance clears a hard threshold."""

    def __init__(self, gates: List[MilestoneGate]) -> None:
        if not gates:
            raise ValueError("At least one milestone gate is required.")
        self._gates = sorted(gates, key=lambda g: g.priority)
        self._released: Dict[str, bool] = {g.name: False for g in self._gates}
        self._release_log: List[Dict[str, Any]] = []

    def evaluate(self, balance_usd: float, now: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Return newly triggered releases since last evaluation."""
        released: List[Dict[str, Any]] = []
        for gate in self._gates:
            if self._released[gate.name]:
                continue
            if balance_usd >= gate.threshold_usd:
                self._released[gate.name] = True
                entry = {
                    "gate": gate.name,
                    "destination": gate.destination_label,
                    "threshold_usd": gate.threshold_usd,
                    "released_utc": (now or datetime.now(timezone.utc)).isoformat(),
                    "balance_at_release_usd": balance_usd,
                }
                released.append(entry)
                self._release_log.append(entry)
        return released

    def remaining_gates(self) -> List[str]:
        return [g.name for g in self._gates if not self._released[g.name]]

    def snapshot(self) -> Dict[str, Any]:
        return {
            "remaining": self.remaining_gates(),
            "released": self._released,
            "release_log": self._release_log[-50:],
        }


# ---------------------------------------------------------------------------
# Master tracking state loop
# ---------------------------------------------------------------------------
@dataclass
class MasterState:
    start_utc: datetime
    target_usd: float = 10_000.00
    current_balance_usd: float = 0.0
    balance_currency: str = "USD"
    active_node_count: int = 6
    last_tick_utc: Optional[datetime] = None
    last_to_s_utc: Optional[datetime] = None
    operational_state: str = "BOOTSTRAP"

    def elapsed_hours(self) -> float:
        return (datetime.now(timezone.utc) - self.start_utc).total_seconds() / 3600.0

    def progress_ratio(self) -> float:
        if self.target_usd <= 0:
            return 0.0
        return max(0.0, min(1.0, self.current_balance_usd / self.target_usd))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "start_utc": self.start_utc.isoformat(),
            "elapsed_hours": round(self.elapsed_hours(), 3),
            "target_usd": self.target_usd,
            "current_balance_usd": self.current_balance_usd,
            "balance_currency": self.balance_currency,
            "progress_pct": round(self.progress_ratio() * 100, 2),
            "active_node_count": self.active_node_count,
            "last_tick_utc": self.last_tick_utc.isoformat() if self.last_tick_utc else None,
            "last_to_s_utc": self.last_to_s_utc.isoformat() if self.last_to_s_utc else None,
            "operational_state": self.operational_state,
        }


class MasterTrackingLoop:
    """Runs the master compliance + balance + milestone state machine."""

    def __init__(self, config: SolConfig, state: MasterState) -> None:
        self.config = config
        self.state = state
        self.breakers = CircuitBreakerRegistry()
        self.compliance = ComplianceVoltageRegulator()
        self.milestones = MilestoneDistributionBox(
            gates=[
                MilestoneGate(name="tax_reserve", threshold_usd=3_500.00, destination_label="tax_vault", priority=1),
                MilestoneGate(name="cloud_advance", threshold_usd=2_500.00, destination_label="cloud_subscription", priority=2),
                MilestoneGate(name="hardware_budget", threshold_usd=4_000.00, destination_label="local_hardware", priority=3),
            ]
        )

    def tick(self, current_balance_usd: float, api_payloads: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Advance the state machine by one tick."""
        self.state.last_tick_utc = datetime.now(timezone.utc)
        self.state.current_balance_usd = float(current_balance_usd)

        # Compliance: inspect every payload passing through this tick.
        api_payloads = api_payloads or []
        for payload in api_payloads:
            try:
                self.compliance.inspect(operation_name="api_payload", payload=payload)
            except ComplianceViolation as exc:
                self.state.last_to_s_utc = datetime.now(timezone.utc)
                self.state.operational_state = "COMPLIANCE_HALT"
                logger.error("Compliance halt: %s", exc)
                return self._snapshot()

        # Milestone evaluation.
        releases = self.milestones.evaluate(current_balance_usd)
        if releases:
            self.state.operational_state = "MILESTONE_RELEASE"

        return self._snapshot()

    def _snapshot(self) -> Dict[str, Any]:
        return {
            "state": self.state.to_dict(),
            "breakers": self.breakers.snapshot(),
            "compliance": self.compliance.snapshot(),
            "milestones": self.milestones.snapshot(),
        }


# ---------------------------------------------------------------------------
# Protocol API polling structure — authorized public-read only
# ---------------------------------------------------------------------------
class ProtocolApiPoller:
    """Poll authorized protocol endpoints without mempool manipulation.

    Behavior contract:
    - Read-only public endpoints only.
    - Circuit breaker per endpoint with 80% response-time limit.
    - No undisclosed mempool reads.
    - Standard gas-price heuristics, no validator bribes.
    """

    RESPONSE_TIME_WARNING_PCT = 0.80

    def __init__(self, registry: CircuitBreakerRegistry) -> None:
        self.registry = registry
        self.endpoints: List[str] = []

    def register_public_endpoints(self, urls: List[str]) -> None:
        self.endpoints = list(urls)

    def probe(self, url: str, timeout_seconds: float = 5.0) -> Dict[str, Any]:
        """Probe one endpoint; trip breaker if it exceeds safe load."""
        import urllib.request
        start = time.perf_counter()
        breaker = self.registry.get(url)
        now = datetime.now(timezone.utc)
        if not breaker.is_closed(now):
            return {"url": url, "status": "SKIPPED_BREAKER", "state": breaker.state_label()}

        try:
            req = urllib.request.urlopen(url, timeout=timeout_seconds)
            elapsed = time.perf_counter() - start
            if elapsed > timeout_seconds * self.RESPONSE_TIME_WARNING_PCT:
                breaker.record_failure(now)
            else:
                breaker.record_success()
            return {
                "url": url,
                "status": "OK",
                "http_status": int(req.getcode()),
                "elapsed_s": round(elapsed, 4),
                "state": breaker.state_label(),
            }
        except Exception as exc:
            breaker.record_failure(now)
            return {
                "url": url,
                "status": "ERROR",
                "error": str(exc)[:1000],
                "state": breaker.state_label(),
            }

    def sweep(self) -> Dict[str, List[Dict[str, Any]]]:
        results: List[Dict[str, Any]] = []
        for url in self.endpoints:
            results.append(self.probe(url))
        return {"probes": results, "count": len(results), "timestamp_utc": datetime.now(timezone.utc).isoformat()}


# ---------------------------------------------------------------------------
# Public API — what the master loop exposes to Hermes runtime
# ---------------------------------------------------------------------------
class HermesInfrastructureEngine:
    """Top-level facade for the Hermes infrastructure stack."""

    def __init__(self, sol_path: str = "Sol.md") -> None:
        self.config = load_sol_config(sol_path)
        self.state = MasterState(start_utc=datetime.now(timezone.utc))
        self.loop = MasterTrackingLoop(config=self.config, state=self.state)
        self.poller = ProtocolApiPoller(registry=self.loop.breakers)
        logger.info("Loaded Hermes infrastructure config: %s %s", self.config.agent_name, self.config.version)

    def update_balance(self, balance_usd: float, api_payloads: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Advance master loop with new balance; returns full state snapshot."""
        if balance_usd < 0:
            raise ValueError("balance_usd must be non-negative.")
        snapshot = self.loop.tick(current_balance_usd=balance_usd, api_payloads=api_payloads or [])
        if snapshot["state"]["progress_pct"] >= 100.0:
            self.state.operational_state = "TARGET_HIT"
        logger.info("Tick: balance=%.2f state=%s", balance_usd, self.state.operational_state)
        return snapshot

    def register_protocol_endpoints(self, urls: List[str]) -> None:
        self.poller.register_public_endpoints(urls)

    def run_probe_sweep(self) -> Dict[str, Any]:
        return self.poller.sweep()

    def export_state(self, path: str) -> None:
        snapshot = {
            "config": self.config.__dict__,
            "state": self.state.to_dict(),
            "breakers": self.loop.breakers.snapshot(),
            "compliance": self.loop.compliance.snapshot(),
            "milestones": self.loop.milestones.snapshot(),
            "exported_utc": datetime.now(timezone.utc).isoformat(),
        }
        Path(path).write_text(json.dumps(snapshot, indent=2), encoding="utf-8")
