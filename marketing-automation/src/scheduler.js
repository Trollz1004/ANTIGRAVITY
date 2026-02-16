/**
 * Marketing Engine - Multi-Platform Scheduler
 * Opus Platform - Production Grade
 *
 * Features:
 * - Cron-based scheduling
 * - Rate limiting integration
 * - Error recovery with retry
 * - Platform health monitoring
 */

const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const contentGenerator = require('./content-generator');
const logger = require('./logger');
const rateLimiter = require('./utils/rate-limiter');
const { withRetry } = require('./utils/retry');

// Platform handlers
const platforms = {
  twitter: require('./platforms/twitter'),
  linkedin: require('./platforms/linkedin'),
  reddit: require('./platforms/reddit'),
  devto: require('./platforms/devto'),
  telegram: require('./platforms/telegram'),
  discord: require('./platforms/discord'),
  bluesky: require('./platforms/bluesky'),
  mastodon: require('./platforms/mastodon'),
  threads: require('./platforms/threads'),
  pinterest: require('./platforms/pinterest'),
  hashnode: require('./platforms/hashnode'),
  facebook: require('./platforms/facebook'),
  medium: require('./platforms/medium'),
  tiktok: require('./platforms/tiktok'),
  youtube: require('./platforms/youtube'),
  producthunt: require('./platforms/producthunt'),
};

class MarketingScheduler {
  constructor() {
    this.jobs = [];
    this.jobHistory = [];
    this.schedule = this.loadSchedule();
    this.running = false;
    this.dataDir = path.join(__dirname, '..', 'data');
  }

  loadSchedule() {
    // Default posting schedule (conservative for production)
    return {
      twitter: ['0 9 * * *', '0 14 * * *', '0 19 * * *'], // 3x daily
      linkedin: ['0 10 * * 1-5'], // Weekdays 10am
      bluesky: ['0 11 * * *'], // Daily 11am
      mastodon: ['0 12 * * *'], // Daily noon
      discord: ['0 15 * * *'], // Daily 3pm
      telegram: ['0 16 * * *'], // Daily 4pm
      reddit: ['0 12 * * 1,4'], // Mon/Thu noon (avoid spam)
      devto: ['0 8 * * 1'], // Monday 8am (article)
      facebook: ['0 10 * * 2,5'], // Tue/Fri 10am
    };
  }

  async checkPlatformHealth() {
    const healthStatus = {};

    for (const [name, handler] of Object.entries(platforms)) {
      try {
        if (typeof handler.isReady === 'function') {
          healthStatus[name] = {
            ready: handler.isReady(),
            authenticated: handler.authenticated || false
          };
        } else {
          healthStatus[name] = { ready: true, authenticated: false };
        }
      } catch (error) {
        healthStatus[name] = { ready: false, error: error.message };
      }
    }

    return healthStatus;
  }

  async postToplatform(platformName, topic, options = {}) {
    const platform = platforms[platformName];
    if (!platform) {
      logger.warn(`Scheduler: Platform ${platformName} not found`);
      return { error: 'Platform not configured' };
    }

    // Check if platform is ready
    if (typeof platform.isReady === 'function' && !platform.isReady()) {
      logger.warn(`Scheduler: Platform ${platformName} not configured (missing env vars)`);
      return { error: 'Platform not configured', skipped: true };
    }

    const jobId = `${platformName}-${Date.now()}`;
    const jobStart = Date.now();

    try {
      logger.info(`Scheduler: Starting post to ${platformName}`, { jobId, topic });

      // Generate content with rate limiting
      const generated = await rateLimiter.execute('content-generator', async () => {
        return contentGenerator.generate({
          platform: platformName,
          topic,
          ...options
        });
      });

      const content = generated.content || generated;

      // Post to platform with retry
      const result = await withRetry(
        async () => platform.post(content),
        {
          maxRetries: 3,
          baseDelayMs: 2000,
          shouldRetry: (error) => {
            // Don't retry auth errors
            if (error.statusCode === 401 || error.statusCode === 403) return false;
            // Retry rate limits and server errors
            if (error.statusCode === 429 || error.statusCode >= 500) return true;
            // Retry network errors
            return error.retryable !== false;
          }
        }
      );

      const jobDuration = Date.now() - jobStart;

      // Record success
      const jobRecord = {
        id: jobId,
        platform: platformName,
        topic,
        status: 'success',
        result,
        duration: jobDuration,
        timestamp: new Date().toISOString()
      };
      this.jobHistory.push(jobRecord);

      logger.info(`Scheduler: Successfully posted to ${platformName}`, {
        jobId,
        url: result.url,
        duration: `${jobDuration}ms`
      });

      // Save job history
      await this.saveJobHistory(jobRecord);

      return result;

    } catch (error) {
      const jobDuration = Date.now() - jobStart;

      // Record failure
      const jobRecord = {
        id: jobId,
        platform: platformName,
        topic,
        status: 'failed',
        error: error.message,
        duration: jobDuration,
        timestamp: new Date().toISOString()
      };
      this.jobHistory.push(jobRecord);

      logger.error(`Scheduler: Failed to post to ${platformName}`, {
        jobId,
        error: error.message,
        duration: `${jobDuration}ms`
      });

      // Save job history
      await this.saveJobHistory(jobRecord);

      return { error: error.message };
    }
  }

  async saveJobHistory(jobRecord) {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      const historyFile = path.join(this.dataDir, 'job-history.jsonl');
      await fs.appendFile(historyFile, JSON.stringify(jobRecord) + '\n');
    } catch (error) {
      logger.warn('Scheduler: Failed to save job history', { error: error.message });
    }
  }

  async postNow(platformName, topic, options = {}) {
    return this.postToplatform(platformName, topic, options);
  }

  async postToAll(topic, options = {}) {
    const results = {};
    const enabledPlatforms = Object.keys(this.schedule);

    logger.info(`Scheduler: Posting to ${enabledPlatforms.length} platforms`, { topic });

    for (const platformName of enabledPlatforms) {
      // Add delay between posts to avoid rate limits
      results[platformName] = await this.postToplatform(platformName, topic, options);
      await this.sleep(2000); // 2 second delay between platforms
    }

    return results;
  }

  start(topics) {
    if (this.running) {
      logger.warn('Scheduler: Already running');
      return;
    }

    logger.info('═══════════════════════════════════════');
    logger.info('  MARKETING ENGINE SCHEDULER - STARTING');
    logger.info('═══════════════════════════════════════');

    Object.entries(this.schedule).forEach(([platformName, cronTimes]) => {
      cronTimes.forEach(cronTime => {
        const job = cron.schedule(cronTime, async () => {
          // Select random topic
          const topic = topics[Math.floor(Math.random() * topics.length)];

          logger.info(`Scheduler: Cron triggered for ${platformName}`, { cronTime, topic });

          await this.postToplatform(platformName, topic);
        }, {
          timezone: 'America/New_York' // EST timezone
        });

        this.jobs.push({ job, platform: platformName, cronTime });
        logger.info(`Scheduler: Scheduled ${platformName}`, { cronTime });
      });
    });

    this.running = true;
    logger.info(`Scheduler: Started with ${this.jobs.length} jobs`);
  }

  stop() {
    this.jobs.forEach(({ job }) => job.stop());
    this.jobs = [];
    this.running = false;
    logger.info('Scheduler: Stopped');
  }

  getStatus() {
    return {
      running: this.running,
      jobs: this.jobs.map(j => ({ platform: j.platform, cronTime: j.cronTime })),
      recentHistory: this.jobHistory.slice(-10),
      rateLimiter: rateLimiter.getStatus()
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new MarketingScheduler();
