#!/usr/bin/env python3
"""Validate canonical UUID roots in agent bundles."""

import argparse
import re
import sys
import json
from pathlib import Path
from typing import Dict, Tuple, Optional


UUID_PATTERN = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    re.IGNORECASE
)

COMMIT_SHA_PATTERN = re.compile(r'^[0-9a-f]{40}$')


class AgentBundleValidator:
    def __init__(self, repo_root: Path = None):
        self.repo_root = repo_root or Path('.')
        self.agents_dir = self.repo_root / 'paperclip' / 'agents'
        self.errors = []
        self.warnings = []
        self.results = {}

    def validate_uuid_format(self, uuid_str: str) -> bool:
        """Check if UUID matches v5 format."""
        return bool(UUID_PATTERN.match(uuid_str))

    def validate_commit_sha(self, sha: str) -> bool:
        """Check if string is a valid commit SHA."""
        if not sha.startswith('commit:'):
            return sha.startswith('v') and len(sha) > 1  # Semantic version

        sha_part = sha[7:]  # Remove 'commit:' prefix
        return bool(COMMIT_SHA_PATTERN.match(sha_part))

    def extract_metadata_from_markdown(self, content: str) -> Optional[Dict]:
        """Extract YAML metadata block from markdown."""
        if not content.startswith('---'):
            return None

        # Find closing ---
        lines = content.split('\n')
        if len(lines) < 2:
            return None

        end_idx = None
        for i in range(1, len(lines)):
            if lines[i].strip() == '---':
                end_idx = i
                break

        if end_idx is None:
            return None

        # Simple YAML parser (no external deps)
        metadata = {}
        for line in lines[1:end_idx]:
            if ':' in line:
                key, value = line.split(':', 1)
                metadata[key.strip()] = value.strip().strip('"\'')

        return metadata if metadata else None

    def validate_agent_bundle(self, agent_dir: Path) -> Tuple[bool, Dict]:
        """Validate a single agent bundle."""
        agents_md = agent_dir / 'AGENTS.md'

        if not agents_md.exists():
            self.errors.append(f"Missing AGENTS.md in {agent_dir}")
            return False, {}

        try:
            with open(agents_md) as f:
                content = f.read()
                metadata = self.extract_metadata_from_markdown(content)
        except IOError as e:
            self.errors.append(f"Failed to read {agents_md}: {e}")
            return False, {}

        if not metadata:
            self.errors.append(f"{agent_dir.name}: Missing metadata block")
            return False, {}

        is_valid = True
        validation_errors = []

        # Check required fields
        required_fields = [
            'agent_role',
            'instruction_root_uuid',
            'instruction_root_version',
            'instruction_root_source'
        ]

        for field in required_fields:
            if field not in metadata or not metadata[field]:
                validation_errors.append(f"Missing or empty field: {field}")
                is_valid = False

        # Validate UUID format
        if metadata.get('instruction_root_uuid'):
            uuid_val = metadata['instruction_root_uuid']
            if not self.validate_uuid_format(uuid_val):
                validation_errors.append(f"Invalid UUID format: {uuid_val}")
                is_valid = False

        # Validate version format
        if metadata.get('instruction_root_version'):
            version_val = metadata['instruction_root_version']
            if not self.validate_commit_sha(version_val):
                validation_errors.append(f"Invalid version format: {version_val}")
                is_valid = False

        # Report errors
        if validation_errors:
            for error in validation_errors:
                self.errors.append(f"{agent_dir.name}: {error}")

        return is_valid, metadata

    def validate_all(self) -> bool:
        """Validate all agent bundles."""
        if not self.agents_dir.exists():
            self.errors.append(f"Agents directory not found: {self.agents_dir}")
            return False

        agent_dirs = [d for d in self.agents_dir.iterdir() if d.is_dir()]

        if not agent_dirs:
            self.errors.append("No agent directories found")
            return False

        all_metadata = {}
        all_valid = True

        for agent_dir in sorted(agent_dirs):
            is_valid, metadata = self.validate_agent_bundle(agent_dir)
            if is_valid:
                all_metadata[agent_dir.name] = metadata
            else:
                all_valid = False
            self.results[agent_dir.name] = {'valid': is_valid, 'metadata': metadata}

        return all_valid

    def report(self, verbose: bool = False) -> str:
        """Generate validation report."""
        report_lines = []

        # Summary
        valid_count = sum(1 for r in self.results.values() if r['valid'])
        total_count = len(self.results)

        report_lines.append("=" * 60)
        report_lines.append("Agent Bundle UUID Validation Report")
        report_lines.append("=" * 60)
        report_lines.append(f"Valid: {valid_count}/{total_count}")

        if self.errors:
            report_lines.append("\n❌ ERRORS:")
            for error in self.errors:
                report_lines.append(f"  - {error}")

        report_lines.append("=" * 60)
        return "\n".join(report_lines)


def main():
    parser = argparse.ArgumentParser(description='Validate canonical UUID roots')
    parser.add_argument('--check-mode', choices=['strict', 'warn'], default='strict')
    parser.add_argument('--fail-on-missing-uuid', action='store_true')
    parser.add_argument('--repo-root', type=Path, default=Path('.'))
    parser.add_argument('--verbose', action='store_true')

    args = parser.parse_args()

    validator = AgentBundleValidator(repo_root=args.repo_root)
    is_valid = validator.validate_all()

    print(validator.report(verbose=args.verbose))

    if args.check_mode == 'strict':
        sys.exit(0 if is_valid else 1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
