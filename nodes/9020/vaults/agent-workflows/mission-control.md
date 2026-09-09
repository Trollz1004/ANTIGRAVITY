# Mission Control

Status: FUTURE integration.

Node 9020 will tie into Mission Control via node-agent, which binds 0.0.0.0:3140 on this host, with omni-router on loopback port 20128. This is the observability/coordination path for the node — it comes after the SCC + Paperclip work, not before.
