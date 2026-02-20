require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode-terminal');
const axios = require('axios');
const winston = require('winston');

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/logs/whatsapp-bridge.log' })
  ]
});

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: '/app/.wwebjs_auth'
  }),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }
});

const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://localhost:3200';

// QR code display
client.on('qr', (qr) => {
  logger.info('QR code generated - scan with WhatsApp');
  QRCode.generate(qr, { small: true });
});

// Authentication
client.on('authenticated', () => {
  logger.info('✓ WhatsApp authenticated');
});

// Ready
client.on('ready', () => {
  logger.info('✓ WhatsApp bridge ready');
});

// Handle messages
client.on('message', async (msg) => {
  try {
    // Skip messages from self
    if (msg.fromMe) return;
    
    // Skip status broadcasts
    if (msg.from === 'status@broadcast') return;

    const senderPhone = msg.from.replace('@c.us', '');
    const messageBody = msg.body;

    logger.info(`Message from ${senderPhone}: ${messageBody}`);

    // Send to OpenClaw /chat endpoint
    try {
      const response = await axios.post(`${OPENCLAW_URL}/chat`, {
        sessionId: senderPhone,
        message: messageBody
      }, { timeout: 30000 });

      const clawResponse = response.data.response;
      logger.info(`Claw response: ${clawResponse.substring(0, 50)}...`);

      // Send response back
      await msg.reply(clawResponse);
    } catch (clawError) {
      logger.error(`OpenClaw error: ${clawError.message}`);
      await msg.reply('Sorry, I encountered an error. Please try again.');
    }
  } catch (error) {
    logger.error(`Message handler error: ${error.message}`);
  }
});

// Disconnect
client.on('disconnected', (reason) => {
  logger.warn(`WhatsApp disconnected: ${reason}`);
});

// Initialize
client.initialize();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down WhatsApp bridge...');
  await client.destroy();
  process.exit(0);
});

logger.info('WhatsApp bridge starting...');
