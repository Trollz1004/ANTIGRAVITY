"""
countdown_generator.py — Founding Member Countdown Image Generator
Generates countdown urgency images across all platform sizes.
Usage: python countdown_generator.py --spots 97
       python countdown_generator.py --spots 85 --platform instagram-feed
"""
import argparse
import math
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BRAND = {
    "name": "YouAndINotAI",
    "url": "youandinotai.com",
    "bg_dark": "#0F172A",
    "bg_darker": "#0A0F1E",
    "gradient": ["#EF4444", "#EC4899", "#F97316"],
    "text_white": "#FFFFFF",
    "text_light": "#E2E8F0",
    "accent_muted": "#94A3B8",
}

PLATFORMS = {
    "instagram-feed": (1080, 1080),
    "instagram-story": (1080, 1920),
    "tiktok": (1080, 1920),
    "twitter": (1200, 675),
}

SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR.parent / "assets" / "social" / "countdown"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def lerp(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def grad_color(t, colors):
    n = len(colors)
    if t <= 0: return colors[0]
    if t >= 1: return colors[-1]
    seg = t * (n - 1)
    idx = int(seg)
    if idx >= n - 1: return colors[-1]
    return lerp(colors[idx], colors[idx + 1], seg - idx)


def get_font(size, bold=False):
    names = ["arialbd.ttf" if bold else "arial.ttf", "segoeui.ttf"]
    for f in names:
        for d in ["C:/Windows/Fonts", os.path.expanduser("~/AppData/Local/Microsoft/Windows/Fonts")]:
            p = os.path.join(d, f)
            if os.path.exists(p):
                try: return ImageFont.truetype(p, size)
                except: continue
    return ImageFont.load_default()


def draw_gradient_text(img, pos, text, font, colors_hex):
    colors = [hex_to_rgb(c) for c in colors_hex]
    bbox = font.getbbox(text)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    text_img = Image.new("RGBA", (tw + 10, th + 10), (0, 0, 0, 0))
    ImageDraw.Draw(text_img).text((0, 0), text, fill=(255, 255, 255, 255), font=font)
    grad = Image.new("RGBA", (tw + 10, th + 10))
    gd = ImageDraw.Draw(grad)
    for x in range(tw + 10):
        t = x / max(1, tw + 9)
        c = grad_color(t, colors)
        gd.line([(x, 0), (x, th + 10)], fill=(*c, 255))
    _, _, _, a = text_img.split()
    result = Image.composite(grad, Image.new("RGBA", grad.size, (0, 0, 0, 0)), a)
    img.paste(result, pos, result)


def generate_countdown(spots_remaining, platform="all"):
    """Generate countdown image(s) for the given number of remaining spots."""
    platforms = PLATFORMS if platform == "all" else {platform: PLATFORMS[platform]}
    files = []

    for plat_name, size in platforms.items():
        w, h = size
        img = Image.new("RGBA", size, (0, 0, 0, 255))
        draw = ImageDraw.Draw(img)

        # Dark gradient bg
        top, bot = hex_to_rgb(BRAND["bg_darker"]), hex_to_rgb(BRAND["bg_dark"])
        for y in range(h):
            c = lerp(top, bot, y / max(1, h - 1))
            draw.line([(0, y), (w, y)], fill=c)

        # Top gradient bar
        gc = [hex_to_rgb(c) for c in BRAND["gradient"]]
        for x in range(w):
            c = grad_color(x / max(1, w - 1), gc)
            draw.line([(x, 0), (x, 5)], fill=c)

        is_vertical = h > w
        margin = int(w * 0.08)

        # Big number
        num_size = int(w * 0.35) if is_vertical else int(h * 0.45)
        num_font = get_font(num_size, bold=True)
        num_text = str(spots_remaining)
        num_bbox = num_font.getbbox(num_text)
        num_tw = num_bbox[2] - num_bbox[0]
        num_y = int(h * 0.2) if is_vertical else int(h * 0.08)
        draw_gradient_text(img, ((w - num_tw) // 2, num_y), num_text, num_font, BRAND["gradient"])

        # "FOUNDING SPOTS" label
        label_size = int(w * 0.06) if is_vertical else int(h * 0.08)
        label_font = get_font(label_size, bold=True)
        label = "FOUNDING SPOTS"
        lb = label_font.getbbox(label)
        draw.text(
            ((w - (lb[2] - lb[0])) // 2, num_y + int(num_size * 1.1)),
            label, fill=BRAND["text_white"], font=label_font
        )

        # "REMAINING" sub-label
        sub_label = "REMAINING"
        sub_font = get_font(int(label_size * 0.8))
        sb = sub_font.getbbox(sub_label)
        draw.text(
            ((w - (sb[2] - sb[0])) // 2, num_y + int(num_size * 1.1) + int(label_size * 1.4)),
            sub_label, fill=BRAND["accent_muted"], font=sub_font
        )

        # Divider
        div_y = num_y + int(num_size * 1.1) + int(label_size * 3)
        for x in range(margin, w - margin):
            t = (x - margin) / max(1, w - margin * 2)
            c = grad_color(t, gc)
            draw.line([(x, div_y), (x, div_y + 2)], fill=c)

        # Body text
        body_size = int(w * 0.035) if is_vertical else int(h * 0.055)
        body_font = get_font(body_size)
        body_y = div_y + 30
        body_lines = [
            "$14.99/mo — locked FOREVER",
            f"Only {spots_remaining} of 100 spots left",
            "V8 Cloud verified humans only",
        ]
        for i, line in enumerate(body_lines):
            bb = body_font.getbbox(line)
            draw.text(
                ((w - (bb[2] - bb[0])) // 2, body_y + i * int(body_size * 1.5)),
                line, fill=BRAND["text_light"], font=body_font
            )

        # CTA bar
        bar_h = int(h * 0.05)
        for x in range(w):
            c = grad_color(x / max(1, w - 1), gc)
            draw.line([(x, h - bar_h), (x, h)], fill=c)
        url_font = get_font(int(bar_h * 0.5), bold=True)
        ub = url_font.getbbox(BRAND["url"])
        draw.text(
            ((w - (ub[2] - ub[0])) // 2, h - bar_h + int(bar_h * 0.25)),
            BRAND["url"], fill=BRAND["text_white"], font=url_font
        )

        # Brand name
        bf = get_font(int(w * 0.025), bold=True)
        bb2 = bf.getbbox(BRAND["name"])
        draw.text(
            ((w - (bb2[2] - bb2[0])) // 2, h - bar_h - int(w * 0.05)),
            BRAND["name"], fill=BRAND["accent_muted"], font=bf
        )

        # Save
        final = Image.new("RGB", size, hex_to_rgb(BRAND["bg_dark"]))
        final.paste(img, (0, 0), img)
        fname = f"countdown-{spots_remaining}-{plat_name}.png"
        path = OUTPUT_DIR / fname
        final.save(str(path), "PNG", quality=95)
        files.append(str(path))
        print(f"  ✅ {fname} ({w}x{h})")

    return files


def main():
    parser = argparse.ArgumentParser(description="Founding Member Countdown Generator")
    parser.add_argument("--spots", "-s", type=int, required=True, help="Spots remaining (1-100)")
    parser.add_argument("--platform", "-p", default="all",
                        choices=list(PLATFORMS.keys()) + ["all"],
                        help="Target platform (default: all)")
    args = parser.parse_args()

    print(f"🔢 Generating countdown: {args.spots} spots remaining")
    files = generate_countdown(args.spots, args.platform)
    print(f"\n✅ {len(files)} countdown images generated in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
