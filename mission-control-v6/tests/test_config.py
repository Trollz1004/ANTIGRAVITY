"""Config loading, env expansion, placeholder substitution, validation."""

from __future__ import annotations

import json

import pytest

from mission_control.config import (
    DEFAULT_CONFIG_PATH, MC_HOME, REPO_ROOT, Config, ConfigError,
    _expand_env, build_config, load_config,
)
from mission_control.models import CheckKind


class TestDefaults:
    def test_shipped_config_loads(self):
        cfg = load_config(None)
        ids = {s.id for s in cfg.services}
        # the real ANTIGRAVITY registry must cover the stack the operator named
        assert {"hermes-dashboard", "openclaw", "omniroute", "backend"} <= ids
        assert cfg.server.port == 8787
        assert cfg.source_path == str(DEFAULT_CONFIG_PATH)

    def test_every_service_with_playbook_resolves(self):
        cfg = load_config(None)
        for spec in cfg.services:
            if spec.playbook:
                assert spec.playbook in cfg.playbooks
                pb = cfg.playbooks[spec.playbook]
                assert pb.commands, f"playbook {pb.id} has no commands"

    def test_links_cover_the_omni_route(self):
        cfg = load_config(None)
        labels = " ".join(l.label for l in cfg.links)
        assert "Hermes" in labels and "OpenClaw" in labels and "OmniRoute" in labels


class TestEnvExpansion:
    def test_expand_value(self):
        assert _expand_env("${FOO}", {"FOO": "42"}) == "42"

    def test_expand_default(self):
        assert _expand_env("${MISSING:-fallback}") == "fallback"

    def test_expand_missing_raises(self):
        with pytest.raises(ConfigError):
            _expand_env("${DEFINITELY_MISSING}", {})

    def test_expansion_inside_file(self, tmp_path):
        path = tmp_path / "c.json"
        path.write_text(json.dumps({
            "server": {"port": "${MC_TEST_PORT:-18787}", "state_db": str(tmp_path / "db.sqlite")},
            "services": [],
        }))
        cfg = load_config(str(path), env={})
        assert cfg.server.port == 18787


class TestValidation:
    def _raw(self, service):
        return {"server": {"state_db": "x.db"}, "services": [service], "playbooks": {}}

    def test_duplicate_ids_rejected(self):
        svc = {"id": "a", "kind": "tcp", "host": "h", "port": 1}
        with pytest.raises(ConfigError, match="duplicate"):
            build_config({"services": [svc, dict(svc)], "playbooks": {}})

    def test_unknown_kind_rejected(self):
        with pytest.raises(ConfigError, match="unknown check kind"):
            build_config(self._raw({"id": "a", "kind": "carrier-pigeon"}))

    def test_tcp_requires_port(self):
        with pytest.raises(ConfigError, match="requires 'host' and 'port'"):
            build_config(self._raw({"id": "a", "kind": "tcp", "host": "h"}))

    def test_http_requires_url(self):
        with pytest.raises(ConfigError, match="requires 'url'"):
            build_config(self._raw({"id": "a", "kind": "http"}))

    def test_process_requires_pattern(self):
        with pytest.raises(ConfigError, match="requires 'process'"):
            build_config(self._raw({"id": "a", "kind": "process"}))

    def test_docker_requires_container(self):
        with pytest.raises(ConfigError, match="requires 'container'"):
            build_config(self._raw({"id": "a", "kind": "docker"}))

    def test_command_requires_argv(self):
        with pytest.raises(ConfigError, match="requires 'command'"):
            build_config(self._raw({"id": "a", "kind": "command"}))

    def test_bad_interval(self):
        svc = {"id": "a", "kind": "tcp", "host": "h", "port": 1, "interval_s": 0}
        with pytest.raises(ConfigError, match="interval_s"):
            build_config(self._raw(svc))

    def test_bad_threshold(self):
        svc = {"id": "a", "kind": "tcp", "host": "h", "port": 1, "fail_threshold": 0}
        with pytest.raises(ConfigError, match="fail_threshold"):
            build_config(self._raw(svc))

    def test_unknown_playbook_ref(self):
        svc = {"id": "a", "kind": "tcp", "host": "h", "port": 1, "playbook": "ghost"}
        with pytest.raises(ConfigError, match="unknown playbook"):
            build_config(self._raw(svc))

    def test_autofix_needs_playbook(self):
        svc = {"id": "a", "kind": "tcp", "host": "h", "port": 1, "auto_fix": True}
        with pytest.raises(ConfigError, match="auto_fix requires"):
            build_config(self._raw(svc))

    def test_bad_expected_status_string(self):
        svc = {"id": "a", "kind": "http", "url": "http://x", "expected_status": "ok-ish"}
        with pytest.raises(ConfigError, match="expected_status"):
            build_config(self._raw(svc))

    def test_bad_expected_status_type(self):
        svc = {"id": "a", "kind": "http", "url": "http://x", "expected_status": ["200"]}
        with pytest.raises(ConfigError, match="expected_status"):
            build_config(self._raw(svc))

    def test_playbook_command_must_be_argv(self):
        raw = {"playbooks": {"p": {"commands": {"linux": ["echo hi"]}}}, "services": []}
        with pytest.raises(ConfigError, match="argv list"):
            build_config(raw)


class TestPlaceholdersAndPaths:
    def test_repo_root_substitution(self):
        raw = {
            "services": [],
            "playbooks": {"p": {"commands": {"all": [["cmd", "/c", "cd /d {repo_root}"]]}, "script": "fix-scripts/x.cmd"}},
        }
        cfg = build_config(raw)
        argv = cfg.playbooks["p"].commands["all"][0]
        assert str(REPO_ROOT) in argv[-1]
        assert "{repo_root}" not in argv[-1]

    def test_state_db_abs(self):
        cfg = build_config({"server": {"state_db": "state/mc.db"}, "services": []})
        assert cfg.state_db_abs() == MC_HOME / "state" / "mc.db"
        cfg2 = build_config({"server": {"state_db": "/tmp/abs.db"}, "services": []})
        assert str(cfg2.state_db_abs()) == "/tmp/abs.db"

    def test_config_lookup(self, cfg: Config):
        assert cfg.service("svc-down").kind is CheckKind.COMMAND
        assert cfg.service("ghost") is None

    def test_load_missing_file(self):
        with pytest.raises(ConfigError, match="not found"):
            load_config("/no/such/file.json")

    def test_load_bad_json(self, tmp_path):
        path = tmp_path / "bad.json"
        path.write_text("{nope")
        with pytest.raises(ConfigError, match="not valid JSON"):
            load_config(str(path))

    def test_notifier_spec_preservation(self, cfg: Config):
        types = {n.get("type") for n in cfg.notifiers}
        assert {"console", "file"} <= types
