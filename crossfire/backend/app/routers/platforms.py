from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import PlatformConfig
from ..services.price_engine import PLATFORMS, calculate_all_platforms, calculate_fees
from ..schemas import PriceCalcRequest, PriceCalcResponse, FeeBreakdown

router = APIRouter(prefix="/api/platforms", tags=["platforms"])


@router.get("/")
async def list_platforms():
    """List all supported platforms and their fee structures."""
    return {k: {"label": v.get("label", k), **v} for k, v in PLATFORMS.items()}


@router.post("/price-calc", response_model=PriceCalcResponse)
async def price_calculator(req: PriceCalcRequest):
    """Calculate fees across all platforms for a given eBay price."""
    result = calculate_all_platforms(
        req.ebay_price, req.cost_basis, req.shipping_cost, req.materials_cost
    )
    return PriceCalcResponse(**result)


@router.get("/price-calc/{platform}/{price}")
async def quick_price(platform: str, price: float, cost: float = 0):
    """Quick fee calc for one platform."""
    if platform not in PLATFORMS:
        return {"error": f"Unknown platform: {platform}"}
    return calculate_fees(platform, price, cost)
