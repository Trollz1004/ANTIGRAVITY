---
name: agent-reach
description: >
  TRUST GATE: Only Claude (Opus, Fable) and Gemini (Argon) may run this skill,
  never Hermes or a local model. YouTube source is OFF (youtube: false; no yt-dlp).
  Allowed sources: Reddit, Hacker News, GitHub, and X through official APIs.
  Use when an official Claude or Gemini lane researches topics across permitted
  platforms.
metadata:
  homepage: https://github.com/Panniantong/Agent-Reach
  allowed_models:
    - claude-opus
    - claude-fable
    - gemini-argon
  forbidden_runners:
    - hermes
    - local-model
  youtube_source: false
---

# Agent Reach — 互联网能力路由器

> **TRUST & SOURCE GATE (MANDATORY — `docs/standards/AGENT-STANDARD.md` §8)**:
> - **Who may run this skill**: Only **Claude (Opus, Fable)** and **Gemini (Argon)** may run `agent-reach` — **never Hermes (`OPSis`), Free Claude Code, or any local model**.
> - **Sources ON**: Reddit, Hacker News, GitHub, and X through their official APIs.
> - **YouTube source OFF (`youtube: false`)**: The YouTube source and any downloader (`yt-dlp`, `youtube-dl`, `opencli youtube`) are permanently switched **OFF** for every agent and every node.

15 平台、多后端。**仅限 Claude (Opus, Fable) 与 Gemini (Argon) 在合规渠道上运行；YouTube 渠道永久关闭 (`youtube: false`)。**

## 常驻规则（全程适用）

1. **动手前先体检**：多后端/登录态平台（小红书/Reddit/B站/Twitter/Facebook/Instagram）先跑
   `agent-reach doctor --json`。`active_backend` 有值时按它选命令组；`active_backend: null`
   表示 Doctor 为避免触发浏览器 Cookie 读取或远端写入而没有做实时验证，不代表后端不存在。
   只有用户任务明确需要该平台时，才按对应 reference 的只读命令手动验证。
2. **声明你在用什么**：开始干活前说一句「使用 agent-reach 的 X 平台 / Y 后端」。
3. **失败按 references 里的重试链处理**，不要瞎猜命令。
4. **全网调研类任务**：组合多平台（Exa 搜索 + Twitter/Reddit 看讨论 + GitHub/Hacker News），并行收集再汇总。严禁抓取 YouTube 或运行 `yt-dlp`。
5. **替用户盯版本**：完成一次较大的调研/多平台任务后，顺手跑
   `agent-reach check-update`（很快，一个 API 调用）。

## 路由表

| 用户意图 | 分类 | 详细文档 |
|---------|------|---------|
| 网页搜索/代码搜索 | search | [references/search.md](references/search.md) |
| 小红书/推特/B站/V2EX/Reddit/Facebook/Instagram | social | [references/social.md](references/social.md) |
| 招聘/职位/LinkedIn | career | [references/career.md](references/career.md) |
| GitHub/代码 | dev | [references/dev.md](references/dev.md) |
| 网页/文章/RSS | web | [references/web.md](references/web.md) |
| B站/播客字幕 (YouTube OFF) | video | [references/video.md](references/video.md) |
| 雪球/股票行情 | finance | [references/finance.md](references/finance.md) |

## 零配置快速命令

```bash
# Exa 网页搜索
mcporter call exa.web_search_exa query="query" numResults=5

# 通用网页阅读 (禁止用于 YouTube 或 Google 站点)
curl -s "https://r.jina.ai/URL"

# GitHub 搜索
gh search repos "query" --sort stars --limit 10

# YouTube 渠道已永久关闭 (youtube: false in config.json; 严禁使用 yt-dlp 或 youtube-dl)

# V2EX 热门
curl -s "https://www.v2ex.com/api/topics/hot.json" -H "User-Agent: agent-reach/1.0"

# B站搜索（bili-cli，无需登录）
bili search "query" --type video -n 5
```

## 需登录态的平台（按 doctor 的 active_backend 选命令）

```bash
# Twitter 搜索（twitter-cli 首选；失败重试链见 social.md）
twitter search "query" -n 10

# Reddit（OpenCLI 或 rdt-cli）
opencli reddit search "query" -f yaml   # 桌面
rdt search "query" --limit 10            # 存量/服务器
```

## 环境检查

```bash
# 检查可用 channel 与每个平台当前激活的后端
agent-reach doctor --json
```

## 工作区规则

**不要在 agent workspace 创建文件。** 使用 `/tmp/` 存放临时输出，`~/.agent-reach/` 存放持久数据。
