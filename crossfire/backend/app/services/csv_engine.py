"""CSV Import/Export engine — handles eBay File Exchange and Seller Hub CSV formats.

Supports:
- eBay Seller Hub active listings report
- eBay File Exchange format
- Generic CSV with flexible column mapping
- Export: adjusted prices for all platforms, eBay Revise CSV
"""

import csv
import io
from typing import Any

from .price_engine import calculate_all_platforms, PLATFORMS

# Map known eBay CSV column headers to our internal field names
COLUMN_MAP: dict[str, str] = {
    # Seller Hub Reports
    "item number": "ebay_item_id",
    "item title": "title",
    "title": "title",
    "custom label": "sku",
    "custom label (sku)": "sku",
    "sku": "sku",
    "available quantity": "quantity",
    "quantity available": "quantity",
    "quantity": "quantity",
    "quantity sold": "quantity_sold",
    "price": "ebay_price",
    "current price": "ebay_price",
    "buy it now price": "ebay_price",
    "start price": "ebay_price",
    "startprice": "ebay_price",
    "condition": "condition",
    "condition id": "condition_id",
    "conditionid": "condition_id",
    "category": "category",
    "category name": "category",
    "category number": "category",
    "description": "description",
    "item description": "description",
    "item url": "ebay_url",
    "view item url": "ebay_url",
    "item id": "ebay_item_id",
    "itemid": "ebay_item_id",
    # File Exchange format
    "*title": "title",
    "*startprice": "ebay_price",
    "*quantity": "quantity",
    "*conditionid": "condition_id",
    "*description": "description",
    "*category": "category",
    "picurl": "photo_url",
    "*action": "action",
    # Weight/dimensions
    "weight": "weight_oz",
    "weight (oz)": "weight_oz",
    "package weight": "weight_oz",
    "length": "length_in",
    "width": "width_in",
    "height": "height_in",
}

# eBay condition IDs to text
CONDITION_MAP = {
    "1000": "New",
    "1500": "New other",
    "1750": "New with defects",
    "2000": "Certified refurbished",
    "2500": "Seller refurbished",
    "3000": "Used",
    "4000": "Very Good",
    "5000": "Good",
    "6000": "Acceptable",
    "7000": "For parts or not working",
}


def _fix_scientific_notation(val: str) -> str:
    """Fix Excel scientific notation for eBay item IDs (2.05216E+11 → 205216000000)."""
    if not val:
        return val
    if "E+" in val.upper() or "e+" in val:
        try:
            return str(int(float(val)))
        except (ValueError, OverflowError):
            return val
    return val


def _detect_header_row(csv_text: str) -> str:
    """Skip eBay metadata rows that appear before the actual header.

    eBay's 'edit price & quantity' template has a metadata row like:
    'filepath,Version=1.0.0,Template= eBay-active-revise...'
    before the real column headers.
    """
    lines = csv_text.split("\n")
    for i, line in enumerate(lines):
        lower = line.lower()
        # Look for known column headers
        if any(h in lower for h in ["item number", "title", "start price", "item title", "*action"]):
            # Return from this line onward
            return "\n".join(lines[i:])
    # No metadata row detected, return as-is
    return csv_text


def parse_ebay_csv(csv_text: str) -> list[dict[str, Any]]:
    """Parse an eBay CSV (any format) into normalized listing dicts."""
    # Skip metadata rows (eBay template headers)
    csv_text = _detect_header_row(csv_text)

    reader = csv.DictReader(io.StringIO(csv_text))
    if reader.fieldnames is None:
        return []

    # Build column mapping for this specific CSV
    col_map = {}
    for header in reader.fieldnames:
        # Normalize: lowercase, strip whitespace and parens
        normalized = header.strip().lower()
        # Remove content in parentheses for matching: "Custom label (SKU)" → "custom label"
        import re
        clean = re.sub(r'\s*\(.*?\)', '', normalized).strip()
        if clean in COLUMN_MAP:
            col_map[header] = COLUMN_MAP[clean]
        elif normalized in COLUMN_MAP:
            col_map[header] = COLUMN_MAP[normalized]

    listings = []
    for row in reader:
        item: dict[str, Any] = {}
        for csv_col, field_name in col_map.items():
            val = row.get(csv_col, "").strip()
            if val:
                item[field_name] = val

        # Skip rows without a title or price
        if "title" not in item or "ebay_price" not in item:
            continue

        # Fix scientific notation on item IDs (Excel mangles large numbers)
        if "ebay_item_id" in item:
            item["ebay_item_id"] = _fix_scientific_notation(item["ebay_item_id"])

        # eBay SKUs often contain the real item ID: "EB-205215666835"
        # If item ID was mangled by scientific notation, extract from SKU
        sku = item.get("sku", "")
        if sku and sku.startswith("EB-"):
            real_id = sku[3:]  # Strip "EB-" prefix
            if real_id.isdigit() and len(real_id) > 10:
                item["ebay_item_id"] = real_id

        # Clean up numeric fields
        price_str = str(item.get("ebay_price", "0"))
        price_str = price_str.replace("$", "").replace(",", "").strip()
        try:
            item["ebay_price"] = float(price_str)
        except ValueError:
            continue

        if item["ebay_price"] <= 0:
            continue

        for int_field in ["quantity", "quantity_sold"]:
            if int_field in item:
                try:
                    item[int_field] = int(float(item[int_field]))  # handle "1.0" etc
                except ValueError:
                    item[int_field] = 1 if int_field == "quantity" else 0

        for float_field in ["weight_oz", "length_in", "width_in", "height_in"]:
            if float_field in item:
                try:
                    item[float_field] = float(item[float_field])
                except ValueError:
                    del item[float_field]

        # Convert condition ID to text
        if "condition_id" in item and "condition" not in item:
            item["condition"] = CONDITION_MAP.get(str(item["condition_id"]), "Used")

        # Default condition
        if "condition" not in item:
            item["condition"] = "Used"

        # Default quantity
        if "quantity" not in item:
            item["quantity"] = 1

        # Clean up: remove "action" field (eBay internal)
        item.pop("action", None)

        listings.append(item)

    return listings


def add_crossfire_prices(
    listings: list[dict[str, Any]],
    cost_basis: float = 0,
    shipping_cost: float = 6.50,
    materials_cost: float = 1.50,
) -> list[dict[str, Any]]:
    """Add calculated prices for all platforms to each listing."""
    enriched = []
    for item in listings:
        ebay_price = item["ebay_price"]
        cb = item.get("cost_basis", cost_basis)
        if isinstance(cb, str):
            try:
                cb = float(cb)
            except ValueError:
                cb = cost_basis

        breakdown = calculate_all_platforms(ebay_price, cb, shipping_cost, materials_cost)

        item["platforms"] = {}
        for platform, fees in breakdown.items():
            item["platforms"][platform] = {
                "list_price": fees.list_price,
                "platform_fee": fees.platform_fee,
                "processing_fee": fees.processing_fee,
                "total_fees": fees.total_fees,
                "net_payout": fees.net_payout,
                "profit": fees.profit,
                "profit_margin": fees.profit_margin,
            }

        enriched.append(item)
    return enriched


def export_crossfire_csv(listings: list[dict[str, Any]]) -> str:
    """Export listings with all platform prices as CSV."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    header = [
        "eBay Item ID", "Title", "SKU", "Condition", "Qty",
        "eBay Price", "eBay Fees", "eBay Net",
        "Square Price", "Square Fees", "Square Net",
        "Mercari Price", "Mercari Fees", "Mercari Net",
        "Poshmark Price", "Poshmark Fees", "Poshmark Net",
        "FB Marketplace Price", "FBMP Fees", "FBMP Net",
        "Etsy Price", "Etsy Fees", "Etsy Net",
        "Profit (from eBay)", "Profit Margin %",
    ]
    writer.writerow(header)

    for item in listings:
        platforms = item.get("platforms", {})
        ebay = platforms.get("ebay", {})
        square = platforms.get("square", {})
        mercari = platforms.get("mercari", {})
        poshmark = platforms.get("poshmark", {})
        fbmp = platforms.get("fbmp", {})
        etsy = platforms.get("etsy", {})

        row = [
            item.get("ebay_item_id", ""),
            item.get("title", ""),
            item.get("sku", ""),
            item.get("condition", ""),
            item.get("quantity", 1),
            f"{item.get('ebay_price', 0):.2f}",
            f"{ebay.get('total_fees', 0):.2f}",
            f"{ebay.get('net_payout', 0):.2f}",
            f"{square.get('list_price', 0):.2f}",
            f"{square.get('total_fees', 0):.2f}",
            f"{square.get('net_payout', 0):.2f}",
            f"{mercari.get('list_price', 0):.2f}",
            f"{mercari.get('total_fees', 0):.2f}",
            f"{mercari.get('net_payout', 0):.2f}",
            f"{poshmark.get('list_price', 0):.2f}",
            f"{poshmark.get('total_fees', 0):.2f}",
            f"{poshmark.get('net_payout', 0):.2f}",
            f"{fbmp.get('list_price', 0):.2f}",
            f"{fbmp.get('total_fees', 0):.2f}",
            f"{fbmp.get('net_payout', 0):.2f}",
            f"{etsy.get('list_price', 0):.2f}",
            f"{etsy.get('total_fees', 0):.2f}",
            f"{etsy.get('net_payout', 0):.2f}",
            f"{ebay.get('profit', 0):.2f}",
            f"{ebay.get('profit_margin', 0)}",
        ]
        writer.writerow(row)

    return output.getvalue()


def export_ebay_revise_csv(
    listings: list[dict[str, Any]],
    price_adjustment: float = 0,
) -> str:
    """Export eBay File Exchange CSV with Action=Revise for price updates.

    price_adjustment: flat amount to add/subtract from current price (0 = no change)
    """
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["*Action", "*ItemID", "*StartPrice", "*Quantity", "CustomLabel"])

    for item in listings:
        item_id = item.get("ebay_item_id")
        if not item_id:
            continue

        price = item.get("ebay_price", 0) + price_adjustment

        row = [
            "Revise",
            item_id,
            f"{price:.2f}",
            item.get("quantity", 1),
            item.get("sku", ""),
        ]
        writer.writerow(row)

    return output.getvalue()


def export_square_csv(listings: list[dict[str, Any]]) -> str:
    """Export Square Online item import CSV.

    Square format: Token, Item Name, Description, Category, SKU,
    Variation Name, Price, Current Quantity, New Quantity,
    Enabled (online), Visibility, Shipping Enabled
    """
    output = io.StringIO()
    writer = csv.writer(output)

    header = [
        "Token", "Item Name", "Description", "Category", "SKU",
        "Variation Name", "Price", "Current Quantity", "New Quantity",
        "Enabled [Online Store]", "Visibility", "Shipping Enabled",
    ]
    writer.writerow(header)

    for item in listings:
        square = item.get("platforms", {}).get("square", {})
        price = square.get("list_price", item.get("ebay_price", 0))

        # Map eBay categories to simpler Square categories
        category = item.get("category", "General")
        if "(" in category:
            category = category.split("(")[0].strip()

        row = [
            "",  # Token — blank for new items
            item.get("title", ""),
            "",  # Description — eBay edit CSV doesn't include it
            category,
            item.get("sku", ""),
            "Regular",
            f"{price:.2f}",
            item.get("quantity", 1),
            item.get("quantity", 1),
            "Y",
            "PUBLIC",
            "Y",
        ]
        writer.writerow(row)

    return output.getvalue()
