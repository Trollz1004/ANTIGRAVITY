from datetime import datetime
from sqlalchemy import String, Text, Float, Integer, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Listing(Base):
    """Master listing record. eBay is source of truth."""
    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ebay_item_id: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    condition: Mapped[str] = mapped_column(String(50), default="Used")
    category: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ebay_price: Mapped[float] = mapped_column(Float, default=0.0)
    cost_basis: Mapped[float] = mapped_column(Float, default=0.0)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    quantity_sold: Mapped[int] = mapped_column(Integer, default=0)
    weight_oz: Mapped[float | None] = mapped_column(Float, nullable=True)
    length_in: Mapped[float | None] = mapped_column(Float, nullable=True)
    width_in: Mapped[float | None] = mapped_column(Float, nullable=True)
    height_in: Mapped[float | None] = mapped_column(Float, nullable=True)
    sku: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    ebay_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    photos: Mapped[list["ListingPhoto"]] = relationship(back_populates="listing", cascade="all, delete-orphan")
    platform_listings: Mapped[list["PlatformListing"]] = relationship(back_populates="listing", cascade="all, delete-orphan")


class ListingPhoto(Base):
    __tablename__ = "listing_photos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    listing_id: Mapped[int] = mapped_column(Integer, ForeignKey("listings.id"))
    url: Mapped[str] = mapped_column(String(512))
    local_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    listing: Mapped["Listing"] = relationship(back_populates="photos")


class PlatformListing(Base):
    """A listing's presence on a specific platform."""
    __tablename__ = "platform_listings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    listing_id: Mapped[int] = mapped_column(Integer, ForeignKey("listings.id"), index=True)
    platform: Mapped[str] = mapped_column(String(20), index=True)
    platform_item_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    platform_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    listed_price: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), default="active")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    listed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    listing: Mapped["Listing"] = relationship(back_populates="platform_listings")


class SyncEvent(Base):
    """Audit log of every sync action."""
    __tablename__ = "sync_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    listing_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("listings.id"), nullable=True)
    platform: Mapped[str] = mapped_column(String(20))
    action: Mapped[str] = mapped_column(String(20))
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class PlatformConfig(Base):
    __tablename__ = "platform_configs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    platform: Mapped[str] = mapped_column(String(20), unique=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    credentials: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_sync: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class ShippingProfile(Base):
    __tablename__ = "shipping_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100))
    carrier: Mapped[str] = mapped_column(String(20))
    service: Mapped[str] = mapped_column(String(50))
    max_weight_oz: Mapped[float | None] = mapped_column(Float, nullable=True)
    flat_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
