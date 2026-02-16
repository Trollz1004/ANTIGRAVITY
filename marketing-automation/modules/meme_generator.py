"""
Meme/image generator module.
Creates branded marketing images with text overlays using Pillow.
No external API needed — runs 100% locally.
"""
import logging
from pathlib import Path
from config import MEME_OUTPUT, TEMPLATE_DIR

log = logging.getLogger("memes")


def create_bold_statement_image(
    top_text: str,
    bottom_text: str,
    watermark: str = "YouAndINotAI.com",
    filename: str = "output.png",
    bg_color: tuple = (220, 20, 40),  # Bold red
    text_color: tuple = (255, 255, 255),
    width: int = 1080,
    height: int = 1080,
):
    """Create a bold text-on-color-background marketing image."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        log.error("Pillow not installed — run: pip install Pillow")
        return None

    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # Try to use a nice font, fall back to default
    try:
        font_large = ImageFont.truetype("arial.ttf", 72)
        font_medium = ImageFont.truetype("arial.ttf", 48)
        font_small = ImageFont.truetype("arial.ttf", 28)
    except OSError:
        try:
            font_large = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 72)
            font_medium = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 48)
            font_small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 28)
        except OSError:
            font_large = ImageFont.load_default()
            font_medium = ImageFont.load_default()
            font_small = ImageFont.load_default()

    # Draw top text (centered, upper third)
    _draw_centered_text(draw, top_text, font_large, text_color, width, height * 0.3)

    # Draw bottom text (centered, lower third)
    _draw_centered_text(draw, bottom_text, font_medium, text_color, width, height * 0.65)

    # Draw watermark (bottom)
    _draw_centered_text(draw, watermark, font_small, (255, 255, 255, 180), width, height * 0.92)

    # Save
    output_path = MEME_OUTPUT / filename
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(output_path), "PNG")
    log.info(f"Generated meme: {output_path}")
    return str(output_path)


def _draw_centered_text(draw, text, font, color, canvas_width, y_position):
    """Draw text centered horizontally at a given Y position."""
    lines = text.split("\n")
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (canvas_width - text_width) / 2
        y = y_position + (i * (text_height + 10))
        draw.text((x, y), line, fill=color, font=font)


def create_countdown_image(days_left: int, filename: str = None):
    """Create a countdown image: 'X DAYS' in bold."""
    if filename is None:
        filename = f"countdown_{days_left}.png"

    return create_bold_statement_image(
        top_text=f"{days_left}",
        bottom_text=f"DAYS UNTIL\nDATE DIFFERENTLY",
        watermark="YouAndINotAI.com | Feb 14, 2026",
        filename=filename,
        bg_color=(220, 20, 40),
    )


def create_stat_image(stat: str, context: str, filename: str = "stat.png"):
    """Create a statistic highlight image."""
    return create_bold_statement_image(
        top_text=stat,
        bottom_text=context,
        watermark="YouAndINotAI.com",
        filename=filename,
        bg_color=(20, 20, 20),  # Dark background
    )


def generate_all_memes():
    """Generate all pre-defined memes from the content library."""
    from modules.content_library import MEME_TEXTS

    generated = []

    for meme in MEME_TEXTS:
        path = create_bold_statement_image(
            top_text=meme["top_text"],
            bottom_text=meme["bottom_text"],
            watermark=meme["watermark"],
            filename=f"meme_{meme['id']}.png",
        )
        if path:
            generated.append(path)

    # Countdown images
    for days in range(5, 0, -1):
        path = create_countdown_image(days)
        if path:
            generated.append(path)

    # Stats images
    stats = [
        ("1 in 5", "Dating profiles are AI-generated", "stat_1in5.png"),
        ("90 min/day", "Average time wasted swiping on bots", "stat_90min.png"),
        ("$4.99/mo", "Early Bird pricing — locked for life", "stat_price.png"),
        ("0 bots", "That's our promise", "stat_0bots.png"),
    ]
    for stat, context, fname in stats:
        path = create_stat_image(stat, context, fname)
        if path:
            generated.append(path)

    log.info(f"Generated {len(generated)} marketing images")
    return generated
