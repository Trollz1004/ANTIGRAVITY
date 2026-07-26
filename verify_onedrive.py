
import os, json, re

ROOT = os.path.expanduser('~/OneDrive')
EXCLUDE_DIRS = {
    'node_modules', '.git', 'AppData',
    'JOSHUA\'s-DO-NOT-COMMIT-TO-GITHUB',
    'Personal Vault-DESKTOP-H4B53GL', 'Personal Vault-Laptop', 'Personal Vault-Sabretooth', 'Personal Vault.lnk',
}
TERMS = ['charity', 'split', 'cap', 'mission', 'DAO', 'kids', '10-27-63']
PAT = re.compile('|'.join(re.escape(t) for t in TERMS), re.IGNORECASE)
TEXT_EXTS = {'.md', '.txt', '.json', '.env', '.ps1', '.sh', '.py', '.js', '.ts', '.jsx', '.tsx', '.html', '.yaml', '.yml', '.toml', '.csv', '.xml'}
HITS = []

for dirpath, dirnames, filenames in os.walk(ROOT, topdown=True, onerror=lambda e: None):
    dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS and not d.startswith('Personal Vault')]
    for filename in filenames:
        if not filename.lower().endswith(tuple(TEXT_EXTS)):
            continue
        full = os.path.join(dirpath, filename)
        try:
            lines = open(full, 'r', encoding='utf-8', errors='ignore').readlines()
        except Exception:
            continue
        hits = []
        for idx, line in enumerate(lines, 1):
            if PAT.search(line):
                hits.append((idx, line.rstrip('\n')))
        if hits:
            HITS.append({'file': os.path.relpath(full, ROOT), 'count': len(hits), 'sample': hits[:12]})
print(json.dumps({'terms': TERMS, 'total_hits': len(HITS), 'hits': HITS}, indent=2), flush=True)
