"""
YouAndINotAI - Visual Asset Generation Pipeline
Generates logo, social media assets, and brand templates.
Coordinated by Opus CLI for deployment to Instagram, TikTok, Pinterest.
"""

import json
import math
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

# ─── BRAND CONFIG ────────────────────────────────────────────────────────────
BRAND = {
    "name": "YouAndINotAI",
    "tagline": "No Bots. Real Humans. V8 Cloud Verification.",
    "url": "youandinotai.com",
    "handle": "@YouAndiNotAi",
    "bg_dark": "#0F172A",
    "bg_darker": "#0A0F1E",
    "gradient": ["#EF4444", "#EC4899", "#F97316"],
    "accent_light": "#F8FAFC",
    "accent_muted": "#94A3B8",
    "text_white": "#FFFFFF",
    "text_light": "#E2E8F0",
}

BASE_DIR = Path(__file__).parent
LOGO_DIR = BASE_DIR / "logo"
SOCIAL_DIR = BASE_DIR / "social"
SCRIPTS_DIR = BASE_DIR.parent / "scripts"

# Create directories
for d in [
    LOGO_DIR,
    SOCIAL_DIR / "instagram-feed",
    SOCIAL_DIR / "instagram-stories",
    SOCIAL_DIR / "tiktok",
    SOCIAL_DIR / "twitter",
    SOCIAL_DIR / "pinterest",
]:
    d.mkdir(parents=True, exist_ok=True)

manifest = {"generated_at": "2026-02-15T23:00:00-05:00", "assets": []}


def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def gradient_color(t, colors):
    """Get color from multi-stop gradient at position t (0-1)."""
    n = len(colors)
    if t <= 0:
        return colors[0]
    if t >= 1:
        return colors[-1]
    segment = t * (n - 1)
    idx = int(segment)
    frac = segment - idx
    if idx >= n - 1:
        return colors[-1]
    return lerp_color(colors[idx], colors[idx + 1], frac)


def draw_gradient_rect(draw, bbox, colors_hex, direction="horizontal"):
    """Draw a gradient-filled rectangle."""
    colors = [hex_to_rgb(c) for c in colors_hex]
    x1, y1, x2, y2 = bbox
    if direction == "horizontal":
        for x in range(x1, x2):
            t = (x - x1) / max(1, (x2 - x1))
            c = gradient_color(t, colors)
            draw.line([(x, y1), (x, y2)], fill=c)
    else:
        for y in range(y1, y2):
            t = (y - y1) / max(1, (y2 - y1))
            c = gradient_color(t, colors)
            draw.line([(x1, y), (x2, y)], fill=c)


def create_gradient_image(size, colors_hex, direction="vertical"):
    """Create a full gradient image."""
    img = Image.new("RGBA", size)
    draw = ImageDraw.Draw(img)
    colors = [hex_to_rgb(c) for c in colors_hex]
    w, h = size
    if direction == "vertical":
        for y in range(h):
            t = y / max(1, h - 1)
            c = gradient_color(t, colors)
            draw.line([(0, y), (w, y)], fill=(*c, 255))
    else:
        for x in range(w):
            t = x / max(1, w - 1)
            c = gradient_color(t, colors)
            draw.line([(x, 0), (x, h)], fill=(*c, 255))
    return img


def get_font(size, bold=False):
    """Try to load Outfit or fall back to a good system font."""
    font_names = [
        "Outfit-Bold.ttf" if bold else "Outfit-Regular.ttf",
        "outfit-bold.ttf" if bold else "outfit-regular.ttf",
        "arialbd.ttf" if bold else "arial.ttf",
        "segoeui.ttf",
        "calibrib.ttf" if bold else "calibri.ttf",
    ]
    font_dirs = [
        "C:/Windows/Fonts",
        os.path.expanduser("~/AppData/Local/Microsoft/Windows/Fonts"),
    ]
    for d in font_dirs:
        for f in font_names:
            path = os.path.join(d, f)
            if os.path.exists(path):
                try:
                    return ImageFont.truetype(path, size)
                except Exception:
                    continue
    # Absolute fallback
    try:
        return ImageFont.truetype("arial.ttf", size)
    except Exception:
        return ImageFont.load_default()


# ═══════════════════════════════════════════════════════════════════════════════
# PRIORITY 1: LOGO GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

def generate_fingerprint_logo(size=1024):
    """Generate a fingerprint logo with heart center using gradient colors."""
    print(f"  🎨 Generating fingerprint logo at {size}x{size}...")
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2
    max_radius = int(size * 0.42)
    grad_colors = [hex_to_rgb(c) for c in BRAND["gradient"]]

    # Draw circular fingerprint ridges
    num_rings = 28
    ring_width = max(2, size // 200)

    for i in range(num_rings):
        t = i / max(1, num_rings - 1)
        radius = int(max_radius * 0.15 + max_radius * 0.85 * t)
        color = gradient_color(t, grad_colors)

        # Create fingerprint-like distortion
        points = []
        num_points = 360
        for angle_idx in range(num_points):
            angle = (angle_idx / num_points) * 2 * math.pi
            # Add organic wobble
            wobble = math.sin(angle * 3 + i * 0.5) * (radius * 0.06)
            wobble += math.sin(angle * 7 + i * 1.2) * (radius * 0.02)

            # Heart distortion in center region
            if t < 0.6:
                heart_t = angle - math.pi / 2
                heart_r = (
                    math.sin(heart_t) * math.sqrt(abs(math.cos(heart_t)))
                    / (math.sin(heart_t) + 1.4)
                    - 2 * math.sin(heart_t)
                    + 2
                )
                heart_influence = (1 - t / 0.6) * 0.15
                wobble += heart_r * radius * heart_influence * 0.1

            r = radius + wobble
            px = int(cx + r * math.cos(angle))
            py = int(cy + r * math.sin(angle))
            points.append((px, py))

        # Draw ring with gaps (fingerprint style)
        gap_size = 15 + int(i * 2)
        for j in range(0, len(points) - 1):
            # Create natural gaps in the ridges
            gap_phase = math.sin(j * 0.08 + i * 1.7)
            if gap_phase > 0.3:  # Skip some segments for gaps
                continue
            alpha = int(255 * (0.6 + 0.4 * (1 - abs(gap_phase))))
            draw.line(
                [points[j], points[(j + 1) % len(points)]],
                fill=(*color, alpha),
                width=ring_width,
            )

    # Draw heart shape in center with glow
    heart_size = int(max_radius * 0.28)
    heart_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    heart_draw = ImageDraw.Draw(heart_img)

    heart_points = []
    for angle_idx in range(360):
        t_angle = math.radians(angle_idx)
        # Heart parametric equation
        x = 16 * math.sin(t_angle) ** 3
        y = -(
            13 * math.cos(t_angle)
            - 5 * math.cos(2 * t_angle)
            - 2 * math.cos(3 * t_angle)
            - math.cos(4 * t_angle)
        )
        scale = heart_size / 18
        heart_points.append((int(cx + x * scale), int(cy + y * scale - heart_size * 0.1)))

    if len(heart_points) > 2:
        # Glow effect
        for glow in range(5, 0, -1):
            glow_alpha = int(40 * (1 - glow / 5))
            glow_color = (*hex_to_rgb(BRAND["gradient"][1]), glow_alpha)
            glow_points = []
            for px, py in heart_points:
                dx, dy = px - cx, py - cy
                dist = math.sqrt(dx * dx + dy * dy)
                if dist > 0:
                    expand = 1 + glow * 0.06
                    glow_points.append((int(cx + dx * expand), int(cy + dy * expand)))
                else:
                    glow_points.append((px, py))
            heart_draw.polygon(glow_points, fill=glow_color)

        # Solid heart with gradient
        heart_draw.polygon(heart_points, fill=(*hex_to_rgb(BRAND["gradient"][1]), 220))

    img = Image.alpha_composite(img, heart_img)

    # Add subtle outer glow ring
    glow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    outer_r = int(max_radius * 1.05)
    for g in range(8, 0, -1):
        r = outer_r + g * 3
        alpha = int(20 * (1 - g / 8))
        glow_draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            outline=(*hex_to_rgb(BRAND["gradient"][0]), alpha),
            width=2,
        )
    img = Image.alpha_composite(glow_layer, img)

    return img


def export_logo(logo_img):
    """Export logo in all required sizes and formats."""
    print("  📦 Exporting logo variants...")
    sizes = {
        "app-icon-1024": (1024, 1024),
        "social-profile-400": (400, 400),
        "favicon-32": (32, 32),
        "og-image-1200x630": (1200, 630),
        "watermark-256": (256, 256),
    }
    files = []

    # PNG transparent
    for name, sz in sizes.items():
        if name == "og-image-1200x630":
            # OG image gets dark background with centered logo
            og = Image.new("RGBA", sz, hex_to_rgb(BRAND["bg_dark"]) + (255,))
            logo_h = int(sz[1] * 0.7)
            resized = logo_img.resize((logo_h, logo_h), Image.LANCZOS)
            offset_x = (sz[0] - logo_h) // 2
            offset_y = (sz[1] - logo_h) // 2
            og.paste(resized, (offset_x, offset_y), resized)

            # Add brand text
            draw = ImageDraw.Draw(og)
            font_lg = get_font(42, bold=True)
            font_sm = get_font(22)
            text_x = offset_x + logo_h + 30
            if text_x + 200 < sz[0]:
                draw.text((text_x, sz[1] // 2 - 40), BRAND["name"], fill=BRAND["text_white"], font=font_lg)
                draw.text((text_x, sz[1] // 2 + 15), BRAND["tagline"], fill=BRAND["accent_muted"], font=font_sm)

            path = LOGO_DIR / f"logo-{name}.png"
            og.save(str(path), "PNG")
        else:
            resized = logo_img.resize(sz, Image.LANCZOS)
            path = LOGO_DIR / f"logo-{name}.png"
            resized.save(str(path), "PNG")
        files.append(str(path))
        print(f"    ✅ {path.name}")

    # Dark background variant
    for name, sz in [("dark-bg-512", (512, 512)), ("dark-bg-256", (256, 256))]:
        bg = Image.new("RGBA", sz, hex_to_rgb(BRAND["bg_dark"]) + (255,))
        margin = int(sz[0] * 0.1)
        logo_sz = sz[0] - margin * 2
        resized = logo_img.resize((logo_sz, logo_sz), Image.LANCZOS)
        bg.paste(resized, (margin, margin), resized)
        path = LOGO_DIR / f"logo-{name}.png"
        bg.save(str(path), "PNG")
        files.append(str(path))
        print(f"    ✅ {path.name}")

    # Light background variant
    for name, sz in [("light-bg-512", (512, 512))]:
        bg = Image.new("RGBA", sz, (248, 250, 252, 255))
        margin = int(sz[0] * 0.1)
        logo_sz = sz[0] - margin * 2
        resized = logo_img.resize((logo_sz, logo_sz), Image.LANCZOS)
        bg.paste(resized, (margin, margin), resized)
        path = LOGO_DIR / f"logo-{name}.png"
        bg.save(str(path), "PNG")
        files.append(str(path))
        print(f"    ✅ {path.name}")

    return files


# ═══════════════════════════════════════════════════════════════════════════════
# PRIORITY 2: SOCIAL MEDIA TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════════

def draw_dark_bg(img, draw):
    """Fill with premium dark gradient background."""
    w, h = img.size
    bg_top = hex_to_rgb(BRAND["bg_darker"])
    bg_bot = hex_to_rgb(BRAND["bg_dark"])
    for y in range(h):
        t = y / max(1, h - 1)
        c = lerp_color(bg_top, bg_bot, t)
        draw.line([(0, y), (w, y)], fill=c)


def draw_gradient_bar(draw, y, w, h, colors_hex):
    """Draw a horizontal gradient accent bar."""
    colors = [hex_to_rgb(c) for c in colors_hex]
    for x in range(w):
        t = x / max(1, w - 1)
        c = gradient_color(t, colors)
        draw.line([(x, y), (x, y + h)], fill=c)


def draw_gradient_text(img, position, text, font, colors_hex):
    """Draw text with gradient fill."""
    # Create text mask
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    text_img = Image.new("RGBA", (tw + 10, th + 10), (0, 0, 0, 0))
    text_draw = ImageDraw.Draw(text_img)
    text_draw.text((0, 0), text, fill=(255, 255, 255, 255), font=font)

    # Create gradient
    grad = create_gradient_image((tw + 10, th + 10), colors_hex, "horizontal")

    # Composite using text as mask
    r, g, b, a = text_img.split()
    result = Image.composite(grad, Image.new("RGBA", grad.size, (0, 0, 0, 0)), a)

    img.paste(result, position, result)


def add_watermark(img, logo_small):
    """Add logo watermark to bottom-right corner."""
    w, h = img.size
    wm_size = int(min(w, h) * 0.08)
    wm = logo_small.resize((wm_size, wm_size), Image.LANCZOS)
    # Make semi-transparent
    wm_data = wm.copy()
    alpha = wm_data.split()[3]
    alpha = alpha.point(lambda p: int(p * 0.5))
    wm_data.putalpha(alpha)
    margin = int(wm_size * 0.5)
    img.paste(wm_data, (w - wm_size - margin, h - wm_size - margin), wm_data)


def add_cta_bar(draw, img_size, font_sm):
    """Add CTA URL bar at bottom."""
    w, h = img_size
    bar_h = int(h * 0.06)
    # Gradient bar
    colors = [hex_to_rgb(c) for c in BRAND["gradient"]]
    for x in range(w):
        t = x / max(1, w - 1)
        c = gradient_color(t, colors)
        draw.line([(x, h - bar_h), (x, h)], fill=c)
    # URL text centered
    text = BRAND["url"]
    bbox = font_sm.getbbox(text)
    tw = bbox[2] - bbox[0]
    draw.text(
        ((w - tw) // 2, h - bar_h + (bar_h - (bbox[3] - bbox[1])) // 2),
        text,
        fill=BRAND["text_white"],
        font=font_sm,
    )


def draw_stat_card(draw, x, y, w, h, stat, label, colors_hex):
    """Draw a stat card with gradient border."""
    # Card background
    draw.rounded_rectangle([x, y, x + w, y + h], radius=12, fill=(15, 23, 42, 200))
    # Gradient top border
    colors = [hex_to_rgb(c) for c in colors_hex]
    for bx in range(x, x + w):
        t = (bx - x) / max(1, w - 1)
        c = gradient_color(t, colors)
        draw.line([(bx, y), (bx, y + 3)], fill=c)
    # Text
    font_stat = get_font(int(h * 0.4), bold=True)
    font_label = get_font(int(h * 0.18))
    stat_bbox = font_stat.getbbox(stat)
    label_bbox = font_label.getbbox(label)
    draw.text(
        (x + (w - (stat_bbox[2] - stat_bbox[0])) // 2, y + int(h * 0.15)),
        stat,
        fill=BRAND["text_white"],
        font=font_stat,
    )
    draw.text(
        (x + (w - (label_bbox[2] - label_bbox[0])) // 2, y + int(h * 0.62)),
        label,
        fill=BRAND["accent_muted"],
        font=font_label,
    )


def wrap_text(text, font, max_width):
    """Word wrap text to fit within max_width."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        bbox = font.getbbox(test)
        if bbox[2] - bbox[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


# ─── INSTAGRAM FEED POSTS ────────────────────────────────────────────────────

INSTAGRAM_TEMPLATES = [
    {
        "id": "launch",
        "headline": "$14.99",
        "subhead": "FOUNDING MEMBER\nFOREVER PRICE",
        "body": "Lock in the lowest price ever.\nFirst 100 members only.",
        "accent": "🚀",
    },
    {
        "id": "v8-cloud",
        "headline": "V8 CLOUD",
        "subhead": "VERIFICATION",
        "body": "8-layer verification system.\nBank-grade identity checks.\nPowered by Plaid.",
        "accent": "🔐",
    },
    {
        "id": "bot-stat",
        "headline": "47%",
        "subhead": "OF DATING PROFILES\nARE BOTS",
        "body": "Are you swiping on\na real person?",
        "accent": "🤖",
    },
    {
        "id": "testimonial",
        "headline": '"Finally, I know\nwho I\'m talking to."',
        "subhead": "— Early Beta User",
        "body": "Real humans. Verified identities.\nNo catfish. No bots.",
        "accent": "💬",
    },
    {
        "id": "verification",
        "headline": "VERIFIED\nHUMANS ONLY",
        "subhead": "Every profile is checked",
        "body": "ID verification • Liveness check\nBank verification • Device check",
        "accent": "✅",
    },
    {
        "id": "urgency",
        "headline": "ONLY 100",
        "subhead": "FOUNDING SPOTS",
        "body": "Once they're gone,\nprice goes up. Period.",
        "accent": "⏰",
    },
    {
        "id": "comparison",
        "headline": "THEM vs US",
        "subhead": "",
        "body": "❌ Bots & fake profiles\n❌ No identity checks\n❌ Catfishing epidemic\n\n✅ 100% verified humans\n✅ V8 Cloud security\n✅ Real connections only",
        "accent": "⚡",
    },
    {
        "id": "founder",
        "headline": "BUILT BY A\nREAL PERSON",
        "subhead": "An electrician who codes",
        "body": "Not a Silicon Valley startup.\nA real guy who was tired of\nfake profiles.",
        "accent": "🔧",
    },
    {
        "id": "plaid",
        "headline": "PLAID\nPOWERED",
        "subhead": "Bank-Grade Trust",
        "body": "The same verification\nyour bank uses.\nNow for dating.",
        "accent": "🏦",
    },
    {
        "id": "social-proof",
        "headline": "GROWING\nFAST",
        "subhead": "Early adopters are in",
        "body": "Join the movement of\npeople done with bots.\nBe among the first.",
        "accent": "📈",
    },
    {
        "id": "how-it-works",
        "headline": "3 STEPS",
        "subhead": "TO REAL CONNECTIONS",
        "body": "1️⃣ Sign up & verify identity\n2️⃣ Complete V8 Cloud check\n3️⃣ Connect with REAL humans",
        "accent": "🎯",
    },
    {
        "id": "realtime",
        "headline": "REAL-TIME\nVERIFICATION",
        "subhead": "Always watching for bots",
        "body": "Continuous monitoring.\nIf a bot slips in,\nwe catch it instantly.",
        "accent": "🛡️",
    },
    {
        "id": "no-bots",
        "headline": "ZERO\nBOTS",
        "subhead": "GUARANTEED",
        "body": "We don't just promise it.\nWe prove it.\nEvery. Single. Profile.",
        "accent": "🚫",
    },
    {
        "id": "cta-join",
        "headline": "JOIN THE\nFOUNDING\nMEMBERS",
        "subhead": "$14.99/mo forever",
        "body": "youandinotai.com\nLock in your spot NOW.",
        "accent": "🔥",
    },
    {
        "id": "values",
        "headline": "REAL\nHUMANS\nONLY",
        "subhead": "That's not a slogan.\nIt's a guarantee.",
        "body": "YouAndINotAI",
        "accent": "❤️",
    },
]


def generate_instagram_post(template, idx, logo_small):
    """Generate a single Instagram feed post (1080x1080)."""
    size = (1080, 1080)
    img = Image.new("RGBA", size, (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    # Dark gradient background
    draw_dark_bg(img, draw)

    # Accent gradient bar at top
    draw_gradient_bar(draw, 0, size[0], 4, BRAND["gradient"])

    # Decorative corner elements
    corner_size = 120
    colors = [hex_to_rgb(c) for c in BRAND["gradient"]]
    for y in range(corner_size):
        t = y / corner_size
        alpha = int(60 * (1 - t))
        c = gradient_color(t * 0.5, colors)
        draw.line([(0, y), (int(corner_size * (1 - t)), y)], fill=(*c, alpha))

    # Main content area
    margin = 80
    content_top = 120

    # Emoji accent (large)
    accent_font = get_font(72)
    draw.text((margin, content_top), template["accent"], font=accent_font, fill=BRAND["text_white"])

    # Headline with gradient text
    headline_font = get_font(72, bold=True)
    headline_y = content_top + 120
    lines = template["headline"].split("\n")
    for i, line in enumerate(lines):
        draw_gradient_text(
            img,
            (margin, headline_y + i * 85),
            line,
            headline_font,
            BRAND["gradient"],
        )

    # Subhead
    subhead_y = headline_y + len(lines) * 85 + 20
    subhead_font = get_font(36, bold=True)
    for i, line in enumerate(template["subhead"].split("\n")):
        draw.text(
            (margin, subhead_y + i * 45),
            line,
            fill=BRAND["accent_muted"],
            font=subhead_font,
        )

    # Body text
    body_y = subhead_y + len(template["subhead"].split("\n")) * 45 + 40
    body_font = get_font(30)
    for i, line in enumerate(template["body"].split("\n")):
        draw.text(
            (margin, body_y + i * 42),
            line,
            fill=BRAND["text_light"],
            font=body_font,
        )

    # Bottom gradient bar
    draw_gradient_bar(draw, size[1] - 80, size[0], 3, BRAND["gradient"])

    # Brand name bottom left
    brand_font = get_font(24, bold=True)
    draw.text((margin, size[1] - 65), BRAND["name"], fill=BRAND["accent_muted"], font=brand_font)

    # URL bottom right
    url_font = get_font(22)
    url_bbox = url_font.getbbox(BRAND["url"])
    draw.text(
        (size[0] - margin - (url_bbox[2] - url_bbox[0]), size[1] - 65),
        BRAND["url"],
        fill=BRAND["accent_muted"],
        font=url_font,
    )

    # Logo watermark
    add_watermark(img, logo_small)

    # Convert to RGB for JPEG/PNG save
    final = Image.new("RGB", size, hex_to_rgb(BRAND["bg_dark"]))
    final.paste(img, (0, 0), img)

    filename = f"ig-feed-{idx+1:02d}-{template['id']}.png"
    path = SOCIAL_DIR / "instagram-feed" / filename
    final.save(str(path), "PNG", quality=95)
    return str(path)


def generate_instagram_story(idx, logo_small):
    """Generate Instagram story (1080x1920)."""
    size = (1080, 1920)
    img = Image.new("RGBA", size, (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    draw_dark_bg(img, draw)

    story_themes = [
        ("SWIPE UP\nTO VERIFY", "Are you talking to\na real person?", "🔍"),
        ("$14.99/MO\nFOREVER", "Founding member\nexclusive price", "💰"),
        ("47% BOTS", "Almost half of dating\nprofiles are FAKE", "😱"),
        ("V8 CLOUD", "8 layers of\nhuman verification", "☁️"),
        ("REAL\nPEOPLE", "No bots.\nNo catfish.\nNo exceptions.", "✨"),
        ("JOIN NOW", "Only 100 founding\nmember spots", "🔥"),
        ("VERIFIED ✓", "Every single profile\nis identity-checked", "🛡️"),
        ("WHY US?", "We verify humans.\nThey verify emails.\nBig difference.", "💡"),
        ("BUILT\nDIFFERENT", "By a real person.\nFor real people.", "🔧"),
        ("THE FUTURE\nIS REAL", "youandinotai.com\nJoin the founding team", "🚀"),
    ]

    theme = story_themes[idx % len(story_themes)]

    # Top gradient accent
    draw_gradient_bar(draw, 0, size[0], 6, BRAND["gradient"])

    # Large centered headline
    margin = 80
    headline_font = get_font(96, bold=True)
    lines = theme[0].split("\n")
    total_h = len(lines) * 115
    start_y = (size[1] // 2) - total_h - 50

    for i, line in enumerate(lines):
        draw_gradient_text(img, (margin, start_y + i * 115), line, headline_font, BRAND["gradient"])

    # Body text
    body_font = get_font(40)
    body_y = start_y + total_h + 60
    for i, line in enumerate(theme[1].split("\n")):
        draw.text((margin, body_y + i * 55), line, fill=BRAND["text_light"], font=body_font)

    # Large emoji
    emoji_font = get_font(120)
    draw.text((size[0] // 2 - 60, body_y + 200), theme[2], font=emoji_font, fill=BRAND["text_white"])

    # Bottom CTA bar
    add_cta_bar(draw, size, get_font(28, bold=True))
    add_watermark(img, logo_small)

    final = Image.new("RGB", size, hex_to_rgb(BRAND["bg_dark"]))
    final.paste(img, (0, 0), img)

    path = SOCIAL_DIR / "instagram-stories" / f"ig-story-{idx+1:02d}.png"
    final.save(str(path), "PNG", quality=95)
    return str(path)


def generate_tiktok_thumbnail(idx, logo_small):
    """Generate TikTok thumbnail (1080x1920)."""
    size = (1080, 1920)
    img = Image.new("RGBA", size, (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    draw_dark_bg(img, draw)

    themes = [
        ("THIS APP\nHAS ZERO\nBOTS", "Literally. Zero. 🤯"),
        ("ARE YOU\nTALKING TO\nA REAL\nPERSON?", "47% chance you're NOT 😬"),
        ("I VERIFY\nEVERY\nHUMAN", "V8 Cloud Technology 🔐"),
        ("$14.99\nFOREVER", "First 100 members only 🔥"),
        ("DATING APPS\nARE FULL\nOF BOTS", "We fixed that ✅"),
    ]

    theme = themes[idx % len(themes)]

    # Bold gradient text - TikTok style (large, centered)
    headline_font = get_font(110, bold=True)
    lines = theme[0].split("\n")
    total_h = len(lines) * 130
    start_y = (size[1] // 2) - total_h // 2 - 100

    for i, line in enumerate(lines):
        # Center each line
        bbox = headline_font.getbbox(line)
        tw = bbox[2] - bbox[0]
        x = (size[0] - tw) // 2
        draw_gradient_text(img, (x, start_y + i * 130), line, headline_font, BRAND["gradient"])

    # Sub text
    sub_font = get_font(42)
    sub_bbox = sub_font.getbbox(theme[1])
    sub_tw = sub_bbox[2] - sub_bbox[0]
    draw.text(
        ((size[0] - sub_tw) // 2, start_y + total_h + 40),
        theme[1],
        fill=BRAND["text_light"],
        font=sub_font,
    )

    # Bottom branding
    draw_gradient_bar(draw, size[1] - 100, size[0], 4, BRAND["gradient"])
    brand_font = get_font(32, bold=True)
    brand_bbox = brand_font.getbbox(BRAND["name"])
    brand_tw = brand_bbox[2] - brand_bbox[0]
    draw.text(
        ((size[0] - brand_tw) // 2, size[1] - 70),
        BRAND["name"],
        fill=BRAND["accent_muted"],
        font=brand_font,
    )

    add_watermark(img, logo_small)

    final = Image.new("RGB", size, hex_to_rgb(BRAND["bg_dark"]))
    final.paste(img, (0, 0), img)

    path = SOCIAL_DIR / "tiktok" / f"tiktok-thumb-{idx+1:02d}.png"
    final.save(str(path), "PNG", quality=95)
    return str(path)


def generate_twitter_card(idx, logo_small):
    """Generate Twitter card (1200x675)."""
    size = (1200, 675)
    img = Image.new("RGBA", size, (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    draw_dark_bg(img, draw)

    themes = [
        ("No Bots. Real Humans.", "V8 Cloud Verification keeps it real."),
        ("47% of dating profiles are bots.", "YouAndINotAI verifies every human."),
        ("$14.99/mo founding member price.", "Lock it in forever. Only 100 spots."),
        ("V8 Cloud: 8 layers of verification.", "Bank-grade security for dating."),
        ("Built by an electrician who codes.", "Not Silicon Valley. Real solutions."),
        ("Every profile is identity verified.", "No exceptions. No bots. Period."),
        ("Plaid-powered trust signals.", "Same tech your bank uses."),
        ("Founding members wanted.", "youandinotai.com — join the 100."),
        ("Real-time bot detection.", "If it's not human, it's gone."),
        ("The future of dating is verified.", "youandinotai.com"),
    ]

    theme = themes[idx % len(themes)]
    margin = 60

    # Top gradient bar
    draw_gradient_bar(draw, 0, size[0], 4, BRAND["gradient"])

    # Logo on left
    logo_sz = 80
    logo_resized = logo_small.resize((logo_sz, logo_sz), Image.LANCZOS)
    img.paste(logo_resized, (margin, margin + 30), logo_resized)

    # Headline
    headline_font = get_font(48, bold=True)
    wrapped = wrap_text(theme[0], headline_font, size[0] - margin * 2 - logo_sz - 40)
    text_x = margin + logo_sz + 30
    for i, line in enumerate(wrapped):
        draw_gradient_text(img, (text_x, margin + 30 + i * 58), line, headline_font, BRAND["gradient"])

    # Body
    body_font = get_font(30)
    body_y = margin + 30 + len(wrapped) * 58 + 30
    wrapped_body = wrap_text(theme[1], body_font, size[0] - margin * 2)
    for i, line in enumerate(wrapped_body):
        draw.text((margin, body_y + i * 40), line, fill=BRAND["text_light"], font=body_font)

    # Bottom bar with URL and handle
    add_cta_bar(draw, size, get_font(22, bold=True))

    # Handle
    handle_font = get_font(22)
    draw.text(
        (size[0] - margin - 150, size[1] - 90),
        BRAND["handle"],
        fill=BRAND["accent_muted"],
        font=handle_font,
    )

    final = Image.new("RGB", size, hex_to_rgb(BRAND["bg_dark"]))
    final.paste(img, (0, 0), img)

    path = SOCIAL_DIR / "twitter" / f"twitter-card-{idx+1:02d}.png"
    final.save(str(path), "PNG", quality=95)
    return str(path)


def generate_pinterest_pin(idx, logo_small):
    """Generate Pinterest pin (1000x1500)."""
    size = (1000, 1500)
    img = Image.new("RGBA", size, (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    draw_dark_bg(img, draw)

    themes = [
        ("TIRED OF\nFAKE\nPROFILES?", "YouAndINotAI verifies\nevery single human.", "😤"),
        ("$14.99/MO\nFOREVER", "Founding member price.\nOnly 100 spots left.", "💎"),
        ("8 LAYERS\nOF TRUST", "V8 Cloud Verification\nprotects your connections.", "🔐"),
        ("REAL\nCONNECTIONS\nONLY", "No bots. No catfish.\nNo compromises.", "❤️"),
        ("47%\nARE BOTS", "Nearly half of dating\nprofiles are fake.\nNot on our platform.", "📊"),
        ("PLAID\nPOWERED", "Bank-grade verification\nfor modern dating.", "🏦"),
        ("3 SIMPLE\nSTEPS", "Sign up → Verify →\nConnect with REAL humans", "✨"),
        ("JOIN THE\nFOUNDING\n100", "youandinotai.com\nBe part of something real.", "🚀"),
    ]

    theme = themes[idx % len(themes)]
    margin = 70

    # Top gradient
    draw_gradient_bar(draw, 0, size[0], 5, BRAND["gradient"])

    # Decorative dots pattern (subtle)
    dot_color = (*hex_to_rgb(BRAND["gradient"][0]), 15)
    for dx in range(0, size[0], 40):
        for dy in range(0, size[1], 40):
            draw.ellipse([dx - 1, dy - 1, dx + 1, dy + 1], fill=dot_color)

    # Emoji
    emoji_font = get_font(80)
    draw.text((margin, 100), theme[2], font=emoji_font, fill=BRAND["text_white"])

    # Headline
    headline_font = get_font(82, bold=True)
    lines = theme[0].split("\n")
    headline_y = 240
    for i, line in enumerate(lines):
        draw_gradient_text(img, (margin, headline_y + i * 100), line, headline_font, BRAND["gradient"])

    # Divider line
    div_y = headline_y + len(lines) * 100 + 40
    colors = [hex_to_rgb(c) for c in BRAND["gradient"]]
    for x in range(margin, size[0] - margin):
        t = (x - margin) / max(1, size[0] - margin * 2)
        c = gradient_color(t, colors)
        draw.line([(x, div_y), (x, div_y + 2)], fill=c)

    # Body text
    body_font = get_font(36)
    body_y = div_y + 40
    for i, line in enumerate(theme[1].split("\n")):
        draw.text((margin, body_y + i * 50), line, fill=BRAND["text_light"], font=body_font)

    # Brand + CTA at bottom
    add_cta_bar(draw, size, get_font(26, bold=True))

    # Brand name above CTA
    brand_font = get_font(28, bold=True)
    brand_bbox = brand_font.getbbox(BRAND["name"])
    brand_tw = brand_bbox[2] - brand_bbox[0]
    draw.text(
        ((size[0] - brand_tw) // 2, size[1] - 160),
        BRAND["name"],
        fill=BRAND["accent_muted"],
        font=brand_font,
    )

    add_watermark(img, logo_small)

    final = Image.new("RGB", size, hex_to_rgb(BRAND["bg_dark"]))
    final.paste(img, (0, 0), img)

    path = SOCIAL_DIR / "pinterest" / f"pinterest-pin-{idx+1:02d}.png"
    final.save(str(path), "PNG", quality=95)
    return str(path)


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    print("🚀 YOUANDINOTAI VISUAL ASSET GENERATION")
    print("=" * 60)
    all_files = []

    # ── STEP 1: Logo ──
    print("\n📌 PRIORITY 1: LOGO GENERATION")
    print("-" * 40)
    logo = generate_fingerprint_logo(1024)
    logo_files = export_logo(logo)
    all_files.extend(logo_files)
    print(f"  ✅ Logo complete: {len(logo_files)} variants exported")

    # Prepare small logo for watermarks
    logo_small = logo.resize((256, 256), Image.LANCZOS)

    # ── STEP 2: Instagram Feed ──
    print("\n📌 PRIORITY 2: SOCIAL MEDIA ASSETS")
    print("-" * 40)

    print("\n  📸 Instagram Feed (15 posts, 1080x1080)")
    for i, tmpl in enumerate(INSTAGRAM_TEMPLATES):
        path = generate_instagram_post(tmpl, i, logo_small)
        all_files.append(path)
        print(f"    ✅ {Path(path).name}")

    # ── Instagram Stories ──
    print("\n  📱 Instagram Stories (10 designs, 1080x1920)")
    for i in range(10):
        path = generate_instagram_story(i, logo_small)
        all_files.append(path)
        print(f"    ✅ {Path(path).name}")

    # ── TikTok Thumbnails ──
    print("\n  🎵 TikTok Thumbnails (5 designs, 1080x1920)")
    for i in range(5):
        path = generate_tiktok_thumbnail(i, logo_small)
        all_files.append(path)
        print(f"    ✅ {Path(path).name}")

    # ── Twitter Cards ──
    print("\n  🐦 Twitter Cards (10 designs, 1200x675)")
    for i in range(10):
        path = generate_twitter_card(i, logo_small)
        all_files.append(path)
        print(f"    ✅ {Path(path).name}")

    # ── Pinterest Pins ──
    print("\n  📌 Pinterest Pins (8 designs, 1000x1500)")
    for i in range(8):
        path = generate_pinterest_pin(i, logo_small)
        all_files.append(path)
        print(f"    ✅ {Path(path).name}")

    # ── STEP 3: Manifest ──
    print("\n📌 PRIORITY 4: GENERATING MANIFEST")
    print("-" * 40)

    manifest["total_assets"] = len(all_files)
    manifest["assets"] = []
    for f in all_files:
        p = Path(f)
        rel = p.relative_to(BASE_DIR)
        img_check = Image.open(f)
        manifest["assets"].append({
            "path": str(rel).replace("\\", "/"),
            "size": f"{img_check.size[0]}x{img_check.size[1]}",
            "format": p.suffix.upper().lstrip("."),
            "file_size_kb": round(p.stat().st_size / 1024, 1),
            "category": str(rel.parts[0]) if rel.parts else "unknown",
        })
        img_check.close()

    manifest_path = BASE_DIR / "assets_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"  ✅ Manifest written: {manifest_path}")

    # Summary
    print("\n" + "=" * 60)
    print(f"🎉 MISSION COMPLETE - {len(all_files)} assets generated!")
    print("=" * 60)
    print("\n📂 File structure:")
    print(f"  assets/logo/           — {len(logo_files)} logo variants")
    print(f"  assets/social/instagram-feed/    — 15 feed posts")
    print(f"  assets/social/instagram-stories/ — 10 stories")
    print(f"  assets/social/tiktok/            — 5 thumbnails")
    print(f"  assets/social/twitter/           — 10 cards")
    print(f"  assets/social/pinterest/         — 8 pins")
    print(f"  assets/assets_manifest.json      — deployment manifest")
    print(f"\n🚀 Ready for deployment via Opus CLI")


if __name__ == "__main__":
    main()
