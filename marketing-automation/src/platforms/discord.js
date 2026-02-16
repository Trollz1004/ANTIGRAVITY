/**
 * Discord Webhook Platform Handler
 * Opus Platform - Production Grade
 */

const axios = require('axios');
const BasePlatformHandler = require('../utils/base-handler');
const { validateUrl } = require('../utils/validation');
const logger = require('../logger');

class DiscordHandler extends BasePlatformHandler {
  constructor() {
    super('discord', ['DISCORD_WEBHOOK_URL']);
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  }

  async authenticate() {
    validateUrl(this.platform, this.webhookUrl, 'DISCORD_WEBHOOK_URL');

    const response = await axios.get(this.webhookUrl, this.getAxiosConfig());

    if (!response.data?.id) {
      throw new Error('Invalid Discord webhook');
    }

    logger.info(`Discord: Webhook verified for channel ${response.data.channel_id}`);
    this.authenticated = true;
    this.webhookId = response.data.id;
    this.channelId = response.data.channel_id;
    return this;
  }

  async _post(content) {
    const response = await axios.post(
      `${this.webhookUrl}?wait=true`,
      { content },
      this.getAxiosConfig({ 'Content-Type': 'application/json' })
    );

    const messageId = this.extractResponseData(response, 'data.id', null);

    const result = {
      id: messageId,
      url: messageId ? `https://discord.com/channels/${this.channelId}/${messageId}` : null,
      platform: this.platform,
      success: true
    };

    logger.info('Discord: Posted successfully', { id: result.id });
    return result;
  }

  async postEmbed(embed) {
    if (!embed || typeof embed !== 'object') {
      throw new Error('Invalid embed object');
    }

    if (embed.title && embed.title.length > 256) {
      throw new Error('Embed title exceeds 256 characters');
    }
    if (embed.description && embed.description.length > 4096) {
      throw new Error('Embed description exceeds 4096 characters');
    }
    if (embed.fields && embed.fields.length > 25) {
      throw new Error('Embed exceeds 25 fields limit');
    }

    const response = await axios.post(
      `${this.webhookUrl}?wait=true`,
      { embeds: [embed] },
      this.getAxiosConfig({ 'Content-Type': 'application/json' })
    );

    const messageId = this.extractResponseData(response, 'data.id', null);

    const result = {
      id: messageId,
      url: messageId ? `https://discord.com/channels/${this.channelId}/${messageId}` : null,
      platform: this.platform,
      success: true
    };

    logger.info('Discord: Embed posted successfully', { id: result.id });
    return result;
  }

  async _getAnalytics(postId) {
    return {
      note: 'Discord webhooks do not provide message analytics',
      messageId: postId
    };
  }
}

module.exports = new DiscordHandler();
