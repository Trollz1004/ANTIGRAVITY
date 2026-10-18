## 2026-10-14 -- NOT SHIPPED -- rendered and verified, upload not armed

- Run: 2026-10-15 08:02 Eastern Daylight Time -> 08:06, exit 3 (unattended)
- Title: Yesterday's News Today - October 14, 2026 | Teen Triathlete Raises & More
- Video: `C:\ANTIGRAVITY\ops\hermes\out\20261014\20261014.mp4` -- 83.955s, 11.8 MB, 5 stories
- Voice: edge (local engine, not the hosted model)
- Thumbnail: `C:\ANTIGRAVITY\ops\hermes\out\20261014\20261014-thumb.png`
- Verified: 23 gates passed (audio mean -19.4 dB, min luma stddev 37.88)

| stage | status | detail |
| --- | --- | --- |
| preflight | OK | ffmpeg+ffprobe on PATH, repo at C:\ANTIGRAVITY |
| source | OK | wrote C:\ANTIGRAVITY\content\yesterday-news\20261014 from C:\Users\joshi\Documents\ANTIGRAVITY-RUNTIME\yesterday-news\content\20261014 |
| parse | OK | 5 stories, title "Yesterday's News Today — October 14, 2026" |
| voice | OK | backend=edge (omniroute: http://127.0.0.1:20128/v1: HTTP 400: No credentials for provider: openai; edge: ok) |
| render | OK | C:\ANTIGRAVITY\ops\hermes\out\20261014\20261014.mp4 (83.955s, 11753009 bytes) |
| verify | OK | 23 gates passed: 83.955s, 1080x1920, mean audio -19.4 dB, min luma stddev 37.88 |
| upload | BLOCKED | no YouTube credentials at C:\ANTIGRAVITY\ops\youtube\.credentials\youtube-oauth.json -- run `python ops/youtube/yt_upload.py auth --client-file ...` (TRO-3). The video is rendered and verified; it is not published. |

Packet: `C:\ANTIGRAVITY\ops\packets\hermes-youtube-20261014`
