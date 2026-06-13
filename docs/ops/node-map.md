# Node Map

Canonical repo: `Trollz1004/ANTIGRAVITY`.

Current working branch for consolidation: `consolidate/one-repo-one-node`.

Runtime split is intentionally simple:

- Sabretooth: Hermes orchestration/control plane.
- 9020 (`192.168.0.5`): Business Exchange runtime on port 3050.
- T5500 (`192.168.0.15`): YouAndiNotAi static date-app runtime on port 3200.

The code lives in one repo. Remote worker nodes should not run extra Hermes gateways unless explicitly requested.
