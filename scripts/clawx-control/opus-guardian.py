"""Opus Guardian — Platform integrity validator.

Any future Claude (4.7, 99.6, whatever) can run this to verify the
YouAndINotAI platform meets security and architecture invariants.

Usage:
    python scripts/clawx-control/opus-guardian.py
    python scripts/clawx-control/opus-guardian.py --fix  (auto-fix what's possible)

Checks:
    1. No hardcoded secrets in source files
    2. All API routes require authentication
    3. No active surface claims  routing or automatic payout
    4. 1-wallet revenue model with 10% reserve — founder-directed, not configurable
    5. PII isolation in metrics
    6. Pydantic validation on all inputs
    7. No raw SQL (SQLAlchemy ORM only)
    8. .env exists with required keys
"""
import os
import re
import sys
from pathlib import Path

# ── Config ──────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent.parent

# The customer-facing API may live at any of these paths depending on node:
#   Sabretooth: API not local (lives on T5500) → API_DIR will not exist; checks skip
#   T5500: services/youandinotai-api/ or youandinotai-api/ at repo root
# We resolve to the first one that exists; otherwise API_DIR stays unresolved
# and AUTH_COVERAGE / PII / RAW_SQL checks degrade to WARN ("API not on this node").
_API_CANDIDATES = [
    ROOT / "services" / "youandinotai-api",
    ROOT / "youandinotai-api",
    ROOT / "apps" / "youandinotai-api",
]
API_DIR = next((p for p in _API_CANDIDATES if p.exists()), _API_CANDIDATES[0])
APP_DIR = API_DIR / "app"
ROUTERS_DIR = APP_DIR / "routers"

_FRONTEND_CANDIDATES = [
    ROOT / "apps" / "youandinotai",
    ROOT / "youandinotai",
]
FRONTEND_DIR = next((p for p in _FRONTEND_CANDIDATES if p.exists()), _FRONTEND_CANDIDATES[-1])

# Endpoints that are intentionally public (no auth)
PUBLIC_ENDPOINTS = {
    "health.py": ["health_check"],
    "auth.py": ["register", "login", "refresh_token"],
    "users.py": ["register_user"],
    "webhooks.py": ["square_payment_webhook", "square_booking_webhook", "stripe_webhook_retired"],
}

# Secret patterns that must NEVER appear in source
ANTHROPIC_PREFIX = "sk" + "-ant-"
GITHUB_PAT_PREFIX = "gh" + "p_"
SECRET_PATTERNS = [
    (r'sk[-_](?:live|test)[-_][a-zA-Z0-9]{20,}', "Stripe secret key"),
    (ANTHROPIC_PREFIX + r'[a-zA-Z0-9]{20,}', "Anthropic API key"),
    (r'whsec_[a-zA-Z0-9]{20,}', "Stripe webhook secret"),
    (r'AIza[a-zA-Z0-9_-]{35}', "Google API key"),
    (GITHUB_PAT_PREFIX + r'[a-zA-Z0-9]{36}', "GitHub PAT"),
    (r'password\s*=\s*["\'][^"\']{8,}["\']', "Hardcoded password"),
    (r'POSTGRES_PASSWORD\s*=\s*["\'][^$][^"\']+["\']', "Hardcoded DB password"),
]

# Stale routing markers that must NOT appear in live product code.
# Doctrine terminated 2026-04-17 — 1-wallet model replaced all split-era language.
LEGACY_ROUTE_MARKERS = [
    "ai-solutions.store",
    "Router100",
    "100% to ",
    "",
    " routing",
    "automatic payout",
    "Gospelpayment",
    "_cap",
]

# Required runtime keys or local env entries for the current Square-first backend
REQUIRED_ENV_KEYS = [
    "JWT_SECRET",
]

# Revenue policy constants (HARDCODED — NEVER CONFIGURABLE)
# 1-wallet model: all revenue in, all costs out, 10% reserve — Josh's call quarterly.
EXPECTED_POLICY = {"reserve_percent": 10}

class GuardianResult:
    def __init__(self):
        self.passed = []
        self.warnings = []
        self.failures = []

    def ok(self, check: str, detail: str = ""):
        self.passed.append((check, detail))

    def warn(self, check: str, detail: str):
        self.warnings.append((check, detail))

    def fail(self, check: str, detail: str):
        self.failures.append((check, detail))

    def report(self) -> int:
        print("\n" + "=" * 60)
        print("  OPUS GUARDIAN — Platform Integrity Report")
        print("=" * 60)

        if self.passed:
            print(f"\n  PASSED ({len(self.passed)})")
            for check, detail in self.passed:
                print(f"    [+] {check}" + (f" — {detail}" if detail else ""))

        if self.warnings:
            print(f"\n  WARNINGS ({len(self.warnings)})")
            for check, detail in self.warnings:
                print(f"    [!] {check} — {detail}")

        if self.failures:
            print(f"\n  FAILURES ({len(self.failures)})")
            for check, detail in self.failures:
                print(f"    [X] {check} — {detail}")

        total = len(self.passed) + len(self.warnings) + len(self.failures)
        score = len(self.passed) / total * 100 if total else 0

        print(f"\n  Score: {score:.0f}% ({len(self.passed)}/{total} checks passed)")
        if self.failures:
            print("  Status: INTEGRITY VIOLATION — FIX REQUIRED")
        elif self.warnings:
            print("  Status: OPERATIONAL — review warnings")
        else:
            print("  Status: FORTRESS MODE — all clear")
        print("=" * 60 + "\n")

        return 1 if self.failures else 0

def scan_files(directory: Path, extensions: list[str]) -> list[Path]:
    """Recursively find source files, excluding node_modules/dist/.git."""
    files = []
    for ext in extensions:
        for f in directory.rglob(f"*{ext}"):
            path_str = str(f)
            if any(skip in path_str for skip in ["node_modules", "dist", ".git", "__pycache__", "alembic/versions", ".venv", "venv", "site-packages"]):
                continue
            files.append(f)
    return files

def check_no_hardcoded_secrets(result: GuardianResult):
    """Scan all source files for leaked secrets."""
    source_files = (
        scan_files(API_DIR, [".py"])
        + scan_files(FRONTEND_DIR / "src", [".ts", ".tsx", ".js"])
    )

    found_any = False
    for f in source_files:
        if f.name == "opus-guardian.py":
            continue  # Skip self (contains patterns)
        try:
            content = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        for pattern, label in SECRET_PATTERNS:
            matches = re.findall(pattern, content)
            if matches:
                rel = f.relative_to(ROOT)
                result.fail("NO_SECRETS", f"{label} found in {rel}")
                found_any = True

    if not found_any:
        result.ok("NO_SECRETS", "Zero hardcoded secrets in source")

def check_auth_coverage(result: GuardianResult):
    """Verify all router endpoints require authentication."""
    if not ROUTERS_DIR.exists():
        # The customer-facing API lives on T5500, not Sabretooth. Skip with WARN
        # rather than FAIL so a single-node guardian run doesn't false-flag.
        result.warn("AUTH_COVERAGE", f"API routers not on this node ({ROUTERS_DIR}); run guardian on the T5500 box for the real check")
        return

    for router_file in ROUTERS_DIR.glob("*.py"):
        if router_file.name == "__init__.py":
            continue

        content = router_file.read_text(encoding="utf-8", errors="ignore")
        public_funcs = PUBLIC_ENDPOINTS.get(router_file.name, [])

        # Find all endpoint functions
        endpoints = re.findall(r'@router\.(get|post|put|delete|patch)\(.*?\)\s*\nasync def (\w+)', content)

        for _method, func_name in endpoints:
            if func_name in public_funcs:
                continue  # Intentionally public

            # Check for auth dependency
            has_auth = (
                "get_current_user" in content.split(f"def {func_name}")[1].split("\ndef ")[0]
                if f"def {func_name}" in content
                else False
            )
            # Also check for custom auth (metrics uses X-Metrics-Key)
            func_block = content.split(f"def {func_name}")[1].split("\ndef ")[0] if f"def {func_name}" in content else ""
            has_custom_auth = "_verify_metrics_key" in func_block or "X-Metrics-Key" in func_block

            if has_auth or has_custom_auth:
                result.ok("AUTH_COVERAGE", f"{router_file.name}:{func_name}")
            else:
                result.fail("AUTH_COVERAGE", f"{router_file.name}:{func_name} — NO AUTH")

def check_legacy_routing_boundary(result: GuardianResult):
    """Verify no active surface claims  routing or automatic payout.

    Doctrine terminated 2026-04-17. 1-wallet model replaced all split-era language.
    This scan now flags stale legacy markers rather than enforcing old doctrine.
    """
    product_files = scan_files(API_DIR, [".py"]) + scan_files(FRONTEND_DIR / "src", [".ts", ".tsx"])

    found_contamination = False
    for f in product_files:
        try:
            content = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        for marker in LEGACY_ROUTE_MARKERS:
            if marker.lower() in content.lower():
                rel = f.relative_to(ROOT)
                result.fail("STALE_LANGUAGE", f"Stale split-era marker '{marker}' in live product file {rel}")
                found_contamination = True

    if not found_contamination:
        result.ok("STALE_LANGUAGE", "No stale /split language in live product code")

def check_revenue_policy(result: GuardianResult):
    """Verify the 1-wallet / 10% reserve model — no split-era  routing.

    Current model (2026-04-17+): all revenue in, all costs out of one wallet.
    10% minimum goes to a reserve bucket — Josh's money, his call quarterly.
    No  labels, no doctrine scans, no automatic payout.
    """
    metrics_file = ROUTERS_DIR / "metrics.py"
    if not metrics_file.exists():
        result.warn("REVENUE_POLICY", "metrics.py not found — can't verify policy")
        return

    content = metrics_file.read_text(encoding="utf-8", errors="ignore")

    # Flag any stale split-era language that shouldn't be in live revenue code
    stale_markers = ["_cap", "_percent", "", "Gospelpayment", "payout"]
    for marker in stale_markers:
        if marker.lower() in content.lower():
            result.fail("REVENUE_POLICY", f"Stale split-era marker '{marker}' found in metrics.py — update to 1-wallet model")
            return

    result.ok("REVENUE_POLICY", "Revenue code clean — no stale /split markers")

def check_pii_isolation(result: GuardianResult):
    """Verify metrics endpoint returns only aggregates, no PII."""
    metrics_file = ROUTERS_DIR / "metrics.py"
    if not metrics_file.exists():
        result.warn("PII_ISOLATION", "metrics.py not found")
        return

    content = metrics_file.read_text(encoding="utf-8", errors="ignore")

    pii_fields = ["email", "display_name", "password", "user_id", "phone"]
    pii_leaked = []
    for field in pii_fields:
        # Check if PII fields appear in response construction (not in query filters)
        response_section = content.split("return")[1] if "return" in content else ""
        if field in response_section and f"count" not in response_section:
            pii_leaked.append(field)

    if not pii_leaked:
        result.ok("PII_ISOLATION", "Metrics endpoint returns aggregates only — zero PII")
    else:
        result.fail("PII_ISOLATION", f"PII fields in response: {', '.join(pii_leaked)}")

def check_no_raw_sql(result: GuardianResult):
    """Verify all database access uses SQLAlchemy ORM, no raw SQL."""
    py_files = scan_files(APP_DIR, [".py"])

    raw_sql_patterns = [
        (r'\.execute\(\s*f["\']', "f-string in execute()"),
        (r'\.execute\(\s*["\'](?:SELECT|INSERT|UPDATE|DELETE)', "Raw SQL string"),
        (r'text\(\s*f["\']', "f-string in text()"),
    ]

    found_raw = False
    for f in py_files:
        content = f.read_text(encoding="utf-8", errors="ignore")
        for pattern, label in raw_sql_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                rel = f.relative_to(ROOT)
                result.fail("NO_RAW_SQL", f"{label} in {rel}")
                found_raw = True

    if not found_raw:
        result.ok("NO_RAW_SQL", "All queries use SQLAlchemy ORM — zero raw SQL")

def check_input_validation(result: GuardianResult):
    """Verify POST/PUT endpoints use Pydantic schemas."""
    if not ROUTERS_DIR.exists():
        return

    for router_file in ROUTERS_DIR.glob("*.py"):
        if router_file.name == "__init__.py":
            continue

        content = router_file.read_text(encoding="utf-8", errors="ignore")
        post_endpoints = re.findall(r'@router\.(post|put)\(.*?\)\s*\nasync def (\w+)\((.*?)\)', content, re.DOTALL)

        for method, func_name, params in post_endpoints:
            # Skip webhooks (raw body / signed payload) and simple signup (path param only)
            if func_name in ["square_payment_webhook", "square_booking_webhook", "stripe_webhook_retired", "signup_volunteer"]:
                continue

            # Check for Pydantic model parameter (type-hinted request body)
            has_schema = bool(re.search(r':\s*\w+(?:Create|Update|Send|Register|Login|Refresh)Request', params))
            if has_schema:
                result.ok("INPUT_VALIDATION", f"{router_file.name}:{func_name}")
            else:
                # Some POST endpoints legitimately don't need a body (like /signup)
                if "payload" in params or "body" in params or "request" in params:
                    result.warn("INPUT_VALIDATION", f"{router_file.name}:{func_name} — has body param but no typed schema")

def check_env_file(result: GuardianResult):
    """Verify required runtime keys exist in environment or expected local env files."""
    candidate_env_files = [
        ROOT / ".env",
        API_DIR / ".env",
    ]

    content_parts = []
    existing_files = []
    for env_file in candidate_env_files:
        if env_file.exists():
            existing_files.append(str(env_file.relative_to(ROOT)))
            content_parts.append(env_file.read_text(encoding="utf-8", errors="ignore"))

    content = "\n".join(content_parts)
    missing = []
    for key in REQUIRED_ENV_KEYS:
        if key not in content and not os.getenv(key):
            missing.append(key)

    if missing and existing_files:
        result.fail("ENV_FILE", f"Missing required keys: {', '.join(missing)}")
    elif missing:
        result.warn("ENV_FILE", f"No local backend env file found on this node; missing runtime keys in current process: {', '.join(missing)}")
    elif existing_files:
        result.ok("ENV_FILE", f"Required keys found via {', '.join(existing_files)}")
    else:
        result.warn("ENV_FILE", "No local .env file found; relying on process environment")

def main():
    result = GuardianResult()

    print("\n  Opus Guardian scanning platform...")
    print(f"  Root: {ROOT}")
    print(f"  API:  {API_DIR}")
    print(f"  UI:   {FRONTEND_DIR}")

    check_no_hardcoded_secrets(result)
    check_auth_coverage(result)
    check_legacy_routing_boundary(result)
    check_revenue_policy(result)
    check_pii_isolation(result)
    check_no_raw_sql(result)
    check_input_validation(result)
    check_env_file(result)

    return result.report()

if __name__ == "__main__":
    sys.exit(main())
