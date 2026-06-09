"""Lead parsing logic."""

from __future__ import annotations

from .models import Lead, ParseResult


def parse_leads(data: list[dict], source: str = "unknown") -> ParseResult:
    """Parse a list of raw dicts into structured Lead objects.

    Args:
        data: List of raw dicts with lead fields.
        source: Origin label for this parsing run.

    Returns:
        ParseResult with successfully parsed leads and any errors.
    """
    leads: list[Lead] = []
    errors: list[str] = []

    for i, record in enumerate(data):
        try:
            lead = Lead(**record)
            leads.append(lead)
        except Exception as exc:
            errors.append(f"Row {i}: {exc}")

    return ParseResult(
        leads=leads,
        source=source,
        total=len(leads),
        errors=errors,
    )