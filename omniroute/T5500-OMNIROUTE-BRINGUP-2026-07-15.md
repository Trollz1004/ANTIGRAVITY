# RETIRED — do not deploy OmniRoute on T5500

This 2026-07-15 bring-up instruction is superseded.

Joshua is finishing OmniRoute on the Windows laptop control plane. T5500 is a
remote execution/date-app node and must not receive another OmniRoute dashboard,
provider database, or copy of the laptop configuration.

Do **not** run the old Docker build, Compose, login, or provider-key steps that
previously appeared in this file. Do **not** hard-code a temporary Cloudflare
Quick Tunnel URL in a T5500 task or config.

Use the replacement runbook:

`docs/runbooks/T5500-CONTROL-PLANE-TARGET-BOOTSTRAP.md`

The replacement documents the verified live state, the disabled unsafe
`NodeAgent-T5500` task, the SSH-only bootstrap, and the gated steps that may run
only after Joshua says the laptop OmniRoute setup is complete.
