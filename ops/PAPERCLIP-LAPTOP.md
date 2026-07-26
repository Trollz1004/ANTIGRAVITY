# Laptop Paperclip → clean repo

## Purpose

One Paperclip instance on this laptop bound to **only**:

| | |
|--|--|
| **GitHub** | https://github.com/Trollz1004/clean |
| **Local cwd** | `E:\clean` |
| **Branch** | **`main` only** |
| **API/UI** | `http://127.0.0.1:3120` |
| **Data dir** | `E:\clean\.paperclip-laptop` |

Not ANTIGRAVITY. Not multi-branch.

## One branch policy

- Default branch: `main`
- Do not create feature branches in this workspace unless Josh explicitly asks
- Paperclip agents should commit/push to `main` only on this repo

## Start (Windows / git-bash)

```bash
# Prefer explicit config path (avoids C:\c\ path rewrite)
paperclipai run --config 'E:\clean\.paperclip-laptop\instances\default\config.json'
```

Or:

```bash
paperclipai run -d 'E:\clean\.paperclip-laptop'
```

## Health

```bash
curl -sS http://127.0.0.1:3120/api/health
```

Expect JSON `status: ok`.

## First company/workspace (after server is up)

Create company in UI or CLI, then attach workspace:

- `sourceType`: `git_repo`
- `cwd`: `E:\clean`
- `repoUrl`: `https://github.com/Trollz1004/clean.git`
- `defaultRef` / branch: `main`

## Ports

| Service | Port |
|---------|------|
| Paperclip clean | **3120** |
| Embedded Postgres | **54350** |

Legacy ANTIGRAVITY laptop Paperclip stays on 3100/3101 if still running — do not mix.
