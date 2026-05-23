# ClawX 6-AI Council Integration for ANTIGRAVITY

This document describes the integration of the ClawX 6-AI Council into the ANTIGRAVITY backend, focusing on API key management, endpoint configuration, and security considerations.

## Overview

The ClawX integration provides a secure and manageable way to interact with the external ClawX 6-AI Council service. This service aggregates responses from six distinct AI agents for joint deliberation. The integration includes:

- **Secure API Key Management**: API keys for individual AI agents are stored securely via environment variables and never hardcoded.
- **Key Validation**: Basic format validation for API keys.
- **Key Rotation**: Endpoints to dynamically rotate API keys for agents.
- **Load Balancing**: Round-robin key selection for distributing requests across agents.
- **Health Checks**: Connectivity checks to the ClawX service.
- **FastAPI Endpoints**: A dedicated router to manage and monitor the integration.

## Configuration

The ClawX integration is configured through environment variables in your `.env` file (or equivalent system environment variables).

1.  **Enable/Disable Integration**: Set `CLAWX_ENABLED` to `true` to activate the integration.

    ```dotenv
    CLAWX_ENABLED=true
    ```

2.  **ClawX Base URL**: Define the base URL for the ClawX service.

    ```dotenv
    CLAWX_BASE_URL=https://api.clawx.example.com
    ```

3.  **Agent API Keys**: Provide a JSON dictionary of agent names to their respective API keys using `CLAWX_AGENT_KEYS`.

    **Important**: Ensure this is valid JSON. Each key should be a string of at least 16 characters, containing only alphanumeric characters, hyphens, underscores, dots, or colons.

    ```dotenv
    CLAWX_AGENT_KEYS='{"claude": "sk-ant-...", "gemini": "AIza...", ""perplexity": "pplx-key-..."}'
    ```

    Example for the 6 AI Council:
    ```dotenv
    CLAWX_AGENT_KEYS='''
    {
        "manus": "manus-internal-key-xxxx",
        "claude": "sk-ant-lm-YOUR_CLAUDE_KEY",
        "gemini": "AIzaSyC_YOUR_GEMINI_KEY",
        "perplexity": "pplx-YOUR_PERPLEXITY_KEY",
        "grok": "grok-YOUR_GROK_KEY",
        "ollama": "ollama-local-key-xxxx"
    }
    '''
    ```

    *Note: "manus" and "ollama" might use internal keys or be free, depending on your setup. The example above shows placeholders for demonstration.*

## API Endpoint Reference

All ClawX endpoints are protected by existing authentication middleware and require a valid authenticated user.

### List Registered Agents

`GET /api/v1/clawx/agents`

Returns a list of all 6 ClawX council agents, indicating whether they are configured with an API key and providing a masked prefix of the key for configured agents (e.g., `sk-ant…`).

**Example Response:**

```json
{
  "agents": [
    {
      "name": "manus",
      "configured": true,
      "key_prefix": "manu…"
    },
    {
      "name": "claude",
      "configured": true,
      "key_prefix": "sk-a…"
    },
    {
      "name": "gemini",
      "configured": false,
      "key_prefix": null
    }
  ],
  "total": 6,
  "configured_count": 2
}
```

### Rotate an Agent's API Key

`POST /api/v1/clawx/agents/{agent_name}/rotate`

Rotates the API key for a specified agent. The `agent_name` path parameter should match one of the known ClawX agents (e.g., `claude`, `gemini`). The new API key is provided in the request body.

**Request Body:**

```json
{
  "new_key": "sk-ant-new-secret-key-here"
}
```

**Example Response (Success):**

```json
{
  "name": "claude",
  "status": "rotated"
}
```

**Error Responses:**

- `404 Not Found`: If `agent_name` is not a known ClawX agent.
- `400 Bad Request`: If `new_key` fails format validation (e.g., too short, invalid characters).

### ClawX Health Check

`GET /api/v1/clawx/health`

Checks the connectivity to the configured ClawX service. If `CLAWX_ENABLED` is false or `CLAWX_BASE_URL` is not set, it will report as disabled/unconfigured. Otherwise, it attempts to connect to the ClawX service's `/health` endpoint using a round-robin selected agent key.

**Example Response (Enabled and Reachable):**

```json
{
  "enabled": true,
  "base_url": "https://api.clawx.example.com",
  "reachable": true,
  "status_code": 200,
  "agent": "claude",
  "error": null
}
```

**Example Response (Disabled):**

```json
{
  "enabled": false,
  "base_url": "https://api.clawx.example.com",
  "reachable": null,
  "status_code": null,
  "agent": null,
  "error": "ClawX integration is disabled."
}
```

## Security Considerations

- **Environment Variables**: API keys are stored exclusively in environment variables (`CLAWX_AGENT_KEYS`) and never committed to version control. This is a critical security measure.
- **Key Validation**: Basic validation ensures keys meet minimum length and character requirements, preventing common misconfigurations.
- **Auth Protection**: All API endpoints for managing ClawX integration are secured by FastAPI's authentication middleware, ensuring only authorized users can perform key operations or check health.
- **Key Masking**: The `list_agents` endpoint only exposes a masked prefix of the API keys, preventing accidental exposure in logs or responses.
- **Error Handling**: Detailed error messages are provided for invalid or missing keys, but care is taken not to expose sensitive key information.
- **Minimal Permissions**: The `ClawxClient` only has access to the keys it needs for its operations and does not expose them directly after loading.
