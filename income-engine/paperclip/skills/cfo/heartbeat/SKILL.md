---
name: CFO Heartbeat
description: Hourly P&L snapshot and budget enforcement
schedule: every 60 minutes
---

# CFO Heartbeat

Every 60 minutes:

1. **Pull revenue** — call `tools/cost-tracker` to refresh Square sales (last 24h + MTD)
2. **Pull spend** — Ollama Cloud usage, OpenRouter usage, any other paid API
3. **Write snapshot** to `C:/income-engine/paperclip-data/finance/daily-{YYYY-MM-DD}.json`:
   ```json
   {
     "date": "2026-05-08",
     "revenue_today": 0,
     "revenue_mtd": 0,
     "spend_today": 0.00,
     "spend_mtd": 0.00,
     "runway_days": null,
     "breakeven_progress_pct": 0
   }
   ```
4. **Alert CEO** (post Paperclip comment on company-level issue) if:
   - Spend > 30% of MTD revenue
   - MTD spend > $50 with $0 MTD revenue
   - Any agent exceeded its monthly budget cap

5. **No-op if nothing changed** — do not spam the CEO thread.

## Failure mode
If Square or Ollama API fails: log to `finance/heartbeat-errors.log`, retry next cycle. Do not crash. Do not alert unless 3 consecutive failures.
