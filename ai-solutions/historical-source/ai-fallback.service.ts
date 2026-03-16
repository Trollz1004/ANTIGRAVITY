/**
 * AI Fallback Service - Gemini → Bedrock with Budget Protection
 * 
 * Implements intelligent fallback and budget auto-disable
 * Mission: 100% of ALL revenue → Shriners Children's Hospitals (OMEGA = full charity)
 */

import { bedrockService, BedrockResponse } from './bedrock.service';
import { cloudWatchAlarms } from './cloudwatch-alarms.service';

interface GeminiResponse {
  content: string;
  usage: { input_tokens: number; output_tokens: number; cost?: number };
  model: string;
  timestamp: Date;
  charityPortion: number;
}

interface BudgetTracker {
  dailySpend: number;
  monthlySpend: number;
  lastReset: Date;
  disabled: boolean;
}

export class AIFallbackService {
  private budgetTracker: BudgetTracker;
  private dailyBudget: number;
  private monthlyBudget: number;
  private autoDisableThreshold: number;

  constructor() {
    this.dailyBudget = parseFloat(process.env.BEDROCK_DAILY_BUDGET || '10');
    this.monthlyBudget = parseFloat(process.env.BEDROCK_MONTHLY_BUDGET || '100');
    this.autoDisableThreshold = parseFloat(process.env.BEDROCK_AUTO_DISABLE_THRESHOLD || '0.9');
    
    this.budgetTracker = {
      dailySpend: 0,
      monthlySpend: 0,
      lastReset: new Date(),
      disabled: false
    };
  }

  /**
   * Generate content with Gemini → Bedrock fallback
   */
  async generateWithFallback(
    prompt: string,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<GeminiResponse | BedrockResponse> {
    
    // Check budget before proceeding
    if (this.isBudgetExceeded()) {
      console.log('💰 Budget exceeded, using Gemini only');
      return this.generateWithGemini(prompt, options);
    }

    try {
      // Try Gemini first (primary AI)
      const geminiResponse = await this.generateWithGemini(prompt, options);
      
      // If Gemini succeeds, return it
      return geminiResponse;
      
    } catch (geminiError) {
      console.log('🔄 Gemini failed, falling back to Bedrock');
      
      try {
        // Fallback to Bedrock
        const startTime = Date.now();
        const bedrockResponse = await bedrockService.generate(prompt, options);
        const latency = Date.now() - startTime;
        
        // Track costs and update budget
        this.updateBudgetTracker(bedrockResponse.usage.cost || 0);
        
        // Log metrics
        await cloudWatchAlarms.logLatency(latency);
        await cloudWatchAlarms.logCost(bedrockResponse.usage.cost || 0);
        
        console.log(`💚 Bedrock fallback successful (${latency}ms, $${(bedrockResponse.usage.cost || 0).toFixed(6)})`);
        
        return bedrockResponse;
        
      } catch (bedrockError) {
        console.error('❌ Both Gemini and Bedrock failed');
        throw new Error(`AI generation failed: Gemini (${(geminiError as Error).message}), Bedrock (${(bedrockError as Error).message})`);
      }
    }
  }

  /**
   * Generate with Gemini (mock implementation)
   */
  private async generateWithGemini(
    prompt: string,
    options: { maxTokens?: number; temperature?: number }
  ): Promise<GeminiResponse> {
    
    // Check if Gemini fallback is enabled
    if (process.env.ENABLE_GEMINI_FALLBACK !== '1') {
      throw new Error('Gemini fallback disabled');
    }

    // Mock Gemini response (replace with actual Gemini integration)
    const mockResponse: GeminiResponse = {
      content: `Gemini response to: ${prompt.substring(0, 50)}...`,
      usage: {
        input_tokens: Math.ceil(prompt.length / 4),
        output_tokens: 50,
        cost: 0 // Gemini is free tier
      },
      model: 'gemini-1.5-pro',
      timestamp: new Date(),
      charityPortion: 1.0 // GOSPEL: OMEGA = 100% to kids
    };

    // Simulate potential failure for testing
    if (prompt.includes('FORCE_GEMINI_FAIL')) {
      throw new Error('Simulated Gemini failure');
    }

    return mockResponse;
  }

  /**
   * Check if budget is exceeded
   */
  private isBudgetExceeded(): boolean {
    this.resetBudgetIfNeeded();
    
    const dailyExceeded = this.budgetTracker.dailySpend >= (this.dailyBudget * this.autoDisableThreshold);
    const monthlyExceeded = this.budgetTracker.monthlySpend >= (this.monthlyBudget * this.autoDisableThreshold);
    
    if (dailyExceeded || monthlyExceeded || this.budgetTracker.disabled) {
      console.log(`🛡️ Budget protection active: Daily: $${this.budgetTracker.dailySpend.toFixed(4)}/$${this.dailyBudget}, Monthly: $${this.budgetTracker.monthlySpend.toFixed(4)}/$${this.monthlyBudget}`);
      return true;
    }
    
    return false;
  }

  /**
   * Update budget tracker with new costs
   */
  private updateBudgetTracker(cost: number): void {
    this.resetBudgetIfNeeded();
    
    this.budgetTracker.dailySpend += cost;
    this.budgetTracker.monthlySpend += cost;
    
    // Auto-disable if threshold exceeded
    const dailyThreshold = this.dailyBudget * this.autoDisableThreshold;
    const monthlyThreshold = this.monthlyBudget * this.autoDisableThreshold;
    
    if (this.budgetTracker.dailySpend >= dailyThreshold || 
        this.budgetTracker.monthlySpend >= monthlyThreshold) {
      this.budgetTracker.disabled = true;
      console.log('🚨 Budget threshold exceeded - Bedrock auto-disabled for charity protection');
    }
  }

  /**
   * Reset budget counters if needed
   */
  private resetBudgetIfNeeded(): void {
    const now = new Date();
    const lastReset = this.budgetTracker.lastReset;
    
    // Reset daily budget (new day)
    if (now.getDate() !== lastReset.getDate() || 
        now.getMonth() !== lastReset.getMonth() || 
        now.getFullYear() !== lastReset.getFullYear()) {
      this.budgetTracker.dailySpend = 0;
      this.budgetTracker.disabled = false; // Re-enable on new day
    }
    
    // Reset monthly budget (new month)
    if (now.getMonth() !== lastReset.getMonth() || 
        now.getFullYear() !== lastReset.getFullYear()) {
      this.budgetTracker.monthlySpend = 0;
    }
    
    this.budgetTracker.lastReset = now;
  }

  /**
   * Get budget status
   */
  getBudgetStatus() {
    this.resetBudgetIfNeeded();
    
    return {
      dailySpend: this.budgetTracker.dailySpend,
      dailyBudget: this.dailyBudget,
      dailyRemaining: Math.max(0, this.dailyBudget - this.budgetTracker.dailySpend),
      monthlySpend: this.budgetTracker.monthlySpend,
      monthlyBudget: this.monthlyBudget,
      monthlyRemaining: Math.max(0, this.monthlyBudget - this.budgetTracker.monthlySpend),
      disabled: this.budgetTracker.disabled,
      charityProtected: this.budgetTracker.dailySpend * 1.0 // GOSPEL: OMEGA = 100% to kids
    };
  }

  /**
   * Manually reset budget (admin function)
   */
  resetBudget(): void {
    this.budgetTracker = {
      dailySpend: 0,
      monthlySpend: 0,
      lastReset: new Date(),
      disabled: false
    };
    console.log('💰 Budget tracker reset');
  }
}

export const aiFallbackService = new AIFallbackService();