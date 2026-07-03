#!/usr/bin/env python3
"""
Patch ~/.hermes/config.yaml:
- Replace all ollama-cloud references with local Ollama (snap) + OpenRouter rotation
- Local Ollama base_url: http://localhost:11434/v1
- Available local models: qwen2.5:7b, qwen3.5, gemma4, gemma2, gemma3:1b,
  joshlcoleman/CFO-Until-No-Kid-In-Need, joshlcoleman/dateapp
"""
import re

config_path = "/home/josh/.hermes/config.yaml"

with open(config_path, "r") as f:
    text = f.read()

original = text

# ── 1. fallback_providers block ──────────────────────────────────────────────
old_fallback = re.search(
    r"^fallback_providers:.*?(?=^\S|\Z)", text, re.MULTILINE | re.DOTALL
)
new_fallback = (
    "fallback_providers:\n"
    "- provider: custom\n"
    "  model: qwen2.5:7b\n"
    "  base_url: http://localhost:11434/v1\n"
    "  api_key: ollama\n"
    "- provider: custom\n"
    "  model: qwen3.5:latest\n"
    "  base_url: http://localhost:11434/v1\n"
    "  api_key: ollama\n"
    "- provider: openrouter\n"
    "  model: qwen/qwen3-235b-a22b\n"
    "- provider: openrouter\n"
    "  model: minimax/minimax-m2\n"
)
if old_fallback:
    text = text[: old_fallback.start()] + new_fallback + text[old_fallback.end() :]
    print("OK fallback_providers updated")
else:
    print("WARN fallback_providers block not found")

# ── 2. delegation block ───────────────────────────────────────────────────────
text = re.sub(
    r"(^delegation:(?:\n  [^\n]*)*?\n  model: )minimax-m3:cloud",
    r"\1qwen2.5:7b",
    text,
    flags=re.MULTILINE,
)
text = re.sub(
    r"(^delegation:(?:\n  [^\n]*)*?\n  provider: )ollama-cloud",
    r"\1custom",
    text,
    flags=re.MULTILINE,
)
# inject base_url+key after "  provider: custom" inside delegation block
def patch_delegation(m):
    block = m.group(0)
    if "base_url: http://localhost:11434/v1" not in block:
        block = re.sub(
            r"(  provider: custom\n)",
            r"\1  base_url: http://localhost:11434/v1\n  api_key: ollama\n",
            block,
            count=1,
        )
    return block

text = re.sub(
    r"^delegation:.*?(?=^\S|\Z)",
    patch_delegation,
    text,
    flags=re.MULTILINE | re.DOTALL,
)
print("OK delegation updated")

# ── 3. auxiliary sub-blocks ───────────────────────────────────────────────────
FAST_TASKS   = {"title_generation", "approval", "mcp", "skills_hub"}
VISION_TASKS = {"vision"}
WORK_MODEL   = "qwen2.5:7b"
FAST_MODEL   = "gemma4:latest"
VISION_MODEL = "gemma4:latest"
LOCAL_BASE   = "http://localhost:11434/v1"

def patch_aux_block(m):
    key   = m.group(1)
    block = m.group(0)
    if "ollama-cloud" not in block and "minimax-m3" not in block:
        return block
    model = VISION_MODEL if key in VISION_TASKS else (FAST_MODEL if key in FAST_TASKS else WORK_MODEL)
    block = block.replace("provider: ollama-cloud", "provider: custom")
    block = re.sub(r"model: minimax-m3(?::cloud)?", f"model: {model}", block)
    if LOCAL_BASE not in block:
        block = re.sub(
            r"(    provider: custom\n)",
            f"\\1    base_url: {LOCAL_BASE}\n    api_key: ollama\n",
            block,
            count=1,
        )
    return block

# auxiliary is 2-space-indented keys, sub-keys are 4-space
text = re.sub(
    r"^  (\w+):\n(?:    [^\n]*\n)+",
    patch_aux_block,
    text,
    flags=re.MULTILINE,
)
print("OK auxiliary blocks updated")

# ── 4. Sanity check ───────────────────────────────────────────────────────────
stray = [
    l for l in text.splitlines()
    if "ollama-cloud" in l
    and "model-providers/ollama-cloud" not in l
    and "plugin" not in l.lower()
]
if stray:
    print("WARN remaining ollama-cloud refs:")
    for l in stray:
        print("  ", l.strip())
else:
    print("OK no stray ollama-cloud refs remain")

# ── 5. Write ──────────────────────────────────────────────────────────────────
if text != original:
    with open(config_path, "w") as f:
        f.write(text)
    print("OK config written")
else:
    print("INFO no changes — config unchanged")
