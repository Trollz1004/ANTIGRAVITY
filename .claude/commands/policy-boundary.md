Check the current task or last code change against all policy boundaries:
1. Customer-facing canonical-7 ban: grep apps/youandinotai-frontend/ for donate|donation|solicitation|charity|charitable|giving back|disbursement
2. Stripe ban on youandinotai.com: grep apps/youandinotai-frontend/ for stripe
3. Haiku model ban: grep -r "haiku" .claude/
4. Hermes Anthropic hard wall: grep services/hermes-router/.env* for ANTHROPIC_API_KEY
5. Doctrine drift: grep apps/youandinotai-frontend/ for "ai-solutions.store\|CharityRouter100\|60/30/10\|100% to charity"
Report PASS or VIOLATION for each.
