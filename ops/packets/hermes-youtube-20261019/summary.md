## 2026-10-19 -- NOT SHIPPED -- rendered and verified, upload not armed

- Run: 2026-10-20 06:30 Eastern Daylight Time -> 06:34, exit 3 (unattended)
- Title: Yesterday's News Today - October 19, 2026 | Mozambique Protects the ‘Butterfly Forest & More
- Video: `C:\ANTIGRAVITY\ops\hermes\out\20261019\20261019.mp4` -- 78.243s, 10.8 MB, 5 stories
- Voice: edge (local engine, not the hosted model)
- Thumbnail: `C:\ANTIGRAVITY\ops\hermes\out\20261019\20261019-thumb.png`
- Verified: 23 gates passed (audio mean -19.4 dB, min luma stddev 38.3)

| stage | status | detail |
| --- | --- | --- |
| preflight | OK | ffmpeg+ffprobe on PATH, repo at C:\ANTIGRAVITY |
| source | OK | wrote C:\ANTIGRAVITY\content\yesterday-news\20261019 from C:\Users\joshi\Documents\ANTIGRAVITY-RUNTIME\yesterday-news\content\20261019 |
| parse | OK | 5 stories, title "Yesterday's News Today — October 19, 2026" |
| voice | OK | backend=edge (omniroute: http://127.0.0.1:20128/v1: HTTP 400: No credentials for provider: openai; edge: ok) |
| render | OK | C:\ANTIGRAVITY\ops\hermes\out\20261019\20261019.mp4 (78.243s, 10835098 bytes) |
| verify | OK | 23 gates passed: 78.243s, 1080x1920, mean audio -19.4 dB, min luma stddev 38.3 |
| upload | BLOCKED | no YouTube credentials at C:\ANTIGRAVITY\ops\youtube\.credentials\youtube-oauth.json -- run `python ops/youtube/yt_upload.py auth --client-file ...` (TRO-3). The video is rendered and verified; it is not published. |

Packet: `C:\ANTIGRAVITY\ops\packets\hermes-youtube-20261019`
