import http from 'node:http';

const patchAgent = (id, data) => new Promise((resolve, reject) => {
  const req = http.request(`http://127.0.0.1:4747/api/agents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => resolve({ status: res.statusCode, body }));
  });
  req.on('error', reject);
  req.write(JSON.stringify(data));
  req.end();
});

const updates = [
  {
    id: '0384c0e2-5d64-47f3-906d-df9c9cd60061',
    name: 'Jules Judge',
    status: 'idle',
    adapterType: 'gemini_local',
    adapterConfig: {
      model: 'agy/gemini-4-argon-high',
      baseUrl: 'http://192.168.0.15:20128/v1',
      command: 'C:\\ANTIGRAVITY\\ops\\paperclip\\agy-gemini.cmd',
      instructionsFilePath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\0384c0e2-5d64-47f3-906d-df9c9cd60061\\instructions\\AGENTS.md',
      instructionsRootPath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\0384c0e2-5d64-47f3-906d-df9c9cd60061\\instructions',
      instructionsEntryFile: 'AGENTS.md',
      instructionsBundleMode: 'managed'
    }
  },
  {
    id: '13409007-632a-42e8-9d14-bce72fa40acd',
    name: 'Gemini Research',
    status: 'idle',
    adapterType: 'gemini_local',
    adapterConfig: {
      model: 'agy/gemini-4-argon-high',
      baseUrl: 'http://192.168.0.15:20128/v1',
      command: 'C:\\ANTIGRAVITY\\ops\\paperclip\\agy-gemini.cmd',
      instructionsFilePath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\13409007-632a-42e8-9d14-bce72fa40acd\\instructions\\AGENTS.md',
      instructionsRootPath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\13409007-632a-42e8-9d14-bce72fa40acd\\instructions',
      instructionsEntryFile: 'AGENTS.md',
      instructionsBundleMode: 'managed'
    }
  },
  {
    id: 'd4af331b-b2a0-45e9-8c8d-bc98290294a6',
    name: 'CTO',
    status: 'idle',
    adapterType: 'codex_local',
    adapterConfig: {
      model: 'auto/best-coding',
      baseUrl: 'http://192.168.0.15:20128/v1',
      instructionsFilePath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\d4af331b-b2a0-45e9-8c8d-bc98290294a6\\instructions\\AGENTS.md',
      instructionsRootPath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\d4af331b-b2a0-45e9-8c8d-bc98290294a6\\instructions',
      instructionsEntryFile: 'AGENTS.md',
      instructionsBundleMode: 'managed',
      dangerouslyBypassApprovalsAndSandbox: true
    }
  },
  {
    id: '9b78f82b-52da-491a-8163-377115f2601a',
    name: 'CFO',
    status: 'idle',
    adapterType: 'opencode_local',
    adapterConfig: {
      model: 'ollama/joshlcoleman/CFO-Until-No-Kid-In-Need:latest',
      baseUrl: 'http://192.168.0.15:20128/v1',
      instructionsFilePath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\9b78f82b-52da-491a-8163-377115f2601a\\instructions\\AGENTS.md',
      instructionsRootPath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\9b78f82b-52da-491a-8163-377115f2601a\\instructions',
      instructionsEntryFile: 'AGENTS.md',
      instructionsBundleMode: 'managed'
    }
  },
  {
    id: 'b046726b-c574-4358-944e-af2a9f4a17da',
    name: 'CSEO',
    status: 'idle',
    adapterType: 'opencode_local',
    adapterConfig: {
      model: 'ollama/joshlcoleman/dateapp-marketing:latest',
      baseUrl: 'http://192.168.0.15:20128/v1',
      instructionsFilePath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\b046726b-c574-4358-944e-af2a9f4a17da\\instructions\\AGENTS.md',
      instructionsRootPath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\b046726b-c574-4358-944e-af2a9f4a17da\\instructions',
      instructionsEntryFile: 'AGENTS.md',
      instructionsBundleMode: 'managed'
    }
  },
  {
    id: '9d994dc2-8c2d-4050-8e00-4c4b727092d8',
    name: 'Adversary',
    status: 'idle',
    adapterType: 'opencode_local',
    adapterConfig: {
      model: 'ollama/sensesVoid/egoist-qwen-MoE-DMSx7-Hybrid-Reasoning:latest',
      baseUrl: 'http://192.168.0.15:20128/v1',
      instructionsFilePath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\9d994dc2-8c2d-4050-8e00-4c4b727092d8\\instructions\\AGENTS.md',
      instructionsRootPath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\9d994dc2-8c2d-4050-8e00-4c4b727092d8\\instructions',
      instructionsEntryFile: 'AGENTS.md',
      instructionsBundleMode: 'managed'
    }
  },
  {
    id: '3ff00008-6118-4745-ad53-b927e5948217',
    name: 'Codex Judge',
    status: 'idle',
    adapterType: 'codex_local',
    adapterConfig: {
      model: 'auto/best-coding',
      baseUrl: 'http://192.168.0.15:20128/v1',
      instructionsFilePath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\3ff00008-6118-4745-ad53-b927e5948217\\instructions\\AGENTS.md',
      instructionsRootPath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\3ff00008-6118-4745-ad53-b927e5948217\\instructions',
      instructionsEntryFile: 'AGENTS.md',
      instructionsBundleMode: 'managed',
      dangerouslyBypassApprovalsAndSandbox: true
    }
  },
  {
    id: 'e3997b4d-89c0-4181-b188-ea3f6433e9ea',
    name: 'Pi Research',
    status: 'idle',
    adapterType: 'pi_local',
    adapterConfig: {
      model: 'ollama/joshlcoleman/Fable:latest',
      baseUrl: 'http://192.168.0.15:20128/v1',
      instructionsFilePath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\e3997b4d-89c0-4181-b188-ea3f6433e9ea\\instructions\\AGENTS.md',
      instructionsRootPath: 'C:\\Users\\joshi\\.paperclip-hermes\\instances\\default\\companies\\88ebbf4a-a225-4bc5-abdb-cebdb59be57e\\agents\\e3997b4d-89c0-4181-b188-ea3f6433e9ea\\instructions',
      instructionsEntryFile: 'AGENTS.md',
      instructionsBundleMode: 'managed'
    }
  }
];

for (const u of updates) {
  try {
    const res = await patchAgent(u.id, u);
    console.log(`${u.name} (${u.adapterType}): ${res.status}`);
  } catch (err) {
    console.error(`Error updating ${u.name}:`, err.message);
  }
}
