import os, re
import pytest
from mission_control_api.config import settings

FORBIDDEN = re.compile(r"openai|anthropic|gemini|emergent|support|support|public-benefit", re.IGNORECASE)

def test_reserve_percent():
    assert settings.RESERVE_PERCENT == 10

def test_no_forbidden_strings():
    src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src"))
    for root, _, files in os.walk(src_dir):
        for f in files:
            if f.endswith('.py'):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8') as fh:
                    content = fh.read()
                    assert not FORBIDDEN.search(content), f"Forbidden string found in {path}"
