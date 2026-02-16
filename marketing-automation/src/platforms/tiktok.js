/**
 * TikTok Platform Handler
 * Opus Platform - Production Grade
 *
 * Note: TikTok API requires business account and approved app
 * Text-only posts are not supported - video upload required
 */

const axios = require('axios');
const BasePlatformHandler = require('../utils/base-handler');
const logger = require('../logger');

class TikTokHandler extends BasePlatformHandler {
  constructor() {
    super('tiktok', ['TIKTOK_ACCESS_TOKEN']);
    this.accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    this.apiBase = 'https://open.tiktokapis.com/v2';
  }

  async authenticate() {
    logger.info('TikTok: Verifying credentials...');

    const response = await axios.get(
      `${this.apiBase}/user/info/`,
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`
        }),
        params: {
          fields: 'open_id,display_name,avatar_url'
        }
      }
    );

    const user = response.data?.data?.user;
    if (!user?.open_id) {
      throw new Error('Failed to verify TikTok credentials');
    }

    logger.info(`TikTok: Authenticated as ${user.display_name}`);
    this.authenticated = true;
    this.openId = user.open_id;
    this.displayName = user.display_name;
    return this;
  }

  async _post(content) {
    // TikTok requires video content - text-only posts not supported
    logger.warn('TikTok: Video required - text-only posts not supported');

    return {
      note: 'TikTok requires video upload. Use TikTok Creator Portal for posting.',
      caption: content.substring(0, 2200), // TikTok caption limit
      platform: this.platform
    };
  }

  async initVideoUpload(videoSize) {
    // Initialize video upload session
    const response = await axios.post(
      `${this.apiBase}/post/publish/video/init/`,
      {
        post_info: {
          title: 'Video',
          privacy_level: 'SELF_ONLY', // Default to private
          disable_duet: false,
          disable_stitch: false,
          disable_comment: false
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize
        }
      },
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        })
      }
    );

    return response.data?.data;
  }

  async _getAnalytics(videoId) {
    const response = await axios.post(
      `${this.apiBase}/video/query/`,
      {
        filters: {
          video_ids: [videoId]
        }
      },
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        })
      }
    );

    const video = response.data?.data?.videos?.[0];
    if (!video) {
      return { note: 'Video not found or analytics unavailable' };
    }

    return {
      views: video.view_count || 0,
      likes: video.like_count || 0,
      comments: video.comment_count || 0,
      shares: video.share_count || 0
    };
  }
}

module.exports = new TikTokHandler();
