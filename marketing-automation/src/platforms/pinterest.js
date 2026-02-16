/**
 * Pinterest Platform Handler
 * Opus Platform - Production Grade
 */

const axios = require('axios');
const BasePlatformHandler = require('../utils/base-handler');
const { validateUrl } = require('../utils/validation');
const logger = require('../logger');

class PinterestHandler extends BasePlatformHandler {
  constructor() {
    super('pinterest', ['PINTEREST_ACCESS_TOKEN', 'PINTEREST_BOARD_ID']);
    this.accessToken = process.env.PINTEREST_ACCESS_TOKEN;
    this.defaultBoardId = process.env.PINTEREST_BOARD_ID;
  }

  async authenticate() {
    logger.info('Pinterest: Verifying credentials...');

    const response = await axios.get('https://api.pinterest.com/v5/user_account', {
      ...this.getAxiosConfig({
        'Authorization': `Bearer ${this.accessToken}`
      })
    });

    if (!response.data?.username) {
      throw new Error('Failed to verify Pinterest credentials');
    }

    logger.info(`Pinterest: Authenticated as @${response.data.username}`);
    this.authenticated = true;
    this.username = response.data.username;
    return this;
  }

  async _post(content, options = {}) {
    const { imageUrl, boardId = this.defaultBoardId, link = null } = options;

    if (!imageUrl) {
      throw new Error('Pinterest requires an image URL');
    }

    validateUrl(this.platform, imageUrl, 'imageUrl');

    const pinData = {
      board_id: boardId,
      media_source: {
        source_type: 'image_url',
        url: imageUrl
      },
      description: content
    };

    if (link) {
      pinData.link = link;
    }

    const response = await axios.post(
      'https://api.pinterest.com/v5/pins',
      pinData,
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        })
      }
    );

    if (!response.data?.id) {
      throw new Error('Pinterest response missing pin ID');
    }

    const result = {
      id: response.data.id,
      url: `https://pinterest.com/pin/${response.data.id}`,
      platform: this.platform
    };

    logger.info('Pinterest: Pin created successfully', { id: result.id });
    return result;
  }

  async _getAnalytics(pinId) {
    const response = await axios.get(
      `https://api.pinterest.com/v5/pins/${pinId}`,
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`
        })
      }
    );

    const pin = response.data || {};
    return {
      saves: pin.pin_metrics?.save || 0,
      clicks: pin.pin_metrics?.pin_click || 0
    };
  }
}

module.exports = new PinterestHandler();
