"""Build the FluidStack 9:16 vertical short cards.

Brand palette taken from the live youandinotai.com CSS:
  orange #ff4f00, black #111111, cream #fffaf2.
"""

from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
ORANGE = (255, 79, 0)
BLACK = (17, 17, 17)
CREAM = (255, 250, 242)

FONTS = "C:/Windows/Fonts"
BOLD = os.path.join(FONTS, "arialbd.ttf")
BLACK_FONT = os.path.join(FONTS, "ariblk.ttf")
REG = os.path.join(FONTS, "arial.ttf")

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cards")
os.makedirs(OUT, exist_ok=True)


def _font(path: str, size: int) -> ImageFont.FreeTypeFont:
    if os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.truetype(BOLD, size)


def wrap(draw: ImageDraw.ImageDraw, text: str, font, max_w: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for word in words:
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def draw_block(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    font,
    x: int,
    y: int,
    fill,
    line_gap: int = 10,
) -> int:
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        bbox = draw.textbbox((x, y), line, font=font)
        y = bbox[3] + line_gap
    return y


def card(
    filename: str,
    kicker: str,
    headline: str,
    body: str,
    bg=CREAM,
    fg=BLACK,
    kicker_color=ORANGE,
    accent_bar=False,
) -> None:
    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)

    # Left accent bar for the "black screen" cards
    if accent_bar:
        d.rectangle([0, 0, 22, H], fill=ORANGE)

    margin = 96
    y = 300

    if kicker:
        kf = _font(BLACK_FONT, 40)
        d.text((margin, y), kicker.upper(), font=kf, fill=kicker_color)
        y += 96

    hf = _font(BLACK_FONT, 104)
    hl = wrap(d, headline.upper(), hf, W - margin * 2)
    y = draw_block(d, hl, hf, margin, y, fg, line_gap=16)

    y += 56
    if body:
        bf = _font(BOLD, 52)
        bl = wrap(d, body, bf, W - margin * 2)
        y = draw_block(d, bl, bf, margin, y, fg, line_gap=20)

    img.save(os.path.join(OUT, filename))
    print("wrote", filename)


# Card 1 - HOOK (orange, matches the site's hero)
card(
    "01_hook.png",
    "YouAndINotAI",
    "3 years of bots. now we found the bot-slayer.",
    "300k role at FluidStack. they are not hiring humans to type.",
    bg=ORANGE,
    fg=CREAM,
    kicker_color=CREAM,
)

# Card 2 - PROBLEM
card(
    "02_problem.png",
    "The problem",
    "Dating apps are 10% humans and 90% bot slop.",
    "Corporate ops: 10% efficiency, 90% busywork.",
    bg=BLACK,
    fg=CREAM,
    kicker_color=ORANGE,
    accent_bar=True,
)

# Card 3 - SOLUTION
card(
    "03_solution.png",
    "The shift",
    "Vibe coding is dead. autonomous infrastructure is here.",
    "Real humans. Bot-Shield verification. No bots, ever.",
    bg=CREAM,
    fg=BLACK,
)

# Card 4 - CTA (orange, matches site CTA)
card(
    "04_cta.png",
    "youandinotai.com",
    "Get verified. get real.",
    "Adults 18 and over.",
    bg=ORANGE,
    fg=CREAM,
    kicker_color=CREAM,
)

print("cards built in", OUT)
