## 2026-10-12 -- NOT SHIPPED -- a stage failed

- Run: 2026-10-13 06:30 Eastern Daylight Time -> 06:30, exit 2 (unattended)

| stage | status | detail |
| --- | --- | --- |
| preflight | OK | ffmpeg+ffprobe on PATH, repo at C:\ANTIGRAVITY |
| source | OK | wrote C:\ANTIGRAVITY\content\yesterday-news\20261012 from C:\Users\joshi\Documents\ANTIGRAVITY-RUNTIME\yesterday-news\content\20261012 |
| parse | OK | 5 stories, title "Yesterday's News Today — October 12, 2026" |
| voice | OK | backend=edge (omniroute: http://127.0.0.1:20128/v1: HTTP 400: No credentials for provider: openai; edge: ok) |
| run | FAILED | unhandled TTSError: edge synthesis failed: WSServerHandshakeError: 403, message='Invalid response status', url='wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=b50eb612b13f4d05a2aec69b32b0eae4&Sec-MS-GEC=C6B5374B5E25E8E1FEC62CEEC7AB7B1841118F8107C2B7259435D4056104A25C&Sec-MS-GEC-Version=1-143.0.3650.75' |

Packet: `C:\ANTIGRAVITY\ops\packets\hermes-youtube-20261012`
