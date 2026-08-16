
import os, json, re, sys

ROOT = r"C:\Users\joshl\OneDrive"
EXCLUDE_DIRS = {
    "node_modules",
    ".git",
    "AppData",
    "Personal Vault-DESKTOP-H4B53GL",
    "Personal Vault-Laptop",
    "Personal Vault-Sabretooth",
    "Personal Vault.lnk",
    "Desktop",
    "Pictures",
    "Music",
    "Documents",
    "e-commerce-orchestrator-v2",
    "Microsoft Copilot Chat Files",
    ".github",
    ".claude",
    ".vscode",
    ".sixth",
    "Attachments",
    "JOSHUA's-DO-NOT-COMMIT-TO-GITHUB",
}
TERMS = ["charity", "split", "cap", "mission", "DAO", "kids", "10-27-63"]
MATCH = re.compile("|".join(re.escape(t) for t in TERMS), re.IGNORECASE)
TEXT_EXTS = {".md", ".txt", ".json", ".env", ".ps1", ".sh", ".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".yaml", ".yml", ".toml", ".csv", ".xml"}
HITS = []

def scan_paths(roots):
    for root in roots:
        for dirpath, dirnames, filenames in os.walk(root, topdown=True, onerror=lambda e: None):
            dirnames[:] = [
                d for d in dirnames
                if d not in EXCLUDE_DIRS and not d.startswith("Personal Vault")
            ]
            for filename in filenames:
                full_path = os.path.join(dirpath, filename)
                try:
                    rel_path = os.path.relpath(full_path, ROOT)
                except ValueError:
                    continue
                if not filename.lower().endswith(tuple(TEXT_EXTS)):
                    continue
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        lines = f.readlines()
                except Exception:
                    continue
                if not lines:
                    continue
                hits = []
                for idx, line in enumerate(lines, start=1):
                    if MATCH.search(line):
                        hits.append((idx, line.rstrip("\n")))
                if hits:
                    HITS.append({"file": rel_path, "lines": hits})

scan_paths([
    r"C:\Users\joshl\OneDrive",
    r"C:\Users\joshl\Desktop",
    r"C:\Users\joshl\Documents",
])
report = {
    "terms": TERMS,
    "total_hits": len(HITS),
    "hits": [
        {
            "file": h["file"],
            "count": len(h["lines"]),
            "sample": h["lines"][:12],
        }
        for h in HITS
    ],
}
out = r"E:\ANTIGRAVITY\onedrive-scan-result.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)
print(json.dumps(report, indent=2))
print(f"WROTE:{out}", flush=True)
