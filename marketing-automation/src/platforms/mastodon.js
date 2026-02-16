/**
 * Mastodon (ActivityPub) Platform Handler
 * Opus Platform - Production Grade
 */

const axios = require('axios');
const BasePlatformHandler = require('../utils/base-handler');
const logger = require('../logger');

class MastodonHandler extends BasePlatformHandler {
  constructor() {
    super('mastodon', ['MASTODON_ACCESS_TOKEN']);
    this.accessToken = process.env.MASTODON_ACCESS_TOKEN;
    this.instanceUrl = process.env.MASTODON_INSTANCE || 'https://mastodon.social';
  }

  async authenticate() {
    logger.info(`Mastodon: Verifying credentials on ${this.instanceUrl}...`);

    const response = await axios.get(
      `${this.instanceUrl}/api/v1/accounts/verify_credentials`,
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`
        })
      }
    );

    if (!response.data?.id) {
      throw new Error('Failed to verify Mastodon credentials');
    }

    const account = response.data;
    logger.info(`Mastodon: Authenticated as @${account.username}@${new URL(this.instanceUrl).host}`);
    this.authenticated = true;
    this.accountId = account.id;
    this.username = account.username;
    return this;
  }

  async _post(content, options = {}) {
    const {
      visibility = 'public',
      spoilerText = null,
      sensitive = false,
      inReplyToId = null
    } = options;

    const postData = {
      status: content,
      visibility
    };

    if (spoilerText) postData.spoiler_text = spoilerText;
    if (sensitive) postData.sensitive = true;
    if (inReplyToId) postData.in_reply_to_id = inReplyToId;

    const response = await axios.post(
      `${this.instanceUrl}/api/v1/statuses`,
      postData,
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `opus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })
      }
    );

    if (!response.data?.id) {
      throw new Error('Mastodon response missing status ID');
    }

    const status = response.data;

    const result = {
      id: status.id,
      url: status.url,
      uri: status.uri,
      platform: this.platform,
      visibility
    };

    logger.info('Mastodon: Posted successfully', { id: result.id, url: result.url });
    return result;
  }

  async _getAnalytics(statusId) {
    const response = await axios.get(
      `${this.instanceUrl}/api/v1/statuses/${statusId}`,
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`
        })
      }
    );

    if (!response.data) {
      return { error: 'Status not found' };
    }

    const status = response.data;
    return {
      reblogs: status.reblogs_count || 0,
      favorites: status.favourites_count || 0,
      replies: status.replies_count || 0
    };
  }

  async boost(statusId) {
    const response = await axios.post(
      `${this.instanceUrl}/api/v1/statuses/${statusId}/reblog`,
      {},
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`
        })
      }
    );

    return {
      id: response.data?.id,
      boosted: true
    };
  }
}

module.exports = new MastodonHandler();
