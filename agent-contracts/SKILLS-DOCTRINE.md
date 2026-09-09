AI-MANDATORY use of skills per task given and sub agents used ----YOU DO NOT JUST LOAD 1 you load all skills for each task below on top of any other mandatory load on all session start skills !!!!!!

Ref:https://www.skills.sh/topic 




Testing skills
Testing skills give your agent the frameworks to write meaningful tests rather than boilerplate coverage — TDD loops, Playwright automation, end-to-end verification passes, and React component testing patterns.

What your agent can do with testing skills installed
Run a proper TDD loop: write the failing test first, implement the minimal fix, verify, then refactor
Write Playwright tests that are resilient to UI changes with correct selectors, wait strategies, and test isolation
Use the Playwright CLI to control a running browser and capture interactions without writing scripts manually
Test React components with correct patterns for what to mock versus what to test through the real implementation
Force a verification pass at the end of any task before marking it complete
Configure CI-appropriate Playwright test runs with parallelism, retries, and failure reporting
Skills in this category
Skill
What it does
test-driven-development
obra/superpowers

TDD loop: write the failing test first, implement the minimal change, verify, then refactor

webapp-testing
anthropics/skills

Web app testing patterns covering unit, integration, and end-to-end approaches

verification-before-completion
obra/superpowers

Force a verification pass before any task is marked done

playwright-best-practices
currents-dev/playwright-best-practices-skill

Playwright patterns: selectors, fixtures, parallelism, and CI integration

playwright-cli
microsoft/playwright-cli

Control a live browser via the Playwright CLI to record, inspect, and replay interactions

Works with your agent
Testing skills are compatible with Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, Codex, Gemini CLI, and all agents that support the skills CLI.



**********

skills
/
topics
/
Marketing
Marketing skills
Marketing skills give your agent domain expertise for SEO, copywriting, CRO, and growth work. Install once and your agent carries that knowledge into every session in the project without you re-explaining the context.

What your agent can do with marketing skills installed
Audit a landing page for SEO issues and return a prioritized action plan — not a generic checklist
Write copy that applies behavioral psychology frameworks (Fogg model, social proof, loss aversion) rather than relying on style intuition alone
Build a content brief from SERP analysis and keyword intent, mapped to what actually ranks for that query
Design and write A/B test variants for landing pages, paywalls, and popups with testable hypotheses
Draft cold email sequences with a coherent narrative arc across all touches
Create a go-to-market plan with sequenced channels, messaging, and timing
Skills in this category
Skill
What it does
seo-audit
coreyhaines31/marketingskills

Technical and on-page SEO audit with prioritized action plan

copywriting
coreyhaines31/marketingskills

Persuasive copy across formats: headlines, landing pages, email, and ads

marketing-psychology
coreyhaines31/marketingskills

Behavioral principles applied to messaging, design decisions, and conversion flows

social-content
coreyhaines31/marketingskills

Platform-native content for LinkedIn, X, and Instagram

content-strategy
coreyhaines31/marketingskills

Topic planning, content calendars, and editorial frameworks

programmatic-seo
coreyhaines31/marketingskills

Large-scale SEO content programs built for consistent quality at volume

pricing-strategy
coreyhaines31/marketingskills

Pricing page structure, plan naming, anchoring, and conversion optimization

page-cro
coreyhaines31/marketingskills

Conversion rate analysis and optimization for landing and product pages

launch-strategy
coreyhaines31/marketingskills

Go-to-market planning, channel sequencing, and launch execution

schema-markup
coreyhaines31/marketingskills

Structured data implementation for rich results and AI search visibility

email-sequence
coreyhaines31/marketingskills

Multi-touch email sequences with coherent arc, personalization, and timing

paid-ads
coreyhaines31/marketingskills

Ad copy and creative briefs for Google, Meta, and LinkedIn campaigns

competitor-alternatives
coreyhaines31/marketingskills

Positioning and messaging for competitive comparison and alternative pages

analytics-tracking
coreyhaines31/marketingskills

Event tracking plans, GA4 setup, and attribution frameworks

paywall-upgrade-cro
coreyhaines31/marketingskills

Optimize paywall and upgrade flows for conversion

popup-cro
coreyhaines31/marketingskills

Intent-based popup design and copy that converts without degrading UX

ai-seo
coreyhaines31/marketingskills

Optimize content for AI Overviews, Perplexity, and answer engine visibility

cold-email
coreyhaines31/marketingskills

Outbound email with personalization frameworks and deliverability guidance

ad-creative
coreyhaines31/marketingskills

Visual and copy briefs for performance creative

churn-prevention
coreyhaines31/marketingskills

Retention messaging, cancellation flows, and win-back sequences

lead-magnets
coreyhaines31/marketingskills

Design and write lead magnets matched to audience intent

Works with your agent
Marketing skills are compatible with Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, Codex, Gemini CLI, and all agents that support the skills CLI.



***************

skills
/
topics
/
React
Frontend & React skills
React skills give your agent the performance rules, component patterns, and ecosystem knowledge to write production-quality frontend code, not just code that works.

What your agent can do with react skills installed
Identify and eliminate data-fetching waterfalls in React component trees
Apply correct memoization, knowing when useMemo, useCallback, and React.memo genuinely help versus when they add overhead without benefit
Build composable component APIs that stay maintainable as features grow rather than accumulating boolean prop sprawl
Set up and extend shadcn/ui components with correct Tailwind configuration and theming
Catch bundle size problems: barrel imports, unnecessary client components, and heavy third-party libraries
Write TypeScript types correctly for complex component APIs, discriminated unions, and conditional types
Skills in this category
Skill
What it does
vercel-react-best-practices
vercel-labs/agent-skills

69 prioritized React performance rules covering waterfalls, bundle size, re-renders, and advanced patterns

vercel-composition-patterns
vercel-labs/agent-skills

Compound components, render props, and context patterns for scalable component APIs

shadcn
shadcn/ui

shadcn/ui component usage, customization, and Tailwind integration

webapp-testing
anthropics/skills

Testing React apps: unit, integration, and end-to-end patterns

typescript-advanced-types
wshobson/agents

Discriminated unions, conditional types, template literals, and utility type patterns

tailwind-design-system
wshobson/agents

Design system implementation with Tailwind: tokens, variants, and component patterns

Building on Vercel? Several of these ship together as a single plugin — npx plugins add vercel/vercel-plugin.

Works with your agent
React skills are compatible with Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, Codex, Gemini CLI, and all agents that support the skills CLI.



***************


skills
/
topics
/
Design & UI
Design & UI skills
Design skills give your agent the taste and frameworks to produce polished interfaces, review visual work, and apply design systems consistently across a project. Install once and your agent knows what good looks like without you re-explaining it each session.

What your agent can do with design & ui skills installed
Review a component and identify specific visual problems — hierarchy, spacing, contrast, motion — with line-level specificity rather than generic feedback
Refactor a design toward a given aesthetic (more minimal, bolder, more editorial) while preserving function
Apply a design system consistently across new components without drifting from established patterns
Extract and document tokens, spacing, and component patterns from an existing codebase
Critique UI against accessibility and usability standards with specific, actionable fixes
Generate frontend code that matches a visual spec rather than falling back on generic boilerplate
Skills in this category
Skill
What it does
frontend-design
anthropics/skills

Comprehensive frontend design patterns and visual polish guidance

web-design-guidelines
vercel-labs/agent-skills

Vercel's Web Interface Guidelines covering spacing, typography, interaction, and accessibility

vercel-composition-patterns
vercel-labs/agent-skills

React composition patterns for flexible, scalable UI component architecture

ui-ux-pro-max
nextlevelbuilder/ui-ux-pro-max-skill

Advanced UI/UX patterns for complex interfaces and interaction design

sleek-design-mobile-apps
sleekdotdesign/agent-skills

Mobile-first design principles for iOS and Android app interfaces

canvas-design
anthropics/skills

Design generation and iteration in canvas-based environments

polish
pbakaus/impeccable

Final-pass visual refinement: tighten spacing, sharpen type, clean edges

critique
pbakaus/impeccable

Structured design critique with specific, actionable feedback

bolder
pbakaus/impeccable

Push a design toward stronger visual weight and presence

delight
pbakaus/impeccable

Add micro-interactions and motion that make interfaces feel alive

distill
pbakaus/impeccable

Strip a design to its essential elements, removing noise and increasing clarity

quieter
pbakaus/impeccable

Reduce visual noise and create calm, focused interfaces

extract-design-system
arvindrk/extract-design-system

Extract tokens, components, and patterns from an existing codebase

design-taste-frontend
leonxlnx/taste-skill

Opinionated frontend design taste with explicit reasoning about visual decisions

high-end-visual-design
leonxlnx/taste-skill

Premium aesthetic sensibility for luxury and editorial interfaces

emil-design-eng
emilkowalski/skill

Emil Kowalski's design engineering principles covering motion, detail, and craftsmanship

Works with your agent
Design & UI skills are compatible with Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, Codex, Gemini CLI, and all agents that support the skills CLI.


*********


skills
/
topics
/
Mobile
Mobile skills
Mobile skills give your agent working knowledge of Expo, React Native, and native platform conventions so it builds for real devices rather than treating mobile as a smaller version of the web.

What your agent can do with mobile skills installed
Build React Native components using Expo's native UI primitives rather than web-ported alternatives
Implement performant list rendering, animations, and gesture handling correctly on iOS and Android
Set up NativeWind and Tailwind-compatible styling in an Expo project with proper native fallbacks
Fetch data using patterns suited to native apps: offline-first, background sync, and push notification triggers
Upgrade Expo SDK versions without breaking native module compatibility
Design mobile interfaces with platform-appropriate conventions rather than copying web UI patterns
Skills in this category
Skill
What it does
vercel-react-native-skills
vercel-labs/agent-skills

React Native best practices: performance, navigation, native modules, and platform APIs

sleek-design-mobile-apps
sleekdotdesign/agent-skills

Mobile-first design patterns for iOS and Android: gestures, safe areas, and native feel

building-native-ui
expo/skills

Expo native UI components: lists, modals, tabs, bottom sheets, and haptics

native-data-fetching
expo/skills

Data fetching for native apps: offline caching, background refresh, and sync patterns

expo-tailwind-setup
expo/skills

NativeWind and Tailwind setup in Expo with correct native class handling

upgrading-expo
expo/skills

Expo SDK upgrade guide covering breaking changes, native module compatibility, and migration steps

Works with your agent
Mobile skills are compatible with Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, Codex, Gemini CLI, and all agents that support the skills CLI.



***************

skills
/
topics
/
Agent workflows
Agent workflow skills
Workflow skills teach your agent how to operate: how to plan before acting, debug methodically, dispatch parallel subagents, automate the browser, and run autonomous task loops without supervision. They are the meta-skills that make every other skill more effective.

What your agent can do with agent workflows skills installed
Break ambiguous tasks into structured plans before touching any code
Dispatch parallel subagents for independent work streams and coordinate their outputs
Automate browser tasks — navigate, fill forms, extract data, take screenshots — without writing custom scripts
Debug using a systematic hypothesis-and-test loop rather than making random edits
Discover and install new skills from skills.sh directly inside an agent session
Close branches cleanly: run tests, write commit messages, open pull requests, request review
Run a ralph loop: feed your agent a prd.json task list and let it work through every item autonomously, committing passing work and retrying failures without supervision
Skills in this category
Skill
What it does
find-skills
vercel-labs/skills

Discover and install skills from skills.sh directly inside an agent session

agent-browser
vercel-labs/agent-browser

Full browser automation: navigate, click, fill forms, extract data, and screenshot

skill-creator
anthropics/skills

Create, test, and publish new skills from within your agent

brainstorming
obra/superpowers

Structured ideation and problem decomposition frameworks

browser-use
browser-use/browser-use

Browser automation with visual understanding — interacts with pages based on what it sees

systematic-debugging
obra/superpowers

Hypothesis-driven debugging loop: observe, hypothesize, test, verify

writing-plans
obra/superpowers

Write structured implementation plans before starting complex tasks

executing-plans
obra/superpowers

Execute a plan step-by-step with checkpoints and verification at each stage

test-driven-development
obra/superpowers

TDD loop: write the failing test first, implement the minimal fix, verify, then refactor

requesting-code-review
obra/superpowers

Prepare code for review: self-review, test coverage, and pull request description

subagent-driven-development
obra/superpowers

Orchestrate specialized subagents for different parts of a task

verification-before-completion
obra/superpowers

Force a verification pass before any task is marked complete

dispatching-parallel-agents
obra/superpowers

Split work across parallel subagents and coordinate their outputs

using-git-worktrees
obra/superpowers

Use git worktrees to run parallel agent sessions on separate branches

finishing-a-development-branch
obra/superpowers

Branch close checklist: tests, commit message, pull request, and review request

ralph-tui-prd
subsy/ralph-tui

Generate a structured prd.json task list for use with ralph-tui's autonomous loop

ralph-tui-create-beads
subsy/ralph-tui

Create Beads tasks (git-backed, with dependencies) for ralph-tui

ralph-tui-create-json
subsy/ralph-tui

Create JSON-format task lists for ralph-tui

ralph-wiggum
fstandhartinger/ralph-wiggum

The Ralph Wiggum loop technique: simplified autonomous agent loop with minimal setup

ralph-loop
andrelandgraf/fullstackrecipes

Ralph loop implementation with agent mode for sustained autonomous task completion

Works with your agent
Agent workflows skills are compatible with Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, Codex, Gemini CLI, and all agents that support the skills CLI.



***********************************************



skills
/
topics
/
Databases
Database skills
Database skills give your agent working knowledge of Postgres, Supabase, Firebase, Neon, and Convex so it writes correct queries, schemas, and migrations rather than generic SQL that needs rework.

What your agent can do with databases skills installed
Design Postgres schemas with correct normalization, indexing strategy, and row-level security policies
Write Supabase queries using the correct client methods, realtime subscriptions, and edge functions
Set up authentication flows with row-level security scoped correctly to authenticated users
Implement Convex queries, mutations, and scheduled functions with correct reactivity patterns
Configure Firestore security rules, composite indexes, and data structures for production scale
Run Neon and PlanetScale branching workflows: create a database branch per pull request, run migrations, merge or discard
Define type-safe schemas and migrations with Drizzle ORM, with full TypeScript inference end-to-end
Use Turso (libSQL) for edge-replicated SQLite — connection setup, replication, and serverless query patterns
Run analytical queries against local files, Parquet, and remote sources with DuckDB
Skills in this category
Skill
What it does
supabase-postgres-best-practices
supabase/agent-skills

Postgres patterns for Supabase: schema design, RLS, indexing, and query performance

supabase
supabase/agent-skills

Supabase client: auth, storage, realtime, edge functions, and migrations

firebase-basics
firebase/agent-skills

Firebase setup, Firestore queries, security rules, and project configuration

firebase-auth-basics
firebase/agent-skills

Firebase Authentication flows, providers, custom claims, and session management

firebase-firestore-enterprise-native-mode
firebase/agent-skills

Firestore at scale: sharding, composite indexes, and enterprise data modeling

convex-quickstart
get-convex/agent-skills

Convex schema, queries, mutations, and real-time reactivity patterns

convex-setup-auth
get-convex/agent-skills

Authentication in Convex with Clerk, Auth0, and custom JWT providers

neon-postgres
neondatabase/agent-skills

Neon-specific patterns: branching workflow, serverless driver, and connection pooling

planetscale-postgres
planetscale/database-skills

PlanetScale Postgres: schema design, branching, and the Vitess-backed scaling model

planetscale-mysql
planetscale/database-skills

PlanetScale MySQL: branch-based schema migrations, sharded scaling, and connection patterns

turso-db
tursodatabase/agent-skills

Turso (libSQL): edge-replicated SQLite — setup, queries, and replication patterns for serverless apps

duckdb-query
duckdb/duckdb-skills

DuckDB query patterns for in-process analytical workloads, Parquet/CSV reads, and embedded analytics

drizzle-orm
bobmatnyc/claude-mpm-skills

Drizzle ORM: type-safe schemas, migrations, and queries with end-to-end TypeScript inference

Works with your agent
Databases skills are compatible with Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, Codex, Gemini CLI, and all agents that support the skills CLI.


***********




