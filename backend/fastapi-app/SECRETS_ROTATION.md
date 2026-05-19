
# ANTIGRAVITY Backend Secrets Rotation Procedure

This document outlines the procedure for rotating secrets used by the ANTIGRAVITY FastAPI backend.
The `SecretsRotationManager` class in `app/secrets_rotation.py` provides a framework for tracking
and auditing secret rotations, following a zero-downtime pattern.

## 1. Overview of Secrets Management

The ANTIGRAVITY backend uses `pydantic_settings` to load configuration, including secrets,
primarily from `.env` files. This procedure focuses on the operational steps and auditing
of rotating these secrets.

**Important:** This framework *tracks* and *guides* rotation; it does NOT automatically
generate or apply new secrets to `.env` files or external secret stores. Actual secret
generation and update in the environment are manual or external steps.

## 2. Rotatable Secrets and Intervals

The following secrets are configured for rotation, with their default intervals:

| Secret Name                      | Default Rotation Interval |
| :------------------------------- | :------------------------ |
| `database_url`                   | 90 days                   |
| `square_access_token`            | 90 days                   |
| `square_webhook_signature_key`   | 90 days                   |
| `jwt_secret`                     | 60 days                   |
| `gemini_api_key`                 | 180 days                  |
| `kimi_api_key`                   | 180 days                  |
| `daily_api_key`                  | 180 days                  |
| `google_client_id`               | 365 days                  |
| `google_client_secret`           | 365 days                  |
| `smtp_password`                  | 90 days                   |
| `telegram_bot_token`             | 180 days                  |
| `clawx_agent_keys`               | 90 days                   |
| `metrics_api_key`                | 90 days                   |

These settings are managed in `backend/fastapi-app/app/secrets_rotation_config.json`.

## 3. Rotation Procedure (Zero-Downtime Pattern)

The recommended approach for rotating secrets is a zero-downtime pattern to ensure
continuous service availability. This procedure assumes secrets are provided via
environment variables (e.g., from `.env` files or a secret management service).

1.  **Generate New Secret:**
    *   Generate a new, strong value for the secret.
    *   **Example (JWT_SECRET):** `python -c 'import secrets; print(secrets.token_urlsafe(64))'`
    *   **Example (API Key):** Generate via the respective service's console (e.g., Square Dashboard, Google Cloud Console).
    *   **Example (Database Password):** Use database-specific commands.

2.  **Provision New Secret in Parallel:**
    *   Update the deployment environment (e.g., Kubernetes secrets, Docker environment variables, `.env` file for local development) to include the *new* secret value **alongside** the *old* one.
    *   This often means having two environment variables for the same logical secret during a transition period (e.g., `JWT_SECRET_NEW` and `JWT_SECRET`).
    *   Modify the application code (e.g., `app/config.py`) to first attempt to load `JWT_SECRET_NEW` and fall back to `JWT_SECRET` if `_NEW` is not found, or to explicitly use both during the transition.

3.  **Validate New Secret:**
    *   Perform health checks or specific test calls using the newly provisioned secret.
    *   Ensure that services that depend on this secret can successfully operate with the new value without affecting live traffic.
    *   Monitor application logs for any errors related to the new secret.

4.  **Swap to New Secret (Application Reload/Update):**
    *   Once validation is successful, configure the application to *exclusively* use the new secret value. This might involve:
        *   Updating the original environment variable (e.g., `JWT_SECRET` now holds the new value).
        *   Triggering an application reload or rolling restart to pick up the updated configuration.
    *   The `SecretsRotationManager.rotate_secret("secret_name")` method can be called to update the `last_rotated` timestamp in `secrets_rotation_config.json` and log the event.

5.  **Deprecate/Cleanup Old Secret:**
    *   After a sufficient grace period (e.g., 24-48 hours, depending on system churn and critical dependencies) to ensure the old secret is no longer in use, remove the old secret value entirely from the deployment environment and any temporary application code that referenced it.
    *   Verify that no services are still trying to use the old secret.

## 4. How to Trigger Rotation (Using the Manager)

The `SecretsRotationManager` is a Python utility. You would typically interact with it via a script or an administrative console.

To check the status of secrets:
```python
from app.secrets_rotation import SecretsRotationManager
manager = SecretsRotationManager(config_path="path/to/secrets_rotation_config.json")
status = manager.get_rotation_status()
for s in status:
    print(f"{s['name']}: Expired={s['is_expired']}")
```

To list expired secrets:
```python
from app.secrets_rotation import SecretsRotationManager
manager = SecretsRotationManager(config_path="path/to/secrets_rotation_config.json")
expired_secrets = manager.check_expiry()
print(f"Secrets needing rotation: {expired_secrets}")
```

To mark a secret as rotated (after you have performed the actual rotation steps):
```python
from app.secrets_rotation import SecretsRotationManager
manager = SecretsRotationManager(config_path="path/to/secrets_rotation_config.json")
manager.rotate_secret("square_access_token")
print("square_access_token marked as rotated.")
```

To conceptually run through the zero-downtime rotation pattern (for documentation/auditing):
```python
from app.secrets_rotation import SecretsRotationManager
import secrets # For example secret generation

def generate_new_jwt_secret():
    return secrets.token_urlsafe(64)

manager = SecretsRotationManager(config_path="path/to/secrets_rotation_config.json")
manager.zero_downtime_rotation_pattern("jwt_secret", generate_new_jwt_secret)
```

## 5. Emergency Rotation Steps

In an emergency (e.g., suspected compromise of a secret), the priority is immediate invalidation and replacement.

1.  **Immediately Invalidate Old Secret:** If possible, revoke the compromised secret via the external service (e.g., invalidate API key in Square, revoke database user password).
2.  **Generate New Secret:** Generate a new, strong secret value.
3.  **Directly Update and Deploy:** Immediately update the relevant environment variable (e.g., in `.env` or deployment configuration) with the new secret value.
4.  **Force Application Restart:** Perform a full restart of the application to ensure the new secret is loaded. This might incur brief downtime, which is acceptable in an emergency.
5.  **Update Rotation Manager:** Once the new secret is deployed and the application is stable, use `SecretsRotationManager.rotate_secret("secret_name")` to update the `last_rotated` timestamp.
6.  **Audit:** Review application logs and the `secrets_rotation_audit.log` file for any anomalous activity or errors during the emergency rotation.

## 6. Audit Logging

All rotations and significant events within the `SecretsRotationManager` are logged to
`backend/fastapi-app/app/secrets_rotation_audit.log`. This log should be regularly reviewed
and integrated with a central logging solution if available.

---
**Note:** The `secrets_rotation.py` file should be placed in `backend/fastapi-app/app/`
and `secrets_rotation_config.json` in `backend/fastapi-app/app/` as well.
The `secrets_rotation_audit.log` will also be created in `backend/fastapi-app/app/`.
