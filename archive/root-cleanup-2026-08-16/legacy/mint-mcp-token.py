#!/usr/bin/env python3
"""
mint-mcp-token.py — CLI utility to mint JWT tokens for hermes-mcp-server.

Usage:
  python mint-mcp-token.py --scope full --ttl 30d --sub josh-first-token
  python mint-mcp-token.py --scope filesystem:read,git:read --ttl 24h --sub claude-readonly
  python mint-mcp-token.py --scope readonly --ttl 7d --sub codex-session

Scopes:
  full       = all scopes
  readonly   = all :read scopes
  <list>     = comma-separated scope names
"""
import argparse
import os
import sys
import time
import secrets
from pathlib import Path

# Add parent to path for config import
sys.path.insert(0, str(Path(__file__).resolve().parent / "hermes" / "mcp-server"))

try:
    import jwt
except ImportError:
    print("ERROR: PyJWT not installed. Run: pip install PyJWT", file=sys.stderr)
    sys.exit(1)

# Try to load config, fall back to env vars
try:
    from config import MCP_OAUTH_SECRET, MCP_OAUTH_ALGORITHM, MCP_TOKEN_ISSUER, MCP_TOKEN_AUDIENCE
except ImportError:
    MCP_OAUTH_SECRET = os.getenv("MCP_OAUTH_SECRET", "")
    MCP_OAUTH_ALGORITHM = os.getenv("MCP_OAUTH_ALGORITHM", "HS256")
    MCP_TOKEN_ISSUER = os.getenv("MCP_TOKEN_ISSUER", "hermes-mcp-server")
    MCP_TOKEN_AUDIENCE = os.getenv("MCP_TOKEN_AUDIENCE", "mcp.youandinotai.com")

ALL_SCOPES = [
    "filesystem:read", "filesystem:write",
    "git:read", "git:write",
    "shell:exec", "shell:script",
    "docker:read", "docker:write",
    "health:read",
    "github:read", "github:write",
    "memory:read", "memory:write",
]

READONLY_SCOPES = [s for s in ALL_SCOPES if s.endswith(":read")]


def parse_ttl(ttl_str: str) -> int:
    """Parse TTL string like '24h', '7d', '30d' to seconds."""
    ttl_str = ttl_str.strip().lower()
    multipliers = {"s": 1, "m": 60, "h": 3600, "d": 86400}

    for suffix, mult in multipliers.items():
        if ttl_str.endswith(suffix):
            try:
                value = int(ttl_str[:-1])
                return value * mult
            except ValueError:
                pass

    raise ValueError(f"Invalid TTL format: {ttl_str}. Use like 24h, 7d, 30d")


def parse_scopes(scope_str: str) -> list[str]:
    """Parse scope string to list of scopes."""
    scope_str = scope_str.strip().lower()

    if scope_str == "full":
        return ALL_SCOPES
    elif scope_str == "readonly":
        return READONLY_SCOPES
    else:
        scopes = [s.strip() for s in scope_str.split(",")]
        # Validate
        valid = []
        for s in scopes:
            if s in ALL_SCOPES:
                valid.append(s)
            else:
                print(f"WARNING: Unknown scope '{s}' — skipping", file=sys.stderr)
        return valid


def main():
    parser = argparse.ArgumentParser(
        description="Mint JWT tokens for hermes-mcp-server"
    )
    parser.add_argument(
        "--scope", required=True,
        help="Scopes: 'full', 'readonly', or comma-separated list"
    )
    parser.add_argument(
        "--ttl", default="30d",
        help="Token TTL: 24h, 7d, 30d (default: 30d)"
    )
    parser.add_argument(
        "--sub", default="",
        help="Subject label for the token (e.g., 'josh-first-token')"
    )
    parser.add_argument(
        "--secret", default="",
        help="Override MCP_OAUTH_SECRET (or set env var)"
    )
    args = parser.parse_args()

    secret = args.secret or MCP_OAUTH_SECRET
    if not secret or secret == "change-me-to-a-random-secret":
        print("ERROR: MCP_OAUTH_SECRET not set. Set it in .env or pass --secret", file=sys.stderr)
        sys.exit(1)

    scopes = parse_scopes(args.scope)
    if not scopes:
        print("ERROR: No valid scopes specified", file=sys.stderr)
        sys.exit(1)

    ttl_seconds = parse_ttl(args.ttl)
    now = int(time.time())
    sub = args.sub or f"token-{secrets.token_hex(4)}"

    payload = {
        "sub": sub,
        "iss": MCP_TOKEN_ISSUER,
        "aud": MCP_TOKEN_AUDIENCE,
        "iat": now,
        "exp": now + ttl_seconds,
        "scope": scopes,
    }

    token = jwt.encode(payload, secret, algorithm=MCP_OAUTH_ALGORITHM)

    # Print token to stdout only (never to log)
    print(token)

    # Print info to stderr
    print(f"\nToken minted:", file=sys.stderr)
    print(f"  sub:    {sub}", file=sys.stderr)
    print(f"  scopes: {scopes}", file=sys.stderr)
    print(f"  exp:    {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime(now + ttl_seconds))}", file=sys.stderr)
    print(f"  ttl:    {args.ttl}", file=sys.stderr)


if __name__ == "__main__":
    main()
