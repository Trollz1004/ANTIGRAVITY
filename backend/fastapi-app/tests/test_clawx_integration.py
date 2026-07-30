"""Tests for the ClawX 6-AI operator key client."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.clawx_integration import (
    CLAWX_AGENT_NAMES,
    AgentNotFoundError,
    ClawxClient,
    ClawxError,
    InvalidKeyError,
    KeyNotFoundError,
)

GOOD_KEY = "sk-valid-key-1234567890"


def _client(env: dict | None = None, *, enabled=False, base_url="") -> ClawxClient:
    settings = MagicMock()
    settings.clawx_agent_keys = env or {}
    settings.clawx_enabled = enabled
    settings.clawx_base_url = base_url
    return ClawxClient(settings_override=settings)


class TestLoadFromEnv:
    def test_dict_env_loads_normalised_keys(self):
        client = _client({" Claude ": GOOD_KEY, "gemini": GOOD_KEY, "empty": "  "})
        assert client.get_agent_key("claude") == GOOD_KEY
        assert client.get_agent_key("GEMINI") == GOOD_KEY

    def test_json_string_env_is_parsed(self):
        client = _client(json.dumps({"grok": GOOD_KEY}))
        assert client.get_agent_key("grok") == GOOD_KEY

    def test_invalid_json_env_is_ignored(self):
        client = _client("{ uh oh")
        with pytest.raises(KeyNotFoundError):
            client.get_agent_key("grok")

    def test_non_dict_env_is_ignored(self):
        settings = MagicMock()
        settings.clawx_agent_keys = ["not-a-dict"]
        client = ClawxClient(settings_override=settings)
        assert client.get_round_robin_agent.__self__ is client
        with pytest.raises(ClawxError):
            client.get_round_robin_agent()

    def test_none_env_defaults_to_empty(self):
        settings = MagicMock()
        settings.clawx_agent_keys = None
        client = ClawxClient(settings_override=settings)
        agents = {a["name"]: a for a in client.list_agents()}
        assert agents["claude"]["configured"] is False


class TestKeyManagement:
    def test_register_and_get(self):
        client = _client()
        client.register_agent("Claude", GOOD_KEY)
        assert client.get_agent_key("CLAUDE ") == GOOD_KEY

    def test_register_rejects_short_and_illegal_keys(self):
        client = _client()
        with pytest.raises(InvalidKeyError):
            client.register_agent("claude", "short")
        with pytest.raises(InvalidKeyError):
            client.register_agent("claude", "")
        with pytest.raises(InvalidKeyError):
            client.register_agent("claude", "has space and more text xx")
        with pytest.raises(InvalidKeyError):
            client.register_agent("claude", "bad$key$characters$$$$$")

    def test_get_missing_key_raises(self):
        client = _client()
        with pytest.raises(KeyNotFoundError):
            client.get_agent_key("nobody")

    def test_rotate_requires_registration(self):
        client = _client()
        with pytest.raises(KeyNotFoundError):
            client.rotate_key("claude", GOOD_KEY)

    def test_rotate_replaces_key(self):
        client = _client({"claude": GOOD_KEY})
        client.rotate_key("claude", "sk-rotated-key-987654")
        assert client.get_agent_key("claude") == "sk-rotated-key-987654"

    def test_rotate_validates_format(self):
        client = _client({"claude": GOOD_KEY})
        with pytest.raises(InvalidKeyError):
            client.rotate_key("claude", "short")

    def test_list_agents_masks_and_reports_unconfigured(self):
        client = _client({"claude": GOOD_KEY, "custom-agent": GOOD_KEY})
        agents = {a["name"]: a for a in client.list_agents()}

        assert agents["claude"]["configured"] is True
        assert agents["claude"]["key_prefix"].startswith("sk-v")
        assert agents["claude"]["key_prefix"].endswith("…")
        assert GOOD_KEY not in json.dumps(agents)

        for known in CLAWX_AGENT_NAMES:
            assert known in agents
        assert agents["grok"]["configured"] is False
        assert agents["grok"]["key_prefix"] is None
        assert agents["custom-agent"]["configured"] is True


class TestRoundRobin:
    def test_cycles_through_agents(self):
        client = _client({"a-agent": GOOD_KEY, "b-agent": GOOD_KEY})
        picks = [client.get_round_robin_agent()[0] for _ in range(4)]
        assert picks == ["a-agent", "b-agent", "a-agent", "b-agent"]

    def test_no_agents_raises(self):
        client = _client()
        with pytest.raises(ClawxError):
            client.get_round_robin_agent()


@pytest.mark.asyncio
class TestConnectivity:
    async def test_disabled_returns_disabled_error(self):
        client = _client({"claude": GOOD_KEY}, enabled=False)
        result = await client.check_connectivity()
        assert result["reachable"] is False
        assert "disabled" in result["error"]

    async def test_missing_base_url_returns_error(self):
        client = _client({"claude": GOOD_KEY}, enabled=True, base_url="")
        result = await client.check_connectivity()
        assert result["reachable"] is False
        assert "CLAWX_BASE_URL" in result["error"]

    async def test_specific_unknown_agent_returns_error(self):
        client = _client({"claude": GOOD_KEY}, enabled=True, base_url="http://claw.test")
        result = await client.check_connectivity(agent_name="ghost")
        assert result["reachable"] is False
        assert "ghost" in result["error"]

    async def test_no_agents_returns_error(self):
        client = _client(enabled=True, base_url="http://claw.test")
        result = await client.check_connectivity()
        assert result["reachable"] is False
        assert "No ClawX agents" in result["error"]

    async def test_successful_health_check(self):
        client = _client({"claude": GOOD_KEY}, enabled=True, base_url="http://claw.test")
        response = MagicMock(status_code=200)
        mock_http = AsyncMock()
        mock_http.get = AsyncMock(return_value=response)
        mock_http.__aenter__ = AsyncMock(return_value=mock_http)
        mock_http.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=mock_http):
            result = await client.check_connectivity()
        assert result["reachable"] is True
        assert result["status_code"] == 200
        assert result["agent"] == "claude"
        headers = mock_http.get.call_args.kwargs["headers"]
        assert headers["Authorization"] == f"Bearer {GOOD_KEY}"

    async def test_server_error_status_is_unreachable(self):
        client = _client({"claude": GOOD_KEY}, enabled=True, base_url="http://claw.test")
        response = MagicMock(status_code=503)
        mock_http = AsyncMock()
        mock_http.get = AsyncMock(return_value=response)
        mock_http.__aenter__ = AsyncMock(return_value=mock_http)
        mock_http.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=mock_http):
            result = await client.check_connectivity()
        assert result["reachable"] is False
        assert result["status_code"] == 503

    async def test_http_error_is_captured(self):
        client = _client({"claude": GOOD_KEY}, enabled=True, base_url="http://claw.test")
        mock_http = AsyncMock()
        mock_http.get = AsyncMock(side_effect=httpx.ConnectError("refused"))
        mock_http.__aenter__ = AsyncMock(return_value=mock_http)
        mock_http.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=mock_http):
            result = await client.check_connectivity()
        assert result["reachable"] is False
        assert "refused" in result["error"]

    async def test_named_agent_is_used(self):
        client = _client(
            {"claude": GOOD_KEY, "grok": GOOD_KEY},
            enabled=True,
            base_url="http://claw.test",
        )
        response = MagicMock(status_code=200)
        mock_http = AsyncMock()
        mock_http.get = AsyncMock(return_value=response)
        mock_http.__aenter__ = AsyncMock(return_value=mock_http)
        mock_http.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=mock_http):
            result = await client.check_connectivity(agent_name=" Grok ")
        assert result["agent"] == "grok"


def test_exceptions_inherit_base():
    assert issubclass(AgentNotFoundError, ClawxError)
    assert issubclass(InvalidKeyError, ClawxError)
    assert issubclass(KeyNotFoundError, ClawxError)
