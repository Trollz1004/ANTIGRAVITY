import os
import re

base = r"C:\Users\joshi\.paperclip-hermes\instances\default\companies\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\codex-home"
target_line = "NODE_REPL_TRUSTED_SERVICES = '{\"browser\":\"C:/Users/joshi/.codex/plugins/cache/openai-bundled/browser/26.1007.71326/scripts/browser-service.mjs\",\"sky\":\"@oai/sky/service\"}'\n"

for root, dirs, files in os.walk(base):
    for f in files:
        if f == "config.toml":
            p = os.path.join(root, f)
            with open(p, "r", encoding="utf-8", errors="ignore") as fp:
                lines = fp.readlines()
            changed = False
            new_lines = []
            for line in lines:
                if line.strip().startswith("NODE_REPL_TRUSTED_SERVICES"):
                    if not line.startswith("NODE_REPL_TRUSTED_SERVICES = '"):
                        new_lines.append(target_line)
                        changed = True
                        continue
                new_lines.append(line)
            if changed:
                with open(p, "w", encoding="utf-8") as fp:
                    fp.writelines(new_lines)
                print(f"[FIXED] {p}")

print("[DONE] Codex TOML configs verified.")
