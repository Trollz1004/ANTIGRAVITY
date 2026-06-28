"""OpenAPI / Swagger UI extra configuration for the YouAndINotAI API.

This module centralises tags_metadata, contact/license/server info,
and the full markdown description used by the FastAPI constructor.
It also provides the custom Swagger UI HTML and health dashboard helpers.
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
            "Square payment integration, and webhook processing health. "
            "Endpoints include `/health` and `/api/v1/health` for overall status, "
            "`/api/v1/health/allocations` for allocation ledger checks, "
            "and `/api/v1/health/webhooks` for webhook processing. "
            "Responses provide detailed status codes and dependency health."
        ),
    },
    {
        "name": "auth",
        "description": (
            "Authentication and authorization. "
            "Register new accounts via `POST /api/v1/auth/register`, "
            "log in with email/password or Google via `POST /api/v1/auth/login` to receive "
            "an `access_token` and `refresh_token`. "
            "Refresh JWT tokens using `POST /api/v1/auth/refresh`, and "
            "retrieve the current user profile (`GET /api/v1/auth/me`). "
            "Detailed request/response examples are available for each endpoint."
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
            "Volunteering opportunities and member activity. "
            "Browse and sign up for volunteer opportunities, "
            "track hours, and view aggregate activity metrics."
        ),
    },
    {
        "name": "marketing",
        "description": (
            "Marketing and promotional endpoints. "
            "Landing page content, referral kits, tracked links, and campaign management."
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
            "ClawX AI operator integration. "
            "Multi-AI operator coordination endpoints."
        ),
    },
]

# ---------------------------------------------------------------------------
# Full markdown description rendered at the top of the Swagger UI page
# ---------------------------------------------------------------------------

API_DESCRIPTION: str = """
# YouAndINotAI API

![API Status](https://img.shields.io/badge/API-v1-blue)

**Human-first social platform** - A dating and community product for verified
members, accountable profiles, support workflows, and real-world plans.

---

## 🚀 Getting Started

### Base URL

| Environment | URL |
|-------------|-----|
| **Production** | `https://api.youandinotai.com` |
| **Local Dev** | `http://localhost:8000` |

### Quick Start

```bash
# 1. Register a new account
curl -X POST https://api.youandinotai.com/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "securePass123!", "display_name": "Alex", "date_of_birth": "1995-04-20", "accepted_terms": true}'

# 2. Log in to get tokens
curl -X POST https://api.youandinotai.com/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "securePass123!"}'

# 3. Use the access token for authenticated requests
curl https://api.youandinotai.com/api/v1/auth/me \\
  -H "Authorization: Bearer <access_token>"
```

---

## 🔑 Authentication

Most endpoints require **Bearer JWT** authentication.

### Auth Flow

```
┌──────────┐    POST /register     ┌──────────┐
│          │ ──────────────────────▶│          │
│  Client  │    POST /login        │   API    │
│          │ ──────────────────────▶│          │
│          │ ◀──── access_token ────│          │
│          │ ◀──── refresh_token ───│          │
│          │                       │          │
│          │  GET /me (+ Bearer)   │          │
│          │ ──────────────────────▶│          │
│          │ ◀──── user profile ───│          │
│          │                       │          │
│          │  POST /refresh        │          │
│          │ ──────────────────────▶│          │
│          │ ◀──── new tokens ─────│          │
└──────────┘                       └──────────┘
```

### Token Details

| Token Type | Expiration | Usage |
|------------|------------|-------|
| `access_token` | 30 minutes | Include in `Authorization: Bearer <token>` header |
| `refresh_token` | 7 days | Use with `POST /api/v1/auth/refresh` to get new tokens |

### Example: Authenticated Request

```http
GET /api/v1/profiles/me HTTP/1.1
Host: api.youandinotai.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⏱ Rate Limiting

All API endpoints are subject to rate limiting to ensure fair usage and
protect the service from abuse.

| Environment | Limit | Window |
|-------------|-------|--------|
| Production  | 60 requests | Per minute per IP |
| Test        | 10,000 requests | Per minute per IP |

When the rate limit is exceeded, the API returns **HTTP 429** with the error
code `RATE_LIMIT_EXCEEDED`.

### Rate Limit Headers

The following headers are returned on all API responses to indicate rate limit status:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | The maximum number of requests allowed in the current window |
| `X-RateLimit-Remaining` | The number of requests remaining in the current window |
| `X-RateLimit-Reset` | The time (in UTC epoch seconds) when the current window resets |

### Rate Limit Exceeded Response

```json
{
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please wait before trying again.",
    "details": {
        "retry_after_seconds": 42
    }
}
```

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

### Error Codes Reference

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

### Validation Error Example

```json
{
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
        "errors": [
            {
                "loc": ["body", "email"],
                "msg": "value is not a valid email address",
                "type": "value_error.email"
            }
        ],
        "correlation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    }
}
```

---

## 🔗 Useful Links

- **Production API:** https://api.youandinotai.com
- **Website:** https://youandinotai.com
- **OpenAPI Schema:** `/openapi.json`
- **Swagger UI:** `/docs`
- **Health Dashboard:** `/api/v1/health/detailed`

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

---

## 🏗 Architecture

The API is built with **FastAPI** and uses:
- **SQLAlchemy** async ORM for database operations
- **Redis** for caching and rate limiting
- **JWT** for stateless authentication
- **Square** for payment processing
- **Daily.co** for video room management
- **OpenTelemetry** for distributed tracing

---

## 📄 License

This API is released under the MIT License.
See https://opensource.org/licenses/MIT for details.
"""

# ---------------------------------------------------------------------------
# Contact, license, and server metadata
# ---------------------------------------------------------------------------

CONTACT_INFO: dict = {
    "name": "YouAndINotAI Team",
    "url": "https://youandinotai.com",
    "email": "joshlcoleman@gmail.com",
}

LICENSE_INFO: dict = {
    "name": "MIT",
    "url": "https://opensource.org/licenses/MIT",
}

SERVERS: list[dict] = [
    {"url": "http://localhost:8000", "description": "Local development"},
    {"url": "https://api.youandinotai.com", "description": "Production"},
    {"url": "https://staging-api.youandinotai.com", "description": "Staging"},
]

# ---------------------------------------------------------------------------
# Custom Swagger UI HTML with mission-control dark theme
# ---------------------------------------------------------------------------


def get_custom_swagger_html() -> str:
    """Return custom Swagger UI HTML with mission-control dark theme.

    The theme uses a dark color scheme with:
    - Background: #1a1a2e (deep navy)
    - Accent: #e94560 (coral red)
    - Secondary: #0f3460 (midnight blue)
    - Text: #eaeaea (soft white)
    """
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YouAndINotAI API — Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
    <link rel="icon" type="image/png" href="https://youandinotai.com/favicon.png" />
    <style>
        /* === Mission Control Dark Theme === */
        :root {
            --bg-primary: #1a1a2e;
            --bg-secondary: #16213e;
            --bg-tertiary: #0f3460;
            --accent: #e94560;
            --accent-hover: #ff6b81;
            --text-primary: #eaeaea;
            --text-secondary: #a0a0b0;
            --text-muted: #6c6c80;
            --success: #00d2d3;
            --warning: #feca57;
            --danger: #ff4757;
            --info: #54a0ff;
            --border: #2a2a4a;
            --code-bg: #0d1117;
        }

        /* Global overrides */
        html, body {
            background-color: var(--bg-primary) !important;
            color: var(--text-primary) !important;
            margin: 0;
            padding: 0;
        }

        /* Top bar */
        .swagger-ui .topbar {
            background-color: var(--bg-secondary) !important;
            border-bottom: 2px solid var(--accent) !important;
            padding: 12px 20px !important;
        }
        .swagger-ui .topbar .download-url-wrapper {
            display: none !important;
        }

        /* Main wrapper */
        .swagger-ui {
            background-color: var(--bg-primary) !important;
            color: var(--text-primary) !important;
        }

        /* Info section */
        .swagger-ui .info {
            margin: 20px 0 40px 0 !important;
        }
        .swagger-ui .info .title {
            color: var(--text-primary) !important;
            font-size: 32px !important;
        }
        .swagger-ui .info .title small {
            background-color: var(--accent) !important;
            color: #fff !important;
        }
        .swagger-ui .info .description {
            color: var(--text-secondary) !important;
        }
        .swagger-ui .info .description h1,
        .swagger-ui .info .description h2,
        .swagger-ui .info .description h3 {
            color: var(--text-primary) !important;
        }
        .swagger-ui .info .description h2 {
            border-bottom: 1px solid var(--border) !important;
            padding-bottom: 8px;
        }
        .swagger-ui .info .description p,
        .swagger-ui .info .description li {
            color: var(--text-secondary) !important;
        }
        .swagger-ui .info .description a {
            color: var(--accent) !important;
        }
        .swagger-ui .info .description code {
            background-color: var(--code-bg) !important;
            color: var(--accent) !important;
            padding: 2px 6px;
            border-radius: 4px;
        }
        .swagger-ui .info .description pre {
            background-color: var(--code-bg) !important;
            border: 1px solid var(--border) !important;
            border-radius: 8px !important;
        }
        .swagger-ui .info .description pre code {
            background: none !important;
            color: var(--text-primary) !important;
        }
        .swagger-ui .info .description table th {
            background-color: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border) !important;
        }
        .swagger-ui .info .description table td {
            border: 1px solid var(--border) !important;
            color: var(--text-secondary) !important;
        }
        .swagger-ui .info .description table tr:nth-child(even) {
            background-color: var(--bg-secondary) !important;
        }

        /* Schemes / servers */
        .swagger-ui .scheme-container {
            background-color: var(--bg-secondary) !important;
            border: 1px solid var(--border) !important;
            border-radius: 8px !important;
            box-shadow: none !important;
        }
        .swagger-ui .scheme-container .schemes-title {
            color: var(--text-primary) !important;
        }
        .swagger-ui .scheme-container select {
            background-color: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border) !important;
        }

        /* Tag sections */
        .swagger-ui .opblock-tag {
            background-color: var(--bg-secondary) !important;
            border: 1px solid var(--border) !important;
            border-radius: 8px !important;
            color: var(--text-primary) !important;
            margin-bottom: 8px !important;
        }
        .swagger-ui .opblock-tag:hover {
            background-color: var(--bg-tertiary) !important;
        }
        .swagger-ui .opblock-tag small {
            color: var(--text-secondary) !important;
        }

        /* Operation blocks */
        .swagger-ui .opblock {
            background-color: var(--bg-secondary) !important;
            border: 1px solid var(--border) !important;
            border-radius: 8px !important;
            margin-bottom: 8px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
        }
        .swagger-ui .opblock .opblock-summary {
            padding: 12px 16px !important;
        }
        .swagger-ui .opblock .opblock-summary-method {
            border-radius: 6px !important;
            font-weight: 700 !important;
            min-width: 80px !important;
        }
        .swagger-ui .opblock .opblock-summary-path {
            color: var(--text-primary) !important;
            font-weight: 600 !important;
        }
        .swagger-ui .opblock .opblock-summary-description {
            color: var(--text-secondary) !important;
        }

        /* Method colors */
        .swagger-ui .opblock.opblock-get {
            border-left: 4px solid var(--info) !important;
        }
        .swagger-ui .opblock.opblock-post {
            border-left: 4px solid var(--success) !important;
        }
        .swagger-ui .opblock.opblock-put {
            border-left: 4px solid var(--warning) !important;
        }
        .swagger-ui .opblock.opblock-patch {
            border-left: 4px solid var(--warning) !important;
        }
        .swagger-ui .opblock.opblock-delete {
            border-left: 4px solid var(--danger) !important;
        }

        .swagger-ui .opblock.opblock-get .opblock-summary-method {
            background-color: rgba(84, 160, 255, 0.15) !important;
            color: var(--info) !important;
        }
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
            background-color: rgba(0, 210, 211, 0.15) !important;
            color: var(--success) !important;
        }
        .swagger-ui .opblock.opblock-put .opblock-summary-method {
            background-color: rgba(254, 202, 87, 0.15) !important;
            color: var(--warning) !important;
        }
        .swagger-ui .opblock.opblock-patch .opblock-summary-method {
            background-color: rgba(254, 202, 87, 0.15) !important;
            color: var(--warning) !important;
        }
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
            background-color: rgba(255, 71, 87, 0.15) !important;
            color: var(--danger) !important;
        }

        /* Operation details (expanded) */
        .swagger-ui .opblock-body {
            background-color: var(--bg-primary) !important;
        }
        .swagger-ui .opblock .opblock-section-header {
            background-color: var(--bg-tertiary) !important;
            border-bottom: 1px solid var(--border) !important;
        }
        .swagger-ui .opblock .opblock-section-header h4 {
            color: var(--text-primary) !important;
        }
        .swagger-ui .opblock .opblock-section-header .btn {
            border-color: var(--border) !important;
            color: var(--text-primary) !important;
        }
        .swagger-ui .opblock .opblock-section-header .btn:hover {
            border-color: var(--accent) !important;
        }

        /* Parameters */
        .swagger-ui .opblock .parameters-col_name {
            color: var(--text-primary) !important;
        }
        .swagger-ui .opblock .parameters-col_name .parameter__name {
            color: var(--text-primary) !important;
        }
        .swagger-ui .opblock .parameters-col_name .parameter__type {
            color: var(--text-muted) !important;
        }
        .swagger-ui .opblock .parameters-col_name .parameter__in {
            color: var(--accent) !important;
        }
        .swagger-ui .opblock .parameters-col_name .parameter__deprecated {
            color: var(--danger) !important;
        }
        .swagger-ui .opblock .parameters-col_description {
            color: var(--text-secondary) !important;
        }
        .swagger-ui .opblock .parameters-col_description input,
        .swagger-ui .opblock .parameters-col_description select,
        .swagger-ui .opblock .parameters-col_description textarea {
            background-color: var(--bg-primary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border) !important;
            border-radius: 4px !important;
        }

        /* Response section */
        .swagger-ui .responses-inner {
            color: var(--text-primary) !important;
        }
        .swagger-ui .responses-inner h4,
        .swagger-ui .responses-inner h5 {
            color: var(--text-primary) !important;
        }
        .swagger-ui .response-col_status {
            color: var(--text-primary) !important;
        }
        .swagger-ui .response-col_description {
            color: var(--text-secondary) !important;
        }
        .swagger-ui .response-col_links {
            color: var(--text-muted) !important;
        }

        /* Response status code colors */
        .swagger-ui .response.response-200 .response-col_status {
            color: var(--success) !important;
        }
        .swagger-ui .response.response-201 .response-col_status {
            color: var(--success) !important;
        }
        .swagger-ui .response.response-400 .response-col_status {
            color: var(--warning) !important;
        }
        .swagger-ui .response.response-401 .response-col_status {
            color: var(--danger) !important;
        }
        .swagger-ui .response.response-403 .response-col_status {
            color: var(--danger) !important;
        }
        .swagger-ui .response.response-404 .response-col_status {
            color: var(--warning) !important;
        }
        .swagger-ui .response.response-422 .response-col_status {
            color: var(--warning) !important;
        }
        .swagger-ui .response.response-429 .response-col_status {
            color: var(--danger) !important;
        }
        .swagger-ui .response.response-500 .response-col_status {
            color: var(--danger) !important;
        }

        /* Models */
        .swagger-ui .model-box {
            background-color: var(--bg-secondary) !important;
            border: 1px solid var(--border) !important;
            border-radius: 8px !important;
        }
        .swagger-ui .model-box .model-title {
            color: var(--text-primary) !important;
        }
        .swagger-ui .model-box .model .prop-name {
            color: var(--text-primary) !important;
        }
        .swagger-ui .model-box .model .prop-type {
            color: var(--accent) !important;
        }
        .swagger-ui .model-box .model .prop-enum {
            color: var(--text-secondary) !important;
        }

        /* Buttons */
        .swagger-ui .btn {
            background-color: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border) !important;
            border-radius: 6px !important;
        }
        .swagger-ui .btn:hover {
            border-color: var(--accent) !important;
            color: var(--accent) !important;
        }
        .swagger-ui .btn.authorize {
            background-color: var(--accent) !important;
            color: #fff !important;
            border-color: var(--accent) !important;
        }
        .swagger-ui .btn.authorize:hover {
            background-color: var(--accent-hover) !important;
        }
        .swagger-ui .btn.execute {
            background-color: var(--accent) !important;
            color: #fff !important;
            border-color: var(--accent) !important;
        }
        .swagger-ui .btn.execute:hover {
            background-color: var(--accent-hover) !important;
        }

        /* Authorization modal */
        .swagger-ui .dialog-ux .modal-ux {
            background-color: var(--bg-secondary) !important;
            border: 1px solid var(--border) !important;
            border-radius: 12px !important;
        }
        .swagger-ui .dialog-ux .modal-ux-header {
            background-color: var(--bg-tertiary) !important;
            border-bottom: 1px solid var(--border) !important;
        }
        .swagger-ui .dialog-ux .modal-ux-header h3 {
            color: var(--text-primary) !important;
        }
        .swagger-ui .dialog-ux .modal-ux-content {
            color: var(--text-secondary) !important;
        }
        .swagger-ui .dialog-ux .modal-ux-content h4 {
            color: var(--text-primary) !important;
        }
        .swagger-ui .dialog-ux .modal-ux-content p {
            color: var(--text-secondary) !important;
        }
        .swagger-ui .dialog-ux .modal-ux-content .auth-container input {
            background-color: var(--bg-primary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border) !important;
        }

        /* Code blocks in responses */
        .swagger-ui .microlight {
            background-color: var(--code-bg) !important;
            color: var(--text-primary) !important;
            border-radius: 6px !important;
        }

        /* Custom header bar */
        .custom-header {
            background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
            border-bottom: 2px solid var(--accent);
            padding: 16px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .custom-header .logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .custom-header .logo-icon {
            width: 36px;
            height: 36px;
            background: var(--accent);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 800;
            color: #fff;
        }
        .custom-header .logo-text {
            font-size: 20px;
            font-weight: 700;
            color: var(--text-primary);
        }
        .custom-header .logo-subtitle {
            font-size: 12px;
            color: var(--text-muted);
        }
        .custom-header .header-links {
            display: flex;
            gap: 16px;
        }
        .custom-header .header-links a {
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 14px;
            transition: color 0.2s;
        }
        .custom-header .header-links a:hover {
            color: var(--accent);
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: var(--bg-primary);
        }
        ::-webkit-scrollbar-thumb {
            background: var(--bg-tertiary);
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: var(--accent);
        }

        /* Try it out section */
        .swagger-ui .execute-wrapper {
            background-color: var(--bg-secondary) !important;
        }
        .swagger-ui .execute-wrapper .btn {
            background-color: var(--accent) !important;
            color: #fff !important;
        }

        /* Copy button */
        .swagger-ui .copy-to-clipboard {
            background-color: var(--bg-tertiary) !important;
            border: 1px solid var(--border) !important;
        }
        .swagger-ui .copy-to-clipboard:hover {
            border-color: var(--accent) !important;
        }

        /* Curl command */
        .swagger-ui .curl-command {
            background-color: var(--code-bg) !important;
            border: 1px solid var(--border) !important;
            border-radius: 8px !important;
        }
        .swagger-ui .curl-command .curl {
            color: var(--text-primary) !important;
        }

        /* Filter input */
        .swagger-ui .filter-container .filter-input {
            background-color: var(--bg-secondary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border) !important;
            border-radius: 6px !important;
        }

        /* Loading indicator */
        .swagger-ui .loading-container .loading {
            border-color: var(--border) !important;
            border-top-color: var(--accent) !important;
        }
    </style>
</head>
<body>
    <div class="custom-header">
        <div class="logo">
            <div class="logo-icon">Y</div>
            <div>
                <div class="logo-text">YouAndINotAI API</div>
                <div class="logo-subtitle">Human-First Social Platform</div>
            </div>
        </div>
        <div class="header-links">
            <a href="https://youandinotai.com" target="_blank">Website</a>
            <a href="/api/v1/health/detailed" target="_blank">Health Dashboard</a>
            <a href="/openapi.json" target="_blank">OpenAPI Schema</a>
        </div>
    </div>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            SwaggerUIBundle({
                url: '/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                theme: "dark",
                tryItOutEnabled: true,
                requestInterceptor: function(request) {
                    // Add correlation ID to all requests from Swagger UI
                    request.headers['X-Request-Source'] = 'swagger-ui';
                    return request;
                },
                responseInterceptor: function(response) {
                    // Log response time for debugging
                    console.log('[Swagger UI] Response:', response.status, response.url);
                    return response;
                },
                onComplete: function() {
                    console.log('[Swagger UI] Documentation loaded successfully');
                }
            });
        };
    </script>
</body>
</html>
"""
