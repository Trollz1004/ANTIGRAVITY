"""CSV Import/Export routes — upload eBay CSV, get crossfire prices, export adjusted CSVs."""

from fastapi import APIRouter, UploadFile, File, Query
from fastapi.responses import StreamingResponse
import io

from ..services.csv_engine import (
    parse_ebay_csv,
    add_crossfire_prices,
    export_crossfire_csv,
    export_ebay_revise_csv,
    export_square_csv,
)

router = APIRouter(prefix="/api/csv", tags=["csv"])

# In-memory store for the current CSV session
_current_listings: list[dict] = []


@router.post("/import")
async def import_csv(
    file: UploadFile = File(...),
    cost_basis: float = Query(0, description="Default cost basis if not in CSV"),
    shipping_cost: float = Query(6.50, description="USPS Ground 32776→90210"),
    materials_cost: float = Query(1.50, description="Tape, box, etc."),
):
    """Upload an eBay CSV → get all listings with crossfire prices for every platform."""
    global _current_listings

    content = await file.read()
    csv_text = content.decode("utf-8-sig")  # Handle BOM from Excel

    listings = parse_ebay_csv(csv_text)
    if not listings:
        return {"error": "No valid listings found in CSV. Check column headers."}

    enriched = add_crossfire_prices(listings, cost_basis, shipping_cost, materials_cost)
    _current_listings = enriched

    return {
        "count": len(enriched),
        "listings": enriched,
    }


@router.post("/import-text")
async def import_csv_text(
    body: dict,
):
    """Import CSV as raw text (for frontend paste/drag)."""
    global _current_listings

    csv_text = body.get("csv_text", "")
    cost_basis = body.get("cost_basis", 0)
    shipping_cost = body.get("shipping_cost", 6.50)
    materials_cost = body.get("materials_cost", 1.50)

    listings = parse_ebay_csv(csv_text)
    if not listings:
        return {"error": "No valid listings found. Check column headers."}

    enriched = add_crossfire_prices(listings, cost_basis, shipping_cost, materials_cost)
    _current_listings = enriched

    return {
        "count": len(enriched),
        "listings": enriched,
    }


@router.get("/export/crossfire")
async def export_crossfire():
    """Download CSV with all platform prices (the master sheet)."""
    if not _current_listings:
        return {"error": "No listings loaded. Import a CSV first."}

    csv_data = export_crossfire_csv(_current_listings)
    return StreamingResponse(
        io.BytesIO(csv_data.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=crossfire-prices.csv"},
    )


@router.get("/export/ebay-revise")
async def export_ebay_revise(
    price_adjustment: float = Query(0, description="Add/subtract from current eBay price"),
):
    """Download eBay File Exchange CSV (Action=Revise) to bulk-update prices on eBay."""
    if not _current_listings:
        return {"error": "No listings loaded. Import a CSV first."}

    csv_data = export_ebay_revise_csv(_current_listings, price_adjustment)
    return StreamingResponse(
        io.BytesIO(csv_data.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ebay-revise.csv"},
    )


@router.get("/export/square")
async def export_square():
    """Download Square Online item import CSV — upload to squareup.com dashboard."""
    if not _current_listings:
        return {"error": "No listings loaded. Import a CSV first."}

    csv_data = export_square_csv(_current_listings)
    return StreamingResponse(
        io.BytesIO(csv_data.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=square-import.csv"},
    )


@router.get("/current")
async def get_current():
    """Get currently loaded listings (after import)."""
    return {
        "count": len(_current_listings),
        "listings": _current_listings,
    }


@router.delete("/clear")
async def clear_listings():
    """Clear the current CSV session."""
    global _current_listings
    _current_listings = []
    return {"status": "cleared"}
