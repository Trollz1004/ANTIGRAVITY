# ANTIGRAVITY Backend Secrets Rotation Checklist (OPU-94)

This checklist outlines the steps required to safely and comprehensively rotate all secrets and keys for the ANTIGRAVITY FastAPI backend. Always perform a dry-run first in a non-production environment.

**Repo:** `/mnt/c/ANTIGRAVITY`
**Backend App:** `/mnt/c/ANTIGRAVITY/backend/fastapi-app/`
**Rotation Script:** `/mnt/c/ANTIGRAVITY/backend/fastapi-app/scripts/rotate_all_secrets.py`

---

## 0. Pre-Rotation Preparation

1.  **Read this entire document:** Understand all steps and potential impacts.
2.  **Review `config.py`:** Ensure you are aware of all secrets and their current configurations.
3.  **Backup:** Perform a full backup of your database, environment variables, and any relevant configuration files.
4.  **Inform Stakeholders:** Notify relevant teams (DevOps, QA, Support) about the planned rotation window.
5.  **Environment Check:** Determine the target environment (development, staging, production). The rotation script has safety checks for production.
6.  **Verify `secrets_rotation_config.json`:** Check the last rotation dates for secrets in `/mnt/c/ANTIGRAVITY/backend/fastapi-app/app/secrets_rotation_config.json`.

---

## 1. Run the Rotation Script (Dry-Run First!)

Always run in dry-run mode (`--apply` flag omitted) first to see what actions would be taken.

### 1.1 Dry-Run (Recommended First Step)

```bash
python /mnt/c/ANTIGRAVITY/backend/fastapi-app/scripts/rotate_all_secrets.py --env <development|staging|production>
```

*   Review the output carefully. Note all generated new secret values and manual action instructions.
*   Check the audit log: `/mnt/c/ANTIGRAVITY/backend/fastapi-app/app/secrets_rotation_audit.log`

### 1.2 Actual Rotation (Use `--apply` carefully)

**WARNING: Running with `--apply` in production will require careful coordination and potential downtime depending on the secret type and your deployment strategy.**

```bash
python /mnt/c/ANTIGRAVITY/backend/fastapi-app/scripts/rotate_all_secrets.py --apply --env <development|staging|production>
```

*   **For Production:** Pay close attention to the interactive safety prompts. Do NOT proceed without full understanding and coordination.

---

## 2. Secret-Specific Rotation Steps & Verification

Follow these steps for each secret type identified by the script. Update configuration in `.env` files, deployment pipelines (e.g., Kubernetes secrets, AWS Secrets Manager, GCP Secret Manager), and/or directly in `config.py` as prompted.

### 2.1 JWT Signing Keys (`jwt_secret`)

*   **Rotation Logic:** Script generates a new URL-safe key.
*   **Action:**
    1.  Copy the new `jwt_secret` value from the script output.
    2.  Update the `JWT_SECRET` environment variable in your deployment environment (e.g., `.env`, Docker Compose, Kubernetes secrets).
    3.  If `config.py` was directly updated (not recommended for secrets), verify the change.
*   **Verification:**
    1.  Restart the FastAPI application to pick up the new secret.
    2.  Attempt to log in to the application. New logins should succeed.
    3.  Existing active sessions will be invalidated. Inform users.

### 2.2 Database Passwords (`database_url` password)

*   **Rotation Logic:** Script generates a strong random password.
*   **Action:**
    1.  Copy the new database password from the script output.
    2.  **Database System:** Log in to your PostgreSQL database (or other DB) and update the password for the `postgres` user (or the user specified in `database_url`).
    3.  **Environment:** Update the `DATABASE_URL` environment variable (specifically the password part) in your deployment environment.
*   **Verification:**
    1.  Restart the FastAPI application.
    2.  Monitor application logs for database connection errors.
    3.  Perform a simple database read/write operation via the application to confirm connectivity.

### 2.3 API Keys (Square: `square_access_token`)

*   **Rotation Logic:** Script provides manual instructions.
*   **Action:**
    1.  Log in to your Square Developer Dashboard: `https://developer.squareup.com/apps`
    2.  Navigate to your ANTIGRAVITY application, then to the 'Credentials' section.
    3.  Generate a **new Production Access membership record**.
    4.  Update the `SQUARE_ACCESS_TOKEN` environment variable in your deployment environment with the new membership record.
    5.  **Grace Period:** Keep the old membership record active for a short grace period (e.g., 1-2 days) if possible, to allow all services to transition.
    6.  **Delete Old membership record:** After verification and grace period, delete the old access membership record from the Square Dashboard.
*   **Verification:**
    1.  Restart the FastAPI application.
    2.  Perform Square-related operations (e.g., process a test payment, retrieve a customer) through the application to confirm the new key is working.

### 2.4 Webhook Signature Keys (Square: `square_payment_webhook_signature_key`, `square_booking_webhook_signature_key`, `square_webhook_signature_key`)

*   **Rotation Logic:** Script generates new URL-safe keys.
*   **Action:**
    1.  Copy the new webhook signature keys from the script output.
    2.  **Square Dashboard:** For each relevant webhook, log in to your Square Developer Dashboard, navigate to your application, and update the webhook's signature key with the newly generated value.
    3.  **Environment:** Update the corresponding environment variables (e.g., `SQUARE_PAYMENT_WEBHOOK_SIGNATURE_KEY`) in your deployment environment.
*   **Verification:**
    1.  Restart the FastAPI application.
    2.  Trigger a test webhook event from Square (if available) or perform an action that generates a webhook (e.g., a test payment, a test booking).
    3.  Monitor your application logs to ensure webhooks are received and processed successfully, indicating correct signature verification.

### 2.5 Other API Keys/Credentials (SMTP, Telegram, Gemini, Kimi, Daily, Google, Metrics, ClawX Agent Keys)

*   **Rotation Logic:** Script generates new values for generic keys/passwords and provides instructions for provider-specific ones (ClawX).
*   **Action:**
    1.  For each key (e.g., `SMTP_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY`, `KIMI_API_KEY`, `DAILY_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `METRICS_API_KEY`, `CLAWX_AGENT_KEYS`):
        *   Generate a new key/password through the respective provider's dashboard/console.
        *   Update the corresponding environment variable in your deployment environment.
        *   For `CLAWX_AGENT_KEYS`, this will involve updating the JSON dictionary in your environment with new keys generated from the ClawX system itself.
*   **Verification:**
    1.  Restart the FastAPI application.
    2.  Test functionality related to each service:
        *   **SMTP:** Send a test email.
        *   **Telegram:** Send a test message via the bot.
        *   **Gemini/Kimi/Daily:** Perform an API call that uses these keys.
        *   **Google:** Test Google OAuth flow (if applicable).
        *   **Metrics:** Verify metrics endpoint is accessible with the new `METRICS_API_KEY`.
        *   **ClawX:** Verify ClawX council interactions are functioning.

---

## 3. Post-Rotation Verification & Cleanup

1.  **Full Application Smoke Test:** Run your application's full test suite or perform comprehensive manual testing across all critical features.
2.  **Monitoring:** Closely monitor application logs, error reporting (e.g., Sentry), and performance metrics for any anomalies.
3.  **Old Secrets Removal (Crucial):**
    *   Ensure all old secrets are removed from `.env` files, environment variables, and any secret management systems.
    *   **Do NOT commit `.env` files to source control.**
4.  **Update `secrets_rotation_config.json`:** Confirm that the `last_rotated` timestamps are updated for all rotated secrets in `/mnt/c/ANTIGRAVITY/backend/fastapi-app/app/secrets_rotation_config.json`. The `--apply` flag in the script should handle this.
5.  **Audit Log Review:** Review the full audit log at `/mnt/c/ANTIGRAVITY/backend/fastapi-app/app/secrets_rotation_audit.log` for any warnings or errors.
6.  **Decommission Old Keys/Certificates:** If any secrets involve external key pairs or certificates, ensure the old ones are properly revoked or decommissioned after a safe grace period.

---

## 4. Rollback Procedure

In case of critical issues during or after rotation:

1.  **Revert Environment Variables:** Immediately revert environment variables and deployment configuration to the state *before* the rotation, using your backups.
2.  **Restore Database:** If database password rotation caused issues, restore the database from the pre-rotation backup.
3.  **Revert `config.py` (if modified):** If `config.py` was directly modified, revert to the previous version using Git.
4.  **Restart Application:** Restart the FastAPI application with the reverted configurations.
5.  **Notify Teams:** Communicate the rollback to all stakeholders.
6.  **Investigate:** Analyze the root cause of the failure before attempting rotation again.

---
