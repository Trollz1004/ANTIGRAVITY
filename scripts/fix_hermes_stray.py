with open("/home/josh/.hermes/config.yaml", "r") as f:
    text = f.read()

# Remove orphaned fallback entry
text = text.replace("- model: minimax-m3:cloud\n  provider: ollama-cloud\n", "")

# Remove dead ollama-cloud credential pool strategy line
text = text.replace("  ollama-cloud: round_robin\n", "")

with open("/home/josh/.hermes/config.yaml", "w") as f:
    f.write(text)

stray = [l for l in text.splitlines()
         if "ollama-cloud" in l and "model-providers/ollama-cloud" not in l]
print("CLEAN" if not stray else "STRAY: " + str(stray))

# Also print the fallback + delegation sections to verify
import re
fb = re.search(r"^fallback_providers:.*?(?=^\S)", text, re.M | re.S)
dg = re.search(r"^delegation:.*?(?=^\S)", text, re.M | re.S)
print("=== fallback_providers ===")
print(fb.group(0)[:400] if fb else "NOT FOUND")
print("=== delegation (first 6 lines) ===")
print("\n".join((dg.group(0) if dg else "NOT FOUND").splitlines()[:6]))
