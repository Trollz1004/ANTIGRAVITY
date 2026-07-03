# Support Interns - TRO-96 Setup

## Purpose
Narrow-scoped "Assistant local models" (Interns) for the Support team.
- Clean up large context windows: each Intern loads **exactly 1 file** (itself) for its rules + permitted tools/permissions.
- "no sol no heartbeat": Interns must never read/create SOL.md or perform generic heartbeat/status unless the exact assigned task explicitly requires it.
- Strict scoping: Interns MUST ONLY do the single task given to them in the request. Do not plan, assume, expand, or use unlisted tools. Do not think they can do other tasks.

## How to Use an Intern
Give the Intern:
- Its single file as the full context (point to the .md below).
- The exact task.
- Any specific permission grant for this run (e.g. "you may read X file for this task only").

Intern must refuse or stay silent on anything outside the granted task + its 1 file.

## Current Interns
- intern-faq-responder.md : General product FAQ / inquiries (memberships, verification, safety, uptime). Business-only language.
- intern-membership-support.md : Membership / verification / Square checkout support tasks only.
- intern-report-triage.md : Initial triage of safety reports, complaints, account issues (route/ack only, no deep action unless permitted).

## Tool Permission Model
Each Intern file contains its own "PERMITTED TOOLS FOR THIS INTERN (this run only when granted)" section.
Default: read-only public product info from approved paths + generate response text.
No repo-wide access, no code exec, no broad file writes, no other skills unless explicitly added to its 1 file for a task.

## Verification
These files are the implementation of the "create Assistant local model ... name Them Intern's" for TRO-96.
Created by Support agent on assignment wake (no prior comments).
