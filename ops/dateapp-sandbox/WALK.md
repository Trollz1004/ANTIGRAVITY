# Date app sandbox walk

This is a local test copy of the date app wired to Square's **sandbox**. It cannot charge real money, cannot reach the live Square account, and cannot touch the production database. The start script refuses to run if the Square host is not `https://connect.squareupsandbox.com` or if the database is not a local sandbox database.

Everything runs on 127.0.0.1. Front end on port 3460, backend on port 8460.

## Before the first run (once)

1. Install the backend packages into a local virtual environment: in `domains\youandinotai.com\backend`, run `python -m venv .venv` and then `.venv\Scripts\python -m pip install -r requirements.txt`.
2. Install the front end packages: in `domains\youandinotai.com\frontend`, run `npm ci`.
3. Run `powershell -NoProfile -File ops\dateapp-sandbox\start-sandbox.ps1`. The first run creates `%LOCALAPPDATA%\dateapp-sandbox\env.sandbox` from `env.sandbox.example` and stops.
4. Open `%LOCALAPPDATA%\dateapp-sandbox\env.sandbox` and fill the two empty lines:
   - `SQUARE_ACCESS_TOKEN`: Square Developer page, open your application, **Credentials**, switch the toggle at the top to **Sandbox**, copy **Sandbox Access token**.
   - `SQUARE_LOCATION_ID`: same application, **Locations**, **Sandbox** tab, copy the location ID of the default test account location.
5. Optional safety proof: `powershell -NoProfile -File ops\dateapp-sandbox\test-start-refusals.ps1` should print `8 of 8 passed`.

## The walk

1. **Start.** Run `powershell -NoProfile -File ops\dateapp-sandbox\start-sandbox.ps1`. It fills a random sign-in secret and a random local webhook signing key into the sandbox env file the first time, starts both parts hidden, prints the two addresses, and returns. Give it about 20 seconds, then open `http://127.0.0.1:8460/api/v1/health` in the browser to see the backend answer.
2. **Sign up account A.** Open `http://127.0.0.1:3460/register`. Use an email on a real-looking domain you control or a made-up one such as `a@sandbox-walk.test`. Do not use `example.com`, `example.org`, `example.net`, `localhost` or `invalid` addresses, because the backend will not open Square checkout for those. Enter an adult date of birth.
3. **Timed human check.** Go to `http://127.0.0.1:3460/app/verify` and start the check. It shows a short math question. Wait at least 3 seconds before you submit (faster answers are treated as a bot and fail), and answer within 5 minutes (after that it expires).
4. **Pay 1 dollar on Square's sandbox checkout page.** After a correct answer the page offers the 1 dollar checkout. It opens Square's sandbox checkout page (the address contains `squareupsandbox.com`). Pay with Square's published sandbox test card:
   - Card number `4111 1111 1111 1111` (Visa)
   - Expiry: any future month and year
   - CVV `111`
   - ZIP / postal code: any valid 5-digit code, such as `94103`

   Square then sends you back to `http://127.0.0.1:3460/app/verify?status=success`. If Square refuses to redirect to a 127.0.0.1 address, the payment still completes; open that page by hand.
5. **Get the sandbox payment event to the local backend.** Square only sends webhooks to a public HTTPS address, and a tunnel is not allowed here, so Square's own webhook delivery **cannot** reach 127.0.0.1. Instead, run:

   `powershell -NoProfile -File ops\dateapp-sandbox\replay-sandbox-payment.ps1`

   It reads the newest completed 1 dollar payment from Square's sandbox API (read only), wraps it in the same `payment.updated` event shape Square sends, signs it the way Square signs (base64 of HMAC-SHA256 over the webhook address plus the body) with the local key from the sandbox env file, and posts it to `http://127.0.0.1:8460/api/v1/webhooks/square-payment`. Signature checking stays on: a wrong or missing signature is rejected by the same backend code production runs. You should see `Backend reply: {"event_id":"…","processed":true,"duplicate":false}`. Add `-PaymentId <id>` to replay one specific payment.

   Plain truth: the payment itself is real Square sandbox data, and the signature check is the real check, but the signature is made with a local key, not by Square. A Square-made signature can only arrive at a public HTTPS address.
6. **Account switches on.** When Square sends you back, the verify page tries `/api/v1/verify/confirm` a few times by itself. If you have not run step 5 yet it will report that the payment is not found; that is expected in this copy, because in production Square's webhook usually arrives within seconds. After step 5 says `processed: true`, refresh `http://127.0.0.1:3460/app/verify`. It should show verified with the gold tier. The confirm call only passes when both the human check and the payment are recorded.
7. **Account B.** Open a private browser window (separate sign-in), and repeat steps 2 to 6 with a second email, such as `b@sandbox-walk.test`.
8. **Two test accounts chat.** In each window, finish the profile at `/app/profile`, then like the other account in Discover at `/app`. When both have liked each other the match appears at `/app/matches`. Open it (it goes to `/app/chat/<match id>`) and send a message from A; it should appear in B's window, and B's reply should appear in A's.
9. **Sign-in survives 30 minutes.** Leave account A's window signed in and untouched for 31 minutes (the sign-in token lasts 30 minutes). Then open `/app/matches`. The page should load without asking you to sign in again, because the front end swaps the expired token for a fresh one using the refresh token, which lasts 7 days.
10. **Stop.** Run `powershell -NoProfile -File ops\dateapp-sandbox\stop-sandbox.ps1`. Logs stay in `%LOCALAPPDATA%\dateapp-sandbox\logs`. To start clean, delete `%LOCALAPPDATA%\dateapp-sandbox\sandbox.db`.

## If something goes wrong

- Checkout says "temporarily unavailable": the backend could not create the Square sandbox payment link. Look in `%LOCALAPPDATA%\dateapp-sandbox\logs\backend.err.log` for `Square CreatePaymentLink failed`. Usually the token or location id is wrong, or one is from the production tab.
- Replay reply is 400 "Invalid Square webhook signature": the sandbox env file changed after the backend started. Stop and start again.
- Replay finds no payment: the payment is not complete yet, or the location id is not the one the checkout used.
