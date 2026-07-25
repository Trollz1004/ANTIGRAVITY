# Content Agents for YouAndINotAI

This directory contains the 24/7 content generation agents for YouAndINotAI marketing operations.

## Agent Structure

### 1. Social Media Content Generator
- Location: `social-media/`
- Specialized in Twitter, Instagram, Facebook posts
- Understands brand voice: warm, real, community-focused
- Complies with legal-safe phrasing requirements

### 2. Blog Content Writer
- Location: `blog/`
- Creates long-form educational content
- Focuses on dating safety, relationship building, platform features

### 3. Newsletter Creator
- Location: `newsletter/`
- Produces weekly digest content
- Summarizes key platform updates and community stories

## Compliance Features

All agents automatically:
- Filter prohibited terms ("payment", "payment", "outreach")
- Substitute with compliant phrasing ("contractual revenue payout")
- Maintain brand voice consistency
- Enforce hashtag policy per platform

## Content Generation Workflow

1. Select task from content-generation-tasks.md
2. Generate content according to task requirements
3. Format for specific platform
4. Submit to content-approval-workflow.md for approval
5. Track approval status and publication timing

## Getting Started

Each agent directory contains:
- `config.json` - Agent configuration with brand guidelines
- `agent.py` - Main agent implementation
- `compliance_checker.py` - Compliance validation functions
- `content_generator.py` - Content generation logic
- `platform_formatter.py` - Platform-specific formatting
- `approval_submitter.py` - Content approval submission

Agents are designed to run continuously and generate content based on the 100 content generation tasks framework.