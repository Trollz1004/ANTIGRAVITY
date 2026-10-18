## 2026-10-10 -- RENDERED -- upload was off

- Run: 2026-10-14 07:05 Eastern Daylight Time -> 07:08, exit 0 (unattended)
- Title: Yesterday's News Today - October 10, 2026 | Sloth Bear, Daughter Gets & More
- Video: `C:\ANTIGRAVITY\ops\hermes\out\20261010\20261010.mp4` -- 87.31s, 11.8 MB, 5 stories
- Voice: edge (local engine, not the hosted model)
- Thumbnail: `C:\ANTIGRAVITY\ops\hermes\out\20261010\20261010-thumb.png`
- Verified: 18 gates passed (audio mean -19.4 dB, min luma stddev 38.01)

| stage | status | detail |
| --- | --- | --- |
| preflight | OK | ffmpeg+ffprobe on PATH, repo at C:\ANTIGRAVITY |
| source | SKIPPED | 20261010 already sourced (3796 bytes) |
| parse | OK | 5 stories, title "Yesterday's News Today — October 10, 2026" |
| voice | OK | backend=edge (omniroute: http://127.0.0.1:20128/v1: HTTP 400: No credentials for provider: openai; edge: ok) |
| render | OK | C:\ANTIGRAVITY\ops\hermes\out\20261010\20261010.mp4 (87.31s, 11816603 bytes) |
| verify | OK | 18 gates passed: 87.31s, 1080x1920, mean audio -19.4 dB, min luma stddev 38.01 |
| upload | SKIPPED | --upload off; the mp4 stays local |

Packet: `C:\ANTIGRAVITY\ops\packets\hermes-youtube-20261010`
