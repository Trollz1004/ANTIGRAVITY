# Hermes Support Gateway

Support-only gateway intended for T5500 on port `9110`.

It is not a command center. It does not store a backlog. It forwards approved date-app support intake into Sabretooth Agent Hub.

## Endpoints

- `GET /health`
- `GET /adapters/health`
- `POST /support/session`

`/adapters/health` and `/support/session` require `SUPPORT_GATEWAY_API_KEY` or `NODE_WORKER_API_KEY` via `X-API-Key` or `Authorization: Bearer ...`.

## Required environment

- `AGENT_HUB_URL`, default `http://192.168.0.8:3130`
- `AGENT_HUB_API_KEY`
- `SUPPORT_GATEWAY_API_KEY` or `NODE_WORKER_API_KEY`
- `PORT`, default `9110`
- `NODE_NAME`, default `t5500`

No secret values belong in this repo.
