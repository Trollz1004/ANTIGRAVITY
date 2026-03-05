"""Price engine — calculates fees and suggested prices across all platforms.

Usage:
    from app.services.price_engine import calculate_all_platforms
    result = calculate_all_platforms(ebay_price=49.99, cost_basis=10.00)
"""

from ..schemas import FeeBreakdown

# Fee structures as of March 2026
PLATFORMS = {
    "ebay": {
        "label": "eBay",
        "fvf_pct": 0.1325,       # 13.25% final value fee (most categories)
        "per_order": 0.30,        # $0.30 per order
    },
    "mercari": {
        "label": "Mercari",
        "seller_pct": 0.10,       # 10% seller fee
        "processing_pct": 0.029,  # 2.9% payment processing
        "processing_flat": 0.30,  # + $0.30
    },
    "poshmark": {
        "label": "Poshmark",
        "flat_fee": 2.95,         # $2.95 for sales under $15
        "pct_fee": 0.20,          # 20% for sales $15+
        "threshold": 15.0,
    },
    "fbmp": {
        "label": "FB Marketplace",
        "selling_pct": 0.05,      # 5% (shipped items)
        "selling_min": 0.40,      # $0.40 minimum
        "local_fee": 0.0,         # Free for local pickup
    },
    "etsy": {
        "label": "Etsy",
        "listing_fee": 0.20,      # $0.20 per listing
        "transaction_pct": 0.065, # 6.5% transaction fee
        "processing_pct": 0.03,   # 3% payment processing
        "processing_flat": 0.25,  # + $0.25
    },
    "square": {
        "label": "Square Online",
        "processing_pct": 0.029,  # 2.9% payment processing
        "processing_flat": 0.30,  # + $0.30
        # No marketplace/platform fee — just payment processing
    },
}


def calculate_fees(platform: str, sale_price: float, cost_basis: float = 0) -> FeeBreakdown:
    """Calculate exact fees and profit for a sale price on any platform."""
    fees = PLATFORMS[platform]
    platform_fee = 0.0
    processing_fee = 0.0

    if platform == "ebay":
        platform_fee = sale_price * fees["fvf_pct"]
        processing_fee = fees["per_order"]

    elif platform == "mercari":
        platform_fee = sale_price * fees["seller_pct"]
        processing_fee = sale_price * fees["processing_pct"] + fees["processing_flat"]

    elif platform == "poshmark":
        if sale_price < fees["threshold"]:
            platform_fee = fees["flat_fee"]
        else:
            platform_fee = sale_price * fees["pct_fee"]

    elif platform == "fbmp":
        platform_fee = max(sale_price * fees["selling_pct"], fees["selling_min"])

    elif platform == "etsy":
        platform_fee = fees["listing_fee"] + sale_price * fees["transaction_pct"]
        processing_fee = sale_price * fees["processing_pct"] + fees["processing_flat"]

    elif platform == "square":
        # Square Online: no platform fee, just payment processing
        processing_fee = sale_price * fees["processing_pct"] + fees["processing_flat"]

    total_fees = round(platform_fee + processing_fee, 2)
    net_payout = round(sale_price - total_fees, 2)
    profit = round(net_payout - cost_basis, 2)
    margin = round((profit / sale_price * 100) if sale_price > 0 else 0, 1)

    return FeeBreakdown(
        platform=platform,
        list_price=round(sale_price, 2),
        platform_fee=round(platform_fee, 2),
        processing_fee=round(processing_fee, 2),
        total_fees=total_fees,
        net_payout=net_payout,
        profit=profit,
        profit_margin=margin,
    )


def suggest_price(platform: str, desired_net: float) -> float:
    """What do you need to list at to NET a specific amount after fees?"""
    price = desired_net
    for _ in range(50):
        breakdown = calculate_fees(platform, price)
        if breakdown.net_payout >= desired_net - 0.01:
            return round(price, 2)
        price += (desired_net - breakdown.net_payout) * 1.05
    return round(price, 2)


def calculate_all_platforms(
    ebay_price: float,
    cost_basis: float = 0,
    shipping_cost: float = 6.50,
    materials_cost: float = 1.50,
) -> dict[str, FeeBreakdown]:
    """Show what to list at on EVERY platform.

    eBay: BUYER pays shipping — don't deduct shipping from eBay profit.
    Other platforms: FREE SHIPPING — shipping + materials baked into price.
    All other platforms priced so Josh nets the same profit as eBay.
    """
    total_ship = shipping_cost + materials_cost

    # eBay: buyer pays shipping, so cost_basis does NOT include shipping
    ebay = calculate_fees("ebay", ebay_price, cost_basis)

    # Other platforms: free shipping, must cover shipping + materials
    # Target: same profit as eBay, but they also eat the shipping cost
    # ebay.profit = ebay.net_payout - cost_basis
    # other.profit should = ebay.profit
    # other.net_payout - cost_basis - total_ship = ebay.profit
    # other.net_payout = ebay.profit + cost_basis + total_ship = ebay.net_payout + total_ship
    target_other_net = ebay.net_payout + total_ship

    results = {"ebay": ebay}
    for p in ["mercari", "poshmark", "fbmp", "etsy", "square"]:
        suggested = suggest_price(p, target_other_net)
        results[p] = calculate_fees(p, suggested, cost_basis + total_ship)

    return results
