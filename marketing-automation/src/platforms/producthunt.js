/**
 * Product Hunt Platform Handler
 * Opus Platform - Production Grade
 */

const axios = require('axios');
const BasePlatformHandler = require('../utils/base-handler');
const logger = require('../logger');

class ProductHuntHandler extends BasePlatformHandler {
  constructor() {
    super('producthunt', ['PRODUCTHUNT_ACCESS_TOKEN']);
    this.accessToken = process.env.PRODUCTHUNT_ACCESS_TOKEN;
    this.apiUrl = 'https://api.producthunt.com/v2/api/graphql';
  }

  async authenticate() {
    logger.info('ProductHunt: Verifying credentials...');

    const response = await axios.post(
      this.apiUrl,
      {
        query: `query { viewer { user { id name username } } }`
      },
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        })
      }
    );

    const user = response.data?.data?.viewer?.user;
    if (!user?.id) {
      throw new Error('Failed to verify ProductHunt credentials');
    }

    logger.info(`ProductHunt: Authenticated as @${user.username}`);
    this.authenticated = true;
    this.userId = user.id;
    this.username = user.username;
    return this;
  }

  async _post(content) {
    // ProductHunt is primarily for product launches, not general posts
    // This creates a discussion comment on a post
    logger.warn('ProductHunt: General posting not supported - use for product launches');

    return {
      note: 'ProductHunt is for product launches. Use their website to launch products.',
      content: content.substring(0, 100),
      platform: this.platform
    };
  }

  async _getAnalytics(postId) {
    // Use parameterized query to prevent GraphQL injection
    const response = await axios.post(
      this.apiUrl,
      {
        query: `
          query GetPost($id: ID!) {
            post(id: $id) {
              id
              name
              votesCount
              commentsCount
              reviewsCount
            }
          }
        `,
        variables: { id: postId }
      },
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        })
      }
    );

    const post = response.data?.data?.post || {};
    return {
      votes: post.votesCount || 0,
      comments: post.commentsCount || 0,
      reviews: post.reviewsCount || 0
    };
  }
}

module.exports = new ProductHuntHandler();
