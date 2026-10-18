import os
import tomllib

paths = [
    r"C:\Users\joshi\.paperclip-hermes\instances\default\companies\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\codex-home\config.toml",
    r"C:\Users\joshi\.paperclip-hermes\instances\default\companies\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\codex-home\connector-runtimes\3ff00008-6118-4745-ad53-b927e5948217\c22d7ef09a6a7a3524e737597f684e1bd441eeb84aab936105170c60d24ea8eb\config.toml"
]

p_golden = os.path.expanduser(r"~/.codex/config.toml")
with open(p_golden, "r", encoding="utf-8") as f:
    golden_content = f.read()

for p in paths:
    if not os.path.exists(p):
        continue
    with open(p, "r", encoding="utf-8") as f:
        curr = f.read()

    idx = curr.find('[mcp_servers."native-')
    extra = ""
    if idx != -1:
        extra = "\n" + curr[idx:]

    new_content = golden_content + extra
    with open(p, "w", encoding="utf-8") as f:
        f.write(new_content)

    try:
        with open(p, "rb") as f:
            tomllib.load(f)
        print("SUCCESS: Validated TOML for", p)
    except Exception as e:
        print("ERROR: Failed to validate", p, e)
