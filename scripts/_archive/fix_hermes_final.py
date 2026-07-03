import re

with open("/home/josh/.hermes/config.yaml", "r") as f:
    text = f.read()

# ── 1. Restore fallback_providers with full rotation chain ────────────────────
FALLBACK = """fallback_providers:
- provider: custom
  model: qwen2.5:7b
  base_url: http://localhost:11434/v1
  api_key: ollama
- provider: custom
  model: qwen3.5:latest
  base_url: http://localhost:11434/v1
  api_key: ollama
- provider: openrouter
  model: qwen/qwen3-235b-a22b
- provider: openrouter
  model: minimax/minimax-m2
"""

# Replace whatever is currently there (could be empty block or partial)
text = re.sub(
    r"^fallback_providers:.*?(?=^\S|\Z)",
    FALLBACK,
    text,
    flags=re.M | re.S,
)
print("OK fallback_providers restored")

# ── 2. Fix duplicate base_url in delegation ───────────────────────────────────
# Pattern: delegation block has two base_url lines — remove the empty one
def fix_delegation(m):
    block = m.group(0)
    # Remove the empty "  base_url: ''" line if local base_url already present
    if "base_url: http://localhost:11434/v1" in block:
        block = re.sub(r"  base_url: ''\n", "", block)
        block = re.sub(r"  api_key: ''\n", "", block)
    return block

text = re.sub(
    r"^delegation:.*?(?=^\S|\Z)",
    fix_delegation,
    text,
    flags=re.M | re.S,
)
print("OK delegation deduplicated")

# ── 3. Final verification ─────────────────────────────────────────────────────
stray = [l for l in text.splitlines()
         if "ollama-cloud" in l and "model-providers/ollama-cloud" not in l]
print("CLEAN - no stray ollama-cloud" if not stray else "STRAY: " + str(stray))

with open("/home/josh/.hermes/config.yaml", "w") as f:
    f.write(text)

# Print key sections for confirmation
fb = re.search(r"^fallback_providers:.*?(?=^\S)", text, re.M | re.S)
dg = re.search(r"^delegation:.*?(?=^\S)", text, re.M | re.S)
print("\n=== fallback_providers ===")
print(fb.group(0).strip() if fb else "NOT FOUND")
print("\n=== delegation (first 7 lines) ===")
print("\n".join((dg.group(0) if dg else "NOT FOUND").splitlines()[:7]))
