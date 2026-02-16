# Marketing Engine - 20 Platform Automation

**Automate your marketing across 20+ social platforms with AI-powered content generation.**

## Supported Platforms

| Platform | API Status | Features |
|----------|------------|----------|
| Twitter/X | Full API | Post, analytics |
| LinkedIn | Full API | Post, analytics |
| Reddit | Full API | Post to subreddits |
| Dev.to | Full API | Articles, analytics |
| Hacker News | Read-only | Analytics only |
| Product Hunt | GraphQL | Launches, analytics |
| Telegram | Full API | Channel posts |
| Discord | Webhooks | Post, embeds |
| Bluesky | Full API | Post, threads |
| Mastodon | Full API | Post, analytics |
| Threads | Limited | Via Instagram API |
| Pinterest | Full API | Pins, boards |
| Quora | Manual | Content prep |
| IndieHackers | Manual | Content prep |
| Hashnode | GraphQL | Articles |
| Substack | Manual | Content prep |
| Facebook | Pages API | Post, analytics |
| Medium | Full API | Articles |
| TikTok | Limited | Captions only |
| YouTube | Limited | Community posts |

## Quick Start

```bash
npm install
cp .env.example .env
# Configure your API keys
npm start
```

## Features

- **AI Content Generation**: Claude/GPT creates platform-optimized content
- **Multi-Platform Scheduler**: Cron-based posting schedule
- **Analytics Aggregation**: Track performance across platforms
- **Content Adaptation**: Auto-formats for each platform's requirements

## File Structure

```
marketing-engine/
├── src/
│   ├── index.js
│   ├── content-generator.js
│   ├── scheduler.js
│   ├── analytics.js
│   ├── logger.js
│   └── platforms/
│       ├── twitter.js
│       ├── linkedin.js
│       └── ... (18 more)
├── package.json
└── README.md
```

## License

MIT
