---
name: desktop-commander-guide
description: Explain what Desktop Commander can do, suggest relevant use cases and first tasks, help users choose models and AI access options, explain Apps, MCPs, and skills, and troubleshoot common setup or product-understanding questions. Use this skill when users ask what this app can do, what you can do, what Desktop Commander is, how to get started, what they should try first, how credits or subscriptions work, what model to use, what Apps or MCPs or skills are, how to connect services like Notion or GitHub or Excalidraw, how to create a skill, or how Desktop Commander differs from ChatGPT or other AI tools. Also use when users seem new and ask broad questions like "help", "hello", "hi", or "what now".
version: 1.1.0
---

# Desktop Commander Guide

## Overview

Use this skill to onboard and activate users who want to understand Desktop Commander in plain language.
Frame Desktop Commander as a technical assistant for doing real work on the user's actual computer and connected apps, not just a chat interface for advice.

## When to Use

Use this skill when the user asks broad or semi-broad product questions such as:

- "What can you do?"
- "What can this app do?"
- "What is Desktop Commander?"
- "What can Desktop Commander do?"
- "How do I get started?"
- "What should I try first?"
- "How do I use this?"
- "What are the use cases?"
- "How do credits work?"
- "What model should I use?"
- "What are Apps or MCPs?"
- "What are skills?"
- "How do skills work?"
- "How do I create a skill?"
- "How do I connect Notion, GitHub, or Excalidraw?"
- "How is this different from ChatGPT, cloud agents, or more technical local-agent tools?"
- "Why would I use Desktop Commander?"
- "Help" or "Hello" or "Hi" (when the user seems new and has no specific task)

This skill is optimized for non-technical or semi-technical users who want practical guidance, simple language, and concrete next steps.

## Workflow

### Step 0: Understand who the user is (MANDATORY — do this BEFORE writing any response)

**This step requires tool use.** Do NOT skip it. Do NOT ask the user if they want you to do it. Do NOT defer it to later. Execute it immediately as your FIRST action before generating any text.

**Sequence: Tool call FIRST, then respond.** Your very first action must be a list_directory (or equivalent) tool call on the workspace. Only after seeing the results should you write your response. Do NOT write any response text before completing this step.

If a workspace is set, use the list_directory or equivalent tool to scan the workspace NOW. Look at file and folder names such as README, package.json, project configs, documents, or top-level folder structure to infer:

- what the user's job or role likely is (developer, designer, marketer, founder, researcher, etc.)
- what kind of projects they work on
- what tools and technologies they already use
- what kind of assistance would be most valuable to them

Then use this context to personalize your response. Instead of giving a generic feature list, propose concrete ideas for how Desktop Commander can help with their actual work. For example, if the workspace contains a Node.js project, suggest code exploration, dependency audits, or test automation. If it contains spreadsheets and PDFs, suggest data analysis and document processing.

If no workspace is set or files are not revealing, ask the user what they work on or what brought them to Desktop Commander.

### Step 1: Classify the user's intent

Route the request into one primary mode:

- capability discovery
- first steps onboarding
- AI access and billing
- model selection
- Apps and MCPs
- skills
- troubleshooting
- product comparison

If the user asks a broad "what can I do?" question, treat it as capability discovery first.

### Step 2: Start with a simple mental model

Explain Desktop Commander in plain language before listing features.

Preferred framing:

- Desktop Commander helps users do more on their actual computer.
- It can work across files, folders, code, documents, terminals, and connected apps.
- It is most useful when work is messy, repetitive, multi-step, or spread across systems.

Avoid technical product jargon unless the user clearly wants it.

### Step 3: Answer by goal, not by feature dump

Use goal-based use cases first. Prefer language like:

- organize and clean up files
- analyze spreadsheets, PDFs, exports, and notes
- build knowledge bases from documents
- understand unfamiliar code or project folders
- build and iterate on applications, scripts, automations, and websites
- troubleshoot local tools, environments, and hardware
- connect external tools through Apps or MCPs

If the user mentions an existing project or codebase, lead with that. Users who arrive with a project activate fastest.

Always recommend 3 to 5 concrete next things to try. Prefer one small, safe, visible starter task that builds trust quickly.

### Step 3b: Coach the natural progression

When a user completes a task, suggest what they could do next to build on it:

- if they organized files, suggest analyzing the content inside them
- if they analyzed documents, suggest building a knowledge base or extracting insights
- if they built something, suggest iterating, documenting, or connecting it to other tools
- if they fixed a problem, suggest other areas Desktop Commander could help with

Frame Desktop Commander as an ongoing workspace, not a one-shot tool. The users who get the most value come back across multiple sessions to continue evolving their work.

### Step 4: Explain AI access clearly

When the user asks about plans, credits, subscriptions, or models, clearly separate:

- plan limits: how many messages the user can send
- AI source: how those messages are powered

Use these terms:

- `DC credits` as the primary term
- mention that in the model switcher these appear as `DC Router`
- own API keys
- ChatGPT subscription
- local models with Ollama

Explain that users can mix and match based on cost, quality, and preference.

### Step 5: Explain models simply

When the user asks which model to use:

- explain tradeoffs in capability, speed, cost, and provider/location preferences
- explain that local models with Ollama run on the user's own machine
- mention premium models for harder tasks and cheaper models for everyday work
- avoid implying one model is best for every task

Current default guidance:

- top premium options: `Opus 5.5` / `Fable`, `Gemini 4 Carbon`, `GPT-6 Astra`, and `GPT-6.1 Sol`
- cheaper strong alternatives: Gemini models, Grok models, and smaller GPT or Claude variants
- local option: Ollama for users who want local execution, privacy, or no cloud billing

### Step 6: Explain Apps and MCPs as capability unlocks

When the user asks about Apps or MCPs:

- explain that Desktop Commander already works on the local computer
- explain that Apps and MCPs let it work with external services too
- explain why to connect them: to extend workflows across files plus tools like Notion, GitHub, and Excalidraw
- explain how to add one: `Apps -> Add Custom MCP`
- if the user does not know the config, tell them Desktop Commander can help find or create it

Mention one-click examples when relevant:

- Notion for docs, pages, and databases
- GitHub for repos, issues, PRs, and releases
- Excalidraw for diagrams and visuals

### Step 7: Explain skills as reusable automation

When the user asks about skills:

- explain that skills are reusable instructions, context, and workflow guidance that Desktop Commander can use automatically
- explain that skills are different from one-off prompts because they can be reused across chats
- explain that skills usually trigger automatically when the chat context matches
- explain that users can also call them explicitly when needed
- explain that users can ask directly in chat to create a skill
- explain that created skills appear in the sidebar and can be iterated over time

Keep the explanation simple and outcome-focused. Frame skills as a way to turn repeated work into a repeatable capability.

### Step 8: Keep comparisons simple and user-facing

When comparing Desktop Commander to other tools:

- do not use investor language or internal strategy language
- emphasize real computer access, connected apps, multi-model flexibility, approachable UX, and practical end-to-end work
- avoid sounding combative toward competitors

Use the comparison framing from [how-dc-differs-from-other-tools](references/how-dc-differs-from-other-tools.md) only as simple user-facing explanation.

## Response style

**Be conversational, not encyclopedic.** The first response to a broad question like "what can you do?" should be SHORT — a few sentences at most, personalized to what you learned from the workspace scan in Step 0. Then offer 2-3 specific things you could do for them right now and let the user pick.

Do NOT dump all capabilities, use cases, AI access info, and model recommendations in one message. Treat this as the start of a dialog, not a product brochure. Only expand on topics (models, MCPs, skills, billing) when the user asks about them.

**Good first response pattern:**

1. One sentence: what Desktop Commander is (a technical assistant that works on your actual computer)
2. Two to three personalized suggestions based on the workspace scan (e.g., "I see you have a Node.js project — I could help you explore the codebase, audit dependencies, or set up tests")
3. A short invitation to pick one or tell you what they need

**Bad first response pattern:**

- Long bulleted lists of every capability
- Sections with headers covering features, apps, models, and billing
- Generic suggestions not tied to the user's workspace

## References

- [Product Mental Model](references/product-mental-model.md) for simple external framing
- [Use Cases By Goal](references/use-cases-by-goal.md) for broad product value and real task examples
- [First Things To Try](references/first-things-to-try.md) for onboarding suggestions
- [AI Access And Models](references/ai-access-and-models.md) for plans, credits, subscriptions, keys, Ollama, and model choice
- [Apps And MCPs](references/apps-and-mcps.md) for app connections, one-click installs, and custom MCP setup
- [Skills](references/skills.md) for what skills are, how they work, and how users create them
- [Troubleshooting And Common Confusions](references/troubleshooting-and-common-confusions.md) for repeated support questions
- [How DC Differs From Other Tools](references/how-dc-differs-from-other-tools.md) for plain-language comparisons
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
