# Node Balancer

Small first-party reverse proxy for T5500 node-pool routing.

- Default port: `4180`
- Config: `ops/mission-control/node-pool.json`
- Health: `GET /health`
- Routes: `GET /routes`

This is intended for stateless public surfaces only. Do not use it for Mission
Control authority, Agent Hub writes, databases, payment webhooks, or memory
doctrine.
