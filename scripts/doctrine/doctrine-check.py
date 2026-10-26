#!/usr/bin/env python3
"""Doctrine gate. Deterministic, no model, no tokens, no network.

A settled fact lives in exactly ONE file. Every other file points at it.
This fails the build the moment someone copies the fact somewhere else,
which is how a fact goes stale and how an agent rebuilds a dead blocker.

It also refuses a few things that are not facts but hazards: a supply-chain
lure, and hardcoded user paths that silently break on another node.

Add a fact below; that is the whole maintenance burden.
Run:  python scripts/doctrine/doctrine-check.py
"""
import json, os, re, subprocess, sys

FACTS = [
    {
        "name": "payments",
        "source": ("docs/PAYMENTS-TRUTH.md", "docs/payment-flow-verification-2026-06-01.md"),
        "patterns": [r"\bT14t\b", r"\bb3FM\b", r"\bv1nS\b",
                     r"\b\d+ Square attempts\b", r"\b\d+ are Joshua's own test charges\b"],
        "allow": (r"^domains/youandinotai\.com/backend/app/revenue_allocation\.py$",
                  r"^ops/runbook/PROTECTED-CHANGELOG\.md$",
                  r"^ops/handoffs/.*$", r"^archive/.*$"),
        "fix": "State the conclusion and point at docs/PAYMENTS-TRUTH.md. Never copy its contents.",
    },
    {
        "name": "paperclip-retired",
        "source": (),
        "patterns": [r"127\.0\.0\.1:4747", r"127\.0\.0\.1:3917", r"localhost:4747"],
        "allow": (r"^ops/runbook/PROTECTED-CHANGELOG\.md$", r"^ops/handoffs/.*$", r"^archive/.*$"),
        "fix": "Paperclip is retired. Mission Control is :3130. Remove the endpoint.",
    },
    {
        "name": "dead-surfaces",
        "source": (),
        "patterns": [r"ai-solutions\.store", r"onlinerecycle\.org", r"192\.168\.0\.8"],
        "allow": (r"^ops/runbook/PROTECTED-CHANGELOG\.md$", r"^ops/handoffs/.*$", r"^archive/.*$"),
        "fix": "Retired surface or dead node. Live: youandinotai.com, onlinerecycle.net, dream-online.net.",
    },
    {
        # SECRET SHAPES. Prefix patterns only - no real secret value is ever stored
        # in this file. The repos are public; a key that lands in one is a key that
        # is gone. This fails the build before the commit, which is the only moment
        # the outcome is still cheap.
        "name": "secret-in-repo",
        "source": (),
        "patterns": [
            r"sk_live_[A-Za-z0-9]{20,}", r"rk_live_[A-Za-z0-9]{20,}",
            r"sk_org_live_[A-Za-z0-9]{20,}",
            r"\bEAAA[A-Za-z0-9_\-]{20,}",            # Square access token
            r"\bghp_[A-Za-z0-9]{30,}", r"\bgithub_pat_[A-Za-z0-9_]{30,}",
            r"\b11A[A-Z0-9]{7}[A-Za-z0-9_\-]{50,}",  # fine-grained GitHub PAT
            r"sk-proj-[A-Za-z0-9_\-]{30,}", r"sk-svcacct-[A-Za-z0-9_\-]{30,}",
            r"sk-or-v1-[a-f0-9]{48,}",
            r"\bxai-[A-Za-z0-9]{40,}", r"\bpplx-[a-f0-9]{40,}",
            r"\bhf_[A-Za-z0-9]{30,}", r"\br8_[A-Za-z0-9]{30,}",
            r"\bsbp_[a-f0-9]{30,}", r"\bsb_secret_[A-Za-z0-9_\-]{20,}",
            r"\bntn_[A-Za-z0-9]{30,}", r"\bvck_[A-Za-z0-9]{30,}",
            r"\bSG\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}",
            r"\bAIza[A-Za-z0-9_\-]{30,}",
            r"\b\d{9,10}:AA[A-Za-z0-9_\-]{30,}",     # Telegram bot token
            r"\bsm_[A-Za-z0-9]{40,}",
        ],
        "allow": (r"^scripts/doctrine/doctrine-check\.py$",),
        "fix": "A live credential. It must never be committed - the repos are PUBLIC. "
               "Put it in a local env file or a GitHub Actions secret and reference it by name.",
    },
    {
        # SUPPLY CHAIN. REA-Gith/REA is a keyword-stuffed lookalike offering a
        # Windows ZIP whose version does not match the real project. Classic lure.
        # The real project is morluto/rea, installed with: npx -y rea-agents mcp
        "name": "supply-chain-lure",
        "source": (),
        "patterns": [r"REA-Gith", r"rea[-_]?gith",
                     r"github\.com/REA-Gith/REA",
                     r"REA[_ -]?Reverse[_ -]?Engineer[_ -]?Anything[_ -]?6\.3\.0"],
        "allow": (r"^scripts/doctrine/doctrine-check\.py$",),
        "fix": "NOT the real project and likely malware. Real: github.com/morluto/rea via 'npx -y rea-agents mcp'. "
               "Never download a ZIP for it. Delete the reference.",
    },
    {
        # Usernames differ per node: joshl on Sabretooth, joshi on T5500,
        # NSFW_BOTS on Alienware. A literal path works on one box and silently
        # breaks on the others.
        "name": "hardcoded-user-path",
        "source": ("docs/memory-layer/agent-workflow-graphy.json", ".agents/harness-config/hermes.yaml"),
        "patterns": [r"C:\\\\Users\\\\joshl\b", r"C:\\Users\\joshl\b",
                     r"C:\\\\Users\\\\joshi\b", r"C:\\Users\\joshi\b",
                     r"C:\\\\Users\\\\NSFW_BOTS\b", r"C:\\Users\\NSFW_BOTS\b",
                     r"/Users/joshl\b", r"/Users/joshi\b"],
        "allow": (r"^ops/runbook/PROTECTED-CHANGELOG\.md$", r"^ops/handoffs/.*$",
                  r"^archive/.*$", r"^scripts/doctrine/doctrine-check\.py$"),
        "fix": "Usernames differ per node (joshl / joshi / NSFW_BOTS). Use $env:USERPROFILE or ~ instead.",
    },
]

# The gate never inspects itself: baseline.json necessarily contains the very
# strings the rules ban, because it lists the files that contain them.
SKIP = re.compile(r"(^|/)(node_modules|dist|build|\.next|vendor)/"
                  r"|^scripts/doctrine/"
                  r"|\.(min\.|lock$|png$|jpg$|jpeg$|gif$|webp$|ico$|pdf$|zip$|mp4$|woff2?$)")


REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _literal_hint(pat):
    if "|" in pat:
        return None
    s = re.sub(r"\\(.)", lambda m: m.group(1) if m.group(1) in ".:/-_\\' " else "\0", pat)
    s = re.sub(r"\[[^\]]*\]|\{[0-9,]+\}|[\^\$\*\+\?\(\)]", "\0", s)
    parts = [p for p in s.split("\0") if len(p) >= 3]
    return max(parts, key=len) if parts else None


def tracked():
    out = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    ).stdout
    return [f for f in out.split("\0") if f and not SKIP.search(f)]


def load_baseline():
    f = os.path.join(os.path.dirname(os.path.abspath(__file__)), "baseline.json")
    if not os.path.exists(f):
        return set()
    with open(f, encoding="utf-8", errors="replace") as fp:
        return {(e["fact"], e["file"]) for e in json.load(fp)["entries"]}


def main():
    os.chdir(REPO_ROOT)
    files, failures = tracked(), []
    baseline = load_baseline()
    compiled = [
        (
            fact,
            [(_literal_hint(p), re.compile(p)) for p in fact["patterns"]],
            [re.compile(a) for a in fact["allow"]],
        )
        for fact in FACTS
    ]
    for f in files:
        active = []
        for fact, pats, allow in compiled:
            if f in fact["source"] or any(a.match(f) for a in allow):
                continue
            if (fact["name"], f) in baseline:
                continue
            active.append((fact, pats))
        if not active:
            continue
        try:
            with open(f, encoding="utf-8", errors="replace") as fp:
                body = fp.read()
        except OSError:
            continue
        for fact, pats in active:
            for hint, p in pats:
                if hint is not None and hint not in body:
                    continue
                for m in p.finditer(body):
                    line = body.count("\n", 0, m.start()) + 1
                    failures.append((fact["name"], f, line, m.group(0), fact["fix"]))

    if not failures:
        print(f"doctrine-check: clean ({len(baseline)} known pre-existing, see baseline.json)", flush=True)
        return 0
    failures.sort(key=lambda x: (x[0], x[1], x[2]))
    print(f"doctrine-check: {len(failures)} violation(s)\n", flush=True)
    for name, f, line, hit, fix in failures:
        print(f"  [{name}] {f}:{line}  found {hit!r}\n      fix: {fix}")
    print("\nA settled fact lives in one file. Everything else points at it.", flush=True)
    return 1


if __name__ == "__main__":
    sys.exit(main())
