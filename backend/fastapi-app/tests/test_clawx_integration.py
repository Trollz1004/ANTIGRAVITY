"""Tests for app.clawx_integration — ClawX 6-AI operator key management."""

from unittest.mock import MagicMock

import pytest

from app.clawx_integration import (
    CLAWX_AGENT_NAMES,
    ClawxClient,
    ClawxError,
    InvalidKeyError,
    KeyNotFoundError,
)


@pytest.fixture
def client():
    """Create a ClawxClient with no env keys."""
    settings = MagicMock()
    settings.clawx_agent_keys = {}
    settings.clawx_enabled = False
    settings.clawx_base_url = ""
    return ClawxClient(settings_override=settings)


class TestConstants:
    def test_six_agents(self):
        assert len(CLAWX_AGENT_NAMES) == 6

    def test_known_agents(self):
        assert "claude" in CLAWX_AGENT_NAMES
        assert "gemini" in CLAWX_AGENT_NAMES
        assert "manus" in CLAWX_AGENT_NAMES


class TestExceptions:
    def test_hierarchy(self):
        assert issubclass(InvalidKeyError, ClawxError)
        assert issubclass(KeyNotFoundError, ClawxError)


class TestRegisterAgent:
    def test_register_and_retrieve(self, client):
        client.register_agent("claude", "sk-ant-valid-key-here-ok")
        key = client.get_agent_key("claude")
        assert key == "sk-ant-valid-key-here-ok"

    def test_register_normalises_name(self, client):
        client.register_agent("  Claude ", "sk-ant-valid-key-here-ok")
        key = client.get_agent_key("claude")
        assert key is not None

    def test_register_invalid_key_too_short(self, client):
        with pytest.raises(InvalidKeyError):
            client.register_agent("claude", "short")

    def test_register_invalid_key_bad_chars(self, client):
        with pytest.raises(InvalidKeyError):
            client.register_agent("claude", "key with spaces!@#$")


class TestGetAgentKey:
    def test_missing_agent(self, client):
        with pytest.raises(KeyNotFoundError):
            client.get_agent_key("nonexistent")


class TestRotateKey:
    def test_rotate_existing(self, client):
        client.register_agent("gemini", "old-key-value-is-long-enough")
        client.rotate_key("gemini", "new-key-value-is-long-enough")
        assert client.get_agent_key("gemini") == "new-key-value-is-long-enough"

    def test_rotate_unregistered(self, client):
        with pytest.raises(KeyNotFoundError):
            client.rotate_key("nonexistent", "valid-key-long-enough")

    def test_rotate_invalid_key(self, client):
        client.register_agent("grok", "original-key-long-enough")
        with pytest.raises(InvalidKeyError):
            client.rotate_key("grok", "bad")


class TestListAgents:
    def test_includes_unconfigured(self, client):
        agents = client.list_agents()
        names = {a["name"] for a in agents}
        for name in CLAWX_AGENT_NAMES:
            assert name in names

    def test_configured_agent_has_prefix(self, client):
        client.register_agent("claude", "sk-ant-secret-key-value")
        agents = client.list_agents()
        claude = next(a for a in agents if a["name"] == "claude")
        assert claude["configured"] is True
        assert claude["key_prefix"].startswith("sk-a")

    def test_unconfigured_has_none_prefix(self, client):
        agents = client.list_agents()
        unconfigured = [a for a in agents if not a["configured"]]
        assert len(unconfigured) > 0
        for a in unconfigured:
            assert a["key_prefix"] is None


class TestRoundRobin:
    def test_cycles_through_agents(self, client):
        client.register_agent("claude", "key-claude-long-enough")
        client.register_agent("gemini", "key-gemini-long-enough")

        seen_agents = set()
        for _ in range(4):
            name, key = client.get_round_robin_agent()
            seen_agents.add(name)
        assert "claude" in seen_agents
        assert "gemini" in seen_agents

    def test_no_agents_raises(self, client):
        with pytest.raises(ClawxError):
            client.get_round_robin_agent()


class TestLoadFromEnv:
    def test_json_string(self):
        settings = MagicMock()
        settings.clawx_agent_keys = '{"claude": "sk-ant-long-key-here-ok"}'
        settings.clawx_enabled = False
        settings.clawx_base_url = ""
        c = ClawxClient(settings_override=settings)
        assert c.get_agent_key("claude") == "sk-ant-long-key-here-ok"

    def test_dict_input(self):
        settings = MagicMock()
        settings.clawx_agent_keys = {"gemini": "key-gemini-is-long-enough"}
        settings.clawx_enabled = False
        settings.clawx_base_url = ""
        c = ClawxClient(settings_override=settings)
        assert c.get_agent_key("gemini") == "key-gemini-is-long-enough"

    def test_invalid_json(self):
        settings = MagicMock()
        settings.clawx_agent_keys = "not valid json"
        settings.clawx_enabled = False
        settings.clawx_base_url = ""
        c = ClawxClient(settings_override=settings)
        assert c.list_agents()  # Should not crash


class TestKeyValidation:
    def test_valid_format(self, client):
        # Should not raise
        ClawxClient._validate_key_format("sk-ant-valid.key:123_test")

    def test_empty_key(self, client):
        with pytest.raises(InvalidKeyError):
            ClawxClient._validate_key_format("")

    def test_none_key(self, client):
        with pytest.raises(InvalidKeyError):
            ClawxClient._validate_key_format(None)
