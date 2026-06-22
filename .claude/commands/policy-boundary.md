Check the current task or last code change against all policy boundaries:
1. Business-only public-surface scan: run `.claude/commands/business-surface-scan.md`
2. Stripe ban on youandinotai.com: grep active YouAndINotAI checkout paths for stripe
3. Haiku model ban: grep -r "haiku" .claude/
4. Hermes Anthropic hard wall: grep services/hermes-router/.env* for ANTHROPIC_API_KEY
5. Current doctrine drift: verify active product copy points at `briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md`
Report PASS or VIOLATION for each.
