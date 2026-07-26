# STATE — session diary

Short. Overwrite each session, don't let this grow. If it's longer than ~15 lines, you're keeping too much.

## Last session
```
Date: 2026-07-22
Changed: Built ops/ceo-harness/*. Pointed live CEO agent's Capabilities field
  at ONE-ENTRY-POINT.md. Merged Josh's standing-facts correction: Laptop is
  browser/control seat only, NOT a live Paperclip instance (T5500 is).
  Added Hermes GUI (9119) / OpenClaw (18789) port distinction. Committed
  locally: 9e319a7 "Add CEO agent harness...". 1 commit ahead of
  origin/main, NOT pushed yet -- Cowork bridge has no network for git push.
Nodes: CONFIRMED -- Paperclip/Hermes runs on T5500, not Sabretooth, not
  Laptop. OmniRoute gate host (Sabretooth vs Laptop) still open.
Ornith: not pulled anywhere yet. T5500 is the priority node.
Git note: bridge git leaves stale .git/*.lock and objects/tmp_obj_* files
  after every call (can't unlink, only mv -- moved 13+ into
  C:\clean\_to_delete\, safe to delete that folder anytime). Repo itself is
  clean and correct; only debris is cosmetic.
TODO: (1) Josh runs `git push origin main` from his own client -- commit is
  already made, nothing else to stage. (2) Pull ornith:9b on T5500 first.
  (3) OmniRoute gate host still needs confirming.
Quota: n/a this session
```

## Template for next update
```
Date: YYYY-MM-DD
Changed: <one line>
Nodes: <node — status>
Ornith: <node — pulled/verified/not started>
TODO: <one line>
Quota: <ok / floor hit>
```
