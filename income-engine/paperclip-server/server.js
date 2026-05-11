const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
app.use(express.json());

const companies = [];
const agents = [];

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'paperclip-3101' }));

app.post('/api/companies', (req, res) => {
  const company = { id: uuidv4(), name: req.body.name || 'CLAUDEs Antigravity', apiKey: uuidv4() };
  companies.push(company);
  res.json(company);
});

app.get('/api/companies', (req, res) => res.json(companies));

app.post('/api/agents', (req, res) => {
  const agent = { id: uuidv4(), name: req.body.name, role: req.body.role, companyId: req.body.companyId, status: 'active' };
  agents.push(agent);
  res.json(agent);
});

app.post('/api/companies/:id/agents', (req, res) => {
  const agent = { 
    id: uuidv4(), 
    name: req.body.name, 
    role: req.body.role, 
    title: req.body.title, 
    companyId: req.params.id, 
    reportsTo: req.body.reportsTo, 
    capabilities: req.body.capabilities, 
    adapterType: req.body.adapterType, 
    adapterConfig: req.body.adapterConfig, 
    runtimeConfig: req.body.runtimeConfig, 
    defaultEnvironmentId: req.body.defaultEnvironmentId, 
    budgetMonthlyCents: req.body.budgetMonthlyCents, 
    permissions: req.body.permissions, 
    status: 'active', 
    createdAt: new Date().toISOString() 
  };
  agents.push(agent);
  res.json(agent);
});

app.get('/api/companies/:id/agents', (req, res) => {
  res.json(agents.filter(a => a.companyId === req.params.id));
});

app.get('/api/agents/:id', (req, res) => {
  const agent = agents.find(a => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Not found' });
  res.json(agent);
});

app.post('/api/agents/:id/heartbeat', (req, res) => {
  const agent = agents.find(a => a.id === req.params.id);
  if (agent) agent.lastHeartbeat = new Date().toISOString();
  res.json({ ok: true });
});

app.listen(3101, () => console.log('[Paperclip-3101] Running on port 3101'));
