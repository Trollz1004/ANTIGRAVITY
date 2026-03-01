"""Shipping calculator — USPS Ground Advantage from 32776 (Josh's FL zip).

Default: USPS Ground Advantage on everything. Simple weight-based estimates.
"""

from ..schemas import ShippingCalcResponse

ORIGIN_ZIP = "32776"
DEFAULT_SERVICE = "USPS Ground Advantage"

# USPS Ground Advantage approximate rates (2026, from 32776 FL)
# These are estimates — actual rates vary by zone/distance
GROUND_ADVANTAGE_RATES = [
    # (max_oz, rate)
    (4, 4.75),      # up to 4 oz
    (8, 5.25),      # up to 8 oz
    (12, 5.75),     # up to 12 oz (under 1 lb)
    (16, 6.50),     # up to 1 lb
    (32, 7.50),     # up to 2 lb
    (48, 8.75),     # up to 3 lb
    (64, 10.50),    # up to 4 lb
    (80, 12.00),    # up to 5 lb
    (160, 15.50),   # up to 10 lb
    (320, 22.00),   # up to 20 lb
    (1120, 35.00),  # up to 70 lb (max)
]

# Flat rate options (always available regardless of weight)
FLAT_RATES = {
    "small_flat_rate_box": {"price": 10.40, "max_weight": 1120, "label": "Small Flat Rate Box"},
    "medium_flat_rate_box": {"price": 16.10, "max_weight": 1120, "label": "Medium Flat Rate Box"},
    "large_flat_rate_box": {"price": 22.80, "max_weight": 1120, "label": "Large Flat Rate Box"},
    "padded_flat_rate": {"price": 10.90, "max_weight": 1120, "label": "Padded Flat Rate Envelope"},
}


def estimate_ground_advantage(weight_oz: float) -> float:
    """Get estimated USPS Ground Advantage rate by weight."""
    for max_oz, rate in GROUND_ADVANTAGE_RATES:
        if weight_oz <= max_oz:
            return rate
    return 35.00  # Max rate


def calculate_shipping(
    weight_oz: float,
    length_in: float = 10.0,
    width_in: float = 8.0,
    height_in: float = 4.0,
    dest_zip: str = "90210",
) -> ShippingCalcResponse:
    """Calculate shipping cost. Always USPS Ground Advantage from 32776."""
    cost = estimate_ground_advantage(weight_oz)

    # Delivery estimate: FL to anywhere is typically 2-5 business days Ground Advantage
    delivery = "2-5 business days"

    return ShippingCalcResponse(
        carrier="USPS",
        service="Ground Advantage",
        origin_zip=ORIGIN_ZIP,
        dest_zip=dest_zip,
        weight_oz=weight_oz,
        estimated_cost=cost,
        delivery_days=delivery,
    )


def best_rate(weight_oz: float, dest_zip: str = "90210") -> dict:
    """Compare Ground Advantage vs flat rate — return cheapest option."""
    ground = estimate_ground_advantage(weight_oz)
    options = [{"service": "Ground Advantage", "cost": ground}]

    for key, fr in FLAT_RATES.items():
        if weight_oz <= fr["max_weight"]:
            options.append({"service": fr["label"], "cost": fr["price"]})

    options.sort(key=lambda x: x["cost"])
    return {
        "cheapest": options[0],
        "all_options": options,
    }
