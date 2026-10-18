## 2026-10-11 -- NOT SHIPPED -- a stage failed

- Run: 2026-10-12 06:30 Eastern Daylight Time -> 06:30, exit 2 (unattended)

| stage | status | detail |
| --- | --- | --- |
| preflight | OK | ffmpeg+ffprobe on PATH, repo at C:\ANTIGRAVITY |
| source | OK | wrote C:\ANTIGRAVITY\content\yesterday-news\20261011 from C:\Users\joshi\Documents\ANTIGRAVITY-RUNTIME\yesterday-news\content\20261011 |
| parse | OK | 4 stories, title "Yesterday's News Today — October 11, 2026" |
| voice | OK | backend=edge (omniroute: http://127.0.0.1:20128/v1: HTTP 400: No credentials for provider: openai; edge: ok) |
| run | FAILED | unhandled TTSError: edge synthesis failed: WSServerHandshakeError: 403, message='Invalid response status', url='wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=cd0cdf7373b84bcca84f6e4055c33ba2&Sec-MS-GEC=ED9189CEFF0ADC5C369DFDD7B4091603E61F46B0F77FC9D64073B9FFF6500DC6&Sec-MS-GEC-Version=1-143.0.3650.75' |

Packet: `C:\ANTIGRAVITY\ops\packets\hermes-youtube-20261011`
