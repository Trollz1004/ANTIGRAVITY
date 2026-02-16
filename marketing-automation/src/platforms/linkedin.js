/**
 * LinkedIn Platform Handler
 * Opus Platform - Production Grade
 */

const axios = require('axios');
const BasePlatformHandler = require('../utils/base-handler');
const logger = require('../logger');

class LinkedInHandler extends BasePlatformHandler {
  constructor() {
    super('linkedin', [
      'LINKEDIN_ACCESS_TOKEN',
      'LINKEDIN_PERSON_ID'
    ]);
    this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    this.personId = process.env.LINKEDIN_PERSON_ID;
  }

  async authenticate() {
    logger.info('LinkedIn: Verifying credentials...');

    const response = await axios.get('https://api.linkedin.com/v2/me', {
      ...this.getAxiosConfig({
        'Authorization': `Bearer ${this.accessToken}`
      })
    });

    if (!response.data?.id) {
      throw new Error('Failed to verify LinkedIn credentials');
    }

    logger.info(`LinkedIn: Authenticated as ${response.data.localizedFirstName} ${response.data.localizedLastName}`);
    this.authenticated = true;
    return this;
  }

  async _post(content) {
    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: `urn:li:person:${this.personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        })
      }
    );

    const postId = this.extractResponseData(response, 'data.id', null);
    if (!postId) {
      throw new Error('LinkedIn response missing post ID');
    }

    const result = {
      id: postId,
      url: `https://www.linkedin.com/feed/update/${postId}`,
      platform: this.platform
    };

    logger.info('LinkedIn: Posted successfully', { id: result.id });
    return result;
  }

  async _getAnalytics(postId) {
    logger.info(`LinkedIn: Analytics requested for ${postId}`);
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      note: 'LinkedIn analytics requires Marketing Developer Platform access'
    };
  }
}

module.exports = new LinkedInHandler();
