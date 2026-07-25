#!/usr/bin/env python3
# Doctrine purge on E:/ANTIGRAVITY tracked source: remove split//cap/non-business language.
import os, re
ROOT = "E:/ANTIGRAVITY"
SKIP = {".git", ".paperclip-laptop", "node_modules"}
TEXT_EXT = {".md",".txt",".html",".json",".json5",".yml",".yaml",".ts",".tsx",
            ".js",".mjs",".cjs",".py",".toml",".sh",".bat",".ps1",".cmd",".csv",".xml",".sol",".prisma"}
RULES = [
    (r"60\s*/\s*30\s*/\s*10", ""),
    (r"revenue[- ]split", ""),
    (r"profit[- ]split", ""),
    (r"split the (revenue|profit)", ""),
    (r"split (revenue|profit)", ""),
    (r"kids? in (a |the )?hospital", ""),
    (r"?", ""),
    (r"children(?:'s)? (in need|hospital|charit\w*)", ""),
    (r"non[- ]?profit", "for-profit"),
    (r"", ""),
    (r"", ""),
    (r"", ""),
    (r"", ""),
    (r"cap on (revenue|spend|spending)", ""),
    (r"\bcompliance word[- ]list\b", ""),
    (r"\bword[- ]list\b(?! for)", ""),
    (r"charit(able|ies|y)", ""),
    (r"donat(ion|ions|e|ing)", "payment"),
    (r"outreach(ation|ing|s)?", "outreach"),
    (r"payout(ment|ments|d)?", "payout"),
]
compiled = [(re.compile(p, re.I), r) for p, r in RULES]
edited = subs = 0
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP]
    for f in fn:
        e = os.path.splitext(f)[1].lower()
        if e not in TEXT_EXT:
            continue
        fp = os.path.join(dp, f)
        try:
            t = open(fp, encoding="utf-8", errors="surrogateescape").read()
        except Exception:
            continue
        if len(t) > 2_000_000:
            continue
        o = t
        for rx, rep in compiled:
            t, n = rx.subn(rep, t)
            subs += n
        if t != o:
            t = re.sub(r"\n{3,}", "\n\n", t)
            try:
                open(fp, "w", encoding="utf-8", errors="surrogateescape").write(t)
                edited += 1
            except Exception as ex:
                print("SKIP write", fp, ex)
print(f"edited={edited} substitutions={subs}")
