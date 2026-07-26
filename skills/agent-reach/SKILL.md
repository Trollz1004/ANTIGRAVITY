---
name: agent-reach
description: |
  Internet research skill for AI agents. Fetch, search, and extract
  content from URLs. Use when the user wants to research something online,
  look up information, or when you need current data beyond your training.
metadata:
  version: 1.0.0
  author: antigravity
  category: research
---

# Agent Reach — Internet Research

## Purpose

Fetch and analyze web content for research, competitive intelligence, and
current data. This is a read-only skill — no posting, commenting, or writes.

## Capabilities

### Web Search
```
Use websearch tool with query parameter.
- type: auto (balanced), fast (quick), deep (comprehensive)
- numResults: 8 default
- Always include current year in search queries
```

### URL Fetch
```
Use webfetch tool with URL parameter.
- format: markdown (default), text, html
- timeout: up to 120 seconds
```

### Multi-Platform Research

| Platform | Method | Notes |
|----------|--------|-------|
| GitHub | websearch "site:github.com ..." | Repos, issues, code |
| Reddit | websearch "site:reddit.com ..." | Discussions, opinions |
| Twitter/X | websearch "site:x.com ..." or agent-reach skill | Real-time reactions |
| LinkedIn | websearch "site:linkedin.com ..." | Professional context |
| YouTube | websearch "site:youtube.com ..." | Tutorials, reviews |
| Stack Overflow | websearch "site:stackoverflow.com ..." | Technical Q&A |
| Hacker News | websearch "site:news.ycombinator.com ..." | Tech community |
| Product Hunt | websearch "site:producthunt.com ..." | New products |

## Workflow

### Research Task
1. Start with websearch for overview
2. Identify 3-5 most relevant URLs
3. Fetch top URLs with webfetch
4. Extract key facts, numbers, and quotes
5. Synthesize into structured summary
6. Cite sources inline

### Competitive Analysis
1. Search for competitor product/brand
2. Fetch their website, pricing page, docs
3. Search for reviews and user sentiment
4. Compile comparison table

### Trend Research
1. Search for "[topic] 2026" or "[topic] latest"
2. Filter for last 30 days
3. Identify patterns and shifts
4. Note emerging players and declining ones

## Output Format

```markdown
## Research: [Topic]

### Key Findings
1. [Finding with source]
2. [Finding with source]

### Data Points
| Metric | Value | Source |
|--------|-------|--------|
| [metric] | [value] | [url] |

### Sources
- [Title](url) — [relevance note]
```

## Rules

- Always cite sources with URLs
- Note when information may be outdated
- Don't present search results as facts — verify when possible
- Use caveman mode for research summaries unless detail is requested
- Log research in state.md for session continuity

## Integration

- **With caveman:** Compress research output using tables and bullets
- **With self-improvement:** Log which search strategies were most effective
- **With proactive-agent:** Flag when research reveals actionable opportunities
