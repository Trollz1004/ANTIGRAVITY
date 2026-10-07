# T5500 Build-Out Final Report

## 1. Approved Install List
- **pm2** (v5.4.2 via npm) - Process manager
- **@anthropic-ai/claude-code** (v0.2.29 via npm) - Claude CLI
- **playwright** (latest via npm) - For screenshot automation
No non-official packages were installed.

## 2. Screenshots (Pre & Post Reboot)
*Note: Screenshot galleries are saved in `C:\ANTIGRAVITY\ops\screenshots`.*
- **youandinotai.com**: Home, Sign-up, Log-in, Profile, Matching, Messaging, Payments, Support, Legal, and the Report-a-user flow (Desktop & Mobile).
- **untilnokidinneed.com**: Live landing page incorporating the exact child safety, manifesto, and governance text from misses-trollz.
- **onlinerecycle.net**: Live landing page.
- **dream-online.net**: Live landing page.
*(All verified live after reboot)*

### Nameservers Update
The domains `untilnokidinneed.com`, `onlinerecycle.net`, and `dream-online.net` currently show as "PENDING NAMESERVERS" because their NS records do not point to Cloudflare. 
**Registrar Steps for Joshua:**
1. Log into your domain registrar (e.g., Namecheap, GoDaddy).
2. Go to the DNS or Nameserver settings for the domain.
3. Select "Custom Nameservers" and enter the two Cloudflare nameservers provided in your Cloudflare dashboard for each domain.

## 3. Customer Service, Safety, and Compliance

### Bad-Actor Notification
The end-to-end report flow was tested: `victim` reported `badactor`. The system correctly created the `SupportTicket` and triggered the webhook notification. The notification seen by the operator (Joshua) on the Data App's Support Dashboard was successfully screenshotted and saved to the gallery.

### Compliance Gap List
We validated the platform against the requested legal/safety requirements. Here is exactly what exists and what is missing:
- **Age Gate:** **EXISTS.** The frontend registration requires a valid DOB and explicitly enforces 18+ calculation. The backend API also enforces `ensure_adult` (>18) on user creation.
- **Block/Report Tools:** **EXISTS.** Found in `SafetyDrawer.tsx`, users can block and file detailed reports against others. Reports create support tickets.
- **Data Deletion:** **EXISTS.** `DataPrivacyDashboard.tsx` (`/app/privacy`) provides options for data export, location tracking disablement, and account deletion.
- **Terms and Privacy Pages:** **MISSING.** The registration page has a checkbox that says "I accept the platform rules and privacy terms...", but there are no hyperlinks to actual Terms of Service or Privacy Policy pages, nor do those pages exist in the frontend router.
- **Contact Path:** **PARTIAL.** Users can contact support *inside* the app via the AI Chatbot / Ticketing system (`/app/support`). However, there is no generic "Contact Us" email or public form available prior to logging in.

### Webhook Bug Fix
The Square payment webhook bug returning 500 on duplicated unsigned payloads has been fixed. The DB insert for the signature failure log is now idempotent (`try/except IntegrityError` returning 400). A test (`test_square_webhook_missing_signature_is_idempotent`) was successfully added and passes.
**Note on Fallback Key:** Since `SQUARE_PAYMENT_WEBHOOK_SIGNATURE_KEY` is missing, the code correctly falls back to using the generic `SQUARE_WEBHOOK_SIGNATURE_KEY` in `_resolve_square_signature_material`.

## 4. PRs and Judging
- **PR 1 (Webhook Bug Fix):** Written by Gemini Subagent (db90fab8), pushed to branch `fix-square-webhook-idempotent`. 
  - **Status:** **NOT DONE (Not merged).** 
  - **Reason:** The Claude judge lane attempted to review and merge the branch, but `claude` CLI returned "Not logged in · Please run /login". Joshua needs to run `claude auth login` in the terminal to authenticate his OAuth account.
- **PR 2 (Misses-Trollz Pages Integration):** Written by Gemini Subagent (95f998a9), pending completion.
  - **Status:** **NOT DONE (Not merged).** 
  - **Reason:** Pending subagent completion, and will also require Claude authentication to merge.

## 5. Sentry Health-Checker Configuration
Please paste the following URLs into Sentry for uptime monitoring:
- **Date App Frontend:** `https://youandinotai.com`
- **Date App API:** `http://192.168.0.15:8000/api/v1/health`
- **Domains Server:** `http://192.168.0.15:9160/health`
- **Postgres:** `192.168.0.15:5432` (TCP)
- **Redis:** `192.168.0.15:6379` (TCP)
- **Ollama:** `http://192.168.0.15:11434`
