---
name: cost-tracker
description: Pulls Square marketplace revenue + Ollama/API spend; writes daily P&L
---

# Tool: cost-tracker

## Inputs
- `date` (optional, default today UTC)

## Steps

### 1. Square revenue
```bash
curl -s -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN" \
  "https://connect.squareup.com/v2/orders/search" \
  -d '{"location_ids":["'$SQUARE_LOCATION_ID'"],"query":{"filter":{"date_time_filter":{"created_at":{"start_at":"<ISO>"}}}}}'
```
Sum `total_money.amount` (cents) → divide by 100 = USD.

### 2. Ollama Cloud spend
GET `https://ollama.com/v1/usage` with bearer key from `OLLAMA_API_KEY`.
(If endpoint doesn't exist, sum from local request log at `paperclip-data/llm-usage.jsonl`.)

### 3. OpenRouter spend
GET `https://openrouter.ai/api/v1/auth/key` with bearer — returns `usage` field.

### 4. Write to `C:/income-engine/paperclip-data/finance/daily-{date}.json`

### 5. Compute runway
`runway_days = balance_usd / (spend_mtd / day_of_month)`. Null if spend_mtd = 0.

## Output
Path to the written JSON file + a one-line summary.

## Constraints
- Never log API keys. Mask all but last 4 chars.
- Numeric only — no commentary in the JSON.
