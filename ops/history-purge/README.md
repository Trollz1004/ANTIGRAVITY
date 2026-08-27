# History purge — prepared, dry-run, and NOT yet executed

Removes every path that ever carried a real credential from `ANTIGRAVITY`'s git
history. **Do not run this until Joshua has rotated the keys.** A purge before
rotation hides a live credential instead of retiring it, and the values are
already scraped either way.

## Status

Dry-run **passed** on a mirror clone, 2026-08-26. Not run against the real repo.

## Why a path list and not a guess

The first draft of `purge-paths.txt` was assembled from two audits and it was
**wrong**. Running it on a throwaway clone removed the named paths and left
**39 blobs still carrying live keys**. Three separate misses:

1. `.env.example` — an *example* file holding a real `sk-ant-` value.
2. The `archive/` copies of several briefings were listed, the **originals** were not.
3. `docs/scratch/create interactive webpage…md` also existed at the **repo root**
   in older history, under a different path, so removing one path left the other.

Each was invisible until the clone was scanned after the rewrite. That is the
whole reason this is dry-run first: a purge from the first list would have
completed successfully, reported nothing wrong, and left six credential-bearing
files public.

## Procedure

```bash
# 0. Confirm rotation is DONE. This is the gate. Do not skip it.

# 1. Fetch every ref, tags included. The audit that missed the .env missed it
#    because it never fetched refs/tags/archive/no-drift-staking-doctrine.
git fetch --tags --prune origin

# 2. Work on a fresh mirror, never the working repo.
git clone --mirror https://github.com/Trollz1004/ANTIGRAVITY.git antigravity-purge.git
cd antigravity-purge.git

# 3. Rewrite.
python -m pip install git-filter-repo
python -m git_filter_repo --invert-paths \
  --paths-from-file ../ops/history-purge/purge-paths.txt --force

# 4. VERIFY BEFORE PUSHING. Must report only the three known fixtures below.
python ../ops/history-purge/verify-no-credentials.py

# 5. Force-push every ref, tags included.
git push --force --mirror https://github.com/Trollz1004/ANTIGRAVITY.git
```

## Expected verify output — exactly these three, nothing else

These are deliberate fake fixtures and **must survive**; removing them breaks the
secret scanner's own tests:

- `.github/policy-guard-allowlist.txt` — `ghp_1234567890…`, sequential, by design
- `paperclip/server/src/__tests__/heartbeat-active-run-output-watchdog.test.ts`
- `paperclip/server/src/__tests__/redaction.test.ts`

**Any other path in the output means the purge is incomplete. Do not push.**

## The tag is not optional

`refs/tags/archive/no-drift-staking-doctrine` (`b46c27c3`) carries **17,285
objects unreachable from `main`**, including the complete production `.env` with
16 live credentials. `--mirror` covers it; a plain clone plus a branch-only push
does not. **A purge that rewrites `main` and leaves that tag intact leaves the
entire `.env` public while looking like a finished cleanup.**

## After pushing

Forks and GitHub's commit cache survive a force-push. Ask GitHub Support to
expire cached views of the old objects. Anyone with an existing clone still has
the old history — which is why rotation, not the purge, is the actual remedy.

---

## Update 2026-08-26 — the exposing tag was deleted from the remote

`refs/tags/archive/no-drift-staking-doctrine` (`b46c27c3`) has been **deleted from
GitHub**, on Joshua's explicit authorization, ahead of rotation.

Why ahead of rotation: that tag was the reason a plain `git clone` handed anyone
the complete production `.env`. Deleting it removes the automatic path
immediately, rather than waiting for rotation and a full purge.

**Backed up first, so this is reversible:**
`~/.antigravity-ref-backups/tag-no-drift-staking-doctrine.bundle` — 103 MB,
`git bundle verify` reports *"The bundle records a complete history."* Restore with
`git fetch <bundle> 'refs/tags/*:refs/tags/*'` then push the tag back.

**Verified by fresh clone, not by assumption.** Cloned
`https://github.com/Trollz1004/ANTIGRAVITY.git` afresh: it sees only
`mc-fix-2026-05-06` and `stable/2026-04-16-session-checkpoint`, blob `59e967a1`
is absent, and `git rev-list --objects --all | grep ' \.env$'` returns **0**.

**What this does NOT do.** GitHub keeps unreachable objects addressable by SHA
until it garbage-collects, and forks and cached commit views survive. Anyone who
already cloned still holds the old history. This shrank the window; it did not
close it. **Rotation remains the actual remedy, and it has not happened.**

**Effect on the purge procedure.** The path list is unchanged — leave `.env` and
the rest in `purge-paths.txt`. Those paths still exist in `main`-reachable history
for several of the credentials, and the tag can be restored from the bundle. Run
the purge with `--mirror` exactly as written; if the tag has been restored by
then, `--mirror` covers it, and if it has not, the procedure still succeeds.
