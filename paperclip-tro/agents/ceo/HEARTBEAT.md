agent: hermes-ceo
project: ANTIGRAVITY
node: sabretooth
config: paperclip-tro/agents/ceo/AGENT.md
state: paperclip-tro/agents/ceo/STATE.md
skills_dir: .agents/skills/
adapter: hermes
model: openai/gpt-5.5-pro
provider: hermes
feed: http://127.0.0.1:9119/api/status
workspace: http://127.0.0.1:3000
visual_board: http://127.0.0.1:4200
last_beat: 2026-07-03T00:00:00Z
status: hermes-only-active-agent

loop:
  - probe Hermes feed shape on :9119
  - update visible Paperclip task/routine/issue/goal status
  - load only needed .agents/skills department file
  - use browser/local tools/APIs directly when safe
  - spawn temporary subagents only when useful
  - verify output evidence before marking done
