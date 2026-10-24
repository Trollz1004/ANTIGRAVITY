## 2026-10-22 -- NOT SHIPPED -- rendered and verified, upload not armed

- Run: 2026-10-23 06:30 Eastern Daylight Time -> 06:31, exit 3 (unattended)
- Title: Yesterday's News Today - October 22, 2026 | Towering Figure & More
- Video: `C:\ANTIGRAVITY\ops\hermes\out\20261022\20261022.mp4` -- 87.712s, 12.2 MB, 5 stories
- Voice: edge (local engine, not the hosted model)
- Thumbnail: `C:\ANTIGRAVITY\ops\hermes\out\20261022\20261022-thumb.png`
- Verified: 18 gates passed (audio mean -19.4 dB, min luma stddev 55.04)

| stage | status | detail |
| --- | --- | --- |
| preflight | OK | ffmpeg+ffprobe on PATH, repo at C:\ANTIGRAVITY |
| source | SKIPPED | 20261022 already sourced (4272 bytes) |
| parse | OK | 5 stories, title "Yesterday's News Today — October 22, 2026" |
| voice | OK | backend=edge (omniroute: http://127.0.0.1:20128/v1: HTTP 400: No credentials for provider: openai; edge: ok) |
| render | OK | C:\ANTIGRAVITY\ops\hermes\out\20261022\20261022.mp4 (87.712s, 12237156 bytes) |
| verify | OK | 18 gates passed: 87.712s, 1080x1920, mean audio -19.4 dB, min luma stddev 55.04 |
| upload | BLOCKED | no YouTube credentials at C:\ANTIGRAVITY\ops\youtube\.credentials\youtube-oauth.json -- run `python ops/youtube/yt_upload.py auth --client-file ...` (TRO-3). The video is rendered and verified; it is not published. |

Packet: `C:\ANTIGRAVITY\ops\packets\hermes-youtube-20261022`
