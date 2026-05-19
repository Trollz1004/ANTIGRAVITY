"""
Validation schemas for Mission Control API routes (OPU-32).

Pydantic schemas for request body validation on POST/PUT/PATCH endpoints.
Used with the validate_request() middleware decorator.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class DeployRequest(BaseModel):
    """Schema for POST /deploy/paperclip — triggers a deployment."""

    environment: str = Field(
        default="production",
        pattern=r"^(production|staging|development)$",
        description="Target environment for deployment",
    )
    force: bool = Field(
        default=False,
        description="Force deployment even if checks fail",
    )

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        allowed = {"production", "staging", "development"}
        if v not in allowed:
            raise ValueError(f"environment must be one of: {', '.join(sorted(allowed))}")
        return v


class TriggerOpsRunRequest(BaseModel):
    """Schema for POST /ops/runs/{command_id} — triggers an operation command."""

    confirm: bool = Field(
        default=False,
        description="Must be true to confirm execution of dangerous commands",
    )
    timeout_override: int | None = Field(
        default=None,
        ge=1,
        le=600,
        description="Optional timeout override in seconds (1-600)",
    )


class OpsRunQuery(BaseModel):
    """Schema for GET /ops/runs query parameters."""

    offset: int = Field(default=0, ge=0)
    limit: int = Field(default=50, ge=1, le=200)
