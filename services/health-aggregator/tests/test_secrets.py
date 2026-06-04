from pathlib import Path

from app.secrets import VaultEnv


def test_vault_env_parses_keys_without_requiring_values_in_output(tmp_path: Path) -> None:
    env = tmp_path / "test.env"
    env.write_text("A=one\n# comment\nB=\"two\"\n", encoding="utf-8")
    vault = VaultEnv(env)
    assert vault.has_any(("A", "B"))
    assert vault.public_key_state(("A", "MISSING")) == {"A": True, "MISSING": False}
