## 2026-10-13 -- NOT SHIPPED -- a stage failed

- Run: 2026-10-14 06:30 Eastern Daylight Time -> 06:30, exit 2 (unattended)

| stage | status | detail |
| --- | --- | --- |
| preflight | OK | ffmpeg+ffprobe on PATH, repo at C:\ANTIGRAVITY |
| source | OK | wrote C:\ANTIGRAVITY\content\yesterday-news\20261013 from C:\Users\joshi\Documents\ANTIGRAVITY-RUNTIME\yesterday-news\content\20261013 |
| parse | OK | 5 stories, title "Yesterday's News Today — October 13, 2026" |
| voice | OK | backend=edge (omniroute: http://127.0.0.1:20128/v1: HTTP 400: No credentials for provider: openai; edge: ok) |
| run | FAILED | unhandled TTSError: edge synthesis failed: WSServerHandshakeError: 403, message='Invalid response status', url='wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=1d9f7ad783904aacb37e30b35a42c51f&Sec-MS-GEC=9EDEC178D6B9FBAE371F9EEE1671A8A07D1740AF29219BA092F8DE647EAFE478&Sec-MS-GEC-Version=1-143.0.3650.75' |

Packet: `C:\ANTIGRAVITY\ops\packets\hermes-youtube-20261013`
