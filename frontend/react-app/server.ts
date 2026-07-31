/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = Number(process.env.PORT || 8080);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types
type Vector3 = { x: number; y: number; z: number };

interface Player {
  id: string;
  color: string;
  position: Vector3 | null;
  lastUpdate: number;
}

interface ForceField {
  id: string;
  position: Vector3;
  type: 'attractor' | 'repulsor';
  ownerId: string;
  createdAt: number;
  color: string;
}

// State
const players = new Map<string, Player>();
const forceFields = new Map<string, ForceField>();
const clients = new Map<string, WebSocket>();

// Colors for players (Romantic/Cosmic theme)
const COLORS = [
  '#FF3366', // Hot Pink
  '#FF66B2', // Rose
  '#CC33FF', // Purple
  '#FF99CC', // Pastel Pink
  '#FF0000', // Red
  '#FFD700', // Gold
  '#E6E6FA', // Lavender
  '#FF4500', // Orange Red
];

function broadcast(data: any, excludeId?: string) {
  const message = JSON.stringify(data);
  for (const [id, ws] of clients.entries()) {
    if (id !== excludeId && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // WebSocket Server
  const wss = new WebSocketServer({ server });

  wss.on('connection', ws => {
    const id = uuidv4();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const player: Player = {
      id,
      color,
      position: null,
      lastUpdate: Date.now(),
    };

    players.set(id, player);
    clients.set(id, ws);

    // Send initial state to the new client
    ws.send(
      JSON.stringify({
        type: 'init',
        id,
        color,
        players: Array.from(players.values()),
        forceFields: Array.from(forceFields.values()),
      })
    );

    // Broadcast new player to others
    broadcast(
      {
        type: 'player_joined',
        player,
      },
      id
    );

    ws.on('message', message => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'cursor') {
          const p = players.get(id);
          if (p) {
            p.position = data.position;
            p.lastUpdate = Date.now();
          }
        } else if (data.type === 'add_force') {
          const forceId = uuidv4();
          const force: ForceField = {
            id: forceId,
            position: data.position,
            type: data.forceType,
            ownerId: id,
            createdAt: Date.now(),
            color: data.color,
          };
          forceFields.set(forceId, force);

          // Broadcast new force field immediately
          broadcast({
            type: 'force_added',
            force,
          });
        }
      } catch (e) {
        console.error('Invalid message', e);
      }
    });

    ws.on('close', () => {
      players.delete(id);
      clients.delete(id);

      // Remove player's force fields
      for (const [forceId, force] of forceFields.entries()) {
        if (force.ownerId === id) {
          forceFields.delete(forceId);
        }
      }

      broadcast({
        type: 'player_left',
        id,
      });
    });
  });

  // Broadcast loop (20Hz)
  setInterval(() => {
    const now = Date.now();

    // Clean up old force fields (e.g., after 10.5 seconds to allow client animation)
    let forcesChanged = false;
    for (const [id, force] of forceFields.entries()) {
      if (now - force.createdAt > 10500) {
        forceFields.delete(id);
        forcesChanged = true;
      }
    }

    const updateData = {
      type: 'sync',
      players: Array.from(players.values()).filter(p => p.position !== null),
      ...(forcesChanged
        ? { forceFields: Array.from(forceFields.values()) }
        : {}),
    };

    broadcast(updateData);
  }, 50);

  // API routes
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', players: players.size });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', players: players.size });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Public traffic arrives via the cloudflared tunnel with the real
        // hostname — Vite's host check 403s anything not listed here.
        allowedHosts: ['.youandinotai.com', 'localhost', '127.0.0.1'],
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');

    // Serve static assets with CDN-ready cache headers.
    // Fingerprinted assets (containing a hash like abc1234) get long-term immutable caching.
    // Non-fingerprinted assets and HTML get short/no caching.
    app.use(express.static(distDir, {
      setHeaders(res, filePath) {
        // HTML files: no-cache so clients always get the latest entry point
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          return;
        }

        // Fingerprinted assets: hash in filename (e.g. main-abc1234.js, vendor-def5678.css)
        // These are safe to cache forever because the hash changes when content changes.
        const basename = path.basename(filePath);
        const hasHash = /-[a-f0-9]{8,}\./.test(basename);
        if (hasHash) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return;
        }

        // All other static assets (images, fonts, etc.): moderate cache
        res.setHeader('Cache-Control', 'public, max-age=86400');
      },
    }));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
