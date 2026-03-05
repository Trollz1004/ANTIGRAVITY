Check Square payment infrastructure status.

## Steps

1. **Load Square credentials** from `.env` (SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID).

2. **Verify API access** — call Square API to confirm token is valid:
   ```bash
   curl -s -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN" https://connect.squareup.com/v2/locations
   ```

3. **Check all 5 checkout links are reachable** (HTTP 200):
   - Bot-Shield $1: https://square.link/u/eMyJvw8D
   - Founding Member $14.99/mo: https://square.link/u/ipY5VUT5
   - 3-Month Founder $39.99: https://square.link/u/cCkmYsFw
   - 12-Month Founder $99.99: https://square.link/u/HlvE57fI
   - Royalty Card $2,500: https://square.link/u/0QQllAFQ

4. **Pull recent orders** (last 7 days) from Square Orders API:
   ```bash
   curl -s -X POST -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"location_ids":["L24ZX5WRA41TH"],"query":{"filter":{"date_time_filter":{"created_at":{"start_at":"LAST_7_DAYS"}}}}}' \
     https://connect.squareup.com/v2/orders/search
   ```

5. **Report**: Token status, each link status, order count, total revenue (last 7 days), and any issues found.
