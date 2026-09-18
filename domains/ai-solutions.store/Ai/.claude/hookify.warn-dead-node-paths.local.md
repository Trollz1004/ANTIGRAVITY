---
name: warn-dead-node-paths
enabled: true
event: all
pattern: (nodes[\\/]9020|node-workloads[\\/]9020|C:[\\/]+Users[\\/]+joshl[\\/]|\bT5500\b.*(node|role|move to)|i7k32GB1050ti)
---

⚠️ **That path or node name is dead.**

- `nodes/9020/…`, `C:/node-workloads/9020/…`, host `i7k32GB1050ti`, "node 9020 (the marketing
  node)" — Joshua: *"no 9020"*. Those notes were frozen 2026-08-21 and contradict current doctrine
  (Hermes quarantined, Ornith as CEO, business-exchange :3050 — all wrong now).
- `C:/Users/joshl/` — the profile is `joshi`; `joshl` is a pre-reinstall path.
- **T5500 the role is dead**; the T5500 **machine** (`DESKTOP-TQD7EIT`, 64 GB, RX 6800) is real and
  reserved as the DREAM Online server. `192.168.0.8` is **SABRETOOTH**, this box, not a T5500.

`C:\ANTIGRAVITY` is the sole canonical working tree. If you are *reading* a dead path as
evidence, fine — label it stale. If you are *writing* it into doctrine, a vault, a target
registry, or a config, stop and use the current truth in `docs/ops/NODE-AND-PORT-MAP.md`.
