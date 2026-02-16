/**
 * Bluesky (AT Protocol) Platform Handler
 * Opus Platform - Production Grade
 */

const axios = require('axios');
const BasePlatformHandler = require('../utils/base-handler');
const logger = require('../logger');

class BlueskyHandler extends BasePlatformHandler {
  constructor() {
    super('bluesky', [
      'BLUESKY_HANDLE',
      'BLUESKY_APP_PASSWORD'
    ]);
    this.handle = process.env.BLUESKY_HANDLE;
    this.appPassword = process.env.BLUESKY_APP_PASSWORD;
    this.pdsUrl = process.env.BLUESKY_PDS_URL || 'https://bsky.social';
    this.session = null;
    this.sessionExpiry = null;
  }

  async authenticate() {
    logger.info('Bluesky: Creating session...');

    const response = await axios.post(
      `${this.pdsUrl}/xrpc/com.atproto.server.createSession`,
      {
        identifier: this.handle,
        password: this.appPassword
      },
      this.getAxiosConfig({ 'Content-Type': 'application/json' })
    );

    if (!response.data?.accessJwt || !response.data?.did) {
      throw new Error('Failed to create Bluesky session');
    }

    this.session = {
      accessJwt: response.data.accessJwt,
      refreshJwt: response.data.refreshJwt,
      did: response.data.did,
      handle: response.data.handle
    };

    this.sessionExpiry = Date.now() + (2 * 60 * 60 * 1000);

    logger.info(`Bluesky: Authenticated as @${this.session.handle}`);
    this.authenticated = true;
    return this;
  }

  async refreshSession() {
    if (!this.session?.refreshJwt) {
      return this.authenticate();
    }

    logger.info('Bluesky: Refreshing session...');

    try {
      const response = await axios.post(
        `${this.pdsUrl}/xrpc/com.atproto.server.refreshSession`,
        {},
        {
          ...this.getAxiosConfig({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.session.refreshJwt}`
          })
        }
      );

      this.session.accessJwt = response.data.accessJwt;
      this.session.refreshJwt = response.data.refreshJwt;
      this.sessionExpiry = Date.now() + (2 * 60 * 60 * 1000);

      logger.info('Bluesky: Session refreshed');
    } catch (error) {
      logger.warn('Bluesky: Session refresh failed, re-authenticating');
      await this.authenticate();
    }
  }

  isSessionExpired() {
    return !this.sessionExpiry || Date.now() >= this.sessionExpiry - 60000;
  }

  async ensureSession() {
    if (!this.session || this.isSessionExpired()) {
      if (this.session?.refreshJwt) {
        await this.refreshSession();
      } else {
        await this.authenticate();
      }
    }
  }

  async _post(content) {
    await this.ensureSession();

    const now = new Date().toISOString();

    const response = await axios.post(
      `${this.pdsUrl}/xrpc/com.atproto.repo.createRecord`,
      {
        repo: this.session.did,
        collection: 'app.bsky.feed.post',
        record: {
          $type: 'app.bsky.feed.post',
          text: content,
          createdAt: now,
          langs: ['en']
        }
      },
      {
        ...this.getAxiosConfig({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.session.accessJwt}`
        })
      }
    );

    if (!response.data?.uri || !response.data?.cid) {
      throw new Error('Bluesky response missing uri/cid');
    }

    const uriParts = response.data.uri.split('/');
    const rkey = uriParts[uriParts.length - 1];

    const result = {
      id: response.data.cid,
      uri: response.data.uri,
      url: `https://bsky.app/profile/${this.session.handle}/post/${rkey}`,
      platform: this.platform
    };

    logger.info('Bluesky: Posted successfully', { id: result.id, url: result.url });
    return result;
  }

  async _getAnalytics(postUri) {
    await this.ensureSession();

    try {
      const response = await axios.get(
        `${this.pdsUrl}/xrpc/app.bsky.feed.getPostThread`,
        {
          ...this.getAxiosConfig({
            'Authorization': `Bearer ${this.session.accessJwt}`
          }),
          params: { uri: postUri, depth: 0 }
        }
      );

      const post = response.data?.thread?.post || {};
      return {
        likes: post.likeCount || 0,
        reposts: post.repostCount || 0,
        replies: post.replyCount || 0
      };
    } catch (error) {
      return {
        note: 'Could not fetch analytics',
        error: error.message
      };
    }
  }
}

module.exports = new BlueskyHandler();
