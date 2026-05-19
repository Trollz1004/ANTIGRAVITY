#!/usr/bin/env python3
"""
OPU-68: Generate an SVG coverage badge from coverage.xml.

Reads coverage.xml (Cobertura format) and produces a simple SVG badge
showing the overall line coverage percentage.

Usage:
    python scripts/generate_coverage_badge.py

Output:
    backend/fastapi-app/coverage-badge.svg
"""

from __future__ import annotations

import os
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
COVERAGE_XML = PROJECT_ROOT / "coverage.xml"
BADGE_SVG = PROJECT_ROOT / "coverage-badge.svg"

# Badge colour thresholds
COLOUR_RANGES = [
    (90, "#4c1"),   # bright green
    (80, "#97ca00"), # green
    (70, "#a4a61d"), # yellow-green
    (60, "#dfb317"), # yellow
    (50, "#fe7d37"), # orange
    (0,  "#e05d44"), # red
]


def parse_coverage(xml_path: Path) -> float:
    """Parse a Cobertura coverage.xml and return line-rate as percentage."""
    if not xml_path.exists():
        raise FileNotFoundError(f"coverage.xml not found at {xml_path}")

    tree = ET.parse(str(xml_path))
    root = tree.getroot()

    # Cobertura root element has a 'line-rate' attribute (0.0–1.0)
    line_rate = root.attrib.get("line-rate")
    if line_rate is None:
        # Fallback: compute from lines-covered / lines-valid
        covered = float(root.attrib.get("lines-covered", 0))
        valid = float(root.attrib.get("lines-valid", 0))
        if valid == 0:
            raise ValueError("coverage.xml reports 0 valid lines")
        line_rate = covered / valid
    else:
        line_rate = float(line_rate)

    return line_rate * 100.0


def colour_for(pct: float) -> str:
    for threshold, colour in COLOUR_RANGES:
        if pct >= threshold:
            return colour
    return COLOUR_RANGES[-1][1]


def generate_svg(pct: float) -> str:
    """Return SVG badge string for the given coverage percentage."""
    pct_text = f"{pct:.1f}%"
    colour = colour_for(pct)

    # Fixed-width badge: left "coverage" label, right percentage
    left_width = 70
    right_width = max(40, len(pct_text) * 7 + 10)
    total_width = left_width + right_width
    centre_x = left_width
    text_anchor_x = left_width + right_width // 2

    return f"""\
<svg xmlns="http://www.w3.org/2000/svg" width="{total_width}" height="20" role="img" aria-label="Coverage: {pct_text}">
  <title>Coverage: {pct_text}</title>
  <linearGradient id="smooth" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="round">
    <rect width="{total_width}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#round)">
    <rect width="{left_width}" height="20" fill="#555"/>
    <rect x="{left_width}" width="{right_width}" height="20" fill="{colour}"/>
    <rect width="{total_width}" height="20" fill="url(#smooth)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="{centre_x // 2}" y="14">coverage</text>
    <text x="{text_anchor_x}" y="14">{pct_text}</text>
  </g>
</svg>
"""


def main() -> int:
    try:
        pct = parse_coverage(COVERAGE_XML)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"ERROR parsing coverage.xml: {exc}", file=sys.stderr)
        return 1

    svg = generate_svg(pct)
    BADGE_SVG.write_text(svg, encoding="utf-8")
    print(f"Coverage badge generated: {BADGE_SVG} ({pct:.1f}%)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
