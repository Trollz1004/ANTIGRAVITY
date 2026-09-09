# Orbital Studio — STAGED, NOT INTEGRATED

Source: Gemini AI Studio session "GEMINI / CLAUDE / CEO's / HERMES AGENT tasks",
delivered by Joshua 2026-08-22, judge-reviewed at staging level only. The prize
is `components/Graphy.tsx` — the 3D orbital knowledge-graph / AFK stream
screensaver ("motion causes emotion"). Joshua explicitly wants this design.

## Known drift (Gemini's self-audit said NO DRIFT; judge scan found this)

- `Graphy.tsx` presents "T5500 (192.168.0.15): COMMAND POST · push-to-main
  authority" — retired IP, false authority. T5500 is the FUTURE Dream Online
  server, not a command post; the only push authority is the judge lane.
- Node/edition claims in the HUD are Gemini's guesses, not telemetry.
- Built for its own Vite app (`:3000`), own `api.ts`/`types.ts` forks (older
  base than mission-control-v5). Server-side forks were deliberately NOT staged
  — repo versions are newer and canonical.
- `MissionControlPipeline.tsx` had a hardcoded OmniRoute VS Code token —
  REDACTED at staging; the live token is rotated.

## Integration task (for the FreeBuff → harness → judge pipeline)

Extract the Graphy/screensaver engine into mission-control-v5's client as the
GRAPHY tab upgrade + `[S]` screensaver: reconcile imports to the v5 client's
types/api, remove the icon-library dependency or vendor it, scrub the drift
above, keep node claims honest (read /api/services instead of hardcoding).
Gate must stay green. Packet to a judge; only the judge lands it.
