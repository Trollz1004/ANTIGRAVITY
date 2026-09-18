import re

with open("/home/josh/.hermes/config.yaml", "r") as f:
    text = f.read()

# The fallback_providers block is duplicated. Replace the whole thing cleanly.
# Strategy: find from "fallback_providers:" to "credential_pool_strategies:" and rewrite.

CLEAN_FALLBACK = """fallback_providers:
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
credential_pool_strategies:"""

# Replace everything between (and including) fallback_providers: ... credential_pool_strategies:
text = re.sub(
    r"fallback_providers:.*?credential_pool_strategies:",
    CLEAN_FALLBACK,
    text,
    flags=re.S,
)

with open("/home/josh/.hermes/config.yaml", "w") as f:
    f.write(text)

# Verify
lines = text.splitlines()
start = next((i for i, l in enumerate(lines) if l == "fallback_providers:"), -1)
stop  = next((i for i, l in enumerate(lines) if l == "credential_pool_strategies:"), -1)
print(f"fallback_providers at line {start+1}, credential_pool_strategies at line {stop+1}")
print("\n".join(lines[start:stop+3]))

stray = [l for l in lines if "ollama-cloud" in l and "model-providers/ollama-cloud" not in l]
print("CLEAN" if not stray else "STRAY: " + str(stray))
