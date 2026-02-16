# DECISIONS LOG — WHY WE DID WHAT WE DID

**Last Updated**: 2026-02-14T08:30:00Z

Every architectural decision is recorded here so no future session re-debates it.

---

## 2026-02-14: Switch AI from Gemini to Claude

**Decision**: Replace Gemini SDK with Claude API in the dashboard  
**Why**: Gemini SDK 300 free credits exhausted. Joshua has Claude Max subscription (unlimited).  
**Impact**: geminiService.ts needs Claude equivalent, or simulation mode stays active  
**Status**: In progress

## 2026-02-14: Replace OpenClaw with custom code

**Decision**: ~~REVERSED~~ — OpenClaw stays. It has built-in memory and 200k+ users.  
**Original concern**: Auth profile format deprecated in v2026.2.13  
**Reversal reason**: OpenClaw already solves the memory problem. Building custom memory on top of Claude Code CLI was unnecessary overhead when OpenClaw's memory works. The auth issue can be fixed; the tool itself is solid.  
**Status**: OpenClaw STAYS. Fix auth if broken, don't replace.

## 2026-02-14: Build persistent memory-bank system

**Decision**: Create `memory-bank/` directory with structured context files  
**Why**: THE ROOT CAUSE of 12 days wasted + 4 duplicate apps. Claude has no memory after context window. Every new session starts blank. Joshua has rebuilt the same dating app 4 times because Claude forgot where things were.  
**Impact**: CLAUDE.md now references memory-bank/. Every session auto-loads full context.  
**Status**: Building now

## 2026-02-13: Node wipe and consolidation  

**Decision**: Factory reset all 3 nodes to marketing-only, preserve vault + OPUSONLY  
**Why**: Too many stale configs, broken services, zombie processes across nodes  
**Impact**: Clean slate on each machine. Scripts in D:\OPUSONLY\scripts\ handle re-setup  
**Status**: 9020 and T5500 wiped. SABRETOOTH last (after DNS verified)

## 2026-02-10: Migrate from GCP to AWS

**Decision**: Move backend from Cloud Run to AWS EC2  
**Why**: GCP project `ai-collab4kids` had issues (initially thought banned — CONFIRMED NOT BANNED). Migrated to AWS as backup.  
**Impact**: Backend now on BOTH 3.84.226.108 (AWS) AND Cloud Run (GCP). PEM key recovered from Antigravity history.  
**Status**: Both backends available. DNS still broken (pointing to old Railway URLs). GCP Cloud Run + Cloud SQL are ACTIVE.

## 2026-02-07: DAO smart contracts deployed

**Decision**: Deploy perpetual DAO on Base Mainnet  
**Why**: Ensure mission survives regardless of what happens to Joshua  
**Impact**: 60/30/10 split enforced by smart contract, not humans  
**Status**: Deployed and locked

## Earlier: Dual-purpose index.html

**Decision**: Landing page + React SPA in same index.html  
**Why**: Quick MVP — static landing page with pre-order modal + dashboard in one file  
**Impact**: Unconventional but works. Don't separate them unless deploying landing page independently.  
**Status**: Working

## Earlier: Tailwind via CDN only

**Decision**: No tailwind.config, no PostCSS, no local install  
**Why**: Fastest path to styled components. No build tooling overhead.  
**Impact**: Cannot customize Tailwind theme via config. Use inline styles for custom values.  
**Status**: Working — DO NOT change this
