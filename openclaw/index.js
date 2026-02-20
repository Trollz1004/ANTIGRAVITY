require('dotenv').config();
const express = require('express');
const Redis = require('ioredis');
const { QdrantClient } = require('@qdrant/js-client-rest');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'C:\\OPUSONLY\\logs\\openclaw.log' })
  ]
});

// Initialize services
const app = express();
const redis = new Redis(process.env.REDIS_URL);
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL
});

// Initialize Anthropic Claude API
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const ollamaBaseUrl = process.env.OLLAMA_BASE_URL;
const claudeModel = process.env.CLAUDE_MODEL || 'claude-opus-4-6';
const qdrantCollection = process.env.QDRANT_COLLECTION;
const port = process.env.OPENCLAW_PORT || 3200;

app.use(express.json());

logger.info('OpenClaw initializing with Claude API');
logger.info(`Model: ${claudeModel}`);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const redisCheck = await redis.ping();
    const qdrantCheck = await qdrant.getCollections();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisCheck === 'PONG',
        qdrant: !!qdrantCheck,
        claude: !!client
      }
    });
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

// Chat endpoint - handle messages with Claude API + Qdrant memory
app.post('/chat', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message required' });
    }

    const conversationId = uuidv4();
    logger.info(`Chat request: ${sessionId} - ${conversationId}`);

    // 1. Generate embedding for semantic search (using Claude's embeddings or simple hash)
    const userEmbedding = await generateEmbedding(message);

    // 2. Search Qdrant for relevant memories
    const memories = await searchMemory(userEmbedding, 5);
    const memoryContext = memories.map(m => m.payload.text).join('\n');

    // 3. Get recent conversation history from Redis
    const history = await getRecentHistory(sessionId, 10);

    // 4. Build system prompt for marketing
    const systemPrompt = `You are Open Claw, an AI marketing agent for youandinotai.com.
You are conversing with a prospect about YouAndINotAI — the only dating app with V8 Cloud Verification. No bots. Real humans.
- USP: Every user is human-verified. No fake profiles. No bots.
- Founding Member access available now
- Target: Convert interest into sign-up

${memoryContext ? `\nContext from previous conversations:\n${memoryContext}` : ''}

Keep responses under 150 words unless asked for more detail. Be conversational, authentic, and focus on VALUE.`;

    // 5. Build messages for Claude API
    const claudeMessages = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    claudeMessages.push({ role: 'user', content: message });

    // 6. Call Claude API for chat completion
    logger.info(`Calling Claude ${claudeModel}...`);
    const response = await client.messages.create({
      model: claudeModel,
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages
    });

    const assistantResponse = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'Unable to generate response';

    logger.info(`Claude response (${response.stop_reason}): ${assistantResponse.substring(0, 50)}...`);

    // 7. Store exchange in Redis (conversation history)
    await addToHistory(sessionId, 'user', message);
    await addToHistory(sessionId, 'assistant', assistantResponse);

    // 8. Store as memory in Qdrant (semantic embedding)
    const memoryText = `User: ${message}\nAssistant: ${assistantResponse}`;
    await storeMemory(memoryText, { 
      sessionId, 
      timestamp: new Date().toISOString(),
      model: claudeModel 
    });

    res.json({
      conversationId,
      response: assistantResponse,
      model: claudeModel,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Chat error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Manual memory store
app.post('/memory/store', async (req, res) => {
  try {
    const { text, metadata } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text required' });
    }

    const memoryId = await storeMemory(text, metadata || {});
    res.json({ id: memoryId, status: 'stored' });
  } catch (error) {
    logger.error(`Memory store error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Memory search
app.get('/memory/search', async (req, res) => {
  try {
    const query = req.query.q;
    const limit = parseInt(req.query.limit) || 5;
    if (!query) {
      return res.status(400).json({ error: 'q parameter required' });
    }

    const embedding = await generateEmbedding(query);
    const results = await searchMemory(embedding, limit);
    res.json({ query, results });
  } catch (error) {
    logger.error(`Memory search error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Helper: Generate simple embedding (can upgrade to Claude embeddings API later)
async function generateEmbedding(text) {
  try {
    // Use Ollama embedding endpoint if available, otherwise use simple hash-based vector
    if (ollamaBaseUrl) {
      try {
        const response = await axios.post(`${ollamaBaseUrl}/api/embeddings`, {
          model: 'nomic-embed-text',
          prompt: text
        }, { timeout: 5000 });
        return response.data.embedding;
      } catch (error) {
        logger.warn(`Ollama embedding failed, using fallback: ${error.message}`);
      }
    }
    
    // Fallback: Generate deterministic vector from text hash
    const hash = require('crypto').createHash('md5').update(text).digest('hex');
    const embedding = [];
    for (let i = 0; i < 768; i++) {
      embedding.push(parseInt(hash.substring(i * 2, i * 2 + 2), 16) / 255);
    }
    return embedding;
  } catch (error) {
    logger.error(`Embedding generation error: ${error.message}`);
    throw error;
  }
}

// Helper: Store memory in Qdrant
async function storeMemory(text, metadata) {
  try {
    const embedding = await generateEmbedding(text);
    const id = Math.floor(Math.random() * 1000000);
    
    await qdrant.upsert(qdrantCollection, {
      points: [
        {
          id,
          vector: embedding,
          payload: {
            text,
            ...metadata
          }
        }
      ]
    });
    
    logger.info(`Memory stored: ${id}`);
    return id;
  } catch (error) {
    logger.error(`Store memory error: ${error.message}`);
    throw error;
  }
}

// Helper: Search Qdrant memories
async function searchMemory(embedding, limit = 5) {
  try {
    const results = await qdrant.search(qdrantCollection, {
      vector: embedding,
      limit,
      with_payload: true
    });
    return results;
  } catch (error) {
    logger.error(`Search memory error: ${error.message}`);
    return [];
  }
}

// Helper: Get recent conversation history
async function getRecentHistory(sessionId, count = 10) {
  try {
    const history = await redis.lrange(`history:${sessionId}`, -count, -1);
    const messages = [];
    for (let i = 0; i < history.length; i++) {
      const entry = JSON.parse(history[i]);
      messages.push(entry);
    }
    return messages;
  } catch (error) {
    logger.error(`Get history error: ${error.message}`);
    return [];
  }
}

// Helper: Add to conversation history
async function addToHistory(sessionId, role, content) {
  try {
    const entry = { role, content };
    await redis.rpush(`history:${sessionId}`, JSON.stringify(entry));
    await redis.expire(`history:${sessionId}`, 86400); // 24 hour TTL
  } catch (error) {
    logger.error(`Add history error: ${error.message}`);
  }
}

// Initialize Qdrant collection
async function initializeQdrant() {
  try {
    const collections = await qdrant.getCollections();
    const collectionNames = collections.collections.map(c => c.name);
    
    if (!collectionNames.includes(qdrantCollection)) {
      logger.info(`Creating Qdrant collection: ${qdrantCollection}`);
      await qdrant.createCollection(qdrantCollection, {
        vectors: {
          size: 768,
          distance: 'Cosine'
        }
      });
    }
  } catch (error) {
    logger.error(`Qdrant initialization error: ${error.message}`);
  }
}

// Start server
(async () => {
  await initializeQdrant();
  app.listen(port, () => {
    logger.info(`✓ OpenClaw running on port ${port}`);
    logger.info(`✓ Redis: ${process.env.REDIS_URL}`);
    logger.info(`✓ Qdrant: ${process.env.QDRANT_URL}`);
    logger.info(`✓ Claude API: ${claudeModel}`);
    logger.info(`✓ Ready for marketing automation`);
  });
})();
