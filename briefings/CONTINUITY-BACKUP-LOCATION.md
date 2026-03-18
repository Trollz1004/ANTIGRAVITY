# Continuity Backup Location

## Purpose

This repo acknowledges that the mission-critical continuity backup exists outside git so recovery does not depend on local SSD survival.

## Safe Location Truth

- The authoritative continuity backup is stored in **Josh's OneDrive Personal Vault on Sabretooth**.
- Repo operators should treat the Personal Vault continuity artifact as the recovery source of truth when rebuilding a node after hardware loss, compromise, or local disk failure.
- The repo may reference the **Personal Vault root location** as the continuity source, but should **not** track exact secret values, full secret inventories, or copy-paste vault dumps.

## Rules

1. Keep real secrets in Personal Vault and ignored local env files only.
2. Do not commit the continuity artifact itself.
3. If a new continuity snapshot is generated, update the local/vault copy first and only record the high-level location in repo briefings.
4. If repo docs mention the backup, keep the wording directional, not disclosive.

## Recovery Guidance

- Start from the Personal Vault continuity artifact.
- Rebuild node-local `.env` files from that source as needed.
- Re-verify high-risk credentials after recovery, especially Cloudflare, GitHub, and payment/webhook credentials.
