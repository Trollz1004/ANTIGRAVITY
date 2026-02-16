/**
 * Dev.to Platform Handler
 * Opus Platform - Production Grade
 */

const axios = require('axios');
const BasePlatformHandler = require('../utils/base-handler');
const logger = require('../logger');

class DevToHandler extends BasePlatformHandler {
  constructor() {
    super('devto', ['DEVTO_API_KEY']);
    this.apiKey = process.env.DEVTO_API_KEY;
  }

  async authenticate() {
    logger.info('Dev.to: Verifying credentials...');

    const response = await axios.get('https://dev.to/api/users/me', {
      ...this.getAxiosConfig({
        'api-key': this.apiKey
      })
    });

    if (!response.data?.id) {
      throw new Error('Failed to verify Dev.to credentials');
    }

    logger.info(`Dev.to: Authenticated as @${response.data.username}`);
    this.authenticated = true;
    this.username = response.data.username;
    return this;
  }

  async _post(content, options = {}) {
    const { title = 'New Post', tags = ['programming', 'webdev'], published = true } = options;

    const response = await axios.post(
      'https://dev.to/api/articles',
      {
        article: {
          title,
          body_markdown: content,
          published,
          tags
        }
      },
      {
        ...this.getAxiosConfig({
          'api-key': this.apiKey,
          'Content-Type': 'application/json'
        })
      }
    );

    if (!response.data?.id) {
      throw new Error('Dev.to response missing article ID');
    }

    const result = {
      id: response.data.id,
      url: response.data.url,
      platform: this.platform
    };

    logger.info('Dev.to: Posted successfully', { id: result.id, url: result.url });
    return result;
  }

  async _getAnalytics(articleId) {
    const response = await axios.get(
      `https://dev.to/api/articles/${articleId}`,
      {
        ...this.getAxiosConfig({
          'api-key': this.apiKey
        })
      }
    );

    const article = response.data || {};
    return {
      views: article.page_views_count || 0,
      reactions: article.positive_reactions_count || 0,
      comments: article.comments_count || 0
    };
  }
}

module.exports = new DevToHandler();
