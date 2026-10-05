#!/usr/bin/env python3
"""
QR CODE & AVATAR BANNER GENERATOR FOR YOUANDINOTAI.COM
======================================================
Generates high-resolution QR codes, profile avatars, and social banners
embedded with a QR code pointing directly to https://youandinotai.com.

Output directory: ops/growth-engine/assets/
"""

import os
from pathlib import Path
import qrcode
from PIL import Image, ImageDraw, ImageFont

# Output directory
OUT_DIR = Path(r"C:/ANTIGRAVITY/ops/growth-engine/assets")
OUT_DIR.mkdir(parents=True, exist_ok=True)

TARGET_URL = "https://youandinotai.com"


def generate_qr_code(url=TARGET_URL, filename="youandinotai_qr.png") -> Path:
    """Generate a clean, high-res QR code for the target URL."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#1E1E2E", back_color="#FFFFFF").convert("RGB")
    out_path = OUT_DIR / filename
    img.save(out_path)
    print(f"Generated QR Code: {out_path} ({img.size[0]}x{img.size[1]})")
    return out_path


def generate_avatar_with_qr(url=TARGET_URL, filename="youandinotai_avatar_qr.png") -> Path:
    """Generate a 1000x1000 profile avatar image featuring the QR code and brand text."""
    # Create 1000x1000 dark canvas
    canvas = Image.new("RGB", (1000, 1000), color="#0F0F1A")
    draw = ImageDraw.Draw(canvas)

    # Draw gradient or decorative accent borders
    draw.rectangle([20, 20, 980, 980], outline="#E11D48", width=6)
    draw.rectangle([35, 35, 965, 965], outline="#3B82F6", width=4)

    # Header text
    try:
        font_title = ImageFont.truetype("arial.ttf", 64)
        font_sub = ImageFont.truetype("arial.ttf", 32)
        font_callout = ImageFont.truetype("arial.ttf", 36)
    except IOError:
        font_title = font_sub = font_callout = ImageFont.load_default()

    # Draw titles
    draw.text((500, 90), "YouAndINotAI", fill="#FFFFFF", font=font_title, anchor="mm")
    draw.text((500, 160), "Human Connection. No Bot Noise.", fill="#F43F5E", font=font_sub, anchor="mm")
    draw.text((500, 210), "Scan to Verify Real Humans ($1 Bot-Shield)", fill="#38BDF8", font=font_sub, anchor="mm")

    # Generate QR Code image to overlay
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=14,
        border=3,
    )
    qr.add_data(url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#0F0F1A", back_color="#FFFFFF").convert("RGB")
    qr_img = qr_img.resize((540, 540))

    # Paste QR Code in center
    canvas.paste(qr_img, (230, 270))

    # Bottom Callout text
    draw.rectangle([100, 840, 900, 930], fill="#1E1E38", outline="#E11D48", width=3)
    draw.text((500, 885), "youandinotai.com • Adults 18+", fill="#FFFFFF", font=font_callout, anchor="mm")

    out_path = OUT_DIR / filename
    canvas.save(out_path)
    print(f"Generated Avatar with QR: {out_path} (1000x1000)")
    return out_path


def generate_post_banner_qr(url=TARGET_URL, filename="youandinotai_post_banner_qr.png") -> Path:
    """Generate a 1200x630 social media post banner with QR code."""
    canvas = Image.new("RGB", (1200, 630), color="#0D0E15")
    draw = ImageDraw.Draw(canvas)

    # Border
    draw.rectangle([15, 15, 1185, 615], outline="#E11D48", width=5)

    try:
        font_title = ImageFont.truetype("arial.ttf", 54)
        font_headline = ImageFont.truetype("arial.ttf", 36)
        font_body = ImageFont.truetype("arial.ttf", 28)
        font_cta = ImageFont.truetype("arial.ttf", 32)
    except IOError:
        font_title = font_headline = font_body = font_cta = ImageFont.load_default()

    # Left text content
    draw.text((60, 80), "YouAndINotAI.com", fill="#F43F5E", font=font_title)
    draw.text((60, 160), "Tired of AI Bots on Dating Apps?", fill="#FFFFFF", font=font_headline)

    body_lines = [
        "✓ $1 Bot-Shield Identity Verification",
        "✓ 100% Real Verified Humans Only",
        "✓ AI Dating Tools & Match Optimization",
        "✓ No Catfishes • No Scripted Bots",
    ]
    y = 230
    for line in body_lines:
        draw.text((60, y), line, fill="#CBD5E1", font=font_body)
        y += 50

    # Call to action box
    draw.rectangle([60, 470, 680, 550], fill="#1E293B", outline="#38BDF8", width=2)
    draw.text((370, 510), "Scan QR Code to Join Now!", fill="#38BDF8", font=font_cta, anchor="mm")

    # Right side: QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#0D0E15", back_color="#FFFFFF").convert("RGB")
    qr_img = qr_img.resize((420, 420))

    canvas.paste(qr_img, (720, 105))

    out_path = OUT_DIR / filename
    canvas.save(out_path)
    print(f"Generated Post Banner with QR: {out_path} (1200x630)")
    return out_path


def main():
    print("=== GENERATING QR CODE & AVATAR MARKETING ASSETS ===")
    qr_path = generate_qr_code()
    avatar_path = generate_avatar_with_qr()
    banner_path = generate_post_banner_qr()
    print("=== ASSETS GENERATING COMPLETE ===")


if __name__ == "__main__":
    main()
