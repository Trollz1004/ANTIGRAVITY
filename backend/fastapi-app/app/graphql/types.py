"""GraphQL type definitions for ANTIGRAVITY models."""

import uuid
from datetime import datetime
from typing import Optional

import strawberry


@strawberry.type
class UserType:
    id: uuid.UUID
    email: str
    display_name: str
    bot_shield_verified: bool
    subscription_tier: Optional[str]
    subscription_active: bool
    subscription_expires_at: Optional[datetime]
    created_at: Optional[datetime]


@strawberry.type
class HealthStatusType:
    service: str
    status: str
    version: str
    uptime_seconds: Optional[float]
    timestamp: Optional[str]


@strawberry.type
class OpsRunType:
    id: uuid.UUID
    run_id: str
    status: str
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    duration_ms: Optional[int]
    error_message: Optional[str]
    metadata: Optional[str]


@strawberry.type
class NotificationType:
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    message: str
    read: bool
    created_at: Optional[datetime]


@strawberry.type
class AuditLogType:
    id: int
    user_id: Optional[str]
    action: str
    table_name: str
    record_id: Optional[str]
    before_values: Optional[str]
    after_values: Optional[str]
    timestamp: datetime
    ip_address: Optional[str]


@strawberry.type
class RateLimitType:
    key: str
    limit: int
    remaining: int
    reset_at: Optional[datetime]
