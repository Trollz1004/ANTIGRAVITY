from fastapi import APIRouter

from ..schemas import ShippingCalcRequest, ShippingCalcResponse
from ..services.shipping_calc import calculate_shipping, best_rate

router = APIRouter(prefix="/api/shipping", tags=["shipping"])


@router.post("/calc", response_model=ShippingCalcResponse)
async def calc_shipping(req: ShippingCalcRequest):
    """Calculate USPS Ground Advantage from 32776 to destination."""
    return calculate_shipping(
        weight_oz=req.weight_oz,
        length_in=req.length_in,
        width_in=req.width_in,
        height_in=req.height_in,
        dest_zip=req.dest_zip,
    )


@router.get("/best-rate/{weight_oz}")
async def get_best_rate(weight_oz: float, dest_zip: str = "90210"):
    """Compare Ground Advantage vs flat rate boxes — return cheapest."""
    return best_rate(weight_oz, dest_zip)
