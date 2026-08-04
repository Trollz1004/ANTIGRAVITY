---
name: video-chat-ui
description: Use when wiring video dates UI (Daily.co rooms).
---
# Video Chat UI
- Match room: `/app/video/:matchId` → `VideoCall.tsx` + `components/VideoChat.tsx`.
- Lobby: `/app/video-lobby`.
- API: `POST /api/v1/video/rooms/{matchId}` with bearer token.
- Camera off until both accept; never cold-call strangers.
