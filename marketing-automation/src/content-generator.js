/**
 * Marketing Engine - AI Content Generator
 * Opus Platform - Production Grade
 *
 * Uses Claude API for content generation with mandatory tagging rules
 */

const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');
const { validateContent, truncateContent, CHAR_LIMITS } = require('./utils/validation');

class ContentGenerator {
  constructor() {
    this.anthropic = null;
    this.openai = null;
    this.gemini = null;
    this.initialized = false;

    // Mandatory tagging rules from Gospel V1.4.1
    this.taggingRules = {
      twitter: { minHashtags: 1, maxHashtags: 5, tagInReply: true },
      instagram: { minHashtags: 5, maxHashtags: 30, firstComment: true },
      linkedin: { minHashtags: 1, maxHashtags: 5 },
      facebook: { minHashtags: 0, maxHashtags: 3 },
      tiktok: { minHashtags: 3, maxHashtags: 10 },
      bluesky: { minHashtags: 1, maxHashtags: 3 },
      mastodon: { minHashtags: 1, maxHashtags: 5 },
      threads: { minHashtags: 1, maxHashtags: 5 },
      default: { minHashtags: 1, maxHashtags: 5 }
    };
  }

  initialize() {
    if (this.initialized) return;

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      logger.info('ContentGenerator: Anthropic API initialized');
    }

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      logger.info('ContentGenerator: OpenAI API initialized');
    }

    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      logger.info('ContentGenerator: Gemini API initialized');
    }

    if (!this.anthropic && !this.openai && !this.gemini) {
      throw new Error('ContentGenerator: No AI API keys configured (ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY required)');
    }

    this.initialized = true;
  }

  getTaggingRules(platform) {
    return this.taggingRules[platform] || this.taggingRules.default;
  }

  getPlatformSpecs(platform) {
    const specs = {
      twitter: {
        maxLength: 280,
        notes: 'Punchy, use threads for longer content. MUST include 1-3 hashtags.',
        style: 'direct, engaging, conversation-starting'
      },
      linkedin: {
        maxLength: 3000,
        notes: 'Professional tone, can be longer form. Include 3-5 industry hashtags.',
        style: 'professional, thought-leadership, value-driven'
      },
      reddit: {
        maxLength: 10000,
        notes: 'Authentic, avoid self-promotion vibes. No hashtags needed.',
        style: 'genuine, helpful, community-focused'
      },
      devto: {
        maxLength: 50000,
        notes: 'Technical, code examples welcome. Tags in metadata.',
        style: 'technical, educational, practical'
      },
      facebook: {
        maxLength: 63206,
        notes: 'Engagement-focused, 1-3 hashtags max.',
        style: 'friendly, engaging, shareable'
      },
      telegram: {
        maxLength: 4096,
        notes: 'Can use markdown formatting.',
        style: 'informative, direct'
      },
      discord: {
        maxLength: 2000,
        notes: 'Community-friendly, can use embeds.',
        style: 'casual, helpful, community-focused'
      },
      bluesky: {
        maxLength: 300,
        notes: 'Similar to Twitter. Include 1-3 hashtags.',
        style: 'conversational, engaging'
      },
      mastodon: {
        maxLength: 500,
        notes: 'Community-focused. Include relevant hashtags.',
        style: 'thoughtful, community-oriented'
      },
      threads: {
        maxLength: 500,
        notes: 'Conversational, Instagram-connected.',
        style: 'casual, relatable'
      },
      pinterest: {
        maxLength: 500,
        notes: 'Visual description, keywords for SEO.',
        style: 'descriptive, keyword-rich'
      },
      medium: {
        maxLength: 50000,
        notes: 'Long-form, storytelling. Tags in metadata.',
        style: 'narrative, insightful, well-structured'
      },
      hashnode: {
        maxLength: 50000,
        notes: 'Technical blog format.',
        style: 'technical, tutorial-style'
      },
      tiktok: {
        maxLength: 2200,
        notes: 'Caption for video. Include 3-10 hashtags.',
        style: 'trendy, engaging, hashtag-rich'
      },
      youtube: {
        maxLength: 5000,
        notes: 'Video description with keywords.',
        style: 'descriptive, SEO-optimized'
      },
    };

    return specs[platform] || {
      maxLength: 1000,
      notes: 'Standard social post with relevant hashtags.',
      style: 'engaging, professional'
    };
  }

  buildPrompt(options) {
    const { platform, topic, style, customInstructions } = options;
    const specs = this.getPlatformSpecs(platform);
    const tagging = this.getTaggingRules(platform);

    // Build hashtag instructions
    let hashtagInstructions = '';
    if (tagging.minHashtags > 0) {
      hashtagInstructions = `- MANDATORY: Include ${tagging.minHashtags}-${tagging.maxHashtags} relevant hashtags
- Hashtags should be: trending, niche-specific, and discoverable
- Research suggests these work well: #dating #tech #startup #AI #charity`;
    }

    return `Create a ${platform} post about: ${topic}

CRITICAL REQUIREMENTS:
- Style: ${style || specs.style}
- Max length: ${specs.maxLength} characters (STRICT - do not exceed)
${hashtagInstructions}
- Format: Ready to post immediately, no explanations or meta-commentary
- Voice: Authentic, not AI-sounding

Platform-specific guidance:
${specs.notes}

${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

IMPORTANT: Owner accounts have LOW organic reach. Proper tagging is THE ONLY way posts get seen.

Return ONLY the post content, nothing else.`;
  }

  async generate(options) {
    this.initialize();

    const { platform, topic, style, customInstructions } = options;
    const specs = this.getPlatformSpecs(platform);

    const prompt = this.buildPrompt({ platform, topic, style, customInstructions });

    let content;
    let usedModel = 'unknown';
    let lastError = null;

    // Try Claude first if available
    if (this.anthropic) {
      try {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: Math.min(1024, Math.ceil(specs.maxLength / 3)),
          messages: [{ role: 'user', content: prompt }],
        });

        content = response.content[0].text.trim();
        usedModel = 'claude-3.5-sonnet';
        logger.info(`ContentGenerator: Generated content with ${usedModel}`, { platform, length: content.length });
      } catch (claudeError) {
        logger.warn(`ContentGenerator: Claude failed`, { error: claudeError.message });
        lastError = claudeError;
      }
    }

    // Try OpenAI if Claude not available or failed
    if (!content && this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: Math.min(1024, Math.ceil(specs.maxLength / 3)),
        });

        content = response.choices[0].message.content.trim();
        usedModel = 'gpt-4';
        logger.info(`ContentGenerator: Generated content with ${usedModel}`, { platform, length: content.length });
      } catch (openaiError) {
        logger.error(`ContentGenerator: OpenAI failed`, { error: openaiError.message });
        lastError = openaiError;
      }
    }

    // Try Gemini if still no content
    if (!content && this.gemini) {
      try {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;

        content = response.text().trim();
        usedModel = 'gemini-1.5-pro';
        logger.info(`ContentGenerator: Generated content with ${usedModel}`, { platform, length: content.length });
      } catch (geminiError) {
        logger.error(`ContentGenerator: Gemini failed`, { error: geminiError.message });
        lastError = geminiError;
      }
    }

    // If still no content, throw error
    if (!content) {
      throw new Error(`Content generation failed: ${lastError?.message || 'No AI provider available'}`);
    }

    // Validate and possibly truncate content
    if (content.length > specs.maxLength) {
      content = truncateContent(platform, content);
      logger.warn(`ContentGenerator: Content truncated for ${platform}`, {
        original: content.length,
        max: specs.maxLength
      });
    }

    // Validate tagging rules
    const tagging = this.getTaggingRules(platform);
    const hashtags = content.match(/#\w+/g) || [];
    if (hashtags.length < tagging.minHashtags && tagging.minHashtags > 0) {
      logger.warn(`ContentGenerator: Post has insufficient hashtags`, {
        platform,
        found: hashtags.length,
        required: tagging.minHashtags
      });
    }

    return {
      content,
      platform,
      model: usedModel,
      hashtags: hashtags.length,
      length: content.length
    };
  }

  async generateBatch(topic, platforms) {
    const results = {};

    for (const platform of platforms) {
      try {
        const result = await this.generate({ platform, topic });
        results[platform] = result;
      } catch (error) {
        logger.error(`ContentGenerator: Batch generation failed for ${platform}`, { error: error.message });
        results[platform] = { error: error.message, platform };
      }
    }

    return results;
  }

  // Generate content specifically for YouAndINotAI dating app
  async generateDatingAppContent(options = {}) {
    const {
      platform = 'twitter',
      angle = 'launch', // launch, feature, testimonial, urgency
    } = options;

    const angles = {
      launch: 'Valentine\'s Day 2026 launch of YouAndINotAI - 100% human-verified dating app. Anti-AI, real connections.',
      feature: 'Video verification and AI detection features of YouAndINotAI dating app.',
      testimonial: 'Why real human connection matters in dating - positioning against bot-filled dating apps.',
      urgency: '100 founding member spots at $14.99/month locked forever. Valentine\'s Day 2026.'
    };

    return this.generate({
      platform,
      topic: angles[angle] || angles.launch,
      customInstructions: 'Include youandinotai.com URL. Focus on anti-AI, human-first messaging. Use #DatingApp #ValentinesDay #NoAI'
    });
  }
}

module.exports = new ContentGenerator();
