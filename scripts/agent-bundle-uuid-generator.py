#!/usr/bin/env python3
"""
Generate canonical UUID roots for agent bundles.

Usage:
  python scripts/agent-bundle-uuid-generator.py --role CTO --commit-sha abc123...
  python scripts/agent-bundle-uuid-generator.py --agent-dir paperclip/agents/cto
"""

import argparse
import uuid
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


# Namespace for instruction roots (custom UUID namespace)
INSTRUCTION_ROOT_NAMESPACE = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')


def generate_instruction_root_uuid(role: str, commit_sha: str) -> str:
    """
    Generate a v5 UUID for an instruction root.

    Args:
        role: Agent role (e.g., "CTO", "CEO")
        commit_sha: Git commit SHA (40 hex chars)

    Returns:
        UUID v5 string
    """
    full_name = f"{role.upper()}:AGENTS.md:{commit_sha}"
    return str(uuid.uuid5(INSTRUCTION_ROOT_NAMESPACE, full_name))


def get_agent_role_from_path(agent_dir: str) -> str:
    """Extract agent role from path like paperclip/agents/cto."""
    parts = Path(agent_dir).parts
    if 'agents' in parts:
        idx = parts.index('agents')
        if idx + 1 < len(parts):
            return parts[idx + 1].upper()
    return None


def generate_metadata_block(
    agent_id: str,
    agent_role: str,
    instruction_root_uuid: str,
    commit_sha: str,
    source_url: str,
    timestamp: str = None
) -> str:
    """
    Generate YAML metadata block for agent bundle.

    Args:
        agent_id: Paperclip agent ID
        agent_role: Agent role
        instruction_root_uuid: Generated UUID
        commit_sha: Git commit SHA
        source_url: GitHub source URL
        timestamp: ISO 8601 timestamp (defaults to now)

    Returns:
        YAML metadata block as string
    """
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')

    block = f"""---
# Agent Bundle Metadata (Canonical UUID Root)
agent_id: "{agent_id}"
agent_role: "{agent_role}"
instruction_root_uuid: "{instruction_root_uuid}"
instruction_root_version: "commit:{commit_sha}"
instruction_root_source: "{source_url}"
instruction_root_generated_at: "{timestamp}"
instruction_root_locked: false
---
"""
    return block


def generate_json_sidecar(
    agent_id: str,
    agent_role: str,
    instruction_root_uuid: str,
    commit_sha: str,
    source_url: str,
    timestamp: str = None
) -> str:
    """Generate JSON metadata sidecar."""
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')

    metadata = {
        "agent_id": agent_id,
        "agent_role": agent_role,
        "instruction_root_uuid": instruction_root_uuid,
        "instruction_root_version": f"commit:{commit_sha}",
        "instruction_root_source": source_url,
        "instruction_root_generated_at": timestamp,
        "instruction_root_locked": False
    }
    return json.dumps(metadata, indent=2)


def main():
    parser = argparse.ArgumentParser(
        description='Generate canonical UUID roots for agent bundles'
    )

    parser.add_argument(
        '--role',
        required=False,
        help='Agent role (e.g., CTO, CEO, CFO)'
    )

    parser.add_argument(
        '--commit-sha',
        required=True,
        help='Git commit SHA (40 hex chars)'
    )

    parser.add_argument(
        '--agent-id',
        required=False,
        help='Paperclip agent ID (optional, for metadata)'
    )

    parser.add_argument(
        '--source-url',
        required=False,
        help='GitHub source URL'
    )

    parser.add_argument(
        '--agent-dir',
        required=False,
        help='Agent directory (extracts role from path)'
    )

    parser.add_argument(
        '--format',
        choices=['yaml', 'json', 'uuid-only'],
        default='yaml',
        help='Output format'
    )

    args = parser.parse_args()

    # Validate commit SHA
    if len(args.commit_sha) != 40 or not all(c in '0123456789abcdef' for c in args.commit_sha.lower()):
        print(f"ERROR: Invalid commit SHA: {args.commit_sha}", file=sys.stderr)
        print("Expected: 40 hex characters", file=sys.stderr)
        sys.exit(1)

    # Determine role
    role = args.role
    if not role and args.agent_dir:
        role = get_agent_role_from_path(args.agent_dir)

    if not role:
        print("ERROR: --role or --agent-dir required", file=sys.stderr)
        sys.exit(1)

    # Generate UUID
    instruction_root_uuid = generate_instruction_root_uuid(role, args.commit_sha)

    # Output based on format
    if args.format == 'uuid-only':
        print(instruction_root_uuid)
    elif args.format == 'yaml':
        agent_id = args.agent_id or "<generated-by-paperclip>"
        source_url = args.source_url or f"https://github.com/Trollz1004/ANTIGRAVITY/blob/{args.commit_sha[:7]}/paperclip/agents/{role.lower()}/AGENTS.md"

        metadata = generate_metadata_block(
            agent_id=agent_id,
            agent_role=role,
            instruction_root_uuid=instruction_root_uuid,
            commit_sha=args.commit_sha,
            source_url=source_url
        )
        print(metadata)
    elif args.format == 'json':
        agent_id = args.agent_id or "<generated-by-paperclip>"
        source_url = args.source_url or f"https://github.com/Trollz1004/ANTIGRAVITY/blob/{args.commit_sha[:7]}/paperclip/agents/{role.lower()}/AGENTS.md"

        metadata = generate_json_sidecar(
            agent_id=agent_id,
            agent_role=role,
            instruction_root_uuid=instruction_root_uuid,
            commit_sha=args.commit_sha,
            source_url=source_url
        )
        print(metadata)


if __name__ == '__main__':
    main()
