/**
 * Marketing Engine - Main Entry
 * Opus Platform - Production Grade
 *
 * 20 Platform Automation with Rate Limiting, Retry Logic, and Tagging Rules
 */

require('dotenv').config();

const scheduler = require('./scheduler');
const contentGenerator = require('./content-generator');
const logger = require('./logger');

const DEFAULT_TOPICS = [
  'Valentine\'s Day 2026 dating app launch - YouAndINotAI - 100% human-verified, zero bots',
  'Why 47% of dating profiles are now bots - and how YouAndINotAI is different',
  'Video verification technology in dating apps - fighting catfishing and AI impersonation',
  '100 founding member spots at $14.99/month forever - youandinotai.com',
];

// Required environment variables
const REQUIRED_ENV = [
  // At least one AI provider
  { key: 'ANTHROPIC_API_KEY', optional: true, group: 'ai' },
  { key: 'OPENAI_API_KEY', optional: true, group: 'ai' },
];

function validateEnvironment() {
  const missing = [];
  const groups = {};

  for (const { key, optional, group } of REQUIRED_ENV) {
    if (!process.env[key]) {
      if (!optional) {
        missing.push(key);
      }
      if (group) {
        groups[group] = groups[group] || [];
        groups[group].push(key);
      }
    }
  }

  // Check that at least one AI provider is configured
  const aiGroup = groups['ai'] || [];
  const hasAI = aiGroup.length < 2; // At least one must be present

  if (!hasAI) {
    logger.error('Startup: No AI provider configured');
    logger.error('Please set either ANTHROPIC_API_KEY or OPENAI_API_KEY');
    return false;
  }

  if (missing.length > 0) {
    logger.error('Startup: Missing required environment variables', { missing });
    return false;
  }

  return true;
}

async function checkPlatformHealth() {
  logger.info('Startup: Checking platform health...');

  const health = await scheduler.checkPlatformHealth();
  const ready = [];
  const notReady = [];

  for (const [platform, status] of Object.entries(health)) {
    if (status.ready) {
      ready.push(platform);
    } else {
      notReady.push(platform);
    }
  }

  logger.info(`Startup: ${ready.length} platforms ready`, { platforms: ready });

  if (notReady.length > 0) {
    logger.warn(`Startup: ${notReady.length} platforms not configured`, { platforms: notReady });
  }

  return { ready, notReady };
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗ ██████╗ ██╗   ██╗███████╗    ████████╗██████╗      ║
║  ██╔═══██╗██╔══██╗██║   ██║██╔════╝    ╚══██╔══╝██╔══██╗     ║
║  ██║   ██║██████╔╝██║   ██║███████╗       ██║   ██████╔╝     ║
║  ██║   ██║██╔═══╝ ██║   ██║╚════██║       ██║   ██╔══██╗     ║
║  ╚██████╔╝██║     ╚██████╔╝███████║       ██║   ██║  ██║     ║
║   ╚═════╝ ╚═╝      ╚═════╝ ╚══════╝       ╚═╝   ╚═╝  ╚═╝     ║
║                                                               ║
║           MARKETING ENGINE - 20 Platform Automation           ║
║                    Production Grade v2.0                      ║
║                                                               ║
║                    Gospel V1.4.1 Compliant                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  logger.info('═══════════════════════════════════════');
  logger.info('  Opus Platform - Marketing Engine');
  logger.info('═══════════════════════════════════════');

  // Validate environment
  if (!validateEnvironment()) {
    logger.error('Startup: Environment validation failed');
    process.exit(1);
  }

  logger.info('Startup: Environment validated');

  // Check platform health
  const { ready, notReady } = await checkPlatformHealth();

  if (ready.length === 0) {
    logger.error('Startup: No platforms configured. Please set API credentials.');
    logger.info('See API-KEYS-SETUP.md for configuration instructions.');
    process.exit(1);
  }

  // Load topics
  const topics = process.env.TOPICS?.split(',').map(t => t.trim()) || DEFAULT_TOPICS;
  logger.info(`Startup: Loaded ${topics.length} topics`);

  // Start scheduler
  scheduler.start(topics);

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Shutdown: Received SIGINT, stopping scheduler...');
    scheduler.stop();
    logger.info('Shutdown: Complete');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Shutdown: Received SIGTERM, stopping scheduler...');
    scheduler.stop();
    logger.info('Shutdown: Complete');
    process.exit(0);
  });

  // Unhandled rejection handler
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason: reason?.message || reason });
  });

  logger.info('═══════════════════════════════════════');
  logger.info('  Marketing Engine Running');
  logger.info(`  ${ready.length} platforms active`);
  logger.info('  Press Ctrl+C to stop');
  logger.info('═══════════════════════════════════════');
}

// Export for testing
module.exports = { main, validateEnvironment, checkPlatformHealth };

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Fatal error', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}
