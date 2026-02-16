"""
generate_social_post.py - Dynamic Social Post Generator
Automation pipeline for ongoing branded content creation.
Usage: python generate_social_post.py --platform instagram --text "Your message" --template launch
"""

import argparse
import json
import math
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

BRAND = {
    "name": "YouAndINotAI",
    "tagline": "No Bots. Real Humans. V8 Cloud Verification.",
    "url": "youandinotai.com",
    "handle": "@AiCollab4Kids",
    "bg_dark": "#0F172A",
    "bg_darker": "#0A0F1E",
    "gradient": ["#EF4444", "#EC4899", "#F97316"],
    "accent_light": "#F8FAFC",
    "accent_muted": "#94A3B8",
    "text_white": "#FFFFFF",
    "text_light": "#E2E8F0",
}

PLATFORM_SIZES = {
    "instagram-feed": (1080, 1080),
    "instagram-story": (1080, 1920),
    "tiktok": (1080, 1920),
    "twitter": (1200, 675),
    "pinterest": (1000, 1500),
    "facebook": (1200, 630),
    "linkedin": (1200, 627),
}

SCRIPT_DIR = Path(__file__).parent
ASSETS_DIR = SCRIPT_DIR.parent / "assets"
LOGO_PATH = ASSETS_DIR / "logo" / "logo-watermark-256.png"
OUTPUT_DIR = ASSETS_DIR / "social" / "generated"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def gradient_color(t, colors):
    n = len(colors)
    if t <= 0: return colors[0]
    if t >= 1: return colors[-1]
    segment = t * (n - 1)
    idx = int(segment)
    frac = segment - idx
    if idx >= n - 1: return colors[-1]
    return lerp_color(colors[idx], colors[idx + 1], frac)


def get_font(size, bold=False):
    font_names = [
        "arialbd.ttf" if bold else "arial.ttf",
        "segoeui.ttf",
        "calibrib.ttf" if bold else "calibri.ttf",
    ]
    for f in font_names:
        for d in ["C:/Windows/Fonts", os.path.expanduser("~/AppData/Local/Microsoft/Windows/Fonts")]:
            path = os.path.join(d, f)
            if os.path.exists(path):
                try:
                    return ImageFont.truetype(path, size)
                except:
                    continue
    return ImageFont.load_default()


def wrap_text(text, font, max_width):
    words = text.split()
    lines, current = [], ""
    for word in words:
        test = f"{current} {word}".strip()
        bbox = font.getbbox(test)
        if bbox[2] - bbox[0] <= max_width:
            current = test
        else:
            if current: lines.append(current)
            current = word
    if current: lines.append(current)
    return lines


def draw_gradient_text(img, position, text, font, colors_hex):
    from PIL import Image as PILImage
    colors = [hex_to_rgb(c) for c in colors_hex]
    bbox = font.getbbox(text)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    text_img = PILImage.new("RGBA", (tw + 10, th + 10), (0, 0, 0, 0))
    text_draw = ImageDraw.Draw(text_img)
    text_draw.text((0, 0), text, fill=(255, 255, 255, 255), font=font)
    
    grad = PILImage.new("RGBA", (tw + 10, th + 10))
    grad_draw = ImageDraw.Draw(grad)
    for x in range(tw + 10):
        t = x / max(1, tw + 9)
        c = gradient_color(t, colors)
        grad_draw.line([(x, 0), (x, th + 10)], fill=(*c, 255))
    
    r, g, b, a = text_img.split()
    result = PILImage.composite(grad, PILImage.new("RGBA", grad.size, (0, 0, 0, 0)), a)
    img.paste(result, position, result)


def generate_post(platform, headline, body="", emoji="🚀", output_name=None):
    """Generate a branded social media post."""
    size = PLATFORM_SIZES.get(platform, (1080, 1080))
    img = Image.new("RGBA", size, (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    # Dark gradient background
    bg_top = hex_to_rgb(BRAND["bg_darker"])
    bg_bot = hex_to_rgb(BRAND["bg_dark"])
    for y in range(size[1]):
        t = y / max(1, size[1] - 1)
        c = lerp_color(bg_top, bg_bot, t)
        draw.line([(0, y), (size[0], y)], fill=c)

    # Top gradient accent bar
    grad_colors = [hex_to_rgb(c) for c in BRAND["gradient"]]
    for x in range(size[0]):
        t = x / max(1, size[0] - 1)
        c = gradient_color(t, grad_colors)
        draw.line([(x, 0), (x, 4)], fill=c)

    margin = int(size[0] * 0.07)
    is_vertical = size[1] > size[0]

    # Emoji
    emoji_size = 72 if is_vertical else 48
    emoji_font = get_font(emoji_size)
    draw.text((margin, int(size[1] * 0.1)), emoji, font=emoji_font, fill=BRAND["text_white"])

    # Headline
    headline_size = int(size[0] * 0.075) if is_vertical else int(size[0] * 0.04)
    headline_font = get_font(headline_size, bold=True)
    headline_y = int(size[1] * 0.18) if is_vertical else int(size[1] * 0.25)
    
    for i, line in enumerate(headline.split("\n")):
        if is_vertical:
            bbox = headline_font.getbbox(line)
            tw = bbox[2] - bbox[0]
            x = (size[0] - tw) // 2
        else:
            x = margin
        draw_gradient_text(img, (x, headline_y + i * int(headline_size * 1.3)), line, headline_font, BRAND["gradient"])

    # Body text
    if body:
        body_size = int(size[0] * 0.035) if is_vertical else int(size[0] * 0.025)
        body_font = get_font(body_size)
        body_lines = headline.count("\n") + 1
        body_y = headline_y + body_lines * int(headline_size * 1.3) + int(size[1] * 0.05)
        
        for i, line in enumerate(body.split("\n")):
            wrapped = wrap_text(line, body_font, size[0] - margin * 2)
            for j, wl in enumerate(wrapped):
                draw.text((margin, body_y + (i + j) * int(body_size * 1.4)), wl, fill=BRAND["text_light"], font=body_font)

    # Bottom CTA bar
    bar_h = int(size[1] * 0.05)
    for x in range(size[0]):
        t = x / max(1, size[0] - 1)
        c = gradient_color(t, grad_colors)
        draw.line([(x, size[1] - bar_h), (x, size[1])], fill=c)
    
    url_font = get_font(int(bar_h * 0.5), bold=True)
    url_bbox = url_font.getbbox(BRAND["url"])
    url_tw = url_bbox[2] - url_bbox[0]
    draw.text(
        ((size[0] - url_tw) // 2, size[1] - bar_h + int(bar_h * 0.2)),
        BRAND["url"],
        fill=BRAND["text_white"],
        font=url_font,
    )

    # Logo watermark
    if LOGO_PATH.exists():
        logo = Image.open(str(LOGO_PATH)).convert("RGBA")
        wm_size = int(min(size) * 0.08)
        logo = logo.resize((wm_size, wm_size), Image.LANCZOS)
        alpha = logo.split()[3].point(lambda p: int(p * 0.5))
        logo.putalpha(alpha)
        wm_margin = int(wm_size * 0.5)
        img.paste(logo, (size[0] - wm_size - wm_margin, size[1] - bar_h - wm_size - wm_margin), logo)

    # Save
    final = Image.new("RGB", size, hex_to_rgb(BRAND["bg_dark"]))
    final.paste(img, (0, 0), img)

    if not output_name:
        import time
        output_name = f"{platform}-{int(time.time())}"
    
    path = OUTPUT_DIR / f"{output_name}.png"
    final.save(str(path), "PNG", quality=95)
    print(f"✅ Generated: {path}")
    return str(path)


def main():
    parser = argparse.ArgumentParser(description="YouAndINotAI Social Post Generator")
    parser.add_argument("--platform", "-p", required=True, choices=list(PLATFORM_SIZES.keys()),
                        help="Target platform")
    parser.add_argument("--headline", "-t", required=True, help="Main headline text (use \\n for line breaks)")
    parser.add_argument("--body", "-b", default="", help="Body text")
    parser.add_argument("--emoji", "-e", default="🚀", help="Accent emoji")
    parser.add_argument("--output", "-o", default=None, help="Output filename (without extension)")
    
    args = parser.parse_args()
    headline = args.headline.replace("\\n", "\n")
    body = args.body.replace("\\n", "\n")
    
    generate_post(args.platform, headline, body, args.emoji, args.output)


if __name__ == "__main__":
    main()
