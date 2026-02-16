/**
 * Telegram Bot Platform Handler
 * Opus Platform - Production Grade
 */

const axios = require('axios');
const BasePlatformHandler = require('../utils/base-handler');
const logger = require('../logger');

class TelegramHandler extends BasePlatformHandler {
  constructor() {
    super('telegram', [
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_CHANNEL_ID'
    ]);
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.channelId = process.env.TELEGRAM_CHANNEL_ID;
    this.apiBase = 'https://api.telegram.org';
  }

  getApiUrl(method) {
    return `${this.apiBase}/bot${this.botToken}/${method}`;
  }

  async authenticate() {
    logger.info('Telegram: Verifying bot...');

    const response = await axios.get(
      this.getApiUrl('getMe'),
      this.getAxiosConfig()
    );

    if (!response.data?.ok || !response.data?.result) {
      throw new Error('Failed to verify Telegram bot');
    }

    const bot = response.data.result;
    logger.info(`Telegram: Authenticated as @${bot.username}`);
    this.authenticated = true;
    this.botUsername = bot.username;
    this.botId = bot.id;
    return this;
  }

  async _post(content) {
    const response = await axios.post(
      this.getApiUrl('sendMessage'),
      {
        chat_id: this.channelId,
        text: content,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      },
      this.getAxiosConfig({ 'Content-Type': 'application/json' })
    );

    if (!response.data?.ok) {
      throw new Error(response.data?.description || 'Telegram API error');
    }

    const message = response.data.result;
    const messageId = message.message_id;

    let url;
    if (this.channelId.toString().startsWith('-100')) {
      const channelIdShort = this.channelId.toString().replace('-100', '');
      url = `https://t.me/c/${channelIdShort}/${messageId}`;
    } else if (this.channelId.toString().startsWith('@')) {
      url = `https://t.me/${this.channelId.replace('@', '')}/${messageId}`;
    } else {
      url = `https://t.me/c/${this.channelId}/${messageId}`;
    }

    const result = {
      id: messageId,
      url,
      platform: this.platform,
      chatId: this.channelId
    };

    logger.info('Telegram: Posted successfully', { id: result.id });
    return result;
  }

  async _getAnalytics(messageId) {
    return {
      note: 'Telegram Bot API does not provide message analytics',
      messageId,
      channelId: this.channelId
    };
  }

  async sendPhoto(photoUrl, caption = '') {
    const response = await axios.post(
      this.getApiUrl('sendPhoto'),
      {
        chat_id: this.channelId,
        photo: photoUrl,
        caption,
        parse_mode: 'Markdown'
      },
      this.getAxiosConfig({ 'Content-Type': 'application/json' })
    );

    if (!response.data?.ok) {
      throw new Error(response.data?.description || 'Telegram API error');
    }

    return {
      id: response.data.result.message_id,
      platform: this.platform
    };
  }
}

module.exports = new TelegramHandler();
