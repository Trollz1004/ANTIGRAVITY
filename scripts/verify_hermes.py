import re

with open("/home/josh/.hermes/config.yaml") as f:
    t = f.read()

# Show auxiliary block
m = re.search(r"^auxiliary:.*?(?=^\S)", t, re.M | re.S)
block = m.group(0) if m else "NOT FOUND"
# Print each sub-key's provider + model
for sub in re.finditer(r"^  (\w+):\n((?:    [^\n]*\n)+)", block, re.M):
    key = sub.group(1)
    body = sub.group(2)
    prov = re.search(r"provider: (\S+)", body)
    mod  = re.search(r"model: (\S+)", body)
    print(f"  {key:<22} provider={prov.group(1) if prov else '?':<12} model={mod.group(1) if mod else '?'}")

# Show delegation
print()
dg = re.search(r"^delegation:.*?(?=^\S)", t, re.M | re.S)
print("\n".join((dg.group(0) if dg else "NOT FOUND").splitlines()[:6]))
