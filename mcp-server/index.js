require('dotenv').config();
const express = require('express');
const Redis = require('ioredis');
const { QdrantClient } = require('@qdrant/js-client-rest');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Initialize services
const app = express();
const redis = new Redis(process.env.REDIS_URL);
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL
});

const ollamaBaseUrl = process.env.OLLAMA_BASE_URL;
const embedModel = process.env.OLLAMA_EMBED_MODEL;
const qdrantCollection = process.env.QDRANT_COLLECTION;
const port = process.env.MCP_PORT || 3100;

app.use(express.json());

console.log(`[MCP Server] Starting on port ${port}`);
console.log(`[MCP Server] Redis: ${process.env.REDIS_URL}`);
console.log(`[MCP Server] Qdrant: ${process.env.QDRANT_URL}`);

// Health check
app.get('/health', async (req, res) => {
  try {
    const redisCheck = await redis.ping();
    const qdrantCheck = await qdrant.getCollections();
    res.json({
      status: 'healthy',
      redis: redisCheck === 'PONG',
      qdrant: !!qdrantCheck
    });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

// MCP Tool: memory_store
app.post('/tools/memory_store', async (req, res) => {
  try {
    const { text, metadata } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });

    const embedding = await embedText(text);
    const id = Math.floor(Math.random() * 1000000);

    await qdrant.upsert(qdrantCollection, {
      points: [{
        id,
        vector: embedding,
        payload: { text, ...metadata }
      }]
    });

    res.json({ id, status: 'stored' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MCP Tool: memory_search
app.post('/tools/memory_search', async (req, res) => {
  try {
    const { query, limit } = req.body;
    if (!query) return res.status(400).json({ error: 'query required' });

    const embedding = await embedText(query);
    const results = await qdrant.search(qdrantCollection, {
      vector: embedding,
      limit: limit || 5,
      with_payload: true
    });

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MCP Tool: memory_recent
app.post('/tools/memory_recent', async (req, res) => {
  try {
    const { sessionId, count } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const history = await redis.lrange(`history:${sessionId}`, -(count || 10), -1);
    const messages = history.map(h => JSON.parse(h));

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MCP Tool: memory_clear
app.post('/tools/memory_clear', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    await redis.del(`history:${sessionId}`);
    res.json({ status: 'cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: Embed text
async function embedText(text) {
  try {
    const response = await axios.post(`${ollamaBaseUrl}/api/embeddings`, {
      model: embedModel,
      prompt: text
    });
    return response.data.embedding;
  } catch (error) {
    console.error(`Embedding error: ${error.message}`);
    throw error;
  }
}

// Initialize
async function init() {
  try {
    const collections = await qdrant.getCollections();
    const collectionNames = collections.collections.map(c => c.name);

    if (!collectionNames.includes(qdrantCollection)) {
      console.log(`[MCP] Creating Qdrant collection: ${qdrantCollection}`);
      await qdrant.createCollection(qdrantCollection, {
        vectors: {
          size: 768,
          distance: 'Cosine'
        }
      });
    }

    app.listen(port, () => {
      console.log(`[MCP] ✓ Server running on port ${port}`);
      console.log(`[MCP] Available tools: memory_store, memory_search, memory_recent, memory_clear`);
    });
  } catch (error) {
    console.error(`[MCP] Init error: ${error.message}`);
    process.exit(1);
  }
}

init();
