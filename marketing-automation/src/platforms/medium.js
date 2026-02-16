/**
 * Medium Platform Handler
 * Opus Platform - Production Grade
 */

const axios = require('axios');
const BasePlatformHandler = require('../utils/base-handler');
const logger = require('../logger');

class MediumHandler extends BasePlatformHandler {
  constructor() {
    super('medium', ['MEDIUM_ACCESS_TOKEN']);
    this.accessToken = process.env.MEDIUM_ACCESS_TOKEN;
    this.userId = null;
  }

  async authenticate() {
    logger.info('Medium: Verifying credentials...');

    const response = await axios.get('https://api.medium.com/v1/me', {
      ...this.getAxiosConfig({
        'Authorization': `Bearer ${this.accessToken}`
      })
    });

    if (!response.data?.data?.id) {
      throw new Error('Failed to verify Medium credentials');
    }

    this.userId = response.data.data.id;
    logger.info(`Medium: Authenticated as ${response.data.data.username}`);
    this.authenticated = true;
    return this;
  }

  async _post(content, options = {}) {
    if (!this.userId) await this.authenticate();

    const { title = 'New Post', tags = [], publishStatus = 'public' } = options;

    const response = await axios.post(
      `https://api.medium.com/v1/users/${this.userId}/posts`,
      {
        title,
        contentFormat: 'markdown',
        content,
        publishStatus,
        tags
      },
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        })
      }
    );

    const post = this.extractResponseData(response, 'data.data', {});
    if (!post.id) {
      throw new Error('Medium response missing post ID');
    }

    const result = {
      id: post.id,
      url: post.url,
      platform: this.platform
    };

    logger.info('Medium: Posted successfully', { id: result.id, url: result.url });
    return result;
  }

  async _getAnalytics(postId) {
    return {
      note: 'Medium analytics available via Medium Partner Program dashboard',
      postId
    };
  }
}

module.exports = new MediumHandler();
