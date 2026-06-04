---
name: "fetcher-trigger"
description: "CEO tool: schedule and manually trigger FETCHER agent scans."
version: "1.0.0"
category: "ceo"
---

# Fetcher Trigger Tool

## Purpose
CEO schedules FETCHER scans every 30 minutes and can also fire manual scans on Joshua's command.

## Schedule
- Auto: every 30 minutes
- Manual: on "scan for leads" command from Joshua

## Rules
1. Only trigger one scan at a time — no overlap
2. Log trigger time to .logs/fetcher-trigger.log
3. If scan is already running, return current status — don't queue another
4. Alert CEO heartbeat when scan completes with result summary

## Inputs
- Schedule timer (30min)
- Manual command from Joshua

## Outputs
- Scan initiated confirmation
- On completion: { total, qualified, top_pick }
