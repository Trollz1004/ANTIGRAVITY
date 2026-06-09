"""Pydantic models for lead generation parsing."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from pydantic import BaseModel, Field


class Lead(BaseModel):
    """A parsed lead record."""

    name: str = Field(..., description="Contact or company name")
    source: str = Field(..., description="Where the lead was found")
    url: str | None = Field(None, description="URL to the lead's profile or listing")
    email: str | None = Field(None, description="Contact email")
    phone: str | None = Field(None, description="Contact phone number")
    notes: str | None = Field(None, description="Additional context")


class ParseResult(BaseModel):
    """Result of a lead parsing run."""

    leads: list[Lead] = Field(default_factory=list)
    source: str = Field(..., description="Origin of the parsed data")
    total: int = Field(0, description="Total leads parsed")
    errors: list[str] = Field(default_factory=list, description="Any parse errors")


class DemoContact(BaseModel):
    """A demo lead with purchase intent, QR code, and key issuance tracking."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str | None = None
    phone: str | None = None
    product: str = Field(..., description="Product slug they're interested in")
    purchase_url: str = Field(..., description="URL embedded in the QR code")
    qr_path: str | None = Field(None, description="Path to the generated QR code PNG")
    created_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    purchased: bool = False
    license_key: str | None = None


class LicenseKey(BaseModel):
    """Issued license key after a purchase."""

    key: str = Field(..., description="The license key string")
    contact_id: str
    product: str
    issued_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())