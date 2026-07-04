const express = require('express');
const { Pool } = require('pg');
const taskRoutes = require('./routes/tasks');
const syncRoute = require('./routes/sync');
const mcpRoute = require('./routes/mcp');
const dispatchRoute = require('./routes/dispatch');

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/agent_hub'
});

app.use((req, res, next) => {
  req.db = pool;
  next();
});

const apiKeyAuth = require('./middleware/auth');
app.use('/api', apiKeyAuth);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'agent-hub', version: '1.0.0' });
});

app.use('/api/entities/AgentTask', taskRoutes);
app.use('/api/functions', syncRoute);
app.use('/api/mcp', mcpRoute);
app.use('/api/dispatch', dispatchRoute);

const PORT = process.env.PORT || 3130;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[agent-hub] listening on :${PORT}`);
});

module.exports = app;
