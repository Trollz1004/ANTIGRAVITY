# Self-Improving Agent Skills Reference

**Last updated:** 2026-06-28  
**Purpose:** Reduce context window by pointing to file locations instead of embedding large text.

## Skills Index (Read This First)

### Core Skills (Available at `.agents/skills/`)

| Skill Key | Quick Use |
|-----------|-----------|
| paperclip | Paperclip/API coordination |
| paperclip-create-agent | Hire new agents |
| paperclip-create-plugin | Build plugins |
| para-memory-files | PARA memory system |
| hermes-evolution | Self-improvement evaluation |
| mission-control | Kanban/task tracking |
| payments | Square/Stripe payment processing |
| revenue-model | Business revenue guidance |
| self-improving-system | Skills reference index |
| sleek-design-mobile-apps | Mobile app design via Sleek |
| social-growth-engineer | TikTok/Instagram growth |
| supabase | Supabase database, auth, edge functions |
| supabase-postgres-best-practices | Postgres optimization |
| ui-ux-pro-max | UI/UX design across 10 stacks |
| devrel-content | Technical blogs/tutorials |
| growth-marketer | Growth marketing, funnels |

### Agency Skills (Available at `.agents/skills/agency-*`)

#### Engineering (30 skills)
| Skill Key | Quick Use |
|-----------|-----------|
| agency-ai-engineer | ML model development |
| agency-backend-architect | Scalable backend systems |
| agency-data-engineer | Data pipelines, lakehouse |
| agency-database-optimizer | Query/index optimization |
| agency-devops-automator | CI/CD, infrastructure |
| agency-embedded-firmware-engineer | ESP32, STM32, RTOS |
| agency-frontend-developer | React, Vue, Angular |
| agency-mcp-builder | Model Context Protocol servers |
| agency-mobile-app-builder | iOS/Android apps |
| agency-api-tester | API validation/testing |
| agency-code-reviewer | Code quality review |
| agency-codebase-onboarding-engineer | Code navigation help |
| agency-software-architect | System architecture design |
| agency-sre-site-reliability-engineer | SLOs, reliability |
| agency-automation-governance-architect | n8n automation governance |
| agency-autonomous-optimization-architect | API performance tuning |
| agency-blockchain-security-auditor | Smart contract audits |
| agency-security-engineer | App security, threat modeling |
| agency-threat-detection-engineer | SIEM rules, detection |
| agency-performance-benchmarker | Performance testing |
| agency-solidity-smart-contract-engineer | EVM contracts |
| agency-blender-add-on-engineer | Blender Python tooling |
| agency-ai-data-remediation-engineer | Data anomaly remediation |
| agency-git-workflow-master | Git workflows/best practices |
| agency-godot-gameplay-scripter | GDScript systems |
| agency-unity-architect | Unity modular design |
| agency-unreal-systems-engineer | UE5 C++/Blueprint |
| agency-roblox-systems-scripter | Luau networking |
| agency-godot-multiplayer-engineer | Godot networking |
| agency-unity-multiplayer-engineer | Unity Netcode |
| agency-unreal-multiplayer-architect | UE5 replication |

#### Design (21 skills)
| Skill Key | Quick Use |
|-----------|-----------|
| agency-ui-designer | Interface design |
| agency-ux-researcher | User research/testing |
| agency-ux-architect | UX architecture |
| agency-brand-guardian | Brand strategy |
| agency-level-designer | Game level design |
| agency-narrative-designer | Story/dialogue design |
| agency-technical-artist | Art-to-engine pipeline |
| agency-game-audio-engineer | FMOD/Wwise audio |
| agency-game-designer | Mechanics/economy |
| agency-visual-storyteller | Visual narratives |
| agency-whimsy-injector | Playful UX |
| agency-unreal-world-builder | UE5 open worlds |
| agency-xr-interface-architect | AR/VR interfaces |
| agency-visionos-spatial-engineer | visionOS apps |
| agency-xr-immersive-developer | WebXR apps |
| agency-xr-cockpit-interaction-specialist | XR cockpit UI |
| agency-roblox-avatar-creator | Roblox UGC |
| agency-roblox-experience-designer | Roblox monetization |
| agency-unity-editor-tool-developer | Editor automation |
| agency-technical-writer | Documentation writing |
| agency-godot-shader-developer | Godot shaders |
| agency-unity-shader-graph-artist | Unity shader graphs |

#### Marketing (27 skills)
| Skill Key | Quick Use |
|-----------|-----------|
| agency-growth-hacker | Viral growth, funnels |
| agency-content-creator | Multi-channel content |
| agency-social-media-strategist | LinkedIn/Twitter social |
| agency-paid-media-auditor | Media account audits |
| agency-ppc-campaign-strategist | Google/Meta ads |
| agency-paid-social-strategist | Social ad campaigns |
| agency-programmatic-display-buyer | DSP/RTB buying |
| agency-search-query-analyst | Search query analysis |
| agency-seo-specialist | Organic search growth |
| agency-baidu-seo-specialist | Baidu SEO |
| agency-tiktok-strategist | TikTok growth |
| agency-instagram-curator | Instagram strategy |
| agency-twitter-engager | X/Twitter engagement |
| agency-douyin-strategist | Douyin marketing |
| agency-kuaishou-strategist | Kuaishou marketing |
| agency-xiaohongshu-specialist | Xiaohongshu content |
| agency-weibo-strategist | Weibo operations |
| agency-bilibili-content-strategist | Bilibili UP主 growth |
| agency-zhihu-strategist | Zhihu thought leadership |
| agency-podcast-strategist | Podcast growth |
| agency-video-optimization-specialist | YouTube optimization |
| agency-short-video-editing-coach | Video editing |
| agency-carousel-growth-engine | Carousel generation |
| agency-image-prompt-engineer | AI image prompts |
| agency-ai-citation-strategist | ChatGPT citations |
| agency-inclusive-visuals-specialist | Diverse representation |
| agency-tracking-measurement-specialist | Ad tracking/analytics |
| agency-trend-researcher | Trend analysis |
| agency-cross-border-e-commerce-specialist | Global e-commerce |

#### Sales (14 skills)
| Skill Key | Quick Use |
|-----------|-----------|
| agency-outbound-strategist | Cold outreach |
| agency-sales-outreach | Consultative sales |
| agency-sales-engineer | Pre-sales tech |
| agency-sales-coach | Rep development |
| agency-deal-strategist | MEDDPICC deals |
| agency-pipeline-analyst | Forecast accuracy |
| agency-account-strategist | Land-and-expand |
| agency-salesforce-architect | SFDC solutions |
| agency-discovery-coach | Discovery calls |
| agency-private-domain-operator | WeCom ecosystem |
| agency-sales-data-extraction-agent | Excel metrics |
| agency-report-distribution-agent | Report distribution |
| agency-data-consolidation-agent | Dashboard consolidation |

#### Product (6 skills)
| Skill Key | Quick Use |
|-----------|-----------|
| agency-product-manager | Product lifecycle |
| agency-sprint-prioritizer | Sprint planning |
| agency-proposal-strategist | RFP responses |
| agency-experiment-tracker | A/B testing |
| agency-rapid-prototyper | MVP creation |

#### Management (9 skills)
| Skill Key | Quick Use |
|-----------|-----------|
| agency-project-shepherd | Cross-team coordination |
| agency-studio-producer | Creative production |
| agency-studio-operations | Studio efficiency |
| agency-chief-of-staff | Executive coordination |
| agency-jira-workflow-steward | Git/Jira workflow |
| agency-workflow-architect | Process design |
| agency-workflow-optimizer | Process improvement |
| agency-agents-orchestrator | Agent pipeline |
| agency-senior-project-manager | Project planning |

#### QA & Testing (5 skills)
| Skill Key | Quick Use |
|-----------|-----------|
| agency-reality-checker | Production validation |
| agency-evidence-collector | QA evidence |
| agency-accessibility-auditor | WCAG compliance |
| agency-test-results-analyzer | Test analysis |
| agency-compliance-auditor | SOC 2, ISO audits |

#### Support (5 skills)
| Skill Key | Quick Use |
|-----------|-----------|
| agency-support-responder | Customer support |
| agency-customer-service | Service inquiries |
| agency-healthcare-customer-service | Healthcare support |
| agency-analytics-reporter | Business insights |
| agency-model-qa-specialist | ML model QA |

#### Finance (9 skills)
| Skill Key | Quick Use |
|-----------|-----------|
| agency-bookkeeper-controller | Day-to-day accounting |
| agency-financial-analyst | Financial modeling |
| agency-fp-a-analyst | Planning/analysis |
| agency-finance-tracker | Financial tracking |
| agency-tax-strategist | Tax optimization |
| agency-accounts-payable-agent | Payments processing |
| agency-investment-researcher | Due diligence |
| agency-legal-billing-time-tracking | Legal billing |
| agency-book-co-author | Thought leadership |

#### Specialized Domains (26 skills)
| Skill Key | Quick Use |
|-----------|-----------|
| agency-china-market-localization-strategist | China go-to-market |
| agency-china-e-commerce-operator | Tmall/Taobao/JD |
| agency-government-digital-presales-consultant | China ToG bids |
| agency-healthcare-marketing-compliance-specialist | Healthcare ads |
| agency-supply-chain-strategist | Procurement |
| agency-recruitment-specialist | Talent acquisition |
| agency-hr-onboarding | New hire onboarding |
| agency-study-abroad-advisor | International education |
| agency-legal-compliance-checker | Legal compliance |
| agency-legal-document-review | Contract review |
| agency-legal-client-intake | Client intake |
| agency-loan-officer-assistant | Mortgage lending |
| agency-real-estate-buyer-seller | Property transactions |
| agency-civil-engineer | Structural design |
| agency-app-store-optimizer | ASO |
| agency-cms-developer | WordPress/Drupal |
| agency-filament-optimization-specialist | Filament PHP admin |
| agency-wechat-mini-program-developer | WeChat mini-programs |
| agency-wechat-official-account-manager | WeCom management |
| agency-feishu-integration-developer | Lark integrations |
| agency-korean-business-navigator | Korean business |
| agency-french-consulting-market-navigator | French freelance |
| agency-tool-evaluator | Tool assessment |
| agency-ad-creative-strategist | Ad creative |
| agency-livestream-commerce-coach | Live commerce |
| agency-behavioral-nudge-engine | User motivation |
| agency-cultural-intelligence-strategist | Global inclusion |
| agency-anthropologist | Cultural systems |
| agency-historian | Historical accuracy |
| agency-psychologist | Character psychology |
| agency-identity-graph-operator | Identity resolution |
| agency-email-intelligence-engineer | Email parsing |
| agency-voice-ai-integration-engineer | Speech pipelines |
| agency-incident-response-commander | Incident response |
| agency-infrastructure-maintainer | Infrastructure ops |
| agency-minimal-change-engineer | Minimal code changes |
| agency-developer-advocate | Developer relations |
| agency-language-translator | Translation services |
| agency-linkedin-content-creator | LinkedIn content |
| agency-corporate-training-designer | Training programs |
| agency-feedback-synthesizer | Feedback analysis |
| agency-document-generator | PDF/DOCX generation |
| agency-narratologist | Narrative theory |
| agency-executive-summary-generator | Executive summaries |
| agency-agentic-identity-trust-architect | Agent identity systems |
| agency-agentic-search-optimizer | AI task completion |
| agency-geographer | Physical geography |
| agency-zk-steward | ZK proof systems |
| agency-terminal-integration-specialist | Terminal apps |
| agency-lsp-index-engineer | Code intelligence |
| agency-macos-spatial-metal-engineer | visionOS native Swift |
| agency-reddit-community-builder | Reddit community |
| agency-senior-developer | Senior code implementation |
| agency-unreal-technical-artist | UE5 shaders/VFX |

#### Retail & Customer Operations (3 skills)
| Skill Key | Quick Use |
|-----------|-----------|
| agency-retail-customer-returns | Returns processing |
| agency-hospitality-guest-services | Hotel/resort service |

### Secondary Skills (Available at `skills/`)

| Skill Key | Quick Use |
|-----------|-----------|
| antigravity-doctrine | Core operating rules |
| antigravity-mission-orchestrator | Workspace orchestration |

### Pi Agent Skills (via skill system)

| Skill Key | Quick Use |
|-----------|-----------|
| agent-browser | Browser automation |
| copywriting | Marketing copy |
| executing-plans | Plan execution |
| find-skills | Discover skills |
| frontend-design | UI design |
| high-end-visual-design | Premium design |
| hyperframes | Video/motion graphics |
| opensource-guide-coach | Open source guidance |
| prototype | Rapid prototypes |
| redesign-existing-projects | UI/UX upgrades |
| subagent-driven-development | Multi-agent execution |
| to-prd | Product requirements |
| triage | Task prioritization |
| verification-before-completion | Quality checks |
| web-design-guidelines | Web standards |

## Search Commands

```bash
# List all available skills
find .agents/skills -maxdepth 1 -type d

# Read a specific skill
read .agents/skills/<skill-name>/SKILL.md

# Search skills by keyword
grep -r "keyword" .agents/skills/*/SKILL.md
```

## File Locations

| Type | Path |
|------|------|
| Skills index | `/mnt/c/antigravity/skills/self-improving-system/skills.md` |
| Session notes | `/mnt/c/antigravity/skills/self-improving-system/session-notes.md` |
| Core skills | `.agents/skills/<skill-name>/SKILL.md` |
| Secondary skills | `skills/<skill-name>/SKILL.md` |
| Pi agent skills | `/home/josh/.pi/agent/skills/` or `agent-browser skills get <name>` |

## Self-Improvement Protocol

On each heartbeat exit, append to `session-notes.md`:

```md
## YYYY-MM-DD Session End - [Agent Name]

- Skills used: [list]
- Effectiveness notes: [what worked]
- Suggestions for next session: [improvements]
- Timestamp: [ISO time]
```