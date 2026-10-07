#!/usr/bin/env node
/**
 * gemini-node-mcp
 * Standing Gemini Co-Builder MCP Server for Antigravity & Node Operations.
 * 
 * Supports:
 * - t5500_status: Inspect 7-stage T5500 production health and Cloudflare tunnel.
 * - t5500_heal: Trigger keepalive.ps1 -Once self-healing cycle.
 * - alienware_exec: Run commands on Alienware dev node (192.168.0.40) over SSH.
 * - obsidian_append: Append audit/landmark entries directly to Obsidian vault.
 * - verify_1branch: Verify strict 1-branch rule on all active repos.
 * - easy_button: Run complete easy-button audit & heal report.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = 'C:\\ANTIGRAVITY';
const OBSIDIAN_VAULT = path.join(REPO_ROOT, 'Antigravity');
const STATUS_FILE = path.join(REPO_ROOT, 'ops', 't5500', 'status.json');
const KEEPALIVE_SCRIPT = path.join(REPO_ROOT, 'ops', 't5500', 'keepalive.ps1');
const EASY_BUTTON_SCRIPT = path.join(REPO_ROOT, 'ops', 't5500', 'easy-button.ps1');

// Send JSON-RPC response
function sendResponse(response) {
  const json = JSON.stringify(response);
  process.stdout.write(json + '\n');
}

// Tool handlers
async function handleToolCall(name, args) {
  switch (name) {
    case 't5500_status': {
      try {
        if (fs.existsSync(STATUS_FILE)) {
          let raw = fs.readFileSync(STATUS_FILE, 'utf8');
          raw = raw.replace(/^\uFEFF/, '').trim();
          const data = JSON.parse(raw);
          const lines = [
            `T5500 Node Status (Updated: ${data.updated})`,
            `Node: ${data.node}`,
            '--- Stages ---'
          ];
          for (const s of data.stages || []) {
            lines.push(`- ${s.stage}: ${s.status} (Failures: ${s.consecutive_failures})`);
          }
          lines.push('--- Domains ---');
          for (const d of data.domains || []) {
            lines.push(`- ${d.domain}: Origin=${d.origin}, Public=${d.public} (${d.nameservers})`);
          }
          return lines.join('\n');
        } else {
          return `Status file not found at ${STATUS_FILE}. Run t5500_heal to generate.`;
        }
      } catch (err) {
        return `Error reading T5500 status: ${err.message}`;
      }
    }

    case 't5500_heal': {
      try {
        const cmd = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${KEEPALIVE_SCRIPT}" -Once`;
        const output = execSync(cmd, { encoding: 'utf8', timeout: 60000 });
        return `T5500 Heal Cycle Completed:\n${output.trim()}`;
      } catch (err) {
        return `Error executing T5500 heal cycle: ${err.message}\n${err.stdout || ''}`;
      }
    }

    case 'alienware_exec': {
      const command = args && args.command;
      if (!command) {
        throw new Error('Missing required argument: command');
      }
      try {
        const escaped = command.replace(/"/g, '\\"');
        const sshCmd = `ssh alienware "${escaped}"`;
        const output = execSync(sshCmd, { encoding: 'utf8', timeout: 30000 });
        return `[Alienware (192.168.0.40) Output]:\n${output.trim()}`;
      } catch (err) {
        return `Error running command on Alienware: ${err.message}\n${err.stdout || ''}\n${err.stderr || ''}`;
      }
    }

    case 'obsidian_append': {
      const title = args && args.title;
      const content = args && args.content;
      if (!title || !content) {
        throw new Error('Missing required arguments: title and content');
      }
      try {
        const today = new Date().toISOString().split('T')[0];
        const notePath = path.join(OBSIDIAN_VAULT, `${today}.md`);
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const entry = `\n\n## ${title} - ${timestamp}\n\n${content}\n`;
        fs.appendFileSync(notePath, entry, 'utf8');
        return `Successfully appended entry to Obsidian note: ${notePath}`;
      } catch (err) {
        return `Error appending to Obsidian: ${err.message}`;
      }
    }

    case 'verify_1branch': {
      try {
        const results = [];
        const repos = [
          { name: 'ANTIGRAVITY', path: REPO_ROOT },
          { name: 'misses-trollz', path: path.join(REPO_ROOT, 'misses-trollz') }
        ];

        for (const repo of repos) {
          if (fs.existsSync(repo.path) && fs.existsSync(path.join(repo.path, '.git'))) {
            try {
              const branches = execSync('git branch --list', { cwd: repo.path, encoding: 'utf8' })
                .split('\n')
                .map(b => b.replace('*', '').trim())
                .filter(Boolean);
              const is1Branch = branches.length === 1 && branches[0] === 'main';
              results.push(`- ${repo.name}: ${branches.join(', ')} [${is1Branch ? 'PASS: 1-branch' : 'VIOLATION'}]`);
            } catch (gitErr) {
              results.push(`- ${repo.name}: git check error (${gitErr.message})`);
            }
          } else {
            results.push(`- ${repo.name}: Path not found (${repo.path})`);
          }
        }
        return `1-Branch Verification Status:\n${results.join('\n')}`;
      } catch (err) {
        return `Error during 1-branch audit: ${err.message}`;
      }
    }

    case 'easy_button': {
      try {
        const cmd = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${EASY_BUTTON_SCRIPT}"`;
        const output = execSync(cmd, { encoding: 'utf8', timeout: 60000 });
        return output.trim();
      } catch (err) {
        return `Error running easy-button: ${err.message}\n${err.stdout || ''}`;
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Tool definitions for MCP tools/list
const TOOLS = [
  {
    name: 't5500_status',
    description: 'Inspect the current status of all 7 production stages, domain origins, and cloudflare tunnels on the T5500 node.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 't5500_heal',
    description: 'Trigger a one-time self-healing cycle on the T5500 node via keepalive.ps1 -Once.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'alienware_exec',
    description: 'Execute a command remotely on the Alienware dev node (192.168.0.40) over authenticated SSH.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The command line string to execute on Alienware'
        }
      },
      required: ['command']
    }
  },
  {
    name: 'obsidian_append',
    description: 'Append an audit or session log block to the Obsidian daily note in C:\\ANTIGRAVITY\\Antigravity\\YYYY-MM-DD.md.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Section header title'
        },
        content: {
          type: 'string',
          description: 'Markdown body content to append'
        }
      },
      required: ['title', 'content']
    }
  },
  {
    name: 'verify_1branch',
    description: 'Verify the standing rule of strictly 1 branch (main) across all active repositories.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'easy_button',
    description: 'Run the full easy-button audit/heal script (ops/t5500/easy-button.ps1) and return the complete health table.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// Handle incoming JSON-RPC message
async function handleMessage(msg) {
  if (!msg || typeof msg !== 'object') return;

  const { id, method, params } = msg;

  if (method === 'initialize') {
    sendResponse({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'gemini-node-mcp',
          version: '1.0.0'
        }
      }
    });
    return;
  }

  if (method === 'notifications/initialized') {
    return;
  }

  if (method === 'ping') {
    sendResponse({
      jsonrpc: '2.0',
      id,
      result: {}
    });
    return;
  }

  if (method === 'tools/list') {
    sendResponse({
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOLS
      }
    });
    return;
  }

  if (method === 'tools/call') {
    try {
      const toolName = params && params.name;
      const toolArgs = (params && params.arguments) || {};
      const output = await handleToolCall(toolName, toolArgs);
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: typeof output === 'string' ? output : JSON.stringify(output, null, 2)
            }
          ]
        }
      });
    } catch (err) {
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error: ${err.message}`
            }
          ]
        }
      });
    }
    return;
  }

  if (id !== undefined) {
    sendResponse({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`
      }
    });
  }
}

// Buffer to accumulate stdio chunks
let buffer = '';

process.stdin.setEncoding('utf8');

process.stdin.on('data', chunk => {
  buffer += chunk;

  while (buffer.length > 0) {
    // Check for Content-Length header framing
    if (buffer.startsWith('Content-Length:')) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) {
        break;
      }
      const header = buffer.substring(0, headerEnd);
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        buffer = buffer.substring(headerEnd + 4);
        continue;
      }
      const contentLength = parseInt(match[1], 10);
      const bodyStart = headerEnd + 4;
      if (buffer.length < bodyStart + contentLength) {
        break;
      }
      const body = buffer.substring(bodyStart, bodyStart + contentLength);
      buffer = buffer.substring(bodyStart + contentLength);
      try {
        const msg = JSON.parse(body);
        handleMessage(msg);
      } catch (e) {
        // Ignore parse error
      }
      continue;
    }

    // Check for newline-delimited JSON
    const newlineIndex = buffer.indexOf('\n');
    if (newlineIndex !== -1) {
      const line = buffer.substring(0, newlineIndex).trim();
      buffer = buffer.substring(newlineIndex + 1);
      if (line.length > 0) {
        try {
          const msg = JSON.parse(line);
          handleMessage(msg);
        } catch (e) {
          // Ignore non-json lines
        }
      }
      continue;
    }

    // Incomplete data
    break;
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});

process.on('uncaughtException', err => {
  // Prevent crash
});
