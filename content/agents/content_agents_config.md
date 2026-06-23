# Content Agents Configuration

## Overview
This configuration file defines the behavior and capabilities of the content generation agents for YouAndINotAI's 24/7 marketing operations.

## Brand Voice Settings
- Tone: warm, real, community-focused
- Style: conversational, authentic, inclusive
- Target Audience: singles seeking meaningful connections, community-oriented individuals

## Legal Compliance Settings
- Prohibited Terms Filter: "restricted-term", "customer payments", "review-gated offer"
- Required Compliant Phrasing:
  - "reserved allocation review" (instead of "customer payments")
  - "review-gated allocation reserve" (instead of "review-gated offer")
  - "platform value lane" (instead of "reserved program")

## Agent Types

### 1. Social Media Content Generator
- Platforms: Twitter, Instagram, Facebook, LinkedIn, TikTok
- Content Types: Captions, thread starters, hashtags, poll questions
- Post Frequency: Every 2-4 hours per platform
- Character Limits Enforcement: Yes
- Platform-Specific Formatting: Yes

### 2. Blog Content Writer
- Content Types: Long-form educational articles, how-to guides, opinion pieces
- Topics Based On: Content pillars (education, story, offer, behind_the_scenes, product_update)
- Word Count Range: 800-1500 words
- SEO Optimization: Headers, keywords, meta descriptions

### 3. Newsletter Creator
- Content Types: Weekly digests, feature highlights, community spotlights
- Structure Templates: Welcome, main content, community highlights, closing
- Delivery Cadence: Weekly
- Personalization Options: Segmented content by user interests

## Content Generation Workflow
1. Pull task from content-generation-tasks.md
2. Apply brand voice and compliance settings
3. Generate content based on task requirements
4. Format for specific platform/channel
5. Submit to content-approval-workflow.md

## Compliance Validation Rules
1. Automatic scan for prohibited terms
2. Mandatory inclusion of compliant phasing where applicable
3. Brand voice consistency scoring
4. Hashtag policy adherence per platform

## Monitoring Requirements
- Content generation volume tracking
- Approval rate metrics
- Platform engagement performance
- Compliance violation alerts

## Error Handling
- Failed content generation retries: 3 attempts
- Compliance violations: Immediate halt and alert
- API connectivity issues: Queue content for retry when service resumes
- Approval workflow failures: Store content for manual submission
