-- Switch CFO + CEO to opencode_local with GLM-5.1:cloud
UPDATE agents SET
  adapter_type = 'opencode_local',
  adapter_config = jsonb_set(adapter_config, '{model}', '"ollama/glm-5.1:cloud"'),
  updated_at = now()
WHERE id IN (
  'cf6c84e2-c37f-492f-9a49-2d5f3c4a56e1',
  'c4b4a3d9-8e66-4463-bf65-abfc5037b92a'
);

-- Mission Guardians (Claude + Codex) → daily heartbeat only
UPDATE agents SET
  runtime_config = jsonb_set(runtime_config, '{heartbeat,intervalSec}', '86400'),
  updated_at = now()
WHERE id IN (
  '2229682b-cede-4462-b38b-25a910af022e',
  '42200bfa-fb9e-42b1-901d-6dadf15eb23b'
);

-- Verify
SELECT name, adapter_type,
  runtime_config->'heartbeat'->>'intervalSec' AS heartbeat_sec,
  adapter_config->>'model' AS model
FROM agents
ORDER BY name;
