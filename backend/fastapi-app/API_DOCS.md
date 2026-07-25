# YouAndINotAI API Documentation

**Version:** 0.1.0
**Base URL:** `/api/v1`

## health - GET /api/v1/health

**Summary:** Health Check

### Request
`GET /api/v1/health`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `HealthResponse`
```json
{
  "properties": {
    "status": {
      "type": "string",
      "title": "Status"
    },
    "db_connected": {
      "type": "boolean",
      "title": "Db Connected"
    },
    "square_connected": {
      "type": "boolean",
      "title": "Square Connected"
    },
    "square_signature_configured": {
      "type": "boolean",
      "title": "Square Signature Configured"
    },
    "wallet_rails_proven": {
      "type": "boolean",
      "title": "Wallet Rails Proven"
    },
    "wallet_rails_status": {
      "type": "string",
      "title": "Wallet Rails Status"
    },
    "payment_proof_labels": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Payment Proof Labels"
    },
    "user_count": {
      "type": "integer",
      "title": "User Count"
    }
  },
  "type": "object",
  "required": [
    "status",
    "db_connected",
    "square_connected",
    "square_signature_configured",
    "wallet_rails_proven",
    "wallet_rails_status",
    "user_count"
  ],
  "title": "HealthResponse"
}
```

---

## health - GET /api/v1/health/allocations

**Summary:** Check Allocations

### Request
`GET /api/v1/health/allocations`

### Responses
**200 Successful Response**
Content-Type: `application/json`

---

## health - GET /api/v1/health/webhooks

**Summary:** Check Webhooks

### Request
`GET /api/v1/health/webhooks`

### Responses
**200 Successful Response**
Content-Type: `application/json`

---

## lovebot - POST /api/v1/lovebot/compatibility

**Summary:** Check Compatibility
**Description:** Check name and optional birthday compatibility.

### Request
`POST /api/v1/lovebot/compatibility`

**Content-Type:** `application/json`
**Schema:** `LoveBotCompatibilityRequest`
```json
{
  "properties": {
    "name1": {
      "type": "string",
      "maxLength": 100,
      "minLength": 1,
      "title": "Name1"
    },
    "name2": {
      "type": "string",
      "maxLength": 100,
      "minLength": 1,
      "title": "Name2"
    },
    "dob1": {
      "anyOf": [
        {
          "type": "string",
          "format": "date"
        },
        {
          "type": "null"
        }
      ],
      "title": "Dob1"
    },
    "dob2": {
      "anyOf": [
        {
          "type": "string",
          "format": "date"
        },
        {
          "type": "null"
        }
      ],
      "title": "Dob2"
    }
  },
  "type": "object",
  "required": [
    "name1",
    "name2"
  ],
  "title": "LoveBotCompatibilityRequest"
}
```

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `LoveBotCompatibilityResponse`
```json
{
  "properties": {
    "score": {
      "type": "integer",
      "title": "Score"
    },
    "message": {
      "type": "string",
      "title": "Message"
    }
  },
  "type": "object",
  "required": [
    "score",
    "message"
  ],
  "title": "LoveBotCompatibilityResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## lovebot - GET /api/v1/lovebot/quotes

**Summary:** Get Love Quotes
**Description:** Get a random love quote or pickup line.

### Request
`GET /api/v1/lovebot/quotes`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `LoveBotQuoteResponse`
```json
{
  "properties": {
    "text": {
      "type": "string",
      "title": "Text"
    },
    "author": {
      "type": "string",
      "title": "Author"
    },
    "category": {
      "type": "string",
      "title": "Category"
    }
  },
  "type": "object",
  "required": [
    "text",
    "author",
    "category"
  ],
  "title": "LoveBotQuoteResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## lovebot - GET /api/v1/lovebot/tips

**Summary:** Get Dating Tips
**Description:** Get expert dating tips and lessons.

### Request
`GET /api/v1/lovebot/tips`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `LoveBotTipResponse`
```json
{
  "properties": {
    "category": {
      "type": "string",
      "title": "Category"
    },
    "tips": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Tips"
    }
  },
  "type": "object",
  "required": [
    "category",
    "tips"
  ],
  "title": "LoveBotTipResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## lovebot - GET /api/v1/lovebot/gifts

**Summary:** Get Gift Ideas
**Description:** Get personalized gift ideas for your soulmate.

### Request
`GET /api/v1/lovebot/gifts`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `LoveBotGiftResponse`
```json
{
  "properties": {
    "recipient": {
      "type": "string",
      "title": "Recipient"
    },
    "ideas": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Ideas"
    }
  },
  "type": "object",
  "required": [
    "recipient",
    "ideas"
  ],
  "title": "LoveBotGiftResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## auth - POST /api/v1/auth/register

**Summary:** Register

### Request
`POST /api/v1/auth/register`

**Content-Type:** `application/json`
**Schema:** `AuthRegisterRequest`
```json
{
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "title": "Email"
    },
    "password": {
      "type": "string",
      "maxLength": 128,
      "minLength": 8,
      "title": "Password"
    },
    "display_name": {
      "type": "string",
      "maxLength": 100,
      "minLength": 1,
      "title": "Display Name"
    },
    "date_of_birth": {
      "type": "string",
      "format": "date",
      "title": "Date Of Birth"
    },
    "accepted_terms": {
      "type": "boolean",
      "const": true,
      "title": "Accepted Terms"
    },
    "accepted_cookie_policy": {
      "type": "boolean",
      "const": true,
      "title": "Accepted Cookie Policy"
    },
    "confirmed_over_18": {
      "type": "boolean",
      "const": true,
      "title": "Confirmed Over 18"
    }
  },
  "type": "object",
  "required": [
    "email",
    "password",
    "display_name",
    "date_of_birth",
    "accepted_terms",
    "accepted_cookie_policy",
    "confirmed_over_18"
  ],
  "title": "AuthRegisterRequest"
}
```

### Responses
**201 Successful Response**
Content-Type: `application/json`
Schema: `AuthTokenResponse`
```json
{
  "properties": {
    "access_token": {
      "type": "string",
      "title": "Access Token"
    },
    "refresh_token": {
      "type": "string",
      "title": "Refresh Token"
    },
    "token_type": {
      "type": "string",
      "title": "Token Type",
      "default": "bearer"
    },
    "user_id": {
      "type": "string",
      "format": "uuid",
      "title": "User Id"
    }
  },
  "type": "object",
  "required": [
    "access_token",
    "refresh_token",
    "user_id"
  ],
  "title": "AuthTokenResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## auth - POST /api/v1/auth/login

**Summary:** Login

### Request
`POST /api/v1/auth/login`

**Content-Type:** `application/json`
**Schema:** `AuthLoginRequest`
```json
{
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "title": "Email"
    },
    "password": {
      "type": "string",
      "title": "Password"
    }
  },
  "type": "object",
  "required": [
    "email",
    "password"
  ],
  "title": "AuthLoginRequest"
}
```

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `AuthTokenResponse`
```json
{
  "properties": {
    "access_token": {
      "type": "string",
      "title": "Access Token"
    },
    "refresh_token": {
      "type": "string",
      "title": "Refresh Token"
    },
    "token_type": {
      "type": "string",
      "title": "Token Type",
      "default": "bearer"
    },
    "user_id": {
      "type": "string",
      "format": "uuid",
      "title": "User Id"
    }
  },
  "type": "object",
  "required": [
    "access_token",
    "refresh_token",
    "user_id"
  ],
  "title": "AuthTokenResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## auth - POST /api/v1/auth/google

**Summary:** Google Login

### Request
`POST /api/v1/auth/google`

**Content-Type:** `application/json`
**Schema:** `GoogleLoginRequest`
```json
{
  "properties": {
    "id_token": {
      "type": "string",
      "title": "Id Token"
    }
  },
  "type": "object",
  "required": [
    "id_token"
  ],
  "title": "GoogleLoginRequest"
}
```

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `AuthTokenResponse`
```json
{
  "properties": {
    "access_token": {
      "type": "string",
      "title": "Access Token"
    },
    "refresh_token": {
      "type": "string",
      "title": "Refresh Token"
    },
    "token_type": {
      "type": "string",
      "title": "Token Type",
      "default": "bearer"
    },
    "user_id": {
      "type": "string",
      "format": "uuid",
      "title": "User Id"
    }
  },
  "type": "object",
  "required": [
    "access_token",
    "refresh_token",
    "user_id"
  ],
  "title": "AuthTokenResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## auth - POST /api/v1/auth/beta-access

**Summary:** Beta Access

### Request
`POST /api/v1/auth/beta-access`

**Content-Type:** `application/json`
**Schema:** `AuthBetaAccessRequest`
```json
{
  "properties": {
    "code": {
      "type": "string",
      "maxLength": 64,
      "minLength": 4,
      "title": "Code"
    }
  },
  "type": "object",
  "required": [
    "code"
  ],
  "title": "AuthBetaAccessRequest"
}
```

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `AuthTokenResponse`
```json
{
  "properties": {
    "access_token": {
      "type": "string",
      "title": "Access Token"
    },
    "refresh_token": {
      "type": "string",
      "title": "Refresh Token"
    },
    "token_type": {
      "type": "string",
      "title": "Token Type",
      "default": "bearer"
    },
    "user_id": {
      "type": "string",
      "format": "uuid",
      "title": "User Id"
    }
  },
  "type": "object",
  "required": [
    "access_token",
    "refresh_token",
    "user_id"
  ],
  "title": "AuthTokenResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## auth - POST /api/v1/auth/refresh

**Summary:** Refresh Token

### Request
`POST /api/v1/auth/refresh`

**Content-Type:** `application/json`
**Schema:** `AuthRefreshRequest`
```json
{
  "properties": {
    "refresh_token": {
      "type": "string",
      "title": "Refresh Token"
    }
  },
  "type": "object",
  "required": [
    "refresh_token"
  ],
  "title": "AuthRefreshRequest"
}
```

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `AuthTokenResponse`
```json
{
  "properties": {
    "access_token": {
      "type": "string",
      "title": "Access Token"
    },
    "refresh_token": {
      "type": "string",
      "title": "Refresh Token"
    },
    "token_type": {
      "type": "string",
      "title": "Token Type",
      "default": "bearer"
    },
    "user_id": {
      "type": "string",
      "format": "uuid",
      "title": "User Id"
    }
  },
  "type": "object",
  "required": [
    "access_token",
    "refresh_token",
    "user_id"
  ],
  "title": "AuthTokenResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## auth - GET /api/v1/auth/me

**Summary:** Get Me

### Request
`GET /api/v1/auth/me`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `UserMeResponse`
```json
{
  "properties": {
    "user_id": {
      "type": "string",
      "format": "uuid",
      "title": "User Id"
    },
    "email": {
      "type": "string",
      "title": "Email"
    },
    "display_name": {
      "type": "string",
      "title": "Display Name"
    },
    "bot_shield_verified": {
      "type": "boolean",
      "title": "Bot Shield Verified"
    },
    "subscription_tier": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Subscription Tier"
    },
    "subscription_active": {
      "type": "boolean",
      "title": "Subscription Active"
    },
    "subscription_expires_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Subscription Expires At"
    },
    "has_profile": {
      "type": "boolean",
      "title": "Has Profile"
    },
    "adult_verified": {
      "type": "boolean",
      "title": "Adult Verified"
    },
    "engagement_score": {
      "type": "number",
      "title": "Engagement Score"
    },
    "member_badge": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Member Badge"
    }
  },
  "type": "object",
  "required": [
    "user_id",
    "email",
    "display_name",
    "bot_shield_verified",
    "subscription_tier",
    "subscription_active",
    "has_profile",
    "adult_verified",
    "engagement_score",
    "member_badge"
  ],
  "title": "UserMeResponse"
}
```

---

## profiles - GET /api/v1/profiles/me

**Summary:** Get My Profile

### Request
`GET /api/v1/profiles/me`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `ProfileResponse`
```json
{
  "properties": {
    "user_id": {
      "type": "string",
      "format": "uuid",
      "title": "User Id"
    },
    "display_name": {
      "type": "string",
      "title": "Display Name"
    },
    "bio": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Bio"
    },
    "age": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "title": "Age"
    },
    "gender": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Gender"
    },
    "looking_for": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Looking For"
    },
    "location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Location"
    },
    "photos": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Photos"
    },
    "interests": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Interests"
    },
    "verified": {
      "type": "boolean",
      "title": "Verified"
    }
  },
  "type": "object",
  "required": [
    "user_id",
    "display_name",
    "bio",
    "age",
    "gender",
    "looking_for",
    "location",
    "photos",
    "interests",
    "verified"
  ],
  "title": "ProfileResponse"
}
```

---

## profiles - PUT /api/v1/profiles/me

**Summary:** Update My Profile

### Request
`PUT /api/v1/profiles/me`

**Content-Type:** `application/json`
**Schema:** `ProfileUpdateRequest`
```json
{
  "properties": {
    "bio": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 500
        },
        {
          "type": "null"
        }
      ],
      "title": "Bio"
    },
    "age": {
      "anyOf": [
        {
          "type": "integer",
          "maximum": 120.0,
          "minimum": 18.0
        },
        {
          "type": "null"
        }
      ],
      "title": "Age"
    },
    "date_of_birth": {
      "anyOf": [
        {
          "type": "string",
          "format": "date"
        },
        {
          "type": "null"
        }
      ],
      "title": "Date Of Birth"
    },
    "gender": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 50
        },
        {
          "type": "null"
        }
      ],
      "title": "Gender"
    },
    "looking_for": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 50
        },
        {
          "type": "null"
        }
      ],
      "title": "Looking For"
    },
    "location": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 200
        },
        {
          "type": "null"
        }
      ],
      "title": "Location"
    },
    "interests": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "maxItems": 20,
      "title": "Interests"
    }
  },
  "type": "object",
  "title": "ProfileUpdateRequest"
}
```

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `ProfileResponse`
```json
{
  "properties": {
    "user_id": {
      "type": "string",
      "format": "uuid",
      "title": "User Id"
    },
    "display_name": {
      "type": "string",
      "title": "Display Name"
    },
    "bio": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Bio"
    },
    "age": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "title": "Age"
    },
    "gender": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Gender"
    },
    "looking_for": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Looking For"
    },
    "location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Location"
    },
    "photos": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Photos"
    },
    "interests": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Interests"
    },
    "verified": {
      "type": "boolean",
      "title": "Verified"
    }
  },
  "type": "object",
  "required": [
    "user_id",
    "display_name",
    "bio",
    "age",
    "gender",
    "looking_for",
    "location",
    "photos",
    "interests",
    "verified"
  ],
  "title": "ProfileResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## profiles - GET /api/v1/profiles/{user_id}

**Summary:** Get User Profile

### Request
`GET /api/v1/profiles/{user_id}`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `ProfileResponse`
```json
{
  "properties": {
    "user_id": {
      "type": "string",
      "format": "uuid",
      "title": "User Id"
    },
    "display_name": {
      "type": "string",
      "title": "Display Name"
    },
    "bio": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Bio"
    },
    "age": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "title": "Age"
    },
    "gender": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Gender"
    },
    "looking_for": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Looking For"
    },
    "location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Location"
    },
    "photos": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Photos"
    },
    "interests": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Interests"
    },
    "verified": {
      "type": "boolean",
      "title": "Verified"
    }
  },
  "type": "object",
  "required": [
    "user_id",
    "display_name",
    "bio",
    "age",
    "gender",
    "looking_for",
    "location",
    "photos",
    "interests",
    "verified"
  ],
  "title": "ProfileResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## swipe - POST /api/v1/swipe

**Summary:** Swipe

### Request
`POST /api/v1/swipe`

**Content-Type:** `application/json`
**Schema:** `SwipeRequest`
```json
{
  "properties": {
    "target_id": {
      "type": "string",
      "format": "uuid",
      "title": "Target Id"
    },
    "direction": {
      "type": "string",
      "pattern": "^(like|pass)$",
      "title": "Direction"
    }
  },
  "type": "object",
  "required": [
    "target_id",
    "direction"
  ],
  "title": "SwipeRequest"
}
```

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `SwipeResponse`
```json
{
  "properties": {
    "matched": {
      "type": "boolean",
      "title": "Matched"
    },
    "match_id": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid"
        },
        {
          "type": "null"
        }
      ],
      "title": "Match Id"
    }
  },
  "type": "object",
  "required": [
    "matched"
  ],
  "title": "SwipeResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## swipe - GET /api/v1/matches

**Summary:** Get Matches

### Request
`GET /api/v1/matches`

### Responses
**200 Successful Response**
Content-Type: `application/json`

---

## swipe - GET /api/v1/matches/{match_id}

**Summary:** Get Match

### Request
`GET /api/v1/matches/{match_id}`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `MatchResponse`
```json
{
  "properties": {
    "match_id": {
      "type": "string",
      "format": "uuid",
      "title": "Match Id"
    },
    "user_id": {
      "type": "string",
      "format": "uuid",
      "title": "User Id"
    },
    "display_name": {
      "type": "string",
      "title": "Display Name"
    },
    "photos": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Photos"
    },
    "matched_at": {
      "type": "string",
      "format": "date-time",
      "title": "Matched At"
    },
    "last_message_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Last Message At"
    },
    "verified": {
      "type": "boolean",
      "title": "Verified",
      "default": false
    },
    "subscription_active": {
      "type": "boolean",
      "title": "Subscription Active",
      "default": false
    },
    "breeze_bypass_enabled": {
      "type": "boolean",
      "title": "Breeze Bypass Enabled",
      "default": false
    }
  },
  "type": "object",
  "required": [
    "match_id",
    "user_id",
    "display_name",
    "photos",
    "matched_at",
    "last_message_at"
  ],
  "title": "MatchResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## swipe - GET /api/v1/discover

**Summary:** Discover

### Request
`GET /api/v1/discover`

### Responses
**200 Successful Response**
Content-Type: `application/json`

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## swipe - PATCH /api/v1/matches/{match_id}/breeze-bypass

**Summary:** Toggle Breeze Bypass
**Description:** Breeze Bypass: Toggle zero-chat handshake mode for a specific match.

### Request
`PATCH /api/v1/matches/{match_id}/breeze-bypass`

### Responses
**200 Successful Response**
Content-Type: `application/json`

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## messages - GET /api/v1/messages/{match_id}

**Summary:** Get Messages

### Request
`GET /api/v1/messages/{match_id}`

### Responses
**200 Successful Response**
Content-Type: `application/json`

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## messages - POST /api/v1/messages/{match_id}

**Summary:** Send Message

### Request
`POST /api/v1/messages/{match_id}`

**Content-Type:** `application/json`
**Schema:** `MessageSendRequest`
```json
{
  "properties": {
    "content": {
      "type": "string",
      "maxLength": 2000,
      "minLength": 1,
      "title": "Content"
    }
  },
  "type": "object",
  "required": [
    "content"
  ],
  "title": "MessageSendRequest"
}
```

### Responses
**201 Successful Response**
Content-Type: `application/json`
Schema: `MessageResponse`
```json
{
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "title": "Id"
    },
    "sender_id": {
      "type": "string",
      "format": "uuid",
      "title": "Sender Id"
    },
    "content": {
      "type": "string",
      "title": "Content"
    },
    "read_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Read At"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "sender_id",
    "content",
    "read_at",
    "created_at"
  ],
  "title": "MessageResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## boards - GET /api/v1/boards

**Summary:** List Boards

### Request
`GET /api/v1/boards`

### Responses
**200 Successful Response**
Content-Type: `application/json`

---

## boards - GET /api/v1/boards/{slug}/posts

**Summary:** List Posts

### Request
`GET /api/v1/boards/{slug}/posts`

### Responses
**200 Successful Response**
Content-Type: `application/json`

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## boards - POST /api/v1/boards/{slug}/posts

**Summary:** Create Post

### Request
`POST /api/v1/boards/{slug}/posts`

**Content-Type:** `application/json`
**Schema:** `PostCreateRequest`
```json
{
  "properties": {
    "title": {
      "type": "string",
      "maxLength": 200,
      "minLength": 1,
      "title": "Title"
    },
    "body": {
      "type": "string",
      "maxLength": 5000,
      "minLength": 1,
      "title": "Body"
    }
  },
  "type": "object",
  "required": [
    "title",
    "body"
  ],
  "title": "PostCreateRequest"
}
```

### Responses
**201 Successful Response**
Content-Type: `application/json`
Schema: `PostResponse`
```json
{
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "title": "Id"
    },
    "board_slug": {
      "type": "string",
      "title": "Board Slug"
    },
    "author_id": {
      "type": "string",
      "format": "uuid",
      "title": "Author Id"
    },
    "author_name": {
      "type": "string",
      "title": "Author Name"
    },
    "title": {
      "type": "string",
      "title": "Title"
    },
    "body": {
      "type": "string",
      "title": "Body"
    },
    "like_count": {
      "type": "integer",
      "title": "Like Count"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "board_slug",
    "author_id",
    "author_name",
    "title",
    "body",
    "like_count",
    "created_at"
  ],
  "title": "PostResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## boards - GET /api/v1/boards/{slug}/posts/{post_id}/comments

**Summary:** List Comments

### Request
`GET /api/v1/boards/{slug}/posts/{post_id}/comments`

### Responses
**200 Successful Response**
Content-Type: `application/json`

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## boards - POST /api/v1/boards/{slug}/posts/{post_id}/comments

**Summary:** Create Comment

### Request
`POST /api/v1/boards/{slug}/posts/{post_id}/comments`

**Content-Type:** `application/json`
**Schema:** `CommentCreateRequest`
```json
{
  "properties": {
    "body": {
      "type": "string",
      "maxLength": 2000,
      "minLength": 1,
      "title": "Body"
    }
  },
  "type": "object",
  "required": [
    "body"
  ],
  "title": "CommentCreateRequest"
}
```

### Responses
**201 Successful Response**
Content-Type: `application/json`
Schema: `CommentResponse`
```json
{
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "title": "Id"
    },
    "author_id": {
      "type": "string",
      "format": "uuid",
      "title": "Author Id"
    },
    "author_name": {
      "type": "string",
      "title": "Author Name"
    },
    "body": {
      "type": "string",
      "title": "Body"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "author_id",
    "author_name",
    "body",
    "created_at"
  ],
  "title": "CommentResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## boards - POST /api/v1/boards/posts/{post_id}/report

**Summary:** Report Post

### Request
`POST /api/v1/boards/posts/{post_id}/report`

**Content-Type:** `application/json`
**Schema:** `PostReportRequest`
```json
{
  "properties": {
    "reason": {
      "type": "string",
      "maxLength": 500,
      "minLength": 1,
      "title": "Reason"
    },
    "details": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 1000
        },
        {
          "type": "null"
        }
      ],
      "title": "Details"
    }
  },
  "type": "object",
  "required": [
    "reason"
  ],
  "title": "PostReportRequest"
}
```

### Responses
**200 Successful Response**
Content-Type: `application/json`

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## events - GET /api/v1/events

**Summary:** List Events

### Request
`GET /api/v1/events`

### Responses
**200 Successful Response**
Content-Type: `application/json`

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## events - POST /api/v1/events

**Summary:** Create Event

### Request
`POST /api/v1/events`

**Content-Type:** `application/json`
**Schema:** `EventCreateRequest`
```json
{
  "properties": {
    "title": {
      "type": "string",
      "maxLength": 200,
      "minLength": 1,
      "title": "Title"
    },
    "description": {
      "type": "string",
      "maxLength": 5000,
      "minLength": 1,
      "title": "Description"
    },
    "location": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 300
        },
        {
          "type": "null"
        }
      ],
      "title": "Location"
    },
    "event_date": {
      "type": "string",
      "format": "date-time",
      "title": "Event Date"
    },
    "max_attendees": {
      "anyOf": [
        {
          "type": "integer",
          "minimum": 1.0
        },
        {
          "type": "null"
        }
      ],
      "title": "Max Attendees"
    },
    "category": {
      "type": "string",
      "title": "Category",
      "default": "general"
    }
  },
  "type": "object",
  "required": [
    "title",
    "description",
    "event_date"
  ],
  "title": "EventCreateRequest"
}
```

### Responses
**201 Successful Response**
Content-Type: `application/json`
Schema: `EventResponse`
```json
{
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "title": "Id"
    },
    "organizer_id": {
      "type": "string",
      "format": "uuid",
      "title": "Organizer Id"
    },
    "organizer_name": {
      "type": "string",
      "title": "Organizer Name"
    },
    "title": {
      "type": "string",
      "title": "Title"
    },
    "description": {
      "type": "string",
      "title": "Description"
    },
    "location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Location"
    },
    "event_date": {
      "type": "string",
      "format": "date-time",
      "title": "Event Date"
    },
    "max_attendees": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "title": "Max Attendees"
    },
    "attendee_count": {
      "type": "integer",
      "title": "Attendee Count"
    },
    "category": {
      "type": "string",
      "title": "Category"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "organizer_id",
    "organizer_name",
    "title",
    "description",
    "location",
    "event_date",
    "max_attendees",
    "attendee_count",
    "category",
    "created_at"
  ],
  "title": "EventResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## events - POST /api/v1/events/{event_id}/rsvp

**Summary:** Rsvp Event

### Request
`POST /api/v1/events/{event_id}/rsvp`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `EventRSVPResponse`
```json
{
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "title": "Id"
    },
    "event_id": {
      "type": "string",
      "format": "uuid",
      "title": "Event Id"
    },
    "user_id": {
      "type": "string",
      "format": "uuid",
      "title": "User Id"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "event_id",
    "user_id",
    "status",
    "created_at"
  ],
  "title": "EventRSVPResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## volunteering - GET /api/v1/volunteer/impact

**Summary:** Volunteer Impact
**Description:** Aggregate volunteer activity shown on the Volunteering Hub dashboard.

### Request
`GET /api/v1/volunteer/impact`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `VolunteerImpactResponse`
```json
{
  "properties": {
    "total_opportunities": {
      "type": "integer",
      "title": "Total Opportunities"
    },
    "total_signups": {
      "type": "integer",
      "title": "Total Signups"
    },
    "total_hours_committed": {
      "type": "number",
      "title": "Total Hours Committed"
    },
    "unique_organizations": {
      "type": "integer",
      "title": "Unique Organizations"
    },
    "unique_volunteers": {
      "type": "integer",
      "title": "Unique Volunteers"
    },
    "category_breakdown": {
      "additionalProperties": {
        "type": "integer"
      },
      "type": "object",
      "title": "Category Breakdown"
    },
    "top_organizations": {
      "items": {
        "type": "object"
      },
      "type": "array",
      "title": "Top Organizations"
    },
    "local_opportunities": {
      "type": "integer",
      "title": "Local Opportunities"
    }
  },
  "type": "object",
  "required": [
    "total_opportunities",
    "total_signups",
    "total_hours_committed",
    "unique_organizations",
    "unique_volunteers",
    "category_breakdown",
    "top_organizations",
    "local_opportunities"
  ],
  "title": "VolunteerImpactResponse",
  "description": "Aggregate volunteer activity shown on the volunteering hub dashboard."
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## volunteering - GET /api/v1/volunteer/my-signups

**Summary:** My Signups
**Description:** Get the current user's volunteer signup history.

### Request
`GET /api/v1/volunteer/my-signups`

### Responses
**200 Successful Response**
Content-Type: `application/json`

---

## volunteering - GET /api/v1/volunteer

**Summary:** List Opportunities
**Description:** List volunteer opportunities with optional location and category filters.

### Request
`GET /api/v1/volunteer`

### Responses
**200 Successful Response**
Content-Type: `application/json`

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## volunteering - POST /api/v1/volunteer

**Summary:** Create Opportunity

### Request
`POST /api/v1/volunteer`

**Content-Type:** `application/json`
**Schema:** `VolunteerCreateRequest`
```json
{
  "properties": {
    "title": {
      "type": "string",
      "maxLength": 200,
      "minLength": 1,
      "title": "Title"
    },
    "organization": {
      "type": "string",
      "maxLength": 200,
      "minLength": 1,
      "title": "Organization"
    },
    "description": {
      "type": "string",
      "maxLength": 5000,
      "minLength": 1,
      "title": "Description"
    },
    "location": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 300
        },
        {
          "type": "null"
        }
      ],
      "title": "Location"
    },
    "category": {
      "type": "string",
      "title": "Category",
      "default": "general"
    },
    "hours_estimate": {
      "anyOf": [
        {
          "type": "number",
          "maximum": 100.0,
          "minimum": 0.5
        },
        {
          "type": "null"
        }
      ],
      "title": "Hours Estimate"
    },
    "event_date": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Event Date"
    },
    "spots": {
      "anyOf": [
        {
          "type": "integer",
          "minimum": 1.0
        },
        {
          "type": "null"
        }
      ],
      "title": "Spots"
    }
  },
  "type": "object",
  "required": [
    "title",
    "organization",
    "description"
  ],
  "title": "VolunteerCreateRequest"
}
```

### Responses
**201 Successful Response**
Content-Type: `application/json`
Schema: `VolunteerResponse`
```json
{
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "title": "Id"
    },
    "created_by": {
      "type": "string",
      "format": "uuid",
      "title": "Created By"
    },
    "creator_name": {
      "type": "string",
      "title": "Creator Name",
      "default": ""
    },
    "title": {
      "type": "string",
      "title": "Title"
    },
    "organization": {
      "type": "string",
      "title": "Organization"
    },
    "description": {
      "type": "string",
      "title": "Description"
    },
    "location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Location"
    },
    "category": {
      "type": "string",
      "title": "Category",
      "default": "general"
    },
    "hours_estimate": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Hours Estimate"
    },
    "event_date": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Event Date"
    },
    "spots": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "title": "Spots"
    },
    "signup_count": {
      "type": "integer",
      "title": "Signup Count"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "created_by",
    "title",
    "organization",
    "description",
    "location",
    "event_date",
    "spots",
    "signup_count",
    "created_at"
  ],
  "title": "VolunteerResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## volunteering - POST /api/v1/volunteer/{opp_id}/signup

**Summary:** Signup Volunteer

### Request
`POST /api/v1/volunteer/{opp_id}/signup`

### Responses
**200 Successful Response**
Content-Type: `application/json`

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## webhooks - POST /api/v1/webhooks/square-payment

**Summary:** Square Payment Webhook
**Description:** Handle Square payment webhooks for Bot-Shield and subscription purchases.

Processes:
  - payment.completed → Bot-Shield $1 verification + subscription purchases
  - payment.updated → Status changes
  - subscription.created → New subscriptions
  - subscription.updated → Subscription changes (cancellation, renewal)

Iron Wall enforcement:
  - Creates a 'payment' VerificationEvent on successful Bot-Shield payment
  - Updates user.bot_shield_verified and subscription_active flags
  - Same tier logic as the retired payment handler, now wired to Square

### Request
`POST /api/v1/webhooks/square-payment`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `WebhookAckResponse`
```json
{
  "properties": {
    "received": {
      "type": "boolean",
      "title": "Received",
      "default": true
    },
    "event_id": {
      "type": "string",
      "title": "Event Id"
    },
    "processed": {
      "type": "boolean",
      "title": "Processed"
    },
    "duplicate": {
      "type": "boolean",
      "title": "Duplicate",
      "default": false
    }
  },
  "type": "object",
  "required": [
    "event_id",
    "processed"
  ],
  "title": "WebhookAckResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## webhooks - POST /api/v1/webhooks/square

**Summary:** Square Payment Webhook
**Description:** Handle Square payment webhooks for Bot-Shield and subscription purchases.

Processes:
  - payment.completed → Bot-Shield $1 verification + subscription purchases
  - payment.updated → Status changes
  - subscription.created → New subscriptions
  - subscription.updated → Subscription changes (cancellation, renewal)

Iron Wall enforcement:
  - Creates a 'payment' VerificationEvent on successful Bot-Shield payment
  - Updates user.bot_shield_verified and subscription_active flags
  - Same tier logic as the retired payment handler, now wired to Square

### Request
`POST /api/v1/webhooks/square`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `WebhookAckResponse`
```json
{
  "properties": {
    "received": {
      "type": "boolean",
      "title": "Received",
      "default": true
    },
    "event_id": {
      "type": "string",
      "title": "Event Id"
    },
    "processed": {
      "type": "boolean",
      "title": "Processed"
    },
    "duplicate": {
      "type": "boolean",
      "title": "Duplicate",
      "default": false
    }
  },
  "type": "object",
  "required": [
    "event_id",
    "processed"
  ],
  "title": "WebhookAckResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## webhooks - POST /api/v1/webhooks/square-booking

**Summary:** Square Booking Webhook
**Description:** Handle Square booking webhooks for e-waste pickups (OnlineRecycle.org).

### Request
`POST /api/v1/webhooks/square-booking`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `WebhookAckResponse`
```json
{
  "properties": {
    "received": {
      "type": "boolean",
      "title": "Received",
      "default": true
    },
    "event_id": {
      "type": "string",
      "title": "Event Id"
    },
    "processed": {
      "type": "boolean",
      "title": "Processed"
    },
    "duplicate": {
      "type": "boolean",
      "title": "Duplicate",
      "default": false
    }
  },
  "type": "object",
  "required": [
    "event_id",
    "processed"
  ],
  "title": "WebhookAckResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## webhooks - POST /api/v1/webhooks/stripe

**Summary:** Stripe Webhook Retired

### Request
`POST /api/v1/webhooks/stripe`

### Responses
**200 Successful Response**
Content-Type: `application/json`

---

## verification - POST /api/v1/verify/challenge

**Summary:** Create Challenge
**Description:** Start a V8 liveness challenge. Returns a math question with a time window.

### Request
`POST /api/v1/verify/challenge`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `ChallengeResponse`
```json
{
  "properties": {
    "challenge_id": {
      "type": "string",
      "title": "Challenge Id"
    },
    "challenge_type": {
      "type": "string",
      "title": "Challenge Type"
    },
    "question": {
      "type": "string",
      "title": "Question"
    },
    "issued_at": {
      "type": "string",
      "title": "Issued At"
    },
    "expires_at": {
      "type": "string",
      "title": "Expires At"
    }
  },
  "type": "object",
  "required": [
    "challenge_id",
    "challenge_type",
    "question",
    "issued_at",
    "expires_at"
  ],
  "title": "ChallengeResponse"
}
```

---

## verification - POST /api/v1/verify/submit

**Summary:** Submit Challenge
**Description:** Submit the answer to a liveness challenge. Returns trust score + checkout URL on pass.

### Request
`POST /api/v1/verify/submit`

**Content-Type:** `application/json`
**Schema:** `ChallengeSubmitRequest`
```json
{
  "properties": {
    "challenge_id": {
      "type": "string",
      "title": "Challenge Id"
    },
    "answer": {
      "type": "string",
      "title": "Answer"
    }
  },
  "type": "object",
  "required": [
    "challenge_id",
    "answer"
  ],
  "title": "ChallengeSubmitRequest"
}
```

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `ChallengeResult`
```json
{
  "properties": {
    "passed": {
      "type": "boolean",
      "title": "Passed"
    },
    "trust_score": {
      "type": "number",
      "title": "Trust Score"
    },
    "message": {
      "type": "string",
      "title": "Message"
    },
    "checkout_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Checkout Url"
    }
  },
  "type": "object",
  "required": [
    "passed",
    "trust_score",
    "message"
  ],
  "title": "ChallengeResult"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## verification - GET /api/v1/verify/status

**Summary:** Verification Status
**Description:** Get current verification status and trust score.

### Request
`GET /api/v1/verify/status`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `VerificationStatus`
```json
{
  "properties": {
    "verified": {
      "type": "boolean",
      "title": "Verified"
    },
    "trust_score": {
      "type": "number",
      "title": "Trust Score"
    },
    "tier": {
      "type": "string",
      "title": "Tier"
    },
    "bot_shield_paid": {
      "type": "boolean",
      "title": "Bot Shield Paid"
    },
    "subscription_active": {
      "type": "boolean",
      "title": "Subscription Active"
    },
    "checks_completed": {
      "type": "integer",
      "title": "Checks Completed"
    }
  },
  "type": "object",
  "required": [
    "verified",
    "trust_score",
    "tier",
    "bot_shield_paid",
    "subscription_active",
    "checks_completed"
  ],
  "title": "VerificationStatus"
}
```

---

## verification - POST /api/v1/verify/confirm

**Summary:** Confirm Verification
**Description:** Called after payment succeeds (webhook or client-side confirmation).

SECURITY: This endpoint requires BOTH:
  1. A passed liveness challenge
  2. A completed payment event (challenge_type == 'payment', status == 'completed')

Without both conditions met, verification is denied.
This prevents free verification bypass (Iron Wall enforcement).

### Request
`POST /api/v1/verify/confirm`

### Responses
**200 Successful Response**
Content-Type: `application/json`

---

## billing - POST /api/v1/billing/checkout-link

**Summary:** Create Checkout Link

### Request
`POST /api/v1/billing/checkout-link`

**Content-Type:** `application/json`
**Schema:** `CheckoutLinkRequest`
```json
{
  "properties": {
    "tier": {
      "type": "string",
      "enum": [
        "founding_member",
        "3_month",
        "12_month",
        "royalty"
      ],
      "title": "Tier"
    }
  },
  "type": "object",
  "required": [
    "tier"
  ],
  "title": "CheckoutLinkRequest"
}
```

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `CheckoutLinkResponse`
```json
{
  "properties": {
    "checkout_url": {
      "type": "string",
      "title": "Checkout Url"
    },
    "session_id": {
      "type": "string",
      "title": "Session Id"
    }
  },
  "type": "object",
  "required": [
    "checkout_url",
    "session_id"
  ],
  "title": "CheckoutLinkResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## metrics - GET /api/v1/metrics/impact

**Summary:** Impact Metrics
**Description:** Aggregate anonymized platform metrics for the Admin Dashboard.

Returns s, user counts, engagement totals.
NO individual user data, emails, names, or payment details.

### Request
`GET /api/v1/metrics/impact`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `PlatformMetricsResponse`
```json
{
  "properties": {
    "generated_at": {
      "type": "string",
      "title": "Generated At"
    },
    "revenue": {
      "$ref": "#/components/schemas/RevenuePolicyResponse"
    },
    "users": {
      "type": "object",
      "title": "Users"
    },
    "engagement": {
      "type": "object",
      "title": "Engagement"
    },
    "verification": {
      "type": "object",
      "title": "Verification"
    }
  },
  "type": "object",
  "required": [
    "generated_at",
    "revenue",
    "users",
    "engagement",
    "verification"
  ],
  "title": "PlatformMetricsResponse",
  "description": "Aggregate platform health metrics \u2014 zero PII."
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## metrics - GET /api/v1/metrics/security-audit

**Summary:** Get Security Audit
**Description:** Run and return security audit results.

This endpoint performs a comprehensive security audit of the application
configuration and reports any potential security issues found.

Note: This is an administrative endpoint that should only be accessible
to authorized operators with the metrics API key.

### Request
`GET /api/v1/metrics/security-audit`

### Responses
**200 Successful Response**
Content-Type: `application/json`

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## privacy - GET /api/v1/privacy/my-data

**Summary:** Get My Data

### Request
`GET /api/v1/privacy/my-data`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `PrivacyMyDataResponse`
```json
{
  "properties": {
    "user_id": {
      "type": "string",
      "format": "uuid",
      "title": "User Id"
    },
    "email": {
      "type": "string",
      "title": "Email"
    },
    "display_name": {
      "type": "string",
      "title": "Display Name"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    },
    "profile": {
      "anyOf": [
        {
          "$ref": "#/components/schemas/PrivacyProfileSummary"
        },
        {
          "type": "null"
        }
      ]
    },
    "message_count": {
      "type": "integer",
      "title": "Message Count"
    },
    "match_count": {
      "type": "integer",
      "title": "Match Count"
    },
    "photos_count": {
      "type": "integer",
      "title": "Photos Count"
    },
    "pending_requests": {
      "items": {
        "$ref": "#/components/schemas/PrivacyRequestResponse"
      },
      "type": "array",
      "title": "Pending Requests"
    }
  },
  "type": "object",
  "required": [
    "user_id",
    "email",
    "display_name",
    "created_at",
    "message_count",
    "match_count",
    "photos_count",
    "pending_requests"
  ],
  "title": "PrivacyMyDataResponse"
}
```

---

## privacy - POST /api/v1/privacy/export

**Summary:** Request Data Export

### Request
`POST /api/v1/privacy/export`

### Responses
**202 Successful Response**
Content-Type: `application/json`
Schema: `PrivacyActionResponse`
```json
{
  "properties": {
    "status": {
      "type": "string",
      "title": "Status"
    },
    "action": {
      "type": "string",
      "title": "Action"
    },
    "request_id": {
      "type": "string",
      "format": "uuid",
      "title": "Request Id"
    },
    "scheduled_for": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Scheduled For"
    }
  },
  "type": "object",
  "required": [
    "status",
    "action",
    "request_id"
  ],
  "title": "PrivacyActionResponse"
}
```

---

## privacy - POST /api/v1/privacy/delete

**Summary:** Request Account Deletion

### Request
`POST /api/v1/privacy/delete`

### Responses
**202 Successful Response**
Content-Type: `application/json`
Schema: `PrivacyActionResponse`
```json
{
  "properties": {
    "status": {
      "type": "string",
      "title": "Status"
    },
    "action": {
      "type": "string",
      "title": "Action"
    },
    "request_id": {
      "type": "string",
      "format": "uuid",
      "title": "Request Id"
    },
    "scheduled_for": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Scheduled For"
    }
  },
  "type": "object",
  "required": [
    "status",
    "action",
    "request_id"
  ],
  "title": "PrivacyActionResponse"
}
```

---

## privacy - POST /api/v1/privacy/location/disable

**Summary:** Disable Location Tracking

### Request
`POST /api/v1/privacy/location/disable`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `PrivacyActionResponse`
```json
{
  "properties": {
    "status": {
      "type": "string",
      "title": "Status"
    },
    "action": {
      "type": "string",
      "title": "Action"
    },
    "request_id": {
      "type": "string",
      "format": "uuid",
      "title": "Request Id"
    },
    "scheduled_for": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Scheduled For"
    }
  },
  "type": "object",
  "required": [
    "status",
    "action",
    "request_id"
  ],
  "title": "PrivacyActionResponse"
}
```

---

## safety - GET /api/v1/safety/blocks

**Summary:** List Blocked Users

### Request
`GET /api/v1/safety/blocks`

### Responses
**200 Successful Response**
Content-Type: `application/json`

---

## safety - POST /api/v1/safety/users/{user_id}/block

**Summary:** Block User

### Request
`POST /api/v1/safety/users/{user_id}/block`

**Content-Type:** `application/json`
**Schema:** `SafetyBlockRequest`
```json
{
  "properties": {
    "reason": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 500
        },
        {
          "type": "null"
        }
      ],
      "title": "Reason"
    }
  },
  "type": "object",
  "title": "SafetyBlockRequest"
}
```

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `SafetyBlockResponse`
```json
{
  "properties": {
    "status": {
      "type": "string",
      "title": "Status"
    },
    "blocked_user_id": {
      "type": "string",
      "format": "uuid",
      "title": "Blocked User Id"
    },
    "match_records_closed": {
      "type": "integer",
      "title": "Match Records Closed",
      "default": 0
    }
  },
  "type": "object",
  "required": [
    "status",
    "blocked_user_id"
  ],
  "title": "SafetyBlockResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## safety - DELETE /api/v1/safety/users/{user_id}/block

**Summary:** Unblock User

### Request
`DELETE /api/v1/safety/users/{user_id}/block`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `SafetyBlockResponse`
```json
{
  "properties": {
    "status": {
      "type": "string",
      "title": "Status"
    },
    "blocked_user_id": {
      "type": "string",
      "format": "uuid",
      "title": "Blocked User Id"
    },
    "match_records_closed": {
      "type": "integer",
      "title": "Match Records Closed",
      "default": 0
    }
  },
  "type": "object",
  "required": [
    "status",
    "blocked_user_id"
  ],
  "title": "SafetyBlockResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## safety - POST /api/v1/safety/users/{user_id}/report

**Summary:** Report User

### Request
`POST /api/v1/safety/users/{user_id}/report`

**Content-Type:** `application/json`
**Schema:** `UserReportRequest`
```json
{
  "properties": {
    "reason": {
      "type": "string",
      "maxLength": 100,
      "minLength": 1,
      "title": "Reason"
    },
    "details": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 1000
        },
        {
          "type": "null"
        }
      ],
      "title": "Details"
    },
    "source": {
      "type": "string",
      "enum": [
        "profile",
        "chat",
        "match",
        "board",
        "other"
      ],
      "title": "Source",
      "default": "profile"
    }
  },
  "type": "object",
  "required": [
    "reason"
  ],
  "title": "UserReportRequest"
}
```

### Responses
**201 Successful Response**
Content-Type: `application/json`
Schema: `UserReportResponse`
```json
{
  "properties": {
    "status": {
      "type": "string",
      "title": "Status"
    },
    "report_id": {
      "type": "string",
      "format": "uuid",
      "title": "Report Id"
    },
    "reported_user_id": {
      "type": "string",
      "format": "uuid",
      "title": "Reported User Id"
    },
    "ticket_id": {
      "anyOf": [
        {
          "type": "string",
          "format": "uuid"
        },
        {
          "type": "null"
        }
      ],
      "title": "Ticket Id"
    }
  },
  "type": "object",
  "required": [
    "status",
    "report_id",
    "reported_user_id"
  ],
  "title": "UserReportResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## support - POST /api/v1/support/chat

**Summary:** Support Chat

### Request
`POST /api/v1/support/chat`

**Content-Type:** `application/json`
**Schema:** `SupportChatRequest`
```json
{
  "properties": {
    "message": {
      "type": "string",
      "maxLength": 2000,
      "minLength": 1,
      "title": "Message"
    },
    "transcript": {
      "items": {
        "$ref": "#/components/schemas/SupportChatMessage"
      },
      "type": "array",
      "title": "Transcript"
    },
    "force_ticket": {
      "type": "boolean",
      "title": "Force Ticket",
      "default": false
    }
  },
  "type": "object",
  "required": [
    "message"
  ],
  "title": "SupportChatRequest"
}
```

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `SupportChatResponse`
```json
{
  "properties": {
    "reply": {
      "type": "string",
      "title": "Reply"
    },
    "escalated": {
      "type": "boolean",
      "title": "Escalated"
    },
    "category": {
      "type": "string",
      "title": "Category"
    },
    "preset_key": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Preset Key"
    },
    "ticket": {
      "anyOf": [
        {
          "$ref": "#/components/schemas/SupportTicketResponse"
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "type": "object",
  "required": [
    "reply",
    "escalated",
    "category"
  ],
  "title": "SupportChatResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## support - GET /api/v1/support/tickets

**Summary:** List My Support Tickets

### Request
`GET /api/v1/support/tickets`

### Responses
**200 Successful Response**
Content-Type: `application/json`

---

## support - POST /api/v1/support/tickets

**Summary:** Create Support Ticket

### Request
`POST /api/v1/support/tickets`

**Content-Type:** `application/json`
**Schema:** `SupportChatRequest`
```json
{
  "properties": {
    "message": {
      "type": "string",
      "maxLength": 2000,
      "minLength": 1,
      "title": "Message"
    },
    "transcript": {
      "items": {
        "$ref": "#/components/schemas/SupportChatMessage"
      },
      "type": "array",
      "title": "Transcript"
    },
    "force_ticket": {
      "type": "boolean",
      "title": "Force Ticket",
      "default": false
    }
  },
  "type": "object",
  "required": [
    "message"
  ],
  "title": "SupportChatRequest"
}
```

### Responses
**201 Successful Response**
Content-Type: `application/json`
Schema: `SupportTicketResponse`
```json
{
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "title": "Id"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "category": {
      "type": "string",
      "title": "Category"
    },
    "subject": {
      "type": "string",
      "title": "Subject"
    },
    "customer_email": {
      "type": "string",
      "title": "Customer Email"
    },
    "customer_message": {
      "type": "string",
      "title": "Customer Message"
    },
    "bot_response": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Bot Response"
    },
    "escalation_reason": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Escalation Reason"
    },
    "transcript": {
      "items": {
        "$ref": "#/components/schemas/SupportChatMessage"
      },
      "type": "array",
      "title": "Transcript"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time",
      "title": "Updated At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "status",
    "category",
    "subject",
    "customer_email",
    "customer_message",
    "created_at",
    "updated_at"
  ],
  "title": "SupportTicketResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## support - GET /api/v1/support/operator/tickets

**Summary:** List Operator Support Tickets

### Request
`GET /api/v1/support/operator/tickets`

### Responses
**200 Successful Response**
Content-Type: `application/json`

---

## video-rooms - POST /api/v1/video/rooms/{match_id}

**Summary:** Create Video Room
**Description:** Creates a Daily.co video room for a match session.

### Request
`POST /api/v1/video/rooms/{match_id}`

### Responses
**200 Successful Response**
Content-Type: `application/json`

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## double-dates - POST /api/v1/double-dates/propose

**Summary:** Propose Double Date

### Request
`POST /api/v1/double-dates/propose`

**Content-Type:** `application/json`
**Schema:** `DoubleDateProposeRequest`
```json
{
  "properties": {
    "match_a_id": {
      "type": "string",
      "format": "uuid",
      "title": "Match A Id"
    },
    "match_b_id": {
      "type": "string",
      "format": "uuid",
      "title": "Match B Id"
    }
  },
  "type": "object",
  "required": [
    "match_a_id",
    "match_b_id"
  ],
  "title": "DoubleDateProposeRequest"
}
```

### Responses
**201 Successful Response**
Content-Type: `application/json`
Schema: `DoubleDateSessionResponse`
```json
{
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "title": "Id"
    },
    "match_a_id": {
      "type": "string",
      "format": "uuid",
      "title": "Match A Id"
    },
    "match_b_id": {
      "type": "string",
      "format": "uuid",
      "title": "Match B Id"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    },
    "accepted_match_ids": {
      "items": {
        "type": "string",
        "format": "uuid"
      },
      "type": "array",
      "title": "Accepted Match Ids"
    },
    "couple_a": {
      "anyOf": [
        {
          "$ref": "#/components/schemas/DoubleDateCoupleResponse"
        },
        {
          "type": "null"
        }
      ]
    },
    "couple_b": {
      "anyOf": [
        {
          "$ref": "#/components/schemas/DoubleDateCoupleResponse"
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "type": "object",
  "required": [
    "id",
    "match_a_id",
    "match_b_id",
    "status",
    "created_at"
  ],
  "title": "DoubleDateSessionResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## double-dates - GET /api/v1/double-dates

**Summary:** List Double Dates

### Request
`GET /api/v1/double-dates`

### Responses
**200 Successful Response**
Content-Type: `application/json`

---

## double-dates - POST /api/v1/double-dates/{session_id}/accept

**Summary:** Accept Double Date

### Request
`POST /api/v1/double-dates/{session_id}/accept`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `DoubleDateSessionResponse`
```json
{
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "title": "Id"
    },
    "match_a_id": {
      "type": "string",
      "format": "uuid",
      "title": "Match A Id"
    },
    "match_b_id": {
      "type": "string",
      "format": "uuid",
      "title": "Match B Id"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    },
    "accepted_match_ids": {
      "items": {
        "type": "string",
        "format": "uuid"
      },
      "type": "array",
      "title": "Accepted Match Ids"
    },
    "couple_a": {
      "anyOf": [
        {
          "$ref": "#/components/schemas/DoubleDateCoupleResponse"
        },
        {
          "type": "null"
        }
      ]
    },
    "couple_b": {
      "anyOf": [
        {
          "$ref": "#/components/schemas/DoubleDateCoupleResponse"
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "type": "object",
  "required": [
    "id",
    "match_a_id",
    "match_b_id",
    "status",
    "created_at"
  ],
  "title": "DoubleDateSessionResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## double-dates - POST /api/v1/double-dates/{session_id}/decline

**Summary:** Decline Double Date

### Request
`POST /api/v1/double-dates/{session_id}/decline`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `DoubleDateSessionResponse`
```json
{
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "title": "Id"
    },
    "match_a_id": {
      "type": "string",
      "format": "uuid",
      "title": "Match A Id"
    },
    "match_b_id": {
      "type": "string",
      "format": "uuid",
      "title": "Match B Id"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    },
    "accepted_match_ids": {
      "items": {
        "type": "string",
        "format": "uuid"
      },
      "type": "array",
      "title": "Accepted Match Ids"
    },
    "couple_a": {
      "anyOf": [
        {
          "$ref": "#/components/schemas/DoubleDateCoupleResponse"
        },
        {
          "type": "null"
        }
      ]
    },
    "couple_b": {
      "anyOf": [
        {
          "$ref": "#/components/schemas/DoubleDateCoupleResponse"
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "type": "object",
  "required": [
    "id",
    "match_a_id",
    "match_b_id",
    "status",
    "created_at"
  ],
  "title": "DoubleDateSessionResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## double-dates - GET /api/v1/double-dates/squad-recommendations

**Summary:** Get Squad Recommendations
**Description:** Squad Protocol: Recommend matches for double-dates based on Mission Impact Score.

### Request
`GET /api/v1/double-dates/squad-recommendations`

### Responses
**200 Successful Response**
Content-Type: `application/json`

---

## users - POST /api/v1/users/register

**Summary:** Register User

### Request
`POST /api/v1/users/register`

**Content-Type:** `application/json`
**Schema:** `UserRegisterRequest`
```json
{
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "title": "Email"
    },
    "display_name": {
      "type": "string",
      "maxLength": 100,
      "minLength": 1,
      "title": "Display Name"
    }
  },
  "type": "object",
  "required": [
    "email",
    "display_name"
  ],
  "title": "UserRegisterRequest"
}
```

### Responses
**201 Successful Response**
Content-Type: `application/json`
Schema: `UserRegisterResponse`
```json
{
  "properties": {
    "user_id": {
      "type": "string",
      "format": "uuid",
      "title": "User Id"
    },
    "session_token": {
      "type": "string",
      "title": "Session Token"
    }
  },
  "type": "object",
  "required": [
    "user_id",
    "session_token"
  ],
  "title": "UserRegisterResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## waitlist - POST /api/v1/waitlist

**Summary:** Signup Waitlist

### Request
`POST /api/v1/waitlist`

**Content-Type:** `application/json`
**Schema:** `WaitlistSignupRequest`
```json
{
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "title": "Email"
    }
  },
  "type": "object",
  "required": [
    "email"
  ],
  "title": "WaitlistSignupRequest"
}
```

### Responses
**202 Successful Response**
Content-Type: `application/json`
Schema: `WaitlistSignupResponse`
```json
{
  "properties": {
    "received": {
      "type": "boolean",
      "title": "Received",
      "default": true
    },
    "confirmation_sent": {
      "type": "boolean",
      "title": "Confirmation Sent",
      "default": true
    },
    "message": {
      "type": "string",
      "title": "Message",
      "default": "Check your inbox for confirmation."
    }
  },
  "type": "object",
  "title": "WaitlistSignupResponse"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## marketing - GET /api/v1/marketing/content

**Summary:** List Content Items
**Description:** List all marketing content items.

### Request
`GET /api/v1/marketing/content`

### Responses
**200 Successful Response**
Content-Type: `application/json`

---

## marketing - POST /api/v1/marketing/content

**Summary:** Create Content Item
**Description:** Create a new marketing content item from AI agent.

This endpoint accepts structured content from AI agents and stores it for publishing.

### Request
`POST /api/v1/marketing/content`

**Content-Type:** `application/json`
**Schema:** `MarketingPost`
```json
{
  "properties": {
    "campaign_name": {
      "type": "string",
      "title": "Campaign Name",
      "description": "Name of the marketing campaign"
    },
    "objective": {
      "type": "string",
      "title": "Objective",
      "description": "Campaign objective"
    },
    "audience": {
      "type": "string",
      "title": "Audience",
      "description": "Target audience"
    },
    "platforms": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Platforms",
      "description": "Platforms to publish on"
    },
    "core_message": {
      "type": "string",
      "title": "Core Message",
      "description": "Core marketing message"
    },
    "post_type": {
      "type": "string",
      "title": "Post Type",
      "description": "Type of post (e.g., announcement, story, testimonial)"
    },
    "primary_caption": {
      "type": "string",
      "title": "Primary Caption",
      "description": "Main caption text"
    },
    "call_to_action": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Call To Action",
      "description": "Call to action phrase"
    },
    "hashtag_block": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Hashtag Block",
      "description": "Hashtags including brand, campaign, topic, and optional location"
    }
  },
  "type": "object",
  "required": [
    "campaign_name",
    "objective",
    "audience",
    "platforms",
    "core_message",
    "post_type",
    "primary_caption"
  ],
  "title": "MarketingPost"
}
```

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `ContentItem`
```json
{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "title": {
      "type": "string",
      "title": "Title"
    },
    "content": {
      "type": "string",
      "title": "Content"
    },
    "tags": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Tags"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    },
    "published": {
      "type": "boolean",
      "title": "Published"
    }
  },
  "type": "object",
  "required": [
    "id",
    "title",
    "content",
    "tags",
    "created_at",
    "published"
  ],
  "title": "ContentItem"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## marketing - GET /api/v1/marketing/content/{content_id}

**Summary:** Get Content Item
**Description:** Get a specific marketing content item.

### Request
`GET /api/v1/marketing/content/{content_id}`

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `ContentItem`
```json
{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "title": {
      "type": "string",
      "title": "Title"
    },
    "content": {
      "type": "string",
      "title": "Content"
    },
    "tags": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Tags"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    },
    "published": {
      "type": "boolean",
      "title": "Published"
    }
  },
  "type": "object",
  "required": [
    "id",
    "title",
    "content",
    "tags",
    "created_at",
    "published"
  ],
  "title": "ContentItem"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## marketing - PUT /api/v1/marketing/content/{content_id}

**Summary:** Update Content Item
**Description:** Update a marketing content item.

### Request
`PUT /api/v1/marketing/content/{content_id}`

**Content-Type:** `application/json`
**Schema:** `MarketingPost`
```json
{
  "properties": {
    "campaign_name": {
      "type": "string",
      "title": "Campaign Name",
      "description": "Name of the marketing campaign"
    },
    "objective": {
      "type": "string",
      "title": "Objective",
      "description": "Campaign objective"
    },
    "audience": {
      "type": "string",
      "title": "Audience",
      "description": "Target audience"
    },
    "platforms": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Platforms",
      "description": "Platforms to publish on"
    },
    "core_message": {
      "type": "string",
      "title": "Core Message",
      "description": "Core marketing message"
    },
    "post_type": {
      "type": "string",
      "title": "Post Type",
      "description": "Type of post (e.g., announcement, story, testimonial)"
    },
    "primary_caption": {
      "type": "string",
      "title": "Primary Caption",
      "description": "Main caption text"
    },
    "call_to_action": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Call To Action",
      "description": "Call to action phrase"
    },
    "hashtag_block": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Hashtag Block",
      "description": "Hashtags including brand, campaign, topic, and optional location"
    }
  },
  "type": "object",
  "required": [
    "campaign_name",
    "objective",
    "audience",
    "platforms",
    "core_message",
    "post_type",
    "primary_caption"
  ],
  "title": "MarketingPost"
}
```

### Responses
**200 Successful Response**
Content-Type: `application/json`
Schema: `ContentItem`
```json
{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "title": {
      "type": "string",
      "title": "Title"
    },
    "content": {
      "type": "string",
      "title": "Content"
    },
    "tags": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Tags"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    },
    "published": {
      "type": "boolean",
      "title": "Published"
    }
  },
  "type": "object",
  "required": [
    "id",
    "title",
    "content",
    "tags",
    "created_at",
    "published"
  ],
  "title": "ContentItem"
}
```

**422 Validation Error**
Content-Type: `application/json`
Schema: `HTTPValidationError`
```json
{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}
```

---

## untagged - GET /

**Summary:** Root

### Request
`GET /`

### Responses
**200 Successful Response**
Content-Type: `application/json`

---
