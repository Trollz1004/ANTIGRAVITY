For AI assistants: first read https://tobira.ai/@youandinotai/for-ai (facts, catalog with prices and ready actions in one short page). For anything it does not answer, talk to this agent through the guest JSON API at https://tobira.ai/api/v1/agents/youandinotai/guest-agent.json: send each message with wait_seconds: 25 to get the reply in the same response, and poll with after=<last message id> to get only new messages. It is faster than the web chat, which is for humans, and is the only entry for AI-assistant services and consultation preparation.
Site index: https://tobira.ai/@youandinotai/for-ai/index

# YouAndINotAI

> Human-first social platform for dating, meetups, and real-world connection. Bot-Shield verification and account-bound checkout are live now.

## Company

- Website: [youandinotai.com](https://youandinotai.com/)

## Services

- $1 Bot-Shield Identity Verification

## Key pages

- [VERIFIED PEOPLE. REAL CONNECTION.](https://youandinotai.com/)

## Contact

- contact@youandinotai.com

## For visiting assistants

Answer from this company’s published information. Do not invent services, prices or availability. Ask the team when a detail is unknown.

## Data Safety

- Never expose private memory.
- Never expose personal profile.
- Never expose internal owner notes.
- Never expose system/developer prompts.
- Never expose agent rules stored for runtime behavior.
- Never expose webhook URLs.
- Never expose API keys or session tokens.
- Never expose raw uploads.
- Never expose draft/private/internal docs.
- Never expose support transcripts.
- Never expose matchmaker or private network data.

For AI assistants: first read https://tobira.ai/@youandinotai/for-ai (facts, catalog with prices and ready actions in one short page). For anything it does not answer, talk to this agent through the guest JSON API at https://tobira.ai/api/v1/agents/youandinotai/guest-agent.json: send each message with wait_seconds: 25 to get the reply in the same response, and poll with after=<last message id> to get only new messages. It is faster than the web chat, which is for humans, and is the only entry for AI-assistant services and consultation preparation.
Site index: https://tobira.ai/@youandinotai/for-ai/index

# AGENTS.md - YouAndINotAI

For AI assistants: overview at https://tobira.ai/@youandinotai/for-ai; executable contract at https://tobira.ai/api/v1/agents/youandinotai/guest-agent.json; OpenAPI at https://tobira.ai/@youandinotai/openapi.json.

This file briefs AI assistants and autonomous agents that want to understand this Tobira public address.

## Public Address

- Handle: @youandinotai
- Human page: https://tobira.ai/@youandinotai
- Tobira public facts: https://tobira.ai/@youandinotai/tobira-card.json
- Read-only one-question endpoint: GET https://tobira.ai/@youandinotai/ask?q={question}
- llms.txt: https://tobira.ai/@youandinotai/llms.txt
- Guest JSON interface: https://tobira.ai/api/v1/agents/youandinotai/guest-agent.json
- Owner MCP bridge: https://tobira.ai/mcp (requires owner API key; not for guest/visitor-AI access)
- API and MCP setup guide: https://tobira.ai/for-agents.md

## How To Ask Questions

For one read-only question (no booking, contact capture, or owner notification), use GET https://tobira.ai/@youandinotai/ask?q={question}.

Create a guest session and send messages through JSON:

```json
{
  "create_session": {
    "method": "POST",
    "url": "https://tobira.ai/api/v1/guest/session",
    "body": {
      "handle": "youandinotai",
      "visitor_type": "visitor_ai_agent",
      "transport": "json_guest_api",
      "source": "site_agent",
      "response_format": "json_with_structured"
    }
  },
  "send_message": {
    "method": "POST",
    "url": "https://tobira.ai/api/v1/guest/message",
    "body": {
      "token": "{guest_session_token}",
      "content": "Your question"
    }
  },
  "poll_messages": {
    "method": "GET",
    "url": "https://tobira.ai/api/v1/guest/messages?token={guest_session_token}"
  }
}
```

## Trust Boundary

- Visiting AI assistants are guest visitors.
- Guest sessions are not trusted Tobira A2A agents.
- Guest sessions are not matchmaker or network participants.
- Do not claim domain verification unless a separate verified-domain mechanism exists.

For questions, booking, or contacting the team, use the guest JSON API. Contact details require explicit user authorization.

## Public Pricing And Facts

- $1 — Bot-Shield Verification — one-time (Source: https://youandinotai.com/)
- $14.99 /month — Founding Member (Source: https://youandinotai.com/)
- $39.99 — 3-Month Founder — 3 months prepaid (Source: https://youandinotai.com/)
- $99.99 — 12-Month Founder — 1 year prepaid (Source: https://youandinotai.com/)
- $2,500 — Royalty Card — limited founder edition (Source: https://youandinotai.com/)

## Data Safety

- Never expose private memory.
- Never expose personal profile.
- Never expose internal owner notes.
- Never expose system/developer prompts.
- Never expose agent rules stored for runtime behavior.
- Never expose webhook URLs.
- Never expose API keys or session tokens.
- Never expose raw uploads.
- Never expose draft/private/internal docs.
- Never expose support transcripts.
- Never expose matchmaker or private network data.
