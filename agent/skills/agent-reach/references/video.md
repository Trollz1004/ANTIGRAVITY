# 视频/播客 (YouTube Source OFF)

> **TRUST & SOURCE GATE (`docs/standards/AGENT-STANDARD.md` §8)**:
> - Only **Claude (Opus, Fable)** and **Gemini (Argon)** may run `agent-reach` — **never Hermes or a local model**.
> - **YouTube (`youtube: false`) is permanently OFF**. Never run `yt-dlp`, `youtube-dl`, or `opencli youtube` against YouTube.

## YouTube — DISABLED (`youtube: false`)

The YouTube channel in `agent-reach` is switched **OFF** (`"youtube": false` in `config.json`). No downloader (`yt-dlp`, `youtube-dl`) or browser/transcript scraper may be used against YouTube on any node.

## B站 / Bilibili（bili-cli 为主，OpenCLI 补字幕）

```bash
# 视频详情（标题/UP主/时长/播放互动数据/字幕可用性）
bili video BVxxx

# 搜索视频
bili search "query" --type video -n 5
```

## 小宇宙播客 / Xiaoyuzhou Podcast

```bash
~/.agent-reach/tools/xiaoyuzhou/transcribe.sh --polish "https://www.xiaoyuzhoufm.com/episode/EPISODE_ID"
```
