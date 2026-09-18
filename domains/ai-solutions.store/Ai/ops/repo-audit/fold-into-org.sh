#!/usr/bin/env bash
###############################################################################
#  DO NOT RUN THIS SCRIPT.
#
#  This is a PROPOSAL produced by a read-only audit (see
#  ops/repo-audit/2026-09-03-trollz1004-consolidation-audit.md). It is NOT
#  executed, has never been executed, and must not be run by anyone except
#  the official judge lane, and only after Joshua has explicitly reviewed and
#  approved the plan below.
#
#  Per repo rules: the judge lane alone pushes, merges, deletes, or archives
#  branches/repos (Rule 5). Creating a new org repo, subtree-adding history
#  into it, and archiving source repos are all Rule-5 actions.
#
#  BLOCKED repos below carry real secrets or a documented live key. Rotation
#  must happen BEFORE `git filter-repo` runs, and `git filter-repo` must run
#  BEFORE any of those repos are folded anywhere. Folding a repo with live
#  credentials still in its history — even into a private/org repo — does not
#  make the exposure go away, it just moves it.
###############################################################################
set -euo pipefail

ORG="Ai-Solutions-Store"
NEW_REPO="ai-solutions"
NEW_REPO_FULL="${ORG}/${NEW_REPO}"

echo "=========================================================================="
echo " THIS SCRIPT IS NOT EXECUTED. Judge lane only. Joshua approval required."
echo "=========================================================================="
read -p "Type EXACTLY 'I AM THE JUDGE LANE AND JOSHUA APPROVED THIS' to continue: " CONFIRM
if [ "$CONFIRM" != "I AM THE JUDGE LANE AND JOSHUA APPROVED THIS" ]; then
  echo "Confirmation not given. Exiting without doing anything."
  exit 1
fi

###############################################################################
# (a) Create the new org repo
###############################################################################
gh repo create "${NEW_REPO_FULL}" \
  --private \
  --description "Ai-Solutions.Store — SaaS company types, business-exchange marketplace, and automations sold on ai-solutions.store" \
  --clone

cd "${NEW_REPO}"
git commit --allow-empty -m "chore: initialize ${NEW_REPO_FULL}

Consolidation target per ops/repo-audit/2026-09-03-trollz1004-consolidation-audit.md.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push origin main

###############################################################################
# (b) FOLD candidates — clean of secrets and banned language, preserve history
#     via git subtree. Run each from inside the ${NEW_REPO} working copy.
###############################################################################

# --- llc-crosslisting-os -> prefix crosslisting-os -----------------------
# NOTE: drift found — the live repo has 161 tracked files; the copy already
# folded into ANTIGRAVITY/apps/crosslisting-os has only 43. Resolve which
# copy is canonical BEFORE running this, or you will fold a stale snapshot.
git subtree add --prefix=crosslisting-os \
  https://github.com/Trollz1004/llc-crosslisting-os main

# --- revenue-first-products (org) -> prefix revenue-catalog ----------------
# Already folded into ANTIGRAVITY/archive/folded-repos/ too — this is a
# second, org-scoped copy for the ai-solutions.store product catalog, not a
# duplicate-avoidance conflict.
git subtree add --prefix=revenue-catalog \
  https://github.com/Ai-Solutions-Store/revenue-first-products main

# --- OPTIONAL, PENDING JOSHUA CONFIRMATION ---------------------------------
# crm/ and mission-control-v5/ already live inside ANTIGRAVITY itself
# (root-level directories, not separate GitHub repos in practice — the GitHub
# copies are frozen mirrors). If Joshua wants a business-facing copy of
# either inside ai-solutions, subtree-add from the local ANTIGRAVITY checkout
# instead of GitHub, e.g.:
#
#   git subtree add --prefix=crm-template ../ANTIGRAVITY main --squash \
#     -- (this needs a filtered history extraction of just crm/, e.g. via
#        `git subtree split --prefix=crm` run inside a clone of ANTIGRAVITY
#        first, then push that split branch somewhere subtree add can reach)
#
# Left commented out — do not run without an explicit decision on which
# directory (crm vs mission-control-v5) belongs in a public-facing product
# repo, since ANTIGRAVITY's own root copies may carry internal-only content.

###############################################################################
# (c) BLOCKED repos — must be scrubbed with git filter-repo BEFORE any fold.
#     None of these commands are run by this script. They are the exact
#     invocations the judge lane needs once Joshua has rotated the
#     corresponding credentials.
###############################################################################

cat <<'BLOCKED'

------------------------------------------------------------------------------
BLOCKED — rotate first, purge second, in this order:
------------------------------------------------------------------------------

1) Trollz1004/sabretooth-hermes-backup
   143 secret-pattern hits: stripe_live (3), github_pat_classic (35),
   xai_key (3), square_token (5), jwt (5), postgres_uri_creds (26),
   openai_env_assign (58), anthropic_key (8). Private repo, 97 MB, 27 commits
   of daily snapshots 2026-05-17..2026-06-16.
   AFTER Joshua rotates the Stripe live key, the GitHub PAT, the xAI key, the
   Square token(s), and the OpenAI/Anthropic keys implicated:

     git clone --mirror https://github.com/Trollz1004/sabretooth-hermes-backup sabretooth-scrub.git
     cd sabretooth-scrub.git
     git filter-repo --invert-paths \
       --path-glob '*/hermes-workspace/electron/server-bundle.cjs' \
       --path-glob '*/skills/mcp/native-mcp/SKILL.md' \
       --path-glob '*/auth.json' \
       --path-glob '*/.env.example' \
       --path-glob '*/assets/mcp-presets.seed.json' \
       --path-glob '*/briefings/*'
     # Review what remains before pushing anywhere. This blast-removes files
     # rather than redacting values in place, which is the safer default for
     # a private backup repo nobody needs byte-identical.

2) Trollz1004/income-engine
   3 secret-pattern hits (github_oauth, postgres_uri_creds) in
   manus-gui-extract/, PLUS a committed raw PostgreSQL data directory
   (paperclip-data/instances/default/db/**) that should never have been
   version-controlled.

     git clone --mirror https://github.com/Trollz1004/income-engine income-engine-scrub.git
     cd income-engine-scrub.git
     git filter-repo --path paperclip-data --invert-paths
     git filter-repo --path manus-gui-extract/INCOME_ENGINE_GITHUB.md --invert-paths
     git filter-repo --path manus-gui-extract/CLAUDE.md --invert-paths
     git filter-repo --path manus-gui-extract/INCOME_ENGINE_ENV.example --invert-paths

3) Trollz1004/MANUS-Has-Hands
   Confirmed credential dump: joshua's.md.env.leave it alone.text,
   SECRETS_CHECKLIST.md, CF-TOKEN-ROTATION.md, plus 176 banned-language guard
   hits (see archive/absorbed-repos-2026-08-26/README.md). This repo also
   fails the language ban independent of secrets — recommend NOT folding even
   after a filter-repo pass; leave archived and private indefinitely.

     git clone --mirror https://github.com/Trollz1004/MANUS-Has-Hands manus-scrub.git
     cd manus-scrub.git
     git filter-repo --invert-paths \
       --path "joshua's.md.env.leave it alone.text" \
       --path SECRETS_CHECKLIST.md \
       --path CF-TOKEN-ROTATION.md \
       --path OPENCLAW-CLAUDE-REMOTE-SETUP.md

4) Ai-Solutions-Store/EMERGENT-if-self-hosted-EMERGENT-GETS-CREDIT-AND-FREEM-BRANDING-MANDATORY-
   Documented live EMERGENT_LLM_KEY (sk-emergent-... prefix) in
   EMERGENT/memory/EMERGENT_JOURNAL.md per
   archive/absorbed-repos-2026-08-26/README.md. Also 6 banned-language guard
   hits — do not fold even after scrubbing; archive in place instead.

     git clone --mirror https://github.com/Ai-Solutions-Store/EMERGENT-if-self-hosted-EMERGENT-GETS-CREDIT-AND-FREEM-BRANDING-MANDATORY- emergent-scrub.git
     cd emergent-scrub.git
     git filter-repo --path memory/EMERGENT_JOURNAL.md --invert-paths

------------------------------------------------------------------------------
BLOCKED

###############################################################################
# (d) Archive commands — run ONLY after (b) folds are verified and (c)
#     rotations are confirmed done by Joshua. These target GitHub, not local
#     disk, and are Rule-5 judge-lane actions.
###############################################################################

cat <<'ARCHIVE'

------------------------------------------------------------------------------
Archive commands (judge lane, after everything above is confirmed):
------------------------------------------------------------------------------

# Duplicate of Trollz1004/llc-crosslisting-os — drop the org mirror once the
# personal repo's content is confirmed canonical and folded:
gh repo archive Ai-Solutions-Store/llc_crosslisting_os --yes

# Empty stubs (README-only, zero unique content):
gh repo archive Trollz1004/DREAM-ONLINE-MMORPG-PvP-OPENWORLD-OR-OPEN-DREAM- --yes
gh repo archive "Trollz1004/Electrician-who-lies-i-KNIOW-CODE-ELECTRICAL-CODE---ForTheKIDS-2" --yes
gh repo archive Ai-Solutions-Store/Antigravity-Ai-HAVE-a-HEART-BEATS-SOL-MUSIC-24-7-SOUNDRACK-v1 --yes

# Already fully covered elsewhere in ANTIGRAVITY or its archive/ tree, or
# already archived on GitHub and confirmed zero-drift:
#   Trollz1004/saas-microservices        (already archived; DROP, no unique content)
#   Trollz1004/SIDE-WORK                 (already archived; documented stale twin of EMERGENT)
#   Trollz1004/9020-hermes-backup        (already archived; 0 commits)
#   Trollz1004/t5500-hermes-backup       (already archived; 0 commits)
#   Trollz1004/ai-marketplace-grok-production  (already archived; already folded)
#   Ai-Solutions-Store/revenue-first-products  (already archived; already folded)
#   Trollz1004/antigravity-dashboard     (already archived; already folded)
# No action needed for these — listed here only so the judge lane sees the
# full board in one place.

# NOT to be archived / touched — standing exceptions:
#   Trollz1004/youandinotai-links   — LIVE GitHub Pages (verified 200)
#   Trollz1004/youandinotai-join    — LIVE GitHub Pages (verified 200)
#   Trollz1004/Trollz1004           — GitHub profile README, must keep exact name
#   Trollz1004/dream-online         — the game keeper repo
#   Trollz1004/ANTIGRAVITY          — the monorepo keeper (out of scope here)
#   Trollz1004/mission-control-v5   — covers vote-engine + role-wall per the
#                                      2026-08-26 coverage ruling; content is
#                                      already mirrored into ANTIGRAVITY root
#   Trollz1004/command-center       — banned-language block, archive-in-place
#                                      already correct, but do not delete
#   Trollz1004/OpenclawDash         — same, banned-language block
#   Trollz1004/ANTIGRAVITYclip      — same, banned-language block
#   Trollz1004/ANTIGRAVITY-v2       — 184 agency-* skills, handled via
#                                      .agents/skills/README.md, not this flow

------------------------------------------------------------------------------
ARCHIVE

echo "Done printing the plan. Nothing above was executed automatically beyond"
echo "the confirmed org-repo creation and the two clean subtree folds in (b)."
