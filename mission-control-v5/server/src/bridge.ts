/**
 * BRIDGE HUB — Wires external AI CLI tools (fcc-claude, OpenClaw) into the MC v5 API.
 * This allows the dashboard to act as a unified chat interface for the bridge.
 */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { Express } from 'express';

const execAsync = promisify(exec);

export async function registerBridgeRoutes(app: Express): Promise<void> {
  // ── FCC-Claude Bridge ──────────────────────────────────────────────────────
  // Route: POST /api/bridge/fcc
  // Body: { prompt: string }
  app.post('/api/bridge/fcc', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

      // We wrap the prompt in a way that the FCC CLI can handle it
      // Assuming 'fcc-claude' is on the system PATH
      const { stdout, stderr } = await execAsync(`fcc-claude "${prompt.replace(/"/g, '\\"')}"`);
      
      res.json({ 
        sender: 'fcc-claude',
        text: stdout || stderr,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(502).json({ 
        error: 'FCC-Claude bridge failure', 
        detail: err instanceof Error ? err.message : String(err) 
      });
    }
  });

  // ── OpenClaw Bridge ─────────────────────────────────────────────────────────
  // Route: POST /api/bridge/openclaw
  // Body: { prompt: string }
  app.post('/api/bridge/openclaw', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

      // OpenClaw is usually driven via its own API or a CLI wrapper
      // Here we implement a placeholder that calls the local OpenClaw API if configured
      const openclawPort = process.env.OPENCLAW_PORT || '18789';
      const response = await fetch(`http://127.0.0.1:${openclawPort}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });

      if (!response.ok) throw new Error(`OpenClaw responded with ${response.status}`);
      
      const data = await response.json() as any;
      res.json({
        sender: 'openclaw',
        text: data.reply || data.text || 'No response from OpenClaw',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(502).json({ 
        error: 'OpenClaw bridge failure', 
        detail: err instanceof Error ? err.message : String(err) 
      });
    }
  });
}
