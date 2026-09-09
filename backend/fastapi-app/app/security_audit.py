"""Security audit utilities for the YouAndINotAI platform."""

import logging
import os
from pathlib import Path
from typing import Any, Dict, List

from app.config import get_settings

logger = logging.getLogger("youandinotai.security.audit")


class SecurityAudit:
    """Security audit utility for checking configuration and code security."""

    def __init__(self):
        self.settings = get_settings()
        self.findings: List[Dict[str, Any]] = []

    def check_jwt_configuration(self) -> None:
        """Check JWT configuration for security issues."""
        logger.info("Checking JWT configuration")

        # Check JWT secret strength
        if not self.settings.jwt_secret:
            self._add_finding(
                "critical",
                "JWT_SECRET",
                "JWT secret is not configured",
                "Set JWT_SECRET environment variable with a strong secret",
            )
        elif len(self.settings.jwt_secret) < 32:
            self._add_finding(
                "high",
                "JWT_SECRET",
                "JWT secret is too short",
                f"JWT secret should be at least 32 characters (current: {len(self.settings.jwt_secret)})",
            )

        # Check for default/weak secrets
        weak_secrets = ["change-me", "secret", "password", "jwt-secret"]
        for weak_secret in weak_secrets:
            if weak_secret in self.settings.jwt_secret.lower():
                self._add_finding(
                    "critical",
                    "JWT_SECRET",
                    "JWT secret contains weak/default value",
                    "Change JWT secret to a strong, random value",
                )
                break

    def check_square_configuration(self) -> None:
        """Check Square payment configuration for security issues."""
        logger.info("Checking Square configuration")

        # Check Square access token
        if not self.settings.square_access_token:
            logger.info(
                "Square access token not configured - this may be expected in development"
            )
        elif len(self.settings.square_access_token) < 20:
            self._add_finding(
                "high",
                "SQUARE_ACCESS_TOKEN",
                "Square access token appears too short",
                "Verify Square access token is valid and complete",
            )

        # Check webhook signature verification
        if not self.settings.square_webhook_verify_signature:
            self._add_finding(
                "medium",
                "SQUARE_WEBHOOK_VERIFY_SIGNATURE",
                "Square webhook signature verification disabled",
                "Enable webhook signature verification in production",
            )

    def check_cors_configuration(self) -> None:
        """Check CORS configuration for security issues."""
        logger.info("Checking CORS configuration")

        # Check for overly permissive CORS
        if "*" in self.settings.cors_origins:
            self._add_finding(
                "medium",
                "CORS_ORIGINS",
                "Wildcard CORS origin configured",
                "Restrict CORS origins to specific domains in production",
            )

    def check_environment_variables(self) -> None:
        """Check environment variable configuration."""
        logger.info("Checking environment variables")

        # Check for debug mode in production
        if (
            self.settings.app_env.lower() == "production"
            and os.getenv("DEBUG", "").lower() == "true"
        ):
            self._add_finding(
                "high",
                "DEBUG",
                "Debug mode enabled in production",
                "Disable DEBUG mode in production environment",
            )

    def check_file_permissions(self) -> None:
        """Check file permissions for sensitive files."""
        logger.info("Checking file permissions")

        # Check if .env file exists and has appropriate permissions
        env_file = Path(".env")
        if env_file.exists():
            try:
                # On Windows, we can't easily check permissions, but we can check if it's readable
                with open(env_file) as f:
                    f.read(100)  # Read just a bit to test access
                logger.info(".env file exists and is readable")
            except PermissionError:
                self._add_finding(
                    "high",
                    ".env",
                    "Insufficient permissions on .env file",
                    "Ensure .env file has appropriate restricted permissions",
                )
            except Exception as e:
                logger.warning(f"Could not check .env file permissions: {e}")

    def run_audit(self) -> Dict[str, Any]:
        """Run complete security audit."""
        logger.info("Starting security audit")

        # Reset findings
        self.findings = []

        # Run all checks
        self.check_jwt_configuration()
        self.check_square_configuration()
        self.check_cors_configuration()
        self.check_environment_variables()
        self.check_file_permissions()

        # Categorize findings
        critical_findings = [f for f in self.findings if f["severity"] == "critical"]
        high_findings = [f for f in self.findings if f["severity"] == "high"]
        medium_findings = [f for f in self.findings if f["severity"] == "medium"]

        audit_result = {
            "summary": {
                "total_findings": len(self.findings),
                "critical": len(critical_findings),
                "high": len(high_findings),
                "medium": len(medium_findings),
                "low": 0,  # We're not checking low severity issues yet
            },
            "findings": self.findings,
            "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        }

        logger.info(f"Security audit completed: {audit_result['summary']}")
        return audit_result

    def _add_finding(
        self, severity: str, category: str, title: str, description: str
    ) -> None:
        """Add a security finding to the audit results."""
        finding = {
            "severity": severity,
            "category": category,
            "title": title,
            "description": description,
        }
        self.findings.append(finding)
        logger.log(
            (
                logging.ERROR
                if severity == "critical"
                else logging.WARNING if severity == "high" else logging.INFO
            ),
            f"Security finding [{severity.upper()}]: {title} - {description}",
        )


def run_security_audit() -> Dict[str, Any]:
    """Convenience function to run a security audit."""
    audit = SecurityAudit()
    return audit.run_audit()


# Example usage as a standalone script
if __name__ == "__main__":
    import json

    result = run_security_audit()
    print(json.dumps(result, indent=2))
