---
name: animated-avatar
description: Use when working on photo-to-animated-avatar feature.
---

# Animated Avatar

- Page: `.../pages/AnimatedAvatar.tsx` route `/app/avatar`.
- Client canvas breath+parallax only (no deepfake identity swap).
- Future server hook: `POST /api/v1/avatar/animate` (not required for launch).
- Export snapshot PNG via canvas toDataURL.
