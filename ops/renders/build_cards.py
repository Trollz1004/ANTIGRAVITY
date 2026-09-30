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
    """Wrap text to max_w, shrinking any single word too wide to fit.

    A word wider than max_w cannot be wrapped by word boundaries: the old
    version emitted it whole and it ran off the right edge of the card, which
    is what happened to INFRASTRUCTURE on 03_solution.png. Such a word is
    split in two so both halves fit; if even one character cannot fit, the
    word is left intact rather than mangled.
    """
    words = text.split()
    lines: list[str] = []
    cur = ""

    def fits(candidate: str) -> bool:
        return draw.textlength(candidate, font=font) <= max_w

    for word in words:
        trial = f"{cur} {word}".strip()
        if fits(trial):
            cur = trial
            continue

        if cur:
            lines.append(cur)
            cur = ""

        # The word alone may exceed the line. Break it at the widest prefix
        # that still fits, so nothing is ever drawn past max_w.
        if not fits(word):
            remainder = word
            while remainder and not fits(remainder):
                split_at = len(remainder) - 1
                while split_at > 1 and not fits(remainder[:split_at]):
                    split_at -= 1
                if split_at <= 1:
                    break  # cannot fit even two characters; give up cleanly
                lines.append(remainder[:split_at])
                remainder = remainder[split_at:]
            cur = remainder
        else:
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


def fitted_font(draw, text: str, path: str, size: int, max_w: int, floor: int = 56):
    """Largest font <= size at which no single word of text exceeds max_w.

    wrap() breaks an oversized word mid-word so nothing is ever clipped, but a
    marketing card reading "INFRASTRUCT / URE IS HERE" is worse than a slightly
    smaller font. Shrinking the type keeps every word whole. The floor stops the
    size collapsing on pathological input; wrap() still guarantees no clipping
    below it.
    """
    words = text.upper().split()
    while size > floor:
        font = _font(path, size)
        if all(draw.textlength(w, font=font) <= max_w for w in words):
            return font
        size -= 4
    return _font(path, floor)


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

    hf = fitted_font(d, headline, BLACK_FONT, 104, W - margin * 2)
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
