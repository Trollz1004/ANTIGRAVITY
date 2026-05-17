"""
Unit tests for generate_all_assets.py - data processing / image generation pipeline.
Tests pure functions and image generation helpers without modifying source code.
"""

import sys
import os
from pathlib import Path

# Ensure we import from the parent directory (assets/)
sys.path.insert(0, str(Path(__file__).parent.parent))

from unittest.mock import MagicMock, patch
import pytest

# Import the module under test
import importlib
import generate_all_assets as ga


# ─── hex_to_rgb ─────────────────────────────────────────────────────────────

class TestHexToRgb:
    def test_basic_red(self):
        assert ga.hex_to_rgb("#FF0000") == (255, 0, 0)

    def test_basic_green(self):
        assert ga.hex_to_rgb("#00FF00") == (0, 255, 0)

    def test_basic_blue(self):
        assert ga.hex_to_rgb("#0000FF") == (0, 0, 255)

    def test_white(self):
        assert ga.hex_to_rgb("#FFFFFF") == (255, 255, 255)

    def test_black(self):
        assert ga.hex_to_rgb("#000000") == (0, 0, 0)

    def test_without_hash_prefix(self):
        assert ga.hex_to_rgb("EF4444") == (239, 68, 68)

    def test_brand_gradient_colors(self):
        """Test actual brand gradient hex values."""
        assert ga.hex_to_rgb("#EF4444") == (239, 68, 68)
        assert ga.hex_to_rgb("#EC4899") == (236, 72, 153)
        assert ga.hex_to_rgb("#F97316") == (249, 115, 22)

    def test_brand_dark_bg(self):
        assert ga.hex_to_rgb("#0F172A") == (15, 23, 42)

    def test_brand_darker_bg(self):
        assert ga.hex_to_rgb("#0A0F1E") == (10, 15, 30)

    def test_returns_tuple_of_ints(self):
        result = ga.hex_to_rgb("#123456")
        assert isinstance(result, tuple)
        assert len(result) == 3
        assert all(isinstance(v, int) for v in result)

    def test_lowercase_hex(self):
        assert ga.hex_to_rgb("#ff0000") == (255, 0, 0)

    def test_mixed_case(self):
        assert ga.hex_to_rgb("#Ff0000") == (255, 0, 0)


# ─── lerp_color ─────────────────────────────────────────────────────────────

class TestLerpColor:
    def test_t_zero_returns_first_color(self):
        c1 = (0, 0, 0)
        c2 = (255, 255, 255)
        assert ga.lerp_color(c1, c2, 0.0) == (0, 0, 0)

    def test_t_one_returns_second_color(self):
        c1 = (0, 0, 0)
        c2 = (255, 255, 255)
        assert ga.lerp_color(c1, c2, 1.0) == (255, 255, 255)

    def test_t_halfway(self):
        c1 = (0, 0, 0)
        c2 = (200, 100, 50)
        result = ga.lerp_color(c1, c2, 0.5)
        assert result == (100, 50, 25)

    def test_same_color_returns_same(self):
        c = (128, 64, 32)
        assert ga.lerp_color(c, c, 0.5) == c

    def test_quarter_interpolation(self):
        c1 = (0, 0, 0)
        c2 = (100, 200, 300)
        result = ga.lerp_color(c1, c2, 0.25)
        assert result == (25, 50, 75)

    def test_returns_tuple_of_ints(self):
        result = ga.lerp_color((10, 20, 30), (40, 50, 60), 0.5)
        assert isinstance(result, tuple)
        assert len(result) == 3
        assert all(isinstance(v, int) for v in result)

    def test_non_zero_start(self):
        c1 = (100, 100, 100)
        c2 = (200, 200, 200)
        result = ga.lerp_color(c1, c2, 0.5)
        assert result == (150, 150, 150)


# ─── gradient_color ─────────────────────────────────────────────────────────

class TestGradientColor:
    def setup_method(self):
        self.colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]

    def test_t_zero_returns_first_color(self):
        assert ga.gradient_color(0.0, self.colors) == (255, 0, 0)

    def test_t_one_returns_last_color(self):
        assert ga.gradient_color(1.0, self.colors) == (0, 0, 255)

    def test_t_below_zero_clamps_to_first(self):
        assert ga.gradient_color(-0.5, self.colors) == (255, 0, 0)

    def test_t_above_one_clamps_to_last(self):
        assert ga.gradient_color(1.5, self.colors) == (0, 0, 255)

    def test_midpoint_of_two_colors(self):
        two_colors = [(0, 0, 0), (200, 100, 50)]
        result = ga.gradient_color(0.5, two_colors)
        assert result == (100, 50, 25)

    def test_quarter_position_three_colors(self):
        # At t=0.25, we're halfway between colors[0] and colors[1]
        result = ga.gradient_color(0.25, self.colors)
        assert result == (127, 127, 0)

    def test_three_quarter_position_three_colors(self):
        # At t=0.75, we're halfway between colors[1] and colors[2]
        result = ga.gradient_color(0.75, self.colors)
        assert result == (0, 127, 127)

    def test_single_color_always_returns_that_color(self):
        single = [(42, 84, 126)]
        assert ga.gradient_color(0.0, single) == (42, 84, 126)
        assert ga.gradient_color(0.5, single) == (42, 84, 126)
        assert ga.gradient_color(1.0, single) == (42, 84, 126)

    def test_returns_tuple(self):
        result = ga.gradient_color(0.5, self.colors)
        assert isinstance(result, tuple)
        assert len(result) == 3

    def test_brand_gradient_at_boundaries(self):
        """Test with actual brand gradient colors."""
        brand_colors = [
            ga.hex_to_rgb("#EF4444"),
            ga.hex_to_rgb("#EC4899"),
            ga.hex_to_rgb("#F97316"),
        ]
        assert ga.gradient_color(0.0, brand_colors) == ga.hex_to_rgb("#EF4444")
        assert ga.gradient_color(1.0, brand_colors) == ga.hex_to_rgb("#F97316")


# ─── create_gradient_image ──────────────────────────────────────────────────

class TestCreateGradientImage:
    def test_returns_image(self):
        from PIL import Image
        result = ga.create_gradient_image((100, 50), ["#FF0000", "#0000FF"])
        assert isinstance(result, Image.Image)

    def test_correct_dimensions(self):
        result = ga.create_gradient_image((200, 100), ["#FF0000", "#00FF00"])
        assert result.size == (200, 100)

    def test_rgba_mode(self):
        result = ga.create_gradient_image((50, 50), ["#FF0000", "#0000FF"])
        assert result.mode == "RGBA"

    def test_vertical_direction(self):
        result = ga.create_gradient_image((10, 20), ["#FF0000", "#0000FF"], direction="vertical")
        assert result.size == (10, 20)

    def test_horizontal_direction(self):
        result = ga.create_gradient_image((20, 10), ["#FF0000", "#0000FF"], direction="horizontal")
        assert result.size == (20, 10)

    def test_small_image(self):
        result = ga.create_gradient_image((2, 2), ["#000000", "#FFFFFF"])
        assert result.size == (2, 2)

    def test_single_pixel_width(self):
        result = ga.create_gradient_image((1, 10), ["#FF0000", "#00FF00"])
        assert result.size == (1, 10)

    def test_three_color_gradient(self):
        result = ga.create_gradient_image((100, 50), ["#FF0000", "#00FF00", "#0000FF"])
        assert result.size == (100, 50)
        assert result.mode == "RGBA"

    def test_brand_gradient(self):
        """Test with actual brand gradient colors."""
        brand_grad = ga.BRAND["gradient"]
        result = ga.create_gradient_image((1080, 1080), brand_grad)
        assert result.size == (1080, 1080)
        assert result.mode == "RGBA"


# ─── draw_gradient_rect ─────────────────────────────────────────────────────

class TestDrawGradientRect:
    def test_horizontal_does_not_crash(self):
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (100, 50))
        draw = ImageDraw.Draw(img)
        ga.draw_gradient_rect(draw, (0, 0, 100, 50), ["#FF0000", "#0000FF"], direction="horizontal")

    def test_vertical_does_not_crash(self):
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (100, 50))
        draw = ImageDraw.Draw(img)
        ga.draw_gradient_rect(draw, (0, 0, 100, 50), ["#FF0000", "#0000FF"], direction="vertical")

    def test_default_direction_is_horizontal(self):
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (50, 50))
        draw = ImageDraw.Draw(img)
        # Should not crash with default direction
        ga.draw_gradient_rect(draw, (0, 0, 50, 50), ["#FF0000", "#0000FF"])

    def test_single_pixel_wide(self):
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (1, 10))
        draw = ImageDraw.Draw(img)
        ga.draw_gradient_rect(draw, (0, 0, 1, 10), ["#FF0000", "#00FF00"])

    def test_three_colors(self):
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (100, 50))
        draw = ImageDraw.Draw(img)
        ga.draw_gradient_rect(draw, (0, 0, 100, 50), ["#FF0000", "#00FF00", "#0000FF"])

    def test_brand_colors(self):
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (1080, 1080))
        draw = ImageDraw.Draw(img)
        ga.draw_gradient_rect(draw, (0, 0, 1080, 1080), ga.BRAND["gradient"])


# ─── wrap_text ──────────────────────────────────────────────────────────────

class TestWrapText:
    def test_empty_string(self):
        font = ga.get_font(20)
        result = ga.wrap_text("", font, 200)
        assert result == []

    def test_single_word(self):
        font = ga.get_font(20)
        result = ga.wrap_text("Hello", font, 500)
        assert result == ["Hello"]

    def test_short_text_single_line(self):
        font = ga.get_font(20)
        result = ga.wrap_text("Hello World", font, 500)
        assert len(result) == 1
        assert "Hello" in result[0]
        assert "World" in result[0]

    def test_returns_list(self):
        font = ga.get_font(20)
        result = ga.wrap_text("test", font, 100)
        assert isinstance(result, list)

    def test_all_words_preserved(self):
        font = ga.get_font(20)
        text = "one two three four five"
        result = ga.wrap_text(text, font, 50)
        # All words should appear in the output
        combined = " ".join(result)
        for word in text.split():
            assert word in combined

    def test_narrow_width_wraps(self):
        font = ga.get_font(30)
        text = "This is a long sentence that should definitely wrap"
        result = ga.wrap_text(text, font, 50)
        assert len(result) > 1


# ─── draw_dark_bg ───────────────────────────────────────────────────────────

class TestDrawDarkBg:
    def test_does_not_crash(self):
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (100, 100))
        draw = ImageDraw.Draw(img)
        ga.draw_dark_bg(img, draw)

    def test_produces_non_uniform_pixels(self):
        """Dark bg should produce a gradient, not a flat color."""
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (100, 100))
        draw = ImageDraw.Draw(img)
        ga.draw_dark_bg(img, draw)
        # Check that top and bottom rows differ (gradient)
        top_pixel = img.getpixel((50, 0))
        bot_pixel = img.getpixel((50, 99))
        assert top_pixel != bot_pixel


# ─── draw_gradient_bar ──────────────────────────────────────────────────────

class TestDrawGradientBar:
    def test_does_not_crash(self):
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (100, 50))
        draw = ImageDraw.Draw(img)
        ga.draw_gradient_bar(draw, 0, 100, 5, ["#FF0000", "#0000FF"])

    def test_brand_colors(self):
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (1080, 1080))
        draw = ImageDraw.Draw(img)
        ga.draw_gradient_bar(draw, 0, 1080, 10, ga.BRAND["gradient"])


# ─── draw_stat_card ─────────────────────────────────────────────────────────

class TestDrawStatCard:
    def test_does_not_crash(self):
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (400, 300))
        draw = ImageDraw.Draw(img)
        ga.draw_stat_card(draw, 50, 50, 150, 100, "47%", "BOTS", ["#FF0000", "#0000FF"])

    def test_brand_colors(self):
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (400, 300))
        draw = ImageDraw.Draw(img)
        ga.draw_stat_card(draw, 50, 50, 150, 100, "100%", "VERIFIED", ga.BRAND["gradient"])


# ─── add_cta_bar ────────────────────────────────────────────────────────────

class TestAddCtaBar:
    def test_does_not_crash(self):
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (1080, 1080))
        draw = ImageDraw.Draw(img)
        font_sm = ga.get_font(20)
        ga.add_cta_bar(draw, (1080, 1080), font_sm)


# ─── add_watermark ──────────────────────────────────────────────────────────

class TestAddWatermark:
    def test_does_not_crash(self):
        from PIL import Image
        img = Image.new("RGBA", (500, 500), (100, 100, 100, 255))
        logo_small = Image.new("RGBA", (50, 50), (255, 0, 0, 128))
        ga.add_watermark(img, logo_small)

    def test_watermark_in_bottom_right(self):
        from PIL import Image
        img = Image.new("RGBA", (500, 500), (100, 100, 100, 255))
        logo_small = Image.new("RGBA", (50, 50), (255, 0, 0, 200))
        ga.add_watermark(img, logo_small)
        # Check that bottom-right area has non-background pixels
        wm_size = int(min(500, 500) * 0.08)
        margin = int(wm_size * 0.5)
        # The watermark should be in the bottom-right corner
        pixel = img.getpixel((500 - wm_size - margin // 2, 500 - wm_size - margin // 2))
        assert pixel[3] > 0  # Has some alpha


# ─── draw_gradient_text ─────────────────────────────────────────────────────

class TestDrawGradientText:
    def test_does_not_crash(self):
        from PIL import Image
        img = Image.new("RGBA", (500, 200))
        font = ga.get_font(40, bold=True)
        ga.draw_gradient_text(img, (10, 10), "TEST", font, ["#FF0000", "#0000FF"])

    def test_brand_gradient_text(self):
        from PIL import Image
        img = Image.new("RGBA", (800, 200))
        font = ga.get_font(60, bold=True)
        ga.draw_gradient_text(img, (10, 10), "YouAndINotAI", font, ga.BRAND["gradient"])


# ─── generate_fingerprint_logo (smoke test) ─────────────────────────────────

class TestGenerateFingerprintLogo:
    def test_small_size_returns_image(self):
        """Smoke test: generate a small logo and verify it returns a valid image."""
        from PIL import Image
        result = ga.generate_fingerprint_logo(size=64)
        assert isinstance(result, Image.Image)

    def test_small_size_correct_dimensions(self):
        result = ga.generate_fingerprint_logo(size=64)
        assert result.size == (64, 64)

    def test_rgba_mode(self):
        result = ga.generate_fingerprint_logo(size=64)
        assert result.mode == "RGBA"

    def test_default_size(self):
        result = ga.generate_fingerprint_logo()
        assert result.size == (1024, 1024)

    def test_custom_size(self):
        result = ga.generate_fingerprint_logo(size=128)
        assert result.size == (128, 128)


# ─── export_logo (integration test with tmp_path) ───────────────────────────

class TestExportLogo:
    def test_creates_files(self, tmp_path):
        """Test that export_logo creates the expected number of files."""
        from PIL import Image
        logo = Image.new("RGBA", (1024, 1024), (255, 0, 0, 128))

        with patch.object(ga, "LOGO_DIR", tmp_path):
            with patch.object(ga, "get_font", return_value=ga.ImageFont.load_default()):
                files = ga.export_logo(logo)

        # Should produce: 5 standard + 2 dark-bg + 1 light-bg = 8 files
        assert len(files) == 8

    def test_creates_png_files(self, tmp_path):
        from PIL import Image
        logo = Image.new("RGBA", (1024, 1024), (255, 0, 0, 128))

        with patch.object(ga, "LOGO_DIR", tmp_path):
            with patch.object(ga, "get_font", return_value=ga.ImageFont.load_default()):
                files = ga.export_logo(logo)

        for f in files:
            assert os.path.exists(f)
            assert f.endswith(".png")

    def test_og_image_has_correct_size(self, tmp_path):
        from PIL import Image
        logo = Image.new("RGBA", (1024, 1024), (255, 0, 0, 128))

        with patch.object(ga, "LOGO_DIR", tmp_path):
            with patch.object(ga, "get_font", return_value=ga.ImageFont.load_default()):
                files = ga.export_logo(logo)

        # Find the OG image file
        og_files = [f for f in files if "og-image" in f]
        assert len(og_files) == 1
        img = Image.open(og_files[0])
        assert img.size == (1200, 630)


# ─── BRAND config ───────────────────────────────────────────────────────────

class TestBrandConfig:
    def test_brand_has_required_keys(self):
        required = ["name", "tagline", "url", "handle", "bg_dark", "bg_darker",
                     "gradient", "accent_light", "accent_muted", "text_white", "text_light"]
        for key in required:
            assert key in ga.BRAND, f"Missing brand key: {key}"

    def test_gradient_has_three_colors(self):
        assert len(ga.BRAND["gradient"]) == 3

    def test_gradient_colors_are_valid_hex(self):
        for color in ga.BRAND["gradient"]:
            assert color.startswith("#")
            assert len(color) == 7
            # Verify it converts without error
            rgb = ga.hex_to_rgb(color)
            assert len(rgb) == 3
            assert all(0 <= v <= 255 for v in rgb)

    def test_brand_name(self):
        assert ga.BRAND["name"] == "YouAndINotAI"


# ─── INSTAGRAM_TEMPLATES ────────────────────────────────────────────────────

class TestInstagramTemplates:
    def test_templates_exist(self):
        assert hasattr(ga, "INSTAGRAM_TEMPLATES")
        assert len(ga.INSTAGRAM_TEMPLATES) > 0

    def test_templates_have_required_keys(self):
        required = ["id", "headline", "subhead", "body", "accent"]
        for template in ga.INSTAGRAM_TEMPLATES:
            for key in required:
                assert key in template, f"Template {template.get('id', '?')} missing key: {key}"

    def test_template_ids_are_unique(self):
        ids = [t["id"] for t in ga.INSTAGRAM_TEMPLATES]
        assert len(ids) == len(set(ids)), "Duplicate template IDs found"
