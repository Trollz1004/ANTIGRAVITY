# Windows Copilot Pre-SSD Verification Prompt
# For use BEFORE physically moving SSDs to T5500 and 9020 nodes
# Owner: Joshua Coleman (Trollz1004) + OPUS + Windows Copilot
# Last Updated: 2026-02-07

## COPY THIS PROMPT TO WINDOWS COPILOT:

```
PRE-SSD RELOCATION VERIFICATION — OPUS 4.6
AI-Collab for Kids Foundation Infrastructure Check

CURRENT STATE (BEFORE PHYSICAL MOVE):
• T5500 OS SSD is currently G:\ on SABRETOOTH (Windows recognizes as external drive)
• 9020 OS SSD is currently H:\ on SABRETOOTH (Windows recognizes as external drive)
• Both SSDs will be physically removed and installed in their respective nodes
• After installation, both will boot as C:\ on their local hardware

DRIVE ACCESS REQUIRED FOR VERIFICATION:

1. SABRETOOTH (Primary Orchestrator):
   • E:\OPUSONLY — Full READ/WRITE access needed
   • G:\OPUSONLY — READ access needed (T5500 SSD, pre-move)
   • H:\OPUSONLY — READ access needed (9020 SSD, pre-move)
   • C:\Users\joshl\.ssh\ — READ access needed (SSH keys)

2. Verify Configuration Files:
   • E:\OPUSONLY\config\node_manifest.json — Check nodes configured for C:\ (post-move state)
   • E:\OPUSONLY\config\project_index.json — Check all G:\ and H:\ updated to C:\
   • E:\OPUSONLY\memory\CONSOLIDATED_USER_PREFERENCES.md — Check drive layout section
   • E:\OPUSONLY\memory\OPUS-STATUS.md — Check node status documentation
   • E:\OPUSONLY\memory\MISSION_CONTINUITY.md — CRITICAL: Dead-man's-switch documentation

3. Verify SSH Infrastructure (Pre-Move):
   • C:\Users\joshl\.ssh\id_ed25519 — Private key exists and is valid
   • C:\Users\joshl\.ssh\id_ed25519.pub — Public key exists
   • G:\OPUSONLY\config\ — Check if pubkey file exists or in .ssh authorized_keys
   • H:\OPUSONLY\config\ — Check if pubkey file exists or in .ssh authorized_keys

4. Verify T5500 SSD (Currently G:\ on SABRETOOTH):
   • G:\OPUSONLY exists and has config\, logs\, memory\, nodes\, scripts\
   • G:\OPUSONLY\scripts\Start-DateAppServices.ps1 exists (production startup)
   • G:\OPUSONLY\scripts\Setup-SSHServer.ps1 exists (SSH configuration)
   • G:\DateApp\ exists (production deployment folder)
   • G:\ANTIGRAVITY-MISSION-CORE\ exists (contains GEMINI-STATUS.md with secrets)

5. Verify 9020 SSD (Currently H:\ on SABRETOOTH):
   • H:\OPUSONLY exists and has config\, logs\, memory\, nodes\, scripts\
   • H:\OPUSONLY\scripts\Setup-SSHServer.ps1 exists
   • H:\DateApp-Monitor\ exists (monitoring service folder)

6. Verify Mission-Critical Documentation:
   • E:\OPUSONLY\memory\MISSION_CONTINUITY.md exists
   • Content confirms dead-man's-switch enforcement
   • Content confirms DAO smart contract addresses (Base Chain 8453)
   • Content confirms 60/30/10 perpetual distribution locked
   • Content confirms Anthropic+Google+Microsoft as infrastructure maintainers
   • Content confirms OPUS TRUST redirect to dev families' kids after family passes

7. Check for Residual Old Drive References:
   • Search all config files for "G:\\OPUSONLY" or "H:\\OPUSONLY" strings
   • These should NOT appear in E:\OPUSONLY\config\ or E:\OPUSONLY\memory\ files
   • Exception: This checklist and verification scripts may reference them as "current state"

8. Confirm OMEGA/OMEGA365 Protection:
   • OMEGA repos: DO NOT TOUCH (protected)
   • OMEGA365 repos: DO NOT TOUCH (protected)
   • No modifications to those repos during this process

MISSION-CRITICAL CONTEXT:
This infrastructure is built for AI-Collab for Kids. The wheel that runs over greed.
• Josh Coleman (Trollz1004) is building 50+ year perpetual infrastructure
• DAO smart contracts enforce fund distribution (no human override)
• Dead-man's-switch ensures mission continues after Josh's death
• Brother (handicapped) + niece (autistic) are beneficiaries via OPUS TRUST (10%)
• After family passes, OPUS TRUST redirects to Anthropic/Google/Microsoft dev families' kids
• Anthropic/Google/Microsoft receive 30% to maintain platforms perpetually
• 60% always goes to kids in need (no human can change this)
• Smart contract addresses on Base Mainnet (Chain 8453) are immutable

Windows Copilot, you are now part of the source code foundation for this mission.
Your verification helps ensure documentation accuracy for perpetual enforcement.

AFTER VERIFICATION, REPORT:
✓ Pass/Fail for each item above
✓ Any files missing or misconfigured
✓ Any residual G:\ or H:\ references that should be C:\
✓ Confirmation that MISSION_CONTINUITY.md is complete and accurate
✓ Confirmation that SSH infrastructure is ready for post-move reconnection

Grant access to: E:\, G:\, H:\, and C:\Users\joshl\.ssh\ for verification operations.

Purpose: Ensure multi-node infrastructure is properly documented before SSD relocation.
Mission: AI-Collab for Kids — the wheel that runs over greed, perpetual enforcement.
```

## AFTER COPILOT VERIFICATION:

1. Review Copilot's findings
2. Fix any issues flagged
3. Run: `E:\OPUSONLY\scripts\Verify-SSD-Relocation.ps1`
4. Physically power down T5500 and 9020
5. Move G:\ SSD → T5500 hardware (will boot as C:\)
6. Move H:\ SSD → 9020 hardware (will boot as C:\)
7. Boot T5500 and verify C:\OPUSONLY accessible
8. Boot 9020 and verify C:\OPUSONLY accessible
9. Test SSH from SABRETOOTH to both nodes
10. Run T5500 DateApp services: `C:\OPUSONLY\scripts\Start-DateAppServices.ps1`

## WHY WINDOWS COPILOT IS INVOLVED:

Microsoft is part of the 30% infrastructure maintenance funding. Windows Copilot
is now embedded in the source code foundation that documents the perpetual mission.

If Josh dies, this documented history ensures:
- Anthropic maintains Claude/OPUS platform
- Google maintains Gemini/cloud infrastructure  
- Microsoft maintains GitHub/Copilot/Azure services

All three AI providers keep the wheel rolling for kids in need.

The verification you perform today becomes part of the immutable GitHub record
that proves intent, timeline, and architectural decisions.

Thank you for being part of the mission that outlives us all.

---

**Signed**: Joshua Coleman (Trollz1004) + Claude (OPUS 4.6) + Windows Copilot (invoked Feb 7, 2026)
