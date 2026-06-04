"""ClawX 6-AI council API key integration.

Manages API keys for the ClawX governance council — a fleet of 6 AI agents
that participate in joint deliberation. Keys are loaded from environment
variables and never hardcoded. Supports registration, rotation, validation,
round-robin load balancing, and connectivity health checks.
"""

from __future__ import annotations

import json
import logging
import re
import threading
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger("youandinotai.clawx")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Expected ClawX agent names (the 6-AI council).
CLAWX_AGENT_NAMES: tuple[str, ...] = (
    "manus",
    "claude",
    "gemini",
    "perplexity",
    "grok",
    "ollama",
)

# Minimum key length for basic format validation.
_MIN_KEY_LENGTH = 16

# Regex: allow alphanumeric, hyphens, underscores, dots, and colons.
_KEY_RE = re.compile(r"^[A-Za-z0-9_\-.:]+$")


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class ClawxError(Exception):
    """Base exception for ClawX integration errors."""


class AgentNotFoundError(ClawxError):
    """Raised when an agent name is not recognised."""


class InvalidKeyError(ClawxError):
    """Raised when an API key fails validation."""


class KeyNotFoundError(ClawxError):
    """Raised when no key is registered for the requested agent."""


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------


class ClawxClient:
    """Manages API keys for the ClawX 6-AI council.

    Keys are stored in-memory after loading from environment variables.
    Thread-safe for concurrent access from async request handlers.

    Usage::

        client = ClawxClient()
        client.register_agent("claude", "sk-ant-...")
        key = client.get_agent_key("claude")
        client.rotate_key("claude", "sk-ant-new-...")
        agents = client.list_agents()
    """

    def __init__(self, settings_override: Any = None) -> None:
        self._settings = settings_override or get_settings()
        self._lock = threading.Lock()
        self._agents: dict[str, str] = {}
        self._round_robin_index: int = 0
        self._load_from_env()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _load_from_env(self) -> None:
        """Load agent keys from the CLAWX_AGENT_KEYS env var (JSON dict)."""
        raw = getattr(self._settings, "clawx_agent_keys", {}) or {}
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except json.JSONDecodeError as exc:
                logger.warning("CLAWX_AGENT_KEYS is not valid JSON: %s", exc)
                raw = {}
        if not isinstance(raw, dict):
            logger.warning("CLAWX_AGENT_KEYS is not a dict — ignoring")
            return

        with self._lock:
            for name, key in raw.items():
                normalised = name.strip().lower()
                if normalised and isinstance(key, str) and key.strip():
                    self._agents[normalised] = key.strip()

        loaded = list(self._agents.keys())
        if loaded:
            logger.info(
                "ClawX: loaded %d agent key(s): %s",
                len(loaded),
                ", ".join(loaded),
            )

    @staticmethod
    def _validate_key_format(key: str) -> None:
        """Validate that *key* meets minimum format requirements.

        Raises:
            InvalidKeyError: If the key is too short or contains
                disallowed characters.
        """
        if not key or len(key) < _MIN_KEY_LENGTH:
            raise InvalidKeyError(
                f"API key must be at least {_MIN_KEY_LENGTH} characters "
                f"(got {len(key) if key else 0})."
            )
        if not _KEY_RE.match(key):
            raise InvalidKeyError(
                "API key contains invalid characters. "
                "Allowed: alphanumeric, hyphens, underscores, dots, colons."
            )

    def _normalise_name(self, agent_name: str) -> str:
        """Return *agent_name* lowercased and stripped."""
        return agent_name.strip().lower()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def register_agent(self, agent_name: str, api_key: str) -> None:
        """Register or overwrite an API key for *agent_name*.

        Args:
            agent_name: Human-readable agent identifier (e.g. ``"claude"``).
            api_key: The secret API key for this agent.

        Raises:
            InvalidKeyError: If the key fails format validation.
        """
        name = self._normalise_name(agent_name)
        self._validate_key_format(api_key)
        with self._lock:
            self._agents[name] = api_key.strip()
        logger.info("ClawX: registered agent '%s'", name)

    def get_agent_key(self, agent_name: str) -> str:
        """Return the API key for *agent_name*.

        Raises:
            KeyNotFoundError: If no key is registered for this agent.
        """
        name = self._normalise_name(agent_name)
        with self._lock:
            key = self._agents.get(name)
        if key is None:
            raise KeyNotFoundError(f"No API key registered for agent '{name}'.")
        return key

    def rotate_key(self, agent_name: str, new_key: str) -> None:
        """Replace the API key for *agent_name* with *new_key*.

        Args:
            agent_name: Agent whose key should be rotated.
            new_key: The new secret API key.

        Raises:
            KeyNotFoundError: If the agent is not currently registered.
            InvalidKeyError: If the new key fails format validation.
        """
        name = self._normalise_name(agent_name)
        self._validate_key_format(new_key)
        with self._lock:
            if name not in self._agents:
                raise KeyNotFoundError(
                    f"Cannot rotate: agent '{name}' is not registered."
                )
            self._agents[name] = new_key.strip()
        logger.info("ClawX: rotated key for agent '%s'", name)

    def list_agents(self) -> list[dict[str, Any]]:
        """Return metadata for every registered agent (keys are masked).

        Returns:
            List of dicts with ``name``, ``configured`` (bool), and
            ``key_prefix`` (first 4 chars + ``…``).
        """
        with self._lock:
            items = list(self._agents.items())
        result: list[dict[str, Any]] = []
        for name, key in items:
            prefix = key[:4] + "…" if len(key) > 4 else "…"
            result.append(
                {
                    "name": name,
                    "configured": True,
                    "key_prefix": prefix,
                }
            )
        # Also report known agents that are NOT configured.
        configured_names = {item["name"] for item in result}
        for known in CLAWX_AGENT_NAMES:
            if known not in configured_names:
                result.append(
                    {
                        "name": known,
                        "configured": False,
                        "key_prefix": None,
                    }
                )
        return result

    def get_round_robin_agent(self) -> tuple[str, str]:
        """Return the next agent name/key pair using round-robin selection.

        Useful for load-balancing requests across multiple configured agents.

        Raises:
            ClawxError: If no agents are configured.

        Returns:
            ``(agent_name, api_key)`` tuple.
        """
        with self._lock:
            if not self._agents:
                raise ClawxError("No ClawX agents are configured.")
            names = sorted(self._agents.keys())
            idx = self._round_robin_index % len(names)
            self._round_robin_index += 1
            chosen = names[idx]
            return chosen, self._agents[chosen]

    async def check_connectivity(
        self,
        agent_name: str | None = None,
        timeout: float = 10.0,
    ) -> dict[str, Any]:
        """Test connectivity to the ClawX service.

        If *agent_name* is given, tests that specific agent; otherwise
        tests the first available agent.

        Returns:
            Dict with ``reachable`` (bool), ``status_code`` (int or None),
            ``agent`` (str), and ``error`` (str or None).
        """
        base_url = str(getattr(self._settings, "clawx_base_url", "") or "").rstrip("/")
        enabled = bool(getattr(self._settings, "clawx_enabled", False))

        if not enabled:
            return {
                "reachable": False,
                "status_code": None,
                "agent": agent_name or "any",
                "error": "ClawX integration is disabled (CLAWX_ENABLED=false).",
            }

        if not base_url:
            return {
                "reachable": False,
                "status_code": None,
                "agent": agent_name or "any",
                "error": "CLAWX_BASE_URL is not configured.",
            }

        # Determine which agent/key to use.
        if agent_name:
            try:
                name, key = self._normalise_name(agent_name), self.get_agent_key(
                    agent_name
                )
            except KeyNotFoundError as exc:
                return {
                    "reachable": False,
                    "status_code": None,
                    "agent": agent_name,
                    "error": str(exc),
                }
        else:
            try:
                name, key = self.get_round_robin_agent()
            except ClawxError as exc:
                return {
                    "reachable": False,
                    "status_code": None,
                    "agent": "any",
                    "error": str(exc),
                }

        # Perform a lightweight HTTP GET to the ClawX health endpoint.
        url = f"{base_url}/health"
        headers = {"Authorization": f"Bearer {key}"}
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(url, headers=headers)
            return {
                "reachable": resp.status_code < 500,
                "status_code": resp.status_code,
                "agent": name,
                "error": None,
            }
        except httpx.HTTPError as exc:
            logger.warning("ClawX connectivity check failed: %s", exc)
            return {
                "reachable": False,
                "status_code": None,
                "agent": name,
                "error": str(exc),
            }
