import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List

logger = logging.getLogger(__name__)


class SecretsRotationManager:
    """
    Manages the rotation of application secrets, tracking their rotation dates
    and providing mechanisms for checking expiry and simulating rotation.

    This class is designed as a utility/framework and does not directly
    perform live secret rotations in the application's runtime configuration.
    It provides the logic and audit trails for a rotation procedure.
    """

    DEFAULT_ROTATION_INTERVAL_DAYS = 90
    CONFIG_FILE_NAME = "secrets_rotation_config.json"
    AUDIT_LOG_FILE_NAME = "secrets_rotation_audit.log"
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

    def __init__(self, base_dir: str = None):
        self._base_dir = base_dir or self.BASE_DIR
        self._config_path = os.path.join(self._base_dir, self.CONFIG_FILE_NAME)
        self._audit_log_path = os.path.join(self._base_dir, self.AUDIT_LOG_FILE_NAME)
        self._secrets_config: Dict[str, Any] = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        """Loads the secrets rotation configuration from a JSON file."""
        try:
            with open(self._config_path) as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(
                f"Secrets rotation config file not found at {self._config_path}. "
                f"Initializing with empty configuration."
            )
            return {"secrets": []}
        except json.JSONDecodeError:
            logger.error(
                f"Error decoding JSON from {self._config_path}. "
                f"Initializing with empty configuration."
            )
            return {"secrets": []}

    def _save_config(self):
        """Saves the current secrets rotation configuration to the JSON file."""
        try:
            os.makedirs(os.path.dirname(self._config_path), exist_ok=True)
            with open(self._config_path, "w") as f:
                json.dump(self._secrets_config, f, indent=4)
        except OSError as e:
            logger.error(
                f"Error saving secrets rotation config to {self._config_path}: {e}"
            )

    def _log_audit(self, secret_name: str, action: str, details: str):
        """
        Logs an audit entry for a secret rotation action.
        Ensures the audit log directory exists.
        """
        timestamp = datetime.now().isoformat()
        log_entry = f"{timestamp} - Secret: {secret_name}, Action: {action}, Details: {details}\n"
        try:
            os.makedirs(os.path.dirname(self._audit_log_path), exist_ok=True)
            with open(self._audit_log_path, "a") as f:
                f.write(log_entry)
        except OSError as e:
            logger.error(
                f"Error writing to secrets rotation audit log {self._audit_log_path}: {e}"
            )

    def get_rotation_status(self) -> List[Dict[str, Any]]:
        """
        Returns the current rotation status for all configured secrets.
        Each entry includes secret_name, last_rotated, interval_days, and is_expired.
        """
        status_list = []
        now = datetime.now()
        for secret_info in self._secrets_config.get("secrets", []):
            secret_name = secret_info["name"]
            last_rotated_str = secret_info.get("last_rotated")
            interval_days = secret_info.get(
                "interval_days", self.DEFAULT_ROTATION_INTERVAL_DAYS
            )

            last_rotated = None
            is_expired = False
            if last_rotated_str:
                try:
                    last_rotated = datetime.fromisoformat(last_rotated_str)
                    expiry_date = last_rotated + timedelta(days=interval_days)
                    is_expired = now > expiry_date
                except ValueError:
                    logger.warning(
                        f"Invalid last_rotated date format for secret '{secret_name}': "
                        f"'{last_rotated_str}'. Skipping expiry check."
                    )
            else:
                is_expired = True  # No rotation date means it's effectively expired/never rotated

            status_list.append(
                {
                    "name": secret_name,
                    "last_rotated": last_rotated_str,
                    "interval_days": interval_days,
                    "is_expired": is_expired,
                }
            )
        return status_list

    def check_expiry(self) -> List[str]:
        """
        Checks all configured secrets and returns a list of names for secrets that have expired.
        """
        expired_secrets = []
        for secret_status in self.get_rotation_status():
            if secret_status["is_expired"]:
                expired_secrets.append(secret_status["name"])
        return expired_secrets

    def rotate_secret(self, secret_name: str, new_value: str = None) -> bool:
        """
        Simulates the rotation of a specific secret.

        This method updates the 'last_rotated' timestamp for the given secret
        and logs the action. It does NOT actually generate new secret values
        or modify environment variables/config files directly.
        The `new_value` parameter is for auditing/logging purposes only.
        """
        now = datetime.now()
        for secret_info in self._secrets_config.get("secrets", []):
            if secret_info["name"] == secret_name:
                old_last_rotated = secret_info.get("last_rotated", "Never")
                secret_info["last_rotated"] = now.isoformat()
                self._save_config()
                self._log_audit(
                    secret_name,
                    "Rotation initiated",
                    f"Old last_rotated: {old_last_rotated}, New last_rotated: {now.isoformat()}",
                )
                logger.info(
                    f"Secret '{secret_name}' rotation simulated and timestamp updated."
                )
                return True
        logger.warning(
            f"Secret '{secret_name}' not found in configuration for rotation."
        )
        return False

    def zero_downtime_rotation_pattern(
        self, secret_name: str, generate_new_secret_func: Callable[[], str]
    ) -> bool:
        """
        Outlines a zero-downtime rotation pattern for a given secret.
        This is a conceptual method that describes the steps; it does not execute them live.

        Args:
            secret_name: The name of the secret to rotate.
            generate_new_secret_func: A callable that returns a newly generated secret string.

        Returns:
            True if the conceptual rotation process completes, False otherwise.
        """
        logger.info(
            f"Initiating zero-downtime rotation pattern for secret: '{secret_name}'"
        )
        self._log_audit(
            secret_name,
            "Zero-downtime rotation start",
            "Beginning conceptual rotation process.",
        )

        try:
            # Step 1: Generate new secret
            logger.info(f"Step 1: Generating new value for '{secret_name}'.")
            _new_secret_value = generate_new_secret_func()
            self._log_audit(
                secret_name, "Generate New", "New secret value conceptually generated."
            )
            # In a real scenario, this would involve calling an external KMS or a secure generation function.

            # Step 2: Provision new secret in parallel
            logger.info(
                f"Step 2: Provisioning new value for '{secret_name}' in parallel. "
                "This typically involves updating a temporary environment variable or KMS entry, "
                "allowing the application to load both old and new secrets."
            )
            self._log_audit(
                secret_name,
                "Provision Parallel",
                "New secret conceptually provisioned alongside old.",
            )
            # E.g., for a database URL, you might provision a new DB user/pass, or for API keys,
            # store the new key in a separate variable (e.g., NEW_SQUARE_ACCESS_TOKEN).

            # Step 3: Validate new secret
            logger.info(
                f"Step 3: Validating new secret for '{secret_name}'. "
                "This involves attempting to use the new secret without affecting live traffic."
            )
            # In a real scenario, this would involve a test connection or API call using new_secret_value.
            # Real deployments plug in an actual validation probe here; the
            # simulation treats generation success as a valid secret.
            self._log_audit(
                secret_name,
                "Validate New",
                "New secret conceptually validated successfully.",
            )
            logger.info(
                f"New secret for '{secret_name}' conceptually validated successfully."
            )

            # Step 4: Swap to new secret (application restart/reload or dynamic update)
            logger.info(
                f"Step 4: Swapping to new secret for '{secret_name}'. "
                "This could be an application reload to pick up the new secret, "
                "or a dynamic update if the application supports it. Old secret is still available."
            )
            self._log_audit(
                secret_name,
                "Swap Active",
                "Application conceptually switched to new secret.",
            )
            self.rotate_secret(
                secret_name
            )  # Update last_rotated timestamp for the primary secret
            # At this point, new connections or operations should prefer the new secret.

            # Step 5: Deprecate/Cleanup old secret (after a grace period)
            logger.info(
                f"Step 5: Deprecating and cleaning up old secret for '{secret_name}'. "
                "This happens after a grace period to ensure all services are using the new secret. "
                "The old secret is then removed from configuration/KMS."
            )
            self._log_audit(
                secret_name,
                "Cleanup Old",
                "Old secret conceptually deprecated/cleaned up.",
            )
            # This step would typically be manual or automated after a significant delay.

            logger.info(
                f"Zero-downtime rotation pattern for secret '{secret_name}' conceptually completed."
            )
            self._log_audit(
                secret_name,
                "Zero-downtime rotation end",
                "Conceptual rotation process finished.",
            )
            return True
        except Exception as e:
            logger.exception(
                f"An error occurred during conceptual zero-downtime rotation for '{secret_name}': {e}"
            )
            self._log_audit(secret_name, "Rotation Error", f"An error occurred: {e}")
            return False


# Example usage (for testing/demonstration, not part of live app logic)
if __name__ == "__main__":  # pragma: no cover — manual demo harness
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )

    # Ensure the target directory exists for example files
    target_dir = SecretsRotationManager.BASE_DIR
    os.makedirs(target_dir, exist_ok=True)

    # Initialize config.json with some sample secrets for demonstration
    initial_config = {
        "secrets": [
            {
                "name": "database_url",
                "last_rotated": datetime.now().isoformat(),
                "interval_days": 90,
            },
            {
                "name": "square_access_token",
                "last_rotated": (datetime.now() - timedelta(days=100)).isoformat(),
                "interval_days": 90,
            },
            {
                "name": "jwt_secret",
                "last_rotated": (datetime.now() - timedelta(days=50)).isoformat(),
                "interval_days": 60,
            },
            {"name": "gemini_api_key", "last_rotated": None, "interval_days": 180},
        ]
    }
    config_file_path = os.path.join(target_dir, SecretsRotationManager.CONFIG_FILE_NAME)
    audit_log_file_path = os.path.join(
        target_dir, SecretsRotationManager.AUDIT_LOG_FILE_NAME
    )

    with open(config_file_path, "w") as f:
        json.dump(initial_config, f, indent=4)

    manager = SecretsRotationManager(base_dir=target_dir)

    print("\n--- Current Rotation Status ---")
    for status_item in manager.get_rotation_status():
        print(
            f"  {status_item['name']}: Last Rotated: {status_item['last_rotated']}, "
            f"Interval: {status_item['interval_days']} days, Expired: {status_item['is_expired']}"
        )

    print("\n--- Checking for Expired Secrets ---")
    expired = manager.check_expiry()
    if expired:
        print(f"Expired secrets: {', '.join(expired)}")
    else:
        print("No secrets have expired.")

    print("\n--- Simulating Rotation for square_access_token ---")
    manager.rotate_secret("square_access_token")

    print("\n--- Status After Rotation Simulation ---")
    for status_item in manager.get_rotation_status():
        print(
            f"  {status_item['name']}: Last Rotated: {status_item['last_rotated']}, "
            f"Interval: {status_item['interval_days']} days, Expired: {status_item['is_expired']}"
        )

    print("\n--- Demonstrating Zero-Downtime Rotation Pattern for jwt_secret ---")

    def generate_jwt_secret():
        import secrets

        return secrets.token_urlsafe(64)  # Placeholder for actual generation

    manager.zero_downtime_rotation_pattern("jwt_secret", generate_jwt_secret)

    print("\n--- Status After Zero-Downtime Pattern ---")
    for status_item in manager.get_rotation_status():
        print(
            f"  {status_item['name']}: Last Rotated: {status_item['last_rotated']}, "
            f"Interval: {status_item['interval_days']} days, Expired: {status_item['is_expired']}"
        )

    print("\n--- Audit Log Content (Partial) ---")
    try:
        with open(audit_log_file_path) as f:
            print("".join(f.readlines()[-5:]))  # Print last 5 lines for example
    except FileNotFoundError:
        print("Audit log not yet created or found.")
