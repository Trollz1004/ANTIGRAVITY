# Marketing Worker

Draft-only worker intended for 9020 on port `3120`.

It is not a command center. It does not store a local backlog. It only creates draft tasks in Sabretooth Agent Hub.

## Endpoints

- `GET /health`
- `GET /queue/status`
- `POST /draft-task`

`/queue/status` and `/draft-task` require `MARKETING_WORKER_API_KEY` or `NODE_WORKER_API_KEY` via `X-API-Key` or `Authorization: Bearer ...`.

## Required environment

- `AGENT_HUB_URL`, default `http://192.168.0.8:3130`
- `AGENT_HUB_API_KEY`
- `MARKETING_WORKER_API_KEY` or `NODE_WORKER_API_KEY`
- `PORT`, default `3120`
- `NODE_NAME`, default `9020`

The worker rejects draft briefs containing banned public-copy terms and marks every task `no_send` in the task description/tags.
