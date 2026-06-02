# Graph Report - app  (2026-06-02)

## Corpus Check
- 100 files · ~40,709 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 420 nodes · 463 edges · 69 communities (58 shown, 11 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e8b5b0a2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 25 edges
2. `_assert_no_forbidden()` - 9 edges
3. `TestLedger` - 9 edges
4. `require_admin()` - 7 edges
5. `_now()` - 6 edges
6. `chat_send()` - 6 edges
7. `_session_secret()` - 6 edges
8. `WebpackHealthPlugin` - 6 edges
9. `_new_id()` - 5 edges
10. `_verify_token()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `MenubarShortcut()` --calls--> `cn()`  [INFERRED]
  frontend/src/components/ui/menubar.jsx → frontend/src/lib/utils.js
- `Skeleton()` --calls--> `cn()`  [INFERRED]
  frontend/src/components/ui/skeleton.jsx → frontend/src/lib/utils.js
- `Calendar()` --calls--> `cn()`  [INFERRED]
  frontend/src/components/ui/calendar.jsx → frontend/src/lib/utils.js
- `CommandShortcut()` --calls--> `cn()`  [INFERRED]
  frontend/src/components/ui/command.jsx → frontend/src/lib/utils.js
- `Badge()` --calls--> `cn()`  [INFERRED]
  frontend/src/components/ui/badge.jsx → frontend/src/lib/utils.js

## Communities (69 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (24): cn(), AlertDialogFooter(), AlertDialogHeader(), Badge(), BreadcrumbEllipsis(), BreadcrumbSeparator(), Calendar(), CommandShortcut() (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (15): LoginRequest, BroadcastRequest, ChatMessage, UnifiedChatRequest, _bridge_via_emergent(), ChatCompletionsRequest, ChatMessage, create_status_check() (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (11): Iteration 4 tests — Graphify + Doctrine + Node Identity + Stripe-410 webhook.  C, The /doctrine endpoint intentionally lists forbidden words inside         forbid, _sweep(), test_endpoint_clean(), TestDoctrine, TestDoctrineSweep, TestGraphifyRegraph, TestGraphifyStatus (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (10): created_task_ids(), _no_forbidden(), Iteration-2 regression: hub.py (multi-platform chat + broadcast) + tasks.py (Pap, Best-effort cleanup of TEST_-prefixed tasks created above., Track ids created in this module so we can cleanup at end., test_chat_send_hermes_fast_real_bridge(), test_cleanup_remaining(), test_no_forbidden_strings_new_endpoints() (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (6): Iteration 3 backend tests: - Mission Ledger (contribute / list / stats / webhook, Insert a stale heartbeat for cfo and verify alerts appear., TestDoctrine, TestImages, TestLedger, TestWatchdog

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (21): doctrine(), graphify_regraph(), graphify_status(), node_identity(), Graphify integration + node identity + doctrine snapshot.  Graphify — runs the `, Synchronously re-run graphify on the workspace. Blocks until done., Synchronously re-run graphify on the workspace. Blocks until done., Synchronously re-run graphify on the workspace. Blocks until done. (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (17): beat(), create_task(), delete_task(), dispatch(), DispatchRequest, HeartbeatPayload, list_agents(), _new_id() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (7): GitPanel(), HermesRouterPanel(), LaunchPanel(), PaperclipWorkerPanel(), RunbookViewer(), SystemStatus(), MissionMode()

### Community 8 - "Community 8"
Cohesion: 0.21
Nodes (16): _admin_password(), auth_login(), auth_status(), _mint_token(), Admin sign-in + Sabretooth dev-node SSH relay.  Sign-in: per directive ("admin d, Dependency-style guard — raises 401/503 if not signed in.     Call inside any ha, Connectivity readout BEFORE attempting any execution.     Returns: env config, r, Run one whitelisted command on Sabretooth and stream output back. (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (16): _broadcast_status(), broadcast_telegram(), broadcast_whatsapp(), _byok_chat(), chat_send(), _emergent_chat(), list_providers(), _local_chat() (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.21
Nodes (10): _assert_no_forbidden(), Mission Control backend regression tests.  Covers:   - /api/ identity   - /api/h, test_agents_six_no_haiku(), test_dao_stats_shape(), test_hermes_chat_completions_fast(), test_hermes_healthz(), test_mission_metrics_tag(), test_no_forbidden_strings_across_endpoints() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (13): generate_image(), _heartbeat_loop(), ImageRequest, install_watchdog(), list_images(), _now(), Watchdog + Image generation backends.  Watchdog: synthetic per-tick heartbeats f, Recent generations — without the heavy base64 payload. (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (6): AgeGate(), SignInGate(), TaskCommander(), TitleBar(), CodeMode(), CreateMode()

### Community 13 - "Community 13"
Cohesion: 0.21
Nodes (10): contribute(), ContributionCreate, _new_id(), _now(), Mission Ledger — every dollar committed to the kids fund, tracked.  Replaces the, Permissive intake. Payment surface diversified per latest directive:     Square, Aggregate stats — drives the Mission ribbon., stats() (+2 more)

### Community 14 - "Community 14"
Cohesion: 0.28
Nodes (5): DAOMonitor(), Sidebar(), ChatProvider(), useChat(), ChatMode()

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (7): addToRemoveQueue(), dispatch(), genId(), reducer(), toast(), useToast(), Toaster()

### Community 19 - "Community 19"
Cohesion: 0.4
Nodes (3): formatUsd(), MissionRibbon(), ShareMissionModal()

## Knowledge Gaps
- **49 isolated node(s):** `Task management system — Paperclip replacement.  Replaces the Paperclip CEO/CFO/`, `Return every agent + load + heartbeat status.`, `Fan a single brief out to multiple agents. Returns the created task ids.`, `Top-line counters that drive the Mission ribbon.`, `OpusPawClaw / Mission Control backend.  Mirrors the contract of the local Hermes` (+44 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ImageRequest` connect `Community 11` to `Community 1`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `MissionMode()` connect `Community 7` to `Community 12`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 0` to `Community 16`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 24 inferred relationships involving `cn()` (e.g. with `Skeleton()` and `Calendar()`) actually correct?**
  _`cn()` has 24 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Task management system — Paperclip replacement.  Replaces the Paperclip CEO/CFO/`, `Return every agent + load + heartbeat status.`, `Fan a single brief out to multiple agents. Returns the created task ids.` to the rest of the system?**
  _49 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._