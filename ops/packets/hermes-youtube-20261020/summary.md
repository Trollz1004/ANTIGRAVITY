## 2026-10-20 -- NOT SHIPPED -- rendered and verified, upload not armed

- Run: 2026-10-21 08:34 Eastern Daylight Time -> 08:38, exit 3 (unattended)
- Title: Yesterday's News Today - October 20, 2026 | Student Plays Truly Epic Birthday & More
- Video: `C:\ANTIGRAVITY\ops\hermes\out\20261020\20261020.mp4` -- 92.333s, 12.4 MB, 5 stories
- Voice: edge (local engine, not the hosted model)
- Thumbnail: `C:\ANTIGRAVITY\ops\hermes\out\20261020\20261020-thumb.png`
- Verified: 23 gates passed (audio mean -19.3 dB, min luma stddev 37.99)

| stage | status | detail |
| --- | --- | --- |
| preflight | OK | ffmpeg+ffprobe on PATH, repo at C:\ANTIGRAVITY |
| source | OK | wrote C:\ANTIGRAVITY\content\yesterday-news\20261020 from $env:USERPROFILE\Documents\ANTIGRAVITY-RUNTIME\yesterday-news\content\20261020 |
| parse | OK | 5 stories, title "Yesterday's News Today — October 20, 2026" |
| voice | OK | backend=edge (omniroute: http://127.0.0.1:20128/v1: ReadTimeout: HTTPConnectionPool(host='127.0.0.1', port=20128): Read timed out. (read timeout=45); edge: ok) |
| render | OK | C:\ANTIGRAVITY\ops\hermes\out\20261020\20261020.mp4 (92.333s, 12369671 bytes) |
| verify | OK | 23 gates passed: 92.333s, 1080x1920, mean audio -19.3 dB, min luma stddev 37.99 |
| upload | BLOCKED | no YouTube credentials at C:\ANTIGRAVITY\ops\youtube\.credentials\youtube-oauth.json -- run `python ops/youtube/yt_upload.py auth --client-file ...` (TRO-3). The video is rendered and verified; it is not published. |

Packet: `C:\ANTIGRAVITY\ops\packets\hermes-youtube-20261020`
