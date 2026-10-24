# T5500 Support Hermes Profile Configuration

## Node Details
- **Host**: T5500-2-XEON-72
- **IP**: 192.168.0.15
- **Purpose**: Customer support for youandinotai.com and onlinerecycle.net
- **Status**: PRIMARY PRODUCTION NODE

## Profile Location
`~/.hermes/profiles/support-t5500/`

## MCP Servers Required
- `brain-mcp`
- `mission-mcp`
- `antigravity-files`
- `playwright`
- `supabase` (read-only)

## Primary Gateway
**OmniRoute T5500 Gateway**
- URL: `http://192.168.0.15:20128/v1`
- API Key: `{env:OMNI_ROUTE_API_KEY}`

## Fallback Gateways
1. Ollama Local: `http://127.0.0.1:11434/v1` with `hermes-support:latest`

## Skills to Load
- `i-have-adhd`
- `dateapp-support-desk`
- `verification-before-completion`
- `systematic-debugging`
- `agent-reach`

## Focus Lane
- Purpose: Customer support ticket triage and response drafting
- Drafts only for Joshua's approval
- Business-only framing

## Port Configuration
- Hermes Gateway: `:8642` or `:9119`
- OmniRoute: `:20128`
- Ollama: `:11434`

## Notes
- All replies require Joshua approval before sending
- Copy stays business-only
- No YouTube automation (separate profile on Sabretooth)

## Verification
- [ ] MCP connections tested
- [ ] Support desk tools working
- [ ] Message drafting functional