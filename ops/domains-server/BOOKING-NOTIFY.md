# Booking notification and daily counts

What was added to the domains server for onlinerecycle.net:

- `booking-notify.mjs` sends the owner a plain-text Telegram message after each saved booking (name, phone, city and ZIP, device-count tier, data-handling notes, requested window, first 160 characters of the item list). It runs after the response is sent, catches every error, and appends failures to `data/ewaste-intake/notify-errors.log`. The token is never logged.
- `booking-stats.mjs` keeps `data/ewaste-intake/stats/YYYY-MM-DD.json` with `page_views` (successful GETs of the onlinerecycle.net home page) and `bookings` (successful POSTs to /api/book). Days are Florida time. No IPs, user agents or cookies are stored, and no endpoint exposes the numbers.

Environment variables on the T5500 (domains-server process):

- `ORC_NOTIFY_TELEGRAM_TOKEN` the Telegram bot token
- `ORC_NOTIFY_TELEGRAM_CHAT` the chat id to message

If either is unset, the server logs one line saying notifications are not configured and carries on.

How to check it works:

1. Restart the domains server with both variables set.
2. Submit one test booking on the form. A Telegram message should arrive within a few seconds.
3. Open `data/ewaste-intake/stats/` and confirm today's file shows `bookings` went up by one.
4. If no message arrives, read `data/ewaste-intake/notify-errors.log`.

Tests: `node ops/domains-server/tests/booking-notify.test.mjs` and `node ops/domains-server/tests/vhost.test.mjs`.
