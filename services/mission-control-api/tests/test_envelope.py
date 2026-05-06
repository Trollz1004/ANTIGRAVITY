import pytest
from mission_control_api.envelope import make_envelope

def test_envelope():
    env = make_envelope("ok", 10, {"foo": "bar"})
    d = env.dict()
    assert d["status"] == "ok"
    assert d["latency_ms"] == 10
    assert d["details"]["foo"] == "bar"
