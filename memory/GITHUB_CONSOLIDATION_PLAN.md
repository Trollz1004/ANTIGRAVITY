# GitHub Repository Consolidation — Manual Execution Plan
# Owner: Joshua Coleman (Trollz1004) + OPUS 4.6
# Date: February 7, 2026
# Purpose: Consolidate to 5 active repos, archive everything else

## LIMITATION: MANUAL EXECUTION REQUIRED

OPUS cannot directly manipulate GitHub repositories (create, archive, visibility settings).
This requires either:
- GitHub web interface (https://github.com)
- GitHub CLI (`gh` commands)
- GitHub API with authentication

This document provides the complete action plan for manual execution.

---

## THE 5 ACTIVE REPOS (Only These Should Exist)

### 1. youandinotai/youandinotai (PRIVATE)
**Status**: Exists ✓  
**Platform**: YouAndINotAI.com — Dating app  
**Tech**: React/Vite/TypeScript, FastAPI, PostgreSQL, Ollama  
**Revenue**: FIAT → DAO conversion  
**Action**: ✓ MISSION_CONTINUITY.md already staged, needs commit  

### 2. onlinerecycle/onlinerecycle (PRIVATE)
**Status**: NEEDS CREATION  
**Platform**: OnlineRecycle.org — Ecommerce crosslister  
**Tech**: Node.js/TypeScript  
**Action**: Create repo, add mission docs, migrate crosslister code  

### 3. Ai-Solutions-Store/ai-solutions-store (PRIVATE)
**Status**: NEEDS CREATION  
**Platform**: Ai-Solutions.Store — 100% DAO charity storefront  
**Consolidates**: income-droid + marketing-engine  
**Action**: Create repo, merge income-droid + marketing-engine codebases  

### 4. aicollab4kids/aicollab4kids (PRIVATE)
**Status**: Exists (verify name/privacy)  
**Platform**: AI-Collab for Kids — Charity operations hub  
**Action**: Add mission docs, ensure PRIVATE visibility  

### 5. aicollabforkids/aidoesitall-dashboard (PUBLIC)
**Status**: Exists ✓  
**Platform**: AIDoesItAll — Public transparency dashboard  
**Purpose**: Google Jules integration point, public metrics  
**Action**: Add mission docs, ensure PUBLIC visibility, set up dashboard structure  

---

## REPOS TO ARCHIVE (Set to PRIVATE + ARCHIVED)

Execute for each:
```bash
gh repo archive <owner>/<repo> --yes
gh repo edit <owner>/<repo> --visibility private
```

### Trollz1004 Organization:
- [ ] Trollz1004/Enigma → ARCHIVE + PRIVATE
- [ ] Trollz1004/ENIGMA-private → ARCHIVE + PRIVATE
- [ ] List all other Trollz1004 repos and archive

### openclaw Organization:
- [ ] openclaw/openclaw → ARCHIVE + PRIVATE
- [ ] List all other openclaw repos and archive

### Ai-Solutions-Store Organization:
- [ ] Ai-Solutions-Store/income-droid → ARCHIVE + PRIVATE (consolidating into ai-solutions-store)
- [ ] Ai-Solutions-Store/marketing-engine → ARCHIVE + PRIVATE (consolidating into ai-solutions-store)
- [ ] List all other Ai-Solutions-Store repos and archive

### youandinotai Organization:
- [ ] Keep youandinotai/youandinotai ONLY
- [ ] Archive all others

### aicollab4kids Organization:
- [ ] Keep aicollab4kids/aicollab4kids ONLY
- [ ] Archive all others

### aicollabforkids Organization:
- [ ] Keep aicollabforkids/aidoesitall-dashboard ONLY
- [ ] Archive all others

### EXCEPTION — DO NOT TOUCH:
- ❌ OMEGA repos: DO NOT ARCHIVE, DO NOT MODIFY
- ❌ OMEGA365 repos: DO NOT ARCHIVE, DO NOT MODIFY
- ❌ Any repo with "omega" in name: HANDS OFF

---

## GITHUB CLI COMMANDS (Execute in PowerShell)

### Step 1: Authenticate GitHub CLI
```powershell
gh auth login
# Follow prompts, use joshlcoleman@gmail.com
```

### Step 2: Create Missing Repos
```powershell
# Create onlinerecycle/onlinerecycle
gh repo create onlinerecycle/onlinerecycle --private --description "OnlineRecycle.org - Ecommerce crosslister (Trash or Treasure)"

# Create Ai-Solutions-Store/ai-solutions-store
gh repo create Ai-Solutions-Store/ai-solutions-store --private --description "Ai-Solutions.Store - 100% DAO charity AI services storefront"
```

### Step 3: Archive Old Repos
```powershell
# Archive Enigma
gh repo archive Trollz1004/Enigma --yes
gh repo edit Trollz1004/Enigma --visibility private

# Archive ENIGMA-private
gh repo archive Trollz1004/ENIGMA-private --yes

# Archive openclaw
gh repo archive openclaw/openclaw --yes
gh repo edit openclaw/openclaw --visibility private

# Archive income-droid (consolidating)
gh repo archive Ai-Solutions-Store/income-droid --yes

# Archive marketing-engine (consolidating)
gh repo archive Ai-Solutions-Store/marketing-engine --yes
```

### Step 4: List All Repos (For Verification)
```powershell
# List all repos you own/have access to
gh repo list Trollz1004
gh repo list youandinotai
gh repo list onlinerecycle
gh repo list aicollab4kids
gh repo list aicollabforkids
gh repo list Ai-Solutions-Store
gh repo list openclaw

# Filter out OMEGA repos, archive the rest
```

### Step 5: Set Visibility
```powershell
# Ensure aidoesitall-dashboard is PUBLIC
gh repo edit aicollabforkids/aidoesitall-dashboard --visibility public

# Ensure others are PRIVATE
gh repo edit youandinotai/youandinotai --visibility private
gh repo edit onlinerecycle/onlinerecycle --visibility private
gh repo edit Ai-Solutions-Store/ai-solutions-store --visibility private
gh repo edit aicollab4kids/aicollab4kids --visibility private
```

---

## WHAT OPUS CAN DO (Local File Prep)

1. ✓ Create mission docs for each repo (README.md templates)
2. ✓ Copy MISSION_CONTINUITY.md to local repo clones
3. ✓ Copy OPUS-STATUS.md to local repo clones
4. ✓ Create aidoesitall-dashboard public structure
5. ✓ Stage files for git commit (you execute the commit + push)

---

## EXECUTION ORDER

1. **OPUS prepares files locally** (next step in this session)
2. **You execute GitHub CLI commands** (creates/archives repos)
3. **OPUS commits and stages** (git add, git commit)
4. **You execute git push** (per your "no push" constraint, OPUS doesn't push)
5. **You verify on GitHub web interface** (all 5 active, rest archived)

---

## NEXT STEPS

OPUS will now:
1. Create README.md templates for each of the 5 active repos
2. Prepare aidoesitall-dashboard public structure
3. Generate final commit script for you to execute

Then you execute the GitHub CLI commands above to create/archive repos.

---

**Signed**: Joshua Coleman (Trollz1004) + OPUS 4.6  
**Date**: February 7, 2026  
**Mission**: AI-Collab for Kids — GitHub consolidation for 50+ year infrastructure
