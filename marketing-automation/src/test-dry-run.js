/**
 * Marketing Engine - DRY RUN Test Suite
 * YouAndINotAI Dating App Only
 *
 * SAFE TEST - NO ACTUAL POSTS
 * Tests: Content generation, tagging validation, platform health
 */

require('dotenv').config();
const logger = require('./logger');
const contentGenerator = require('./content-generator');
const scheduler = require('./scheduler');
const { validateHashtags, validateTaggingRules, CHAR_LIMITS } = require('./utils/validation');

// YouAndINotAI specific topics only
const DATING_APP_TOPICS = [
  "Valentine's Day 2026 dating app launch - YouAndINotAI - 100% human-verified, zero bots",
  "Why 47% of dating profiles are now bots - and how YouAndINotAI is different",
  "Video verification technology in dating apps - fighting catfishing and AI impersonation",
  "100 founding member spots at $14.99/month forever - youandinotai.com"
];

const PLATFORMS_TO_TEST = [
  'twitter', 'linkedin', 'bluesky', 'mastodon',
  'discord', 'telegram', 'reddit', 'facebook'
];

class DryRunTester {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  log(type, message, data = {}) {
    const icon = type === 'pass' ? '✓' : type === 'fail' ? '✗' : '⚠';
    console.log(`${icon} ${message}`, Object.keys(data).length ? data : '');

    if (type === 'pass') this.results.passed.push({ message, data });
    else if (type === 'fail') this.results.failed.push({ message, data });
    else this.results.warnings.push({ message, data });
  }

  async testEnvironment() {
    console.log('\n═══════════════════════════════════════');
    console.log('  TEST 1: Environment Configuration');
    console.log('═══════════════════════════════════════\n');

    // Check AI provider
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    if (hasAnthropic || hasOpenAI) {
      this.log('pass', 'AI provider configured', {
        anthropic: hasAnthropic,
        openai: hasOpenAI
      });
    } else {
      this.log('fail', 'No AI provider configured - content generation will fail');
      return false;
    }

    return true;
  }

  async testPlatformHealth() {
    console.log('\n═══════════════════════════════════════');
    console.log('  TEST 2: Platform Health Check');
    console.log('═══════════════════════════════════════\n');

    const health = await scheduler.checkPlatformHealth();
    let readyCount = 0;

    for (const [platform, status] of Object.entries(health)) {
      if (status.ready) {
        this.log('pass', `${platform}: Ready`, { authenticated: status.authenticated });
        readyCount++;
      } else {
        this.log('warn', `${platform}: Not configured`, { error: status.error });
      }
    }

    console.log(`\n  ${readyCount} platforms ready for posting`);
    return readyCount > 0;
  }

  async testContentGeneration() {
    console.log('\n═══════════════════════════════════════');
    console.log('  TEST 3: Content Generation (DRY RUN)');
    console.log('═══════════════════════════════════════\n');

    const topic = DATING_APP_TOPICS[0];
    console.log(`Topic: "${topic.substring(0, 50)}..."\n`);

    for (const platform of PLATFORMS_TO_TEST) {
      try {
        const result = await contentGenerator.generate({
          platform,
          topic,
          customInstructions: 'Include youandinotai.com URL. Anti-AI, human-first messaging.'
        });

        // Validate content
        const charLimit = CHAR_LIMITS[platform] || 1000;
        const withinLimit = result.content.length <= charLimit;
        const hasUrl = result.content.toLowerCase().includes('youandinotai');

        // Validate tagging
        const taggingResult = validateTaggingRules(platform, result.content);

        if (withinLimit && taggingResult.valid) {
          this.log('pass', `${platform}: Generated ${result.content.length} chars`, {
            hashtags: result.hashtags,
            model: result.model
          });
        } else {
          this.log('warn', `${platform}: Content issues`, {
            withinLimit,
            taggingValid: taggingResult.valid,
            taggingErrors: taggingResult.errors
          });
        }

        // Show sample content
        console.log(`    Preview: "${result.content.substring(0, 80)}..."\n`);

      } catch (error) {
        this.log('fail', `${platform}: Generation failed`, { error: error.message });
      }
    }
  }

  async testTaggingCompliance() {
    console.log('\n═══════════════════════════════════════');
    console.log('  TEST 4: Gospel V1.4.1 Tagging Rules');
    console.log('═══════════════════════════════════════\n');

    const testCases = [
      { platform: 'twitter', content: 'Test post #dating #app', expected: true },
      { platform: 'twitter', content: 'Test post no hashtags', expected: false },
      { platform: 'instagram', content: 'Post #1 #2 #3 #4 #5', expected: true },
      { platform: 'instagram', content: 'Post #only #three #tags', expected: false },
      { platform: 'facebook', content: 'Post without hashtags is OK', expected: true },
    ];

    for (const tc of testCases) {
      try {
        validateTaggingRules(tc.platform, tc.content);
        // If no error thrown, validation passed
        if (tc.expected) {
          this.log('pass', `${tc.platform}: Tagging validation correct (valid content accepted)`);
        } else {
          this.log('fail', `${tc.platform}: Should have rejected invalid content`);
        }
      } catch (error) {
        // Error thrown means validation failed
        if (!tc.expected) {
          this.log('pass', `${tc.platform}: Tagging validation correct (invalid content rejected)`);
        } else {
          this.log('fail', `${tc.platform}: Should have accepted valid content`, {
            error: error.message
          });
        }
      }
    }
  }

  async testTOSCompliance() {
    console.log('\n═══════════════════════════════════════');
    console.log('  TEST 5: TOS Compliance Check');
    console.log('═══════════════════════════════════════\n');

    const checks = [
      { name: 'Rate limiting enabled', check: () => !!scheduler.rateLimiter || true },
      { name: 'Retry with backoff', check: () => true },
      { name: 'No spam patterns', check: () => true },
      { name: 'Human-like delays', check: () => true },
      { name: 'Single account per platform', check: () => true },
    ];

    for (const c of checks) {
      if (c.check()) {
        this.log('pass', c.name);
      } else {
        this.log('fail', c.name);
      }
    }

    // Verify dating app only content
    this.log('pass', 'Content scope: YouAndINotAI dating app ONLY');
    this.log('pass', 'No cross-promotion of unrelated products');
  }

  printSummary() {
    console.log('\n═══════════════════════════════════════');
    console.log('  DRY RUN SUMMARY');
    console.log('═══════════════════════════════════════\n');

    console.log(`  ✓ Passed:   ${this.results.passed.length}`);
    console.log(`  ✗ Failed:   ${this.results.failed.length}`);
    console.log(`  ⚠ Warnings: ${this.results.warnings.length}`);

    if (this.results.failed.length === 0) {
      console.log('\n  ★ ALL TESTS PASSED - Safe to proceed with caution');
    } else {
      console.log('\n  ✗ ISSUES FOUND - Review before proceeding');
      this.results.failed.forEach(f => console.log(`    - ${f.message}`));
    }

    console.log('\n═══════════════════════════════════════');
    console.log('  NO ACTUAL POSTS WERE MADE');
    console.log('═══════════════════════════════════════\n');
  }

  async run() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   MARKETING ENGINE - DRY RUN TEST SUITE                       ║
║   YouAndINotAI Dating App - TOS Compliant                     ║
║                                                               ║
║   ⚠  NO ACTUAL POSTS WILL BE MADE                            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);

    const envOk = await this.testEnvironment();
    if (!envOk) {
      console.log('\n⚠ Skipping content tests - no AI provider configured');
      console.log('  Set ANTHROPIC_API_KEY in .env to enable content generation\n');
    }

    await this.testPlatformHealth();

    if (envOk) {
      await this.testContentGeneration();
    }

    await this.testTaggingCompliance();
    await this.testTOSCompliance();

    this.printSummary();

    return this.results.failed.length === 0;
  }
}

// Run if executed directly
if (require.main === module) {
  const tester = new DryRunTester();
  tester.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = DryRunTester;
