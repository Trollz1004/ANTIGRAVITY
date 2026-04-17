const fs = require('fs');

const [, , targetPath, kind, modelRef, modelId, hostPort] = process.argv;

if (!targetPath || !kind || !modelRef || !modelId || !hostPort) {
  console.error(
    'usage: node normalize-openclaw-ollama-json.js <path> <openclaw|models> <modelRef> <modelId> <hostPort>',
  );
  process.exit(1);
}

const provider = {
  baseUrl: `http://${hostPort}/v1`,
  apiKey: 'ollama-local',
  api: 'openai-completions',
  models: [
    {
      id: modelId,
      name: modelId,
      reasoning: false,
      input: ['text'],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
      },
      contextWindow: 128000,
      maxTokens: 8192,
    },
  ],
};

const raw = fs.readFileSync(targetPath, 'utf8').replace(/^\uFEFF/, '');
const json = JSON.parse(raw);

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

if (json.models?.providers) {
  for (const provider of Object.values(json.models.providers)) {
    if (!provider || typeof provider !== 'object') continue;
    if ('models' in provider) provider.models = ensureArray(provider.models);
    if (Array.isArray(provider.models)) {
      for (const model of provider.models) {
        if (model && 'input' in model) model.input = ensureArray(model.input);
      }
    }
  }
}

if (json.agents?.list) {
  json.agents.list = ensureArray(json.agents.list);
}

if (kind === 'openclaw') {
  json.models ??= {};
  json.models.mode = 'merge';
  json.models.providers ??= {};
  json.models.providers.ollama = provider;

  json.agents ??= {};
  json.agents.defaults ??= {};
  json.agents.defaults.model ??= {};
  json.agents.defaults.model.primary = modelRef;
  json.agents.defaults.subagents ??= {};
  json.agents.defaults.subagents.model ??= {};
  json.agents.defaults.subagents.model.primary = modelRef;
  json.agents.defaults.models ??= {};
  json.agents.defaults.models[modelRef] = { alias: 'Local qwen2.5:7b' };

  if (Array.isArray(json.agents.list)) {
    for (const agent of json.agents.list) {
      agent.model ??= {};
      agent.model.primary = modelRef;
    }
  }
} else if (kind === 'models') {
  json.providers ??= {};
  json.providers.ollama = provider;
} else {
  console.error(`unknown kind: ${kind}`);
  process.exit(1);
}

fs.writeFileSync(targetPath, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
