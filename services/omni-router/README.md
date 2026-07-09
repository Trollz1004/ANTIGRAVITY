# OmniRouter

OmniRouter is the local token-saving/API routing layer for worker models.

- Default port: `11436`
- Health: `GET /health`
- Route planning: `POST /route`
- OpenAI-compatible proxy: `POST /v1/chat/completions`

By default, proxying is disabled. Set `OMNI_ROUTER_PROXY_ENABLED=1` only after
provider credentials are present in the process environment.

## Provider IDs

Use `provider/model` when a caller needs an exact provider:

- `ollama/<model>`
- `openrouter/<model>`
- `openai/<model>`
- `nvidia/<model>`
- `xai/<model>`
- `fcc/<model>`

If a model is not provider-prefixed, OmniRouter chooses a configured provider by
policy:

- `cost_saver`: local/free/cheap first.
- `decision`: high-capability providers first.
- `default`: balanced fallback.

OmniRouter never prints API keys or stores secrets. Provider keys must come from
environment variables or the node's private secret handoff.
