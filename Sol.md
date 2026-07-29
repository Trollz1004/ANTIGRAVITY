# Solution: Hermes Infrastructure Stability on OmniRoute
This Sol.md file defines the strict operational boundaries for the Hermes agent.

[agent]
name = "Hermes-Infrastructure-Velocity"
version = "4.0.0-Canonical"
framework = "Hermes-Core"

[omnirout.config]
auth_mode = "OMNIROUTE_KEY_ONLY"
fail_closed = true
max_concurrent_nodes = 6

[hardware.node_registry]
primary_node = "T5500 (192.168.0.15:20128 - GTX 1070)"
secondary_node = "NONE"
paperclip_node = "T5500 (paperclip-local)"
cloud_wrapper = "VS Code CLI (glm-5.2:cloud)"

[safety.electrical_guardrails]
max_load_threshold_percent = 80
block_direct_model_fallback = true
enforce_lap_drift_protection = true
