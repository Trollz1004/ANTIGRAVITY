const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 18895;
const CONFIG_PATH = '/var/lib/supportclaw/state/openclaw.json';

app.use(express.json());

// Load config
let config = {};
if (fs.existsSync(CONFIG_PATH)) {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', profile: config.meta?.profile || 'supportclaw-t5500' });
});

// Support chat endpoint
app.post('/chat', (req, res) => {
  const { sessionId, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message required' });
  }

  // Basic routing logic for support
  const isShouldEscalate =
    message.toLowerCase().includes('escalate') ||
    message.toLowerCase().includes('problem') ||
    message.toLowerCase().includes('help');

  const category = message.toLowerCase().includes('receipt')
    ? 'billing'
    : message.toLowerCase().includes('verification')
      ? 'verification'
      : message.toLowerCase().includes('app')
        ? 'technical'
        : 'general';

  res.json({
    sessionId,
    reply: `Support received: ${message.substring(0, 50)}...`,
    should_escalate: isShouldEscalate,
    category,
    subject: `Support ticket for: ${category}`,
    escalation_reason: isShouldEscalate ? 'Complex request requiring human review' : null,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`SupportClaw gateway running on port ${PORT}`);
  console.log(`Profile: ${config.meta?.profile || 'supportclaw-t5500'}`);
  console.log(`Workspace: /var/lib/supportclaw/workspace`);
  console.log(`State: /var/lib/supportclaw/state`);
});
