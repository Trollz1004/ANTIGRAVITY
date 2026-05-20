"""OpenAPI / Swagger UI extra configuration for the YouAndINotAI API.

This module centralises tags_metadata, contact/license/server info,
and the full markdown description used by the FastAPI constructor.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Tags metadata – groups every router into a logical section in Swagger UI
# ---------------------------------------------------------------------------

TAGS_METADATA: list[dict] = [
    {
        "name": "health",
        "description": (
            "Health check and monitoring endpoints. "
            "Use these to verify service status, database connectivity, "
            "Square payment integration, and webhook processing health."
        ),
    },
    {
        "name": "auth",
        "description": (
            "Authentication and authorization. "
            "Register new accounts, log in with email/password or Google, "
            "refresh JWT tokens, and retrieve the current user profile (`/me`)."
        ),
    },
    {
        "name": "users",
        "description": (
            "User management and profiles. "
            "Register, retrieve, and update user accounts and public profiles."
        ),
    },
    {
        "name": "profiles",
        "description": (
            "Extended profile management. "
            "Create, read, patch, and delete rich dating profiles including "
            "bio, photos, interests, and verification status."
        ),
    },
    {
        "name": "messaging",
        "description": (
            "Chat, messages, and real-time communication. "
            "Send and receive messages within matches, manage conversations, "
            "and handle message read receipts."
        ),
    },
    {
        "name": "messages",
        "description": (
            "Direct messaging between matched users. "
            "Send text messages, list conversation history, and mark messages as read."
        ),
    },
    {
        "name": "lovebot",
        "description": (
            "AI-powered relationship coaching and conversation assistance. "
            "Get personalised advice, ice-breakers, and date planning suggestions."
        ),
    },
    {
        "name": "social",
        "description": (
            "Swipe, matching, double dates, and events. "
            "Discover new people, swipe to like/pass, form matches, "
            "organise double dates, and browse community events."
        ),
    },
    {
        "name": "swipe",
        "description": (
            "Swipe-based discovery and matching. "
            "Browse discover profiles, swipe left (pass) or right (like), "
            "and receive match notifications when both users like each other."
        ),
    },
    {
        "name": "double-dates",
        "description": (
            "Double date sessions. "
            "Propose double dates between two matches, accept/reject invitations, "
            "and manage group date sessions."
        ),
    },
    {
        "name": "events",
        "description": (
            "Community events. "
            "Create, browse, RSVP to, and manage local and virtual events."
        ),
    },
    {
        "name": "content",
        "description": (
            "Boards, volunteering opportunities, and marketing content. "
            "Community discussion boards, volunteer opportunity listings, "
            "and promotional marketing endpoints."
        ),
    },
    {
        "name": "boards",
        "description": (
            "Community discussion boards. "
            "Create posts, comment, like, and report content within topic-based boards."
        ),
    },
    {
        "name": "volunteering",
        "description": (
            "Volunteering opportunities and community impact. "
            "Browse and sign up for volunteer opportunities, "
            "track hours, and view community impact metrics."
        ),
    },
    {
        "name": "marketing",
        "description": (
            "Marketing and promotional endpoints. "
            "Landing page content, referral tracking, and campaign management."
        ),
    },
    {
        "name": "media",
        "description": (
            "Video, video rooms, and file uploads. "
            "Manage video call sessions, create Daily.co video rooms, "
            "and handle secure file uploads (photos, documents)."
        ),
    },
    {
        "name": "video",
        "description": (
            "Video call management. "
            "Initiate, join, and end video calls between matched users."
        ),
    },
    {
        "name": "video-rooms",
        "description": (
            "Daily.co video room management. "
            "Create, configure, and manage persistent video rooms for dates and group calls."
        ),
    },
    {
        "name": "uploads",
        "description": (
            "Secure file uploads. "
            "Upload photos, profile pictures, and other media with "
            "type and size validation."
        ),
    },
    {
        "name": "billing",
        "description": (
            "Billing, metrics, and feature flags. "
            "Manage subscriptions, view billing history, "
            "access platform metrics, and check feature flag status."
        ),
    },
    {
        "name": "metrics",
        "description": (
            "Platform metrics and analytics. "
            "Access aggregated usage statistics and performance indicators."
        ),
    },
    {
        "name": "feature-flags",
        "description": (
            "Feature flag management. "
            "Check which features are enabled for the current user or environment."
        ),
    },
    {
        "name": "operations",
        "description": (
            "Ops runs, webhooks, notifications, and support. "
            "Operational endpoints for managing background jobs, "
            "webhook delivery, push notifications, and support tickets."
        ),
    },
    {
        "name": "webhooks",
        "description": (
            "Webhook ingestion and retry management. "
            "Receive and process webhooks from external services (Square, etc.) "
            "and manage retry queues for failed deliveries."
        ),
    },
    {
        "name": "ops-runs",
        "description": (
            "Operational background job runs. "
            "Trigger, monitor, and manage scheduled and on-demand operational tasks."
        ),
    },
    {
        "name": "notifications",
        "description": (
            "Push notifications and in-app alerts. "
            "Manage notification preferences, device tokens, and notification history."
        ),
    },
    {
        "name": "support",
        "description": (
            "Customer support. "
            "AI-assisted support chat, ticket creation, and escalation workflows."
        ),
    },
    {
        "name": "safety",
        "description": (
            "Privacy, safety, and verification. "
            "GDPR data export/deletion requests, content blocking/reporting, "
            "identity verification, and account safety settings."
        ),
    },
    {
        "name": "privacy",
        "description": (
            "Privacy and data protection (GDPR). "
            "Request data export, initiate account deletion, "
            "and manage privacy preferences."
        ),
    },
    {
        "name": "verification",
        "description": (
            "Identity verification. "
            "Submit and check identity verification status for profile badges."
        ),
    },
    {
        "name": "waitlist",
        "description": (
            "Waitlist management. "
            "Join the beta waitlist and manage waitlist invitations."
        ),
    },
    {
        "name": "clawx",
        "description": (
            "ClawX AI Council integration. "
            "Multi-AI governance and deliberation endpoints."
        ),
    },
]

# ---------------------------------------------------------------------------
# Full markdown description rendered at the top of the Swagger UI page
# ---------------------------------------------------------------------------

API_DESCRIPTION: str = """
# YouAndINotAI API

**Social Platform for Good** — A dating and community platform that connects
people while supporting charitable causes.

---

## 🔑 Authentication

Most endpoints require **Bearer JWT** authentication.

1. Register a new account via `POST /api/v1/auth/register`
2. Log in via `POST /api/v1/auth/login` to receive an `access_token` and `refresh_token`
3. Include the token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

4. When the access token expires, use `POST /api/v1/auth/refresh` with the
   `refresh_token` to obtain a new pair.

Access tokens expire after **30 minutes** by default.
Refresh tokens expire after **7 days**.

---

## ⏱ Rate Limiting

All API endpoints are subject to rate limiting:

| Environment | Limit | Window |
|-------------|-------|--------|
| Production  | 60 requests | Per minute per IP |
| Test        | 10,000 requests | Per minute per IP |

When the rate limit is exceeded, the API returns **HTTP 429** with the error
code `RATE_LIMIT_EXCEEDED`.

---

## 📦 Standard Error Format

All error responses follow a consistent structure:

```json
{
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": null
}
```

Common error codes:

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `INVALID_CREDENTIALS` | 401 | Bad email/password or expired token |
| `INSUFFICIENT_PERMISSIONS` | 403 | Not allowed to access this resource |
| `NOT_FOUND` | 404 | Resource does not exist |
| `ALREADY_EXISTS` | 409 | Duplicate resource (e.g. email taken) |
| `VALIDATION_ERROR` | 422 | Request body failed validation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily down |

---

## 🔗 Useful Links

- **Production API:** https://api.youandinotai.com
- **Website:** https://youandinotai.com
- **OpenAPI Schema:** `/openapi.json`
- **Swagger UI:** `/docs`

---

## 📚 API Sections

| Tag | Description |
|-----|-------------|
| **health** | Service health checks and monitoring |
| **auth** | Registration, login, token refresh |
| **users** | User account management |
| **profiles** | Dating profile CRUD |
| **messaging** | Chat and direct messages |
| **social** | Swipe, matching, double dates, events |
| **content** | Boards, volunteering, marketing |
| **media** | Video calls, video rooms, file uploads |
| **billing** | Subscriptions, metrics, feature flags |
| **operations** | Webhooks, ops runs, notifications, support |
| **safety** | Privacy, safety, verification |
"""

# ---------------------------------------------------------------------------
# Contact, license, and server metadata
# ---------------------------------------------------------------------------

CONTACT_INFO: dict = {
    "name": "YouAndINotAI Team",
    "url": "https://youandinotai.com",
    "email": "api@youandinotai.com",
}

LICENSE_INFO: dict = {
    "name": "MIT",
    "url": "https://opensource.org/licenses/MIT",
}

SERVERS: list[dict] = [
    {"url": "http://localhost:8000", "description": "Local development"},
    {"url": "https://api.youandinotai.com", "description": "Production"},
]
