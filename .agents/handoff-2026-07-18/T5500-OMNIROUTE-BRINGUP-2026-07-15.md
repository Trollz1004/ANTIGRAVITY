# T5500 — BRING OMNIROUTE DASHBOARD UP (stop at login)
Issued by first-party Claude via Josh. Goal: get the OmniRoute web UI serving in a browser on T5500 so Josh can log in and configure the combo/keys/floor by hand (same as Sabretooth). **This does NOT configure the gate and does NOT touch Sabretooth.** Bring it up, prove the dashboard responds, hand back the URL. Stop.

## HARD RULES
- Do **not** stop, kill, or reconfigure anything on Sabretooth (192.168.0.8). Its gate stays up as fallback.
- Never elevated. Never commit `.env.docker` or any secret. If omniroute source is inside the repo tree, confirm `.env.docker` is gitignored BEFORE any `git add`.
- No mock success. "Up" means an HTTP request to the dashboard returned real HTML, not that a port is listening.
- Bounded: 3 build/up→check cycles, then write what failed and stop. Hard stop 45 min.

## PRECHECK
```
docker --version && docker compose version         # daemon + compose present
docker ps                                          # what's already running
cd C:\ANTIGRAVITY\omniroute                         # migrated source must be here
dir                                                 # confirm Dockerfile, docker-compose.yml, .env.docker present
```
If `C:\ANTIGRAVITY\omniroute` is missing or empty → STOP, report "source not migrated yet." Nothing else to do until the copy from Sabretooth `C:\paperclip\omniroute` lands.

## SECRET-BEFORE-COMMIT GUARD (do this before any git touch)
```
git check-ignore .env.docker        # MUST print the path (=ignored). If it prints nothing:
                                    #   echo .env.docker>> .gitignore   (then re-check)
git status --porcelain | findstr /I ".env.docker"   # MUST return nothing
```
Do not proceed to any `git add` until `.env.docker` is confirmed ignored.

## ENV SANITY (values stay in the file — do NOT echo secret values back)
Confirm the KEYS exist in `.env.docker` without printing their values:
```
findstr /B /C:"JWT_SECRET=" /C:"API_KEY_SECRET=" /C:"INITIAL_PASSWORD=" /C:"OPENROUTER_API_KEY=" .env.docker
```
Report only which keys are PRESENT vs MISSING (mask everything after `=`). If `INITIAL_PASSWORD` is empty the first-run login won't work — flag it, Josh sets it.

## BRING IT UP
```
docker compose build omniroute
docker compose up -d
docker compose ps                    # omniroute + redis should be Up/healthy
docker compose logs --tail=40 omniroute   # look for "listening"/"ready"/bound-port lines
```
If the container exits or restarts: capture the last 40 log lines, that's the failure evidence — report it, don't loop more than 3 times.

## PROVE THE DASHBOARD SERVES (the actual goal)
```
curl -s -o NUL -w "dashboard 20128 -> %{http_code}\n" http://127.0.0.1:20128
curl -s -o NUL -w "api 20129 -> %{http_code}\n"       http://127.0.0.1:20129/v1/models
curl -s http://127.0.0.1:20128 | findstr /I "omniroute login sign html"   # proves real HTML, not a blank 200
```
A dashboard that returns 200 **and** HTML containing a login/app marker = success. Note WHICH port serves the web login vs which serves `/v1/*` — Josh needs the right URL.

## BINDING CHECK
```
netstat -ano | findstr ":20128 :20129"   # confirm 127.0.0.1 bound (not 0.0.0.0 exposed to LAN)
```
Gate/UI should bind localhost only on T5500 for now.

## RESPOND BACK EXACTLY
```
PRECHECK: source present? Y/N · docker/compose OK? Y/N
GITIGNORE: .env.docker ignored? Y/N
ENV KEYS: JWT_SECRET / API_KEY_SECRET / INITIAL_PASSWORD / OPENROUTER_API_KEY = PRESENT|MISSING (values masked)
CONTAINERS: omniroute <state> · redis <state>
DASHBOARD: http://127.0.0.1:<port> -> <code>, HTML marker found? Y/N
API PORT: http://127.0.0.1:<port>/v1/models -> <code>
BINDING: 127.0.0.1 only? Y/N
>> LOGIN URL FOR JOSH: http://127.0.0.1:<port>
BLOCKERS: [list or NONE]
```
Then STOP. Josh logs in at that URL and configures the combo, keys, and 20% floor by hand — the same build he did on Sabretooth. Configuration is not your job in this prompt.
