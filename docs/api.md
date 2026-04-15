# API Documentation

This document describes the YouAndINotAI REST API endpoints and their usage.

## Base URL

Production: `https://api.youandinotai.com/api/v1`

## Authentication

Most endpoints require authentication via JWT Bearer tokens.

```http
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Health

#### GET /health

Check the health status of the API.

**Response:**

```json
{
  "status": "ok",
  "db_connected": true,
  "square_connected": true,
  "square_signature_configured": true,
  "wallet_rails_proven": false,
  "wallet_rails_status": "unproven",
  "payment_proof_labels": [],
  "user_count": 2
}
```

### Authentication

#### POST /auth/register

Register a new user.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "display_name": "User Name"
}
```

**Response:**

```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "display_name": "User Name",
  "token": "jwt-token"
}
```

#### POST /auth/login

Authenticate a user and obtain a JWT token.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "display_name": "User Name",
  "token": "jwt-token"
}
```

#### POST /auth/refresh

Refresh an expired JWT token.

**Headers:**

```http
Authorization: Bearer <expired-jwt-token>
```

**Response:**

```json
{
  "token": "new-jwt-token"
}
```

### Users

#### GET /users/me

Get the current user's profile.

**Headers:**

```http
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "User Name",
  "bio": "User biography",
  "created_at": "2026-01-01T00:00:00Z"
}
```

#### PUT /users/me

Update the current user's profile.

**Headers:**

```http
Authorization: Bearer <jwt-token>
```

**Request:**

```json
{
  "display_name": "New Name",
  "bio": "Updated biography"
}
```

**Response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "New Name",
  "bio": "Updated biography",
  "created_at": "2026-01-01T00:00:00Z"
}
```

### Safety

#### GET /safety/blocks

Get a list of blocked users.

**Headers:**

```http
Authorization: Bearer <jwt-token>
```

**Response:**

```json
[
  {
    "blocked_user_id": "uuid",
    "display_name": "Blocked User",
    "reason": "Block from safety tools",
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

#### POST /safety/users/{user_id}/block

Block a user.

**Headers:**

```http
Authorization: Bearer <jwt-token>
```

**Request:**

```json
{
  "reason": "Blocked from safety tools"
}
```

**Response:**

```json
{
  "status": "blocked",
  "blocked_user_id": "uuid",
  "match_records_closed": 0
}
```

#### DELETE /safety/users/{user_id}/block

Unblock a user.

**Headers:**

```http
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "status": "unblocked",
  "blocked_user_id": "uuid",
  "match_records_closed": 0
}
```

#### POST /safety/users/{user_id}/report

Report a user.

**Headers:**

```http
Authorization: Bearer <jwt-token>
```

**Request:**

```json
{
  "reason": "harassment",
  "details": "User sent threatening messages",
  "source": "chat"
}
```

**Response:**

```json
{
  "status": "reported",
  "report_id": "uuid",
  "reported_user_id": "uuid",
  "ticket_id": "uuid"
}
```

### Payments

#### POST /payments/checkout

Create a payment checkout session.

**Headers:**

```http
Authorization: Bearer <jwt-token>
```

**Request:**

```json
{
  "amount": 1499,
  "product": "founder_monthly",
  "success_url": "https://youandinotai.com/success",
  "cancel_url": "https://youandinotai.com/cancel"
}
```

**Response:**

```json
{
  "checkout_url": "https://square.link/u/checkout-id"
}
```

### Events

#### GET /events

Get upcoming events.

**Headers:**

```http
Authorization: Bearer <jwt-token>
```

**Query Parameters:**

- `location`: Filter by location
- `category`: Filter by category
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset

**Response:**

```json
[
  {
    "id": "uuid",
    "title": "Community Cleanup Day",
    "description": "Join us for a neighborhood cleanup",
    "location": "Central Park",
    "category": "volunteering",
    "start_time": "2026-04-20T10:00:00Z",
    "end_time": "2026-04-20T14:00:00Z",
    "attendee_count": 15
  }
]
```

#### POST /events

Create a new event.

**Headers:**

```http
Authorization: Bearer <jwt-token>
```

**Request:**

```json
{
  "title": "Community Cleanup Day",
  "description": "Join us for a neighborhood cleanup",
  "location": "Central Park",
  "category": "volunteering",
  "start_time": "2026-04-20T10:00:00Z",
  "end_time": "2026-04-20T14:00:00Z"
}
```

**Response:**

```json
{
  "id": "uuid",
  "title": "Community Cleanup Day",
  "description": "Join us for a neighborhood cleanup",
  "location": "Central Park",
  "category": "volunteering",
  "start_time": "2026-04-20T10:00:00Z",
  "end_time": "2026-04-20T14:00:00Z",
  "attendee_count": 1,
  "created_by": "uuid"
}
```

### Volunteering

#### GET /volunteering/opportunities

Get volunteering opportunities.

**Headers:**

```http
Authorization: Bearer <jwt-token>
```

**Response:**

```json
[
  {
    "id": "uuid",
    "title": "Food Bank Helper",
    "organization": "Local Food Bank",
    "description": "Help sort and distribute food to families in need",
    "skills_needed": ["lifting", "organization"],
    "time_commitment": "4 hours/week",
    "location": "Downtown"
  }
]
```

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity
- 500: Internal Server Error

## Rate Limiting

API requests are rate limited to prevent abuse:

- 100 requests per minute per IP address
- Excessive requests will result in 429 Too Many Requests responses

## Webhooks

### Square Payment Webhook

**Endpoint:** `/webhooks/square-payment`

Handles payment events from Square:

- `payment.created`
- `payment.updated`
- `subscription.created`
- `subscription.updated`

Webhooks are secured with signature verification using `SQUARE_WEBHOOK_SIGNATURE_KEY`.

## Versioning

The API uses date-based versioning in the URL path (`/api/v1/`). Breaking changes will result in new version paths.

## Contact

For API-related questions or support, contact developers@youandinotai.com.
