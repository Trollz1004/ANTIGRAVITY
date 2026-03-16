import axios, { AxiosInstance } from 'axios';
import { Pool } from 'pg';
// import * as fs from 'fs';
// import * as path from 'path';

/**
 * CivitAI Integration Service
 *
 * AI-powered image generation and enhancement for YouAndINotAI dating platform
 *
 * Features:
 * - Profile picture enhancement
 * - Dating photo optimization
 * - Content moderation via AI
 * - Background removal/replacement
 * - Style transfer
 *
 * Documentation: https://github.com/civitai/civitai/wiki/REST-API-Reference
 */

interface GenerationRequest {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  seed?: number;
}

interface GenerationResult {
  id: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  imageUrl?: string;
  error?: string;
}

export class CivitAIService {
  private apiClient: AxiosInstance;
  private db: Pool;
  private apiKey: string;

  constructor(db: Pool) {
    this.apiKey = process.env.CIVITAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  CIVITAI_API_KEY not set. AI image features will be disabled.');
    }

    this.apiClient = axios.create({
      baseURL: 'https://api.civitai.com/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.db = db;
  }

  /**
   * Enhance a profile picture with AI
   */
  async enhanceProfilePicture(
    userId: string,
    imageUrl: string,
    options?: {
      removeBackground?: boolean;
      improveQuality?: boolean;
      applyStyle?: string;
    }
  ): Promise<GenerationResult> {
    console.log(`🎨 Enhancing profile picture for user: ${userId}`);

    let prompt = 'professional profile photo, high quality, well-lit, natural smile';

    if (options?.applyStyle) {
      prompt += `, ${options.applyStyle} style`;
    }

    if (options?.improveQuality) {
      prompt += ', ultra detailed, 4k resolution, sharp focus';
    }

    const negativePrompt = 'blurry, low quality, pixelated, distorted, oversaturated, filters, heavy makeup';

    try {
      const result = await this.generateImage({
        prompt,
        negativePrompt,
        model: 'sdxl-1.0',
        width: 1024,
        height: 1024,
        steps: 30,
        cfgScale: 7,
      });

      // Log enhancement to database
      await this.db.query(`
        INSERT INTO ai_enhancements (
          user_id, original_image, enhanced_image, type, status, created_at
        ) VALUES ($1, $2, $3, 'profile_picture', 'completed', NOW())
      `, [userId, imageUrl, result.imageUrl]);

      console.log(`✅ Profile picture enhanced: ${result.imageUrl}`);
      return result;

    } catch (error: any) {
      console.error(`❌ Enhancement failed:`, error.message);

      await this.db.query(`
        INSERT INTO ai_enhancements (
          user_id, original_image, type, status, error, created_at
        ) VALUES ($1, $2, 'profile_picture', 'failed', $3, NOW())
      `, [userId, imageUrl, error.message]);

      throw error;
    }
  }

  /**
   * Generate dating profile suggestions
   */
  async generateDatingPhotoSuggestions(userId: string): Promise<string[]> {
    console.log(`💡 Generating photo suggestions for user: ${userId}`);

    // Get user preferences and profile data
    const userResult = await this.db.query(`
      SELECT
        u.gender, u.interests, u.bio,
        p.outdoor_preferences, p.style_preferences
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.id = $1
    `, [userId]);

    const user = userResult.rows[0];

    const suggestions = [
      'outdoor adventure photo showing your active lifestyle',
      'casual photo in a coffee shop or cafe',
      'dressed up photo from a social event',
      'candid photo showing your genuine smile',
      'group photo with friends (showing social life)',
      'travel photo from an interesting location',
    ];

    if (user.interests?.includes('fitness')) {
      suggestions.push('athletic photo from gym or outdoor activity');
    }

    if (user.interests?.includes('cooking')) {
      suggestions.push('photo in kitchen or at restaurant');
    }

    if (user.outdoor_preferences === 'loves_outdoors') {
      suggestions.push('hiking or beach photo');
    }

    return suggestions;
  }

  /**
   * Moderate profile picture for inappropriate content
   */
  async moderateImage(imageUrl: string): Promise<{
    approved: boolean;
    reasons?: string[];
    confidence: number;
  }> {
    console.log(`🔍 Moderating image: ${imageUrl}`);

    try {
      // Use CivitAI's content moderation
      const response = await this.apiClient.post('/images/moderate', {
        imageUrl,
      });

      const result = response.data;

      const approved = result.rating === 'safe' || result.rating === 'suggestive';
      const reasons = !approved ? result.flags : [];

      // Log moderation result
      await this.db.query(`
        INSERT INTO image_moderation (
          image_url, approved, reasons, confidence, created_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `, [imageUrl, approved, JSON.stringify(reasons), result.confidence]);

      return {
        approved,
        reasons,
        confidence: result.confidence || 0,
      };

    } catch (error: any) {
      console.error(`❌ Moderation failed:`, error.message);

      // Default to manual review on error
      return {
        approved: false,
        reasons: ['moderation_service_error'],
        confidence: 0,
      };
    }
  }

  /**
   * Remove background from image
   */
  async removeBackground(imageUrl: string): Promise<string> {
    console.log(`✂️ Removing background from: ${imageUrl}`);

    try {
      const response = await this.apiClient.post('/images/remove-background', {
        imageUrl,
      });

      const resultUrl = response.data.imageUrl;
      console.log(`✅ Background removed: ${resultUrl}`);

      return resultUrl;

    } catch (error: any) {
      console.error(`❌ Background removal failed:`, error.message);
      throw error;
    }
  }

  /**
   * Generate AI image from prompt
   */
  async generateImage(request: GenerationRequest): Promise<GenerationResult> {
    console.log(`🎨 Generating image with prompt: ${request.prompt}`);

    try {
      // Create generation request
      const response = await this.apiClient.post('/images/generate', {
        prompt: request.prompt,
        negativePrompt: request.negativePrompt || '',
        model: request.model || 'sdxl-1.0',
        width: request.width || 1024,
        height: request.height || 1024,
        steps: request.steps || 30,
        cfgScale: request.cfgScale || 7,
        seed: request.seed || -1,
      });

      const jobId = response.data.id;

      // Poll for completion
      const result = await this.pollGeneration(jobId);

      return result;

    } catch (error: any) {
      console.error(`❌ Image generation failed:`, error.message);

      return {
        id: 'error',
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Poll generation status until complete
   */
  private async pollGeneration(jobId: string, maxAttempts: number = 60): Promise<GenerationResult> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.apiClient.get(`/images/generate/${jobId}`);
        const data = response.data;

        if (data.status === 'succeeded') {
          return {
            id: jobId,
            status: 'succeeded',
            imageUrl: data.imageUrl,
          };
        }

        if (data.status === 'failed') {
          return {
            id: jobId,
            status: 'failed',
            error: data.error || 'Generation failed',
          };
        }

        // Still processing, wait and retry
        await this.delay(2000);

      } catch (error: any) {
        console.error(`❌ Polling failed:`, error.message);

        if (i === maxAttempts - 1) {
          return {
            id: jobId,
            status: 'failed',
            error: 'Polling timeout',
          };
        }
      }
    }

    return {
      id: jobId,
      status: 'failed',
      error: 'Timeout after 2 minutes',
    };
  }

  /**
   * Get popular AI models for image generation
   */
  async getPopularModels(): Promise<any[]> {
    try {
      const response = await this.apiClient.get('/models', {
        params: {
          limit: 20,
          sort: 'Most Downloaded',
          types: 'Checkpoint',
        },
      });

      return response.data.items || [];

    } catch (error: any) {
      console.error(`❌ Failed to fetch models:`, error.message);
      return [];
    }
  }

  /**
   * Batch process user profile pictures
   */
  async batchEnhanceProfiles(limit: number = 10): Promise<void> {
    console.log(`🎨 Starting batch enhancement (limit: ${limit})...`);

    // Get users with unenhanced profile pictures
    const result = await this.db.query(`
      SELECT u.id, u.profile_picture
      FROM users u
      LEFT JOIN ai_enhancements ae ON ae.user_id = u.id AND ae.type = 'profile_picture'
      WHERE u.profile_picture IS NOT NULL
        AND ae.id IS NULL
      LIMIT $1
    `, [limit]);

    const users = result.rows;
    console.log(`Found ${users.length} users to enhance`);

    for (const user of users) {
      try {
        await this.enhanceProfilePicture(user.id, user.profile_picture, {
          improveQuality: true,
          removeBackground: false,
        });

        console.log(`✅ Enhanced profile for user: ${user.id}`);

        // Rate limiting
        await this.delay(5000);

      } catch (error: any) {
        console.error(`❌ Failed to enhance profile for user ${user.id}:`, error.message);
      }
    }

    console.log('✅ Batch enhancement complete!');
  }

  /**
   * Generate content for marketing campaigns
   */
  async generateMarketingImage(campaign: string): Promise<string> {
    console.log(`📢 Generating marketing image for campaign: ${campaign}`);

    const prompts: Record<string, string> = {
      'valentines_day': 'romantic couple, valentines day theme, hearts, warm lighting, professional photography',
      'summer_dating': 'happy couple at beach, summer vibes, sunset, casual clothing, smiling',
      'winter_romance': 'cozy couple with hot chocolate, winter setting, warm tones, romantic atmosphere',
      'pride_month': 'diverse couples, pride theme, colorful, joyful, inclusive dating',
    };

    const prompt = prompts[campaign] || `dating app marketing, ${campaign} theme, professional, engaging`;

    const result = await this.generateImage({
      prompt,
      negativePrompt: 'text, watermark, logo, blurry, low quality',
      width: 1920,
      height: 1080,
      steps: 40,
      cfgScale: 7.5,
    });

    if (result.status === 'succeeded' && result.imageUrl) {
      // Save to marketing assets
      await this.db.query(`
        INSERT INTO marketing_assets (
          campaign, image_url, type, created_at
        ) VALUES ($1, $2, 'ai_generated', NOW())
      `, [campaign, result.imageUrl]);

      return result.imageUrl;
    }

    throw new Error(`Failed to generate marketing image: ${result.error}`);
  }

  /**
   * Get AI enhancement statistics
   */
  async getStats(): Promise<any> {
    const result = await this.db.query(`
      SELECT
        COUNT(*) as total_enhancements,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100 as success_rate
      FROM ai_enhancements
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);

    return result.rows[0];
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in other modules
export default CivitAIService;
