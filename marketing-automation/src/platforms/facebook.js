/**
 * Facebook Pages Platform Handler
 * Opus Platform - Production Grade
 */

const axios = require('axios');
const BasePlatformHandler = require('../utils/base-handler');
const logger = require('../logger');

class FacebookHandler extends BasePlatformHandler {
  constructor() {
    super('facebook', [
      'FACEBOOK_PAGE_ACCESS_TOKEN',
      'FACEBOOK_PAGE_ID'
    ]);
    this.accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
    this.pageId = process.env.FACEBOOK_PAGE_ID;
    this.apiVersion = 'v18.0';
  }

  async authenticate() {
    logger.info('Facebook: Verifying page access token...');

    const response = await axios.get(
      `https://graph.facebook.com/${this.apiVersion}/me`,
      {
        ...this.getAxiosConfig(),
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.data?.id) {
      throw new Error('Failed to verify Facebook credentials');
    }

    logger.info(`Facebook: Authenticated for page ${response.data.name}`);
    this.authenticated = true;
    this.pageName = response.data.name;
    return this;
  }

  async _post(content) {
    const response = await axios.post(
      `https://graph.facebook.com/${this.apiVersion}/${this.pageId}/feed`,
      { message: content },
      {
        ...this.getAxiosConfig(),
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const postId = this.extractResponseData(response, 'data.id', null);
    if (!postId) {
      throw new Error('Facebook response missing post ID');
    }

    const result = {
      id: postId,
      url: `https://www.facebook.com/${postId.replace('_', '/posts/')}`,
      platform: this.platform
    };

    logger.info('Facebook: Posted successfully', { id: result.id });
    return result;
  }

  async _getAnalytics(postId) {
    const response = await axios.get(
      `https://graph.facebook.com/${this.apiVersion}/${postId}`,
      {
        ...this.getAxiosConfig(),
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: {
          fields: 'shares,reactions.summary(true),comments.summary(true)'
        }
      }
    );

    const data = response.data || {};
    return {
      shares: data.shares?.count || 0,
      reactions: data.reactions?.summary?.total_count || 0,
      comments: data.comments?.summary?.total_count || 0
    };
  }
}

module.exports = new FacebookHandler();
