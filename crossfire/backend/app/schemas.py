from datetime import datetime
from pydantic import BaseModel


# --- Listings ---

class ListingCreate(BaseModel):
    title: str
    description: str | None = None
    condition: str = "Used"
    category: str | None = None
    ebay_price: float
    cost_basis: float = 0.0
    quantity: int = 1
    weight_oz: float | None = None
    length_in: float | None = None
    width_in: float | None = None
    height_in: float | None = None
    sku: str | None = None
    ebay_item_id: str | None = None
    ebay_url: str | None = None


class ListingUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    condition: str | None = None
    category: str | None = None
    ebay_price: float | None = None
    cost_basis: float | None = None
    quantity: int | None = None
    weight_oz: float | None = None
    length_in: float | None = None
    width_in: float | None = None
    height_in: float | None = None
    sku: str | None = None
    status: str | None = None


class PlatformListingOut(BaseModel):
    id: int
    platform: str
    platform_item_id: str | None
    platform_url: str | None
    listed_price: float
    status: str
    error_message: str | None
    listed_at: datetime | None
    model_config = {"from_attributes": True}


class ListingOut(BaseModel):
    id: int
    ebay_item_id: str | None
    title: str
    description: str | None
    condition: str
    category: str | None
    ebay_price: float
    cost_basis: float
    quantity: int
    quantity_sold: int
    weight_oz: float | None
    length_in: float | None
    width_in: float | None
    height_in: float | None
    sku: str | None
    status: str
    ebay_url: str | None
    created_at: datetime
    platform_listings: list[PlatformListingOut] = []
    model_config = {"from_attributes": True}


# --- Price Engine ---

class FeeBreakdown(BaseModel):
    platform: str
    list_price: float
    platform_fee: float
    processing_fee: float
    total_fees: float
    net_payout: float
    profit: float
    profit_margin: float


class PriceCalcRequest(BaseModel):
    ebay_price: float
    cost_basis: float = 0.0
    shipping_cost: float = 6.50
    materials_cost: float = 1.50


class PriceCalcResponse(BaseModel):
    ebay: FeeBreakdown
    mercari: FeeBreakdown
    poshmark: FeeBreakdown
    fbmp: FeeBreakdown
    etsy: FeeBreakdown
    square: FeeBreakdown


# --- Crosspost ---

class CrosspostRequest(BaseModel):
    listing_id: int
    platforms: list[str]
    price_overrides: dict[str, float] | None = None


# --- Shipping ---

class ShippingCalcRequest(BaseModel):
    weight_oz: float
    length_in: float = 10.0
    width_in: float = 8.0
    height_in: float = 4.0
    dest_zip: str = "90210"


class ShippingCalcResponse(BaseModel):
    carrier: str
    service: str
    origin_zip: str
    dest_zip: str
    weight_oz: float
    estimated_cost: float
    delivery_days: str


# --- Sync ---

class SyncEventOut(BaseModel):
    id: int
    listing_id: int | None
    platform: str
    action: str
    details: str | None
    success: bool
    created_at: datetime
    model_config = {"from_attributes": True}
