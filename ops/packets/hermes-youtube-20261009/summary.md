## 2026-10-09 -- NOT SHIPPED -- rendered and verified, upload not armed

- Run: 2026-10-10 06:30 Eastern Daylight Time -> 06:31, exit 3 (unattended)
- Title: Yesterday's News Today - October 09, 2026 | NPR-Inspired Homework Leads Teen & More
- Video: `C:\ANTIGRAVITY\ops\hermes\out\20261009\20261009.mp4` -- 86.176s, 12.2 MB, 5 stories
- Voice: edge (local engine, not the hosted model)
- Thumbnail: `C:\ANTIGRAVITY\ops\hermes\out\20261009\20261009-thumb.png`
- Verified: 23 gates passed (audio mean -19.2 dB, min luma stddev 37.62)

| stage | status | detail |
| --- | --- | --- |
| preflight | OK | ffmpeg+ffprobe on PATH, repo at C:\ANTIGRAVITY |
| source | OK | wrote C:\ANTIGRAVITY\content\yesterday-news\20261009 from C:\Users\joshi\Documents\ANTIGRAVITY-RUNTIME\yesterday-news\content\20261009 |
| parse | OK | 5 stories, title "Yesterday's News Today — October 09, 2026" |
| voice | OK | backend=edge (omniroute: http://127.0.0.1:20128/v1: HTTP 400: No credentials for provider: openai; edge: ok) |
| render | OK | C:\ANTIGRAVITY\ops\hermes\out\20261009\20261009.mp4 (86.176s, 12186487 bytes) |
| verify | OK | 23 gates passed: 86.176s, 1080x1920, mean audio -19.2 dB, min luma stddev 37.62 |
| upload | BLOCKED | no YouTube credentials at C:\ANTIGRAVITY\ops\youtube\.credentials\youtube-oauth.json -- run `python ops/youtube/yt_upload.py auth --client-file ...` (TRO-3). The video is rendered and verified; it is not published. |

Packet: `C:\ANTIGRAVITY\ops\packets\hermes-youtube-20261009`
