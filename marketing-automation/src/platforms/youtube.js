/**
 * YouTube Platform Handler (Community Posts)
 * Opus Platform - Production Grade
 */

const { google } = require('googleapis');
const BasePlatformHandler = require('../utils/base-handler');
const logger = require('../logger');

class YouTubeHandler extends BasePlatformHandler {
  constructor() {
    super('youtube', [
      'YOUTUBE_CLIENT_ID',
      'YOUTUBE_CLIENT_SECRET',
      'YOUTUBE_REFRESH_TOKEN'
    ]);
    this.youtube = null;
    this.auth = null;
  }

  async authenticate() {
    logger.info('YouTube: Authenticating with OAuth2...');

    this.auth = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET
    );

    this.auth.setCredentials({
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
    });

    // Force token refresh
    await this.auth.getAccessToken();

    this.youtube = google.youtube({ version: 'v3', auth: this.auth });

    // Verify by getting channel info
    const response = await this.youtube.channels.list({
      part: 'snippet',
      mine: true
    });

    if (!response.data?.items?.[0]) {
      throw new Error('Failed to verify YouTube credentials');
    }

    const channel = response.data.items[0];
    logger.info(`YouTube: Authenticated as ${channel.snippet.title}`);
    this.authenticated = true;
    this.channelId = channel.id;
    this.channelTitle = channel.snippet.title;
    return this;
  }

  async _post(content) {
    // YouTube Community Posts require specific API access
    // The YouTube Data API doesn't directly support community posts
    logger.warn('YouTube: Community posts require YouTube Studio access');

    return {
      note: 'YouTube community posts are not available via API. Use YouTube Studio.',
      content: content.substring(0, 100),
      platform: this.platform,
      channelId: this.channelId
    };
  }

  async _getAnalytics(videoId) {
    if (!this.youtube) await this.authenticate();

    const response = await this.youtube.videos.list({
      part: 'statistics,snippet',
      id: videoId
    });

    const video = response.data?.items?.[0];
    if (!video) {
      return { error: 'Video not found' };
    }

    const stats = video.statistics || {};
    return {
      views: parseInt(stats.viewCount) || 0,
      likes: parseInt(stats.likeCount) || 0,
      comments: parseInt(stats.commentCount) || 0,
      title: video.snippet?.title
    };
  }

  async uploadVideo(videoPath, options = {}) {
    if (!this.youtube) await this.authenticate();

    const { title, description, tags = [], privacyStatus = 'private' } = options;

    const response = await this.youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: '22' // People & Blogs
        },
        status: {
          privacyStatus
        }
      },
      media: {
        body: require('fs').createReadStream(videoPath)
      }
    });

    return {
      id: response.data.id,
      url: `https://youtube.com/watch?v=${response.data.id}`,
      platform: this.platform
    };
  }
}

module.exports = new YouTubeHandler();
