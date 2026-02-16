/**
 * Threads Platform Handler
 * Opus Platform - Production Grade
 *
 * Note: Requires Instagram Business/Creator account with Threads access
 */

const axios = require('axios');
const BasePlatformHandler = require('../utils/base-handler');
const logger = require('../logger');

class ThreadsHandler extends BasePlatformHandler {
  constructor() {
    super('threads', ['THREADS_ACCESS_TOKEN', 'THREADS_USER_ID']);
    this.accessToken = process.env.THREADS_ACCESS_TOKEN;
    this.userId = process.env.THREADS_USER_ID;
    this.apiBase = 'https://graph.threads.net/v1.0';
  }

  async authenticate() {
    logger.info('Threads: Verifying credentials...');

    const response = await axios.get(
      `${this.apiBase}/${this.userId}`,
      {
        ...this.getAxiosConfig(),
        params: {
          fields: 'id,username,threads_profile_picture_url',
          access_token: this.accessToken
        }
      }
    );

    if (!response.data?.id) {
      throw new Error('Failed to verify Threads credentials');
    }

    logger.info(`Threads: Authenticated as @${response.data.username}`);
    this.authenticated = true;
    this.username = response.data.username;
    return this;
  }

  async _post(content) {
    // Step 1: Create media container
    const createResponse = await axios.post(
      `${this.apiBase}/${this.userId}/threads`,
      null,
      {
        ...this.getAxiosConfig(),
        params: {
          media_type: 'TEXT',
          text: content,
          access_token: this.accessToken
        }
      }
    );

    if (!createResponse.data?.id) {
      throw new Error('Failed to create Threads media container');
    }

    const containerId = createResponse.data.id;

    // Step 2: Publish the container
    const publishResponse = await axios.post(
      `${this.apiBase}/${this.userId}/threads_publish`,
      null,
      {
        ...this.getAxiosConfig(),
        params: {
          creation_id: containerId,
          access_token: this.accessToken
        }
      }
    );

    if (!publishResponse.data?.id) {
      throw new Error('Failed to publish Threads post');
    }

    const result = {
      id: publishResponse.data.id,
      url: `https://threads.net/@${this.username}/post/${publishResponse.data.id}`,
      platform: this.platform
    };

    logger.info('Threads: Posted successfully', { id: result.id });
    return result;
  }

  async _getAnalytics(postId) {
    const response = await axios.get(
      `${this.apiBase}/${postId}/insights`,
      {
        ...this.getAxiosConfig(),
        params: {
          metric: 'views,likes,replies,reposts,quotes',
          access_token: this.accessToken
        }
      }
    );

    const insights = response.data?.data || [];
    const metrics = {};
    insights.forEach(item => {
      metrics[item.name] = item.values?.[0]?.value || 0;
    });

    return metrics;
  }
}

module.exports = new ThreadsHandler();
