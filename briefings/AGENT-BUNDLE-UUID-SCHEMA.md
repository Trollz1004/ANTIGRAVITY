# Agent Bundle Canonical UUID Schema

**Status**: CANONICAL (enforced for all future agent bundle creation)  
**Effective Date**: 2026-06-15  
**Authority**: CTO / BUS-144

---

## Overview

Every agent bundle (instruction root) must declare a canonical **instruction root UUID** that uniquely identifies the versioned source of truth for that agent's instructions. This prevents instruction drift, enables audit trails, and ensures future agent creation is traceable to a specific documented version.

## What Is an Instruction Root UUID?

An **instruction root UUID** is a v5 UUID (SHA-1 namespace-based) that uniquely identifies:
- The agent's role / canonical name
- The instruction set version (derived from commit hash or documentation version)
- The instruction source location (file path)

**Example:**
```
instruction_root_uuid: "550e8400-e29b-41d4-a716-446655440000"
instruction_root_source: "https://github.com/Trollz1004/ANTIGRAVITY/blob/main/paperclip/agents/cto/AGENTS.md"
instruction_root_version: "commit:abc1234567890def1234567890abcdef12345678"
instruction_root_generated_at: "2026-06-15T12:00:00Z"
```

---

## Required Fields in Agent Bundle Metadata

Every agent bundle AGENTS.md file must include a metadata block (as inline comments) or a separate JSON sidecar file (`AGENTS.uuid.json`) with these fields:

### Metadata Block (Inline — Preferred)

```markdown
---
# Agent Bundle Metadata (Required for validation)
agent_id: "b02a21c7-737e-4177-91ac-6d8e57805801"  # Paperclip agent ID
agent_role: "CTO"
instruction_root_uuid: "550e8400-e29b-41d4-a716-446655440000"
instruction_root_version: "commit:abc1234567890def1234567890abcdef12345678"
instruction_root_source: "https://github.com/Trollz1004/ANTIGRAVITY/blob/main/paperclip/agents/cto/AGENTS.md"
instruction_root_generated_at: "2026-06-15T12:00:00Z"
instruction_root_locked: true  # Prevents accidental modification
---
```

Place this block **at the top** of the AGENTS.md file, before any other content. Format as YAML front matter enclosed in `---`.

### JSON Sidecar (Alternative)

If metadata blocks interfere with markdown rendering, use a sibling file:

**File**: `paperclip/agents/cto/AGENTS.uuid.json`

```json
{
  "agent_id": "b02a21c7-737e-4177-91ac-6d8e57805801",
  "agent_role": "CTO",
  "instruction_root_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "instruction_root_version": "commit:abc1234567890def1234567890abcdef12345678",
  "instruction_root_source": "https://github.com/Trollz1004/ANTIGRAVITY/blob/main/paperclip/agents/cto/AGENTS.md",
  "instruction_root_generated_at": "2026-06-15T12:00:00Z",
  "instruction_root_locked": true
}
```

---

## How to Generate an Instruction Root UUID

### Step 1: Determine the Instruction Root Name

```
root_name = "{agent_role}:AGENTS.md"
```

**Example**: `"CTO:AGENTS.md"`

### Step 2: Get the Current Commit SHA

```bash
git rev-parse HEAD
```

Output example: `abc1234567890def1234567890abcdef12345678`

### Step 3: Compute UUID v5 (SHA-1 based)

Use Python or a UUID v5 generator:

```python
import uuid

root_name = "CTO:AGENTS.md"
commit_sha = "abc1234567890def1234567890abcdef12345678"
namespace = uuid.NAMESPACE_URL  # or custom namespace

# Combine role + commit as the name
full_name = f"{root_name}:{commit_sha}"

instruction_root_uuid = uuid.uuid5(namespace, full_name)
print(instruction_root_uuid)
```

Or use the provided script:

```bash
python scripts/agent-bundle-uuid-generator.py \
  --role CTO \
  --commit-sha abc1234567890def1234567890abcdef12345678
```

### Step 4: Record the Metadata

Once generated, record the UUID and source information in the agent bundle.

---

## Validation Rules

Every agent bundle must pass these checks:

### 1. UUID Format
- Must be a valid UUID v5
- Must match pattern: `[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}`

### 2. Version Tracking
- `instruction_root_version` must reference a valid commit SHA or semantic version
- Format: `commit:` or `v` (e.g., `commit:abc123...` or `v1.2.3`)

### 3. Immutability
- Once set, `instruction_root_uuid` must NOT change unless:
  - A new instruction root is created (new agent or major version bump)
  - Josh explicitly authorizes the change
- `instruction_root_locked: true` enforces this protection in validation

### 4. Presence
- Every agent bundle in `paperclip/agents/*/AGENTS.md` MUST have these fields
- Validation fails if any field is missing
- New agent bundles cannot be created without passing UUID validation

---

## CI/CD Enforcement

### Pre-commit Hook

File: `.git/hooks/pre-commit`

```bash
#!/bin/bash
# Validate canonical UUID roots on agent bundle changes

python scripts/validate-agent-bundle-uuids.py \
  --check-mode strict \
  --fail-on-missing-uuid \
  --fail-on-invalid-format

if [ $? -ne 0 ]; then
  echo "ERROR: Agent bundle UUID validation failed. Cannot commit."
  exit 1
fi
```

### GitHub Actions Workflow

File: `.github/workflows/ci-validate.yml`

Runs on:
- Push to `main`
- Pull requests
- Manual trigger

Checks:
- All agent bundles have valid UUIDs
- UUIDs are not duplicated across agents
- Version metadata is correct
- No locked bundles have been modified without a new UUID

---

## Migration Path (Existing Agents)

For agents created before this schema was enforced:

1. **Audit existing agents** (scripts/audit-agent-bundles.py)
2. **Generate UUIDs** for each based on the current commit
3. **Add metadata blocks** to existing AGENTS.md files
4. **Commit as a single PR** with title: `feat(cto): add canonical UUID roots to all existing agent bundles`

Example migration for one agent:

```bash
# 1. Determine the commit where CTO AGENTS.md was created
git log --follow -p paperclip/agents/cto/AGENTS.md | head -100

# 2. Generate the UUID for that original state
python scripts/agent-bundle-uuid-generator.py \
  --role CTO \
  --commit-sha <original-commit>

# 3. Add the metadata block to the current AGENTS.md
# (Edit the file, add YAML front matter at top)

# 4. Update the version to the current commit
python scripts/agent-bundle-uuid-generator.py \
  --role CTO \
  --commit-sha $(git rev-parse HEAD)
```

---

## Future Agent Creation Workflow

### For a New Agent (e.g., "Architect")

1. **Create the AGENTS.md file** in `paperclip/agents/architect/AGENTS.md`

2. **Generate the UUID:**

```bash
python scripts/agent-bundle-uuid-generator.py \
  --role Architect \
  --commit-sha $(git rev-parse HEAD)
```

3. **Add metadata block** at top of AGENTS.md:

```yaml
---
agent_id: "<generated-by-paperclip>"
agent_role: "Architect"
instruction_root_uuid: "GENERATED-UUID-HERE"
instruction_root_version: "commit:$(git rev-parse HEAD)"
instruction_root_source: "https://github.com/Trollz1004/ANTIGRAVITY/blob/main/paperclip/agents/architect/AGENTS.md"
instruction_root_generated_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
instruction_root_locked: false
---
```

4. **Pass validation** before merge:

```bash
python scripts/validate-agent-bundle-uuids.py \
  --check-mode strict \
  --fail-on-missing-uuid
```

5. **Merge** when CI passes

---

## Examples

### Valid Agent Bundle (with UUID)

**File**: `paperclip/agents/cto/AGENTS.md`

```yaml
---
agent_id: "b02a21c7-737e-4177-91ac-6d8e57805801"
agent_role: "CTO"
instruction_root_uuid: "550e8400-e29b-41d4-a716-446655440000"
instruction_root_version: "commit:abc1234567890def1234567890abcdef12345678"
instruction_root_source: "https://github.com/Trollz1004/ANTIGRAVITY/blob/main/paperclip/agents/cto/AGENTS.md"
instruction_root_generated_at: "2026-06-15T12:00:00Z"
instruction_root_locked: true
---

# Agent Instructions

You are the CTO of ANTIGRAVITY...
```

### Invalid Bundle (missing UUID)

```markdown
# Agent Instructions

You are the CTO of ANTIGRAVITY...
```

❌ **Validation fails**: Missing `instruction_root_uuid` in metadata

---

## Audit Trail

The UUID system enables:

1. **Traceability**: Every agent's instructions can be traced to a specific commit
2. **Versioning**: Upgrades to agent instructions create new UUIDs
3. **Drift Detection**: If instructions are modified without updating the UUID, validation catches it
4. **Recovery**: Lost agents can be recreated by referencing the UUID commit

**Query agent by UUID:**

```bash
# Find which agent uses a specific UUID
grep -r "550e8400-e29b-41d4-a716-446655440000" paperclip/agents/
```

---

## Enforcement Summary

| Check | When | Action on Fail |
|-------|------|----------------|
| UUID presence | Pre-commit + CI | Block commit / PR |
| UUID format | Pre-commit + CI | Block commit / PR |
| UUID uniqueness | CI | Fail test |
| Version tracking | CI | Warn (non-blocking first wave) |
| Locked flag respected | CI | Fail if locked + modified without new UUID |

---

## Questions?

Refer to:
- **Schema validation script**: `scripts/validate-agent-bundle-uuids.py`
- **UUID generator**: `scripts/agent-bundle-uuid-generator.py`
- **Audit tool**: `scripts/audit-agent-bundles.py`
- **CTO**: [BUS-144](/BUS/issues/BUS-144)

---

*Canonical as of 2026-06-15 | Authored by CTO 2 on behalf of [BUS-144](/BUS/issues/BUS-144)*
