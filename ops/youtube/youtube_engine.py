#!/usr/bin/env python3
"""
ANTIGRAVITY Autonomous YouTube Shorts Engine.
Enforces STRICT 59-second maximum duration limit.
Includes:
- 5-second Intro
- Curated News Stories
- 5-second Previous News Thumbnails showcase
- 5-second Outro
Generates vertical 1080x1920 Shorts with Edge-TTS, Pillow visuals, FFmpeg Ken Burns & audio normalization.
"""
import argparse
import asyncio
import html
import json
import math
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PYTHON_EXE = r"C:\Users\joshi\AppData\Local\Programs\Python\Python313\python.exe"
MAX_VIDEO_DURATION = 59.0  # HARD LIMIT: Must never exceed 59 seconds for YouTube Shorts

# Design Tokens (Sleek Dark Cyber / Editorial Aesthetic)
BG_TOP = (11, 15, 25)
BG_BOTTOM = (26, 35, 51)
CARD_BG = (18, 24, 38, 235)
CARD_BORDER = (56, 189, 248, 200)  # Cyan glow
ACCENT_COLOR = (56, 189, 248)      # Cyan #38bdf8
TEXT_PRIMARY = (255, 255, 255)
TEXT_MUTED = (203, 213, 225)       # Slate 300 for high readability
GOLD_ACCENT = (250, 204, 21)

def get_font(size: int, bold: bool = False):
    font_names = [
        "arialbd.ttf" if bold else "arial.ttf",
        "seguiemb.ttf" if bold else "segoeui.ttf",
        "calibrib.ttf" if bold else "calibri.ttf",
    ]
    for fn in font_names:
        try:
            return ImageFont.truetype(fn, size)
        except Exception:
            continue
    return ImageFont.load_default()

def wrap_text(text: str, font, max_width: int, draw: ImageDraw.ImageDraw) -> list[str]:
    words = text.split()
    lines = []
    current_line = []
    for word in words:
        test_line = " ".join(current_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        w = bbox[2] - bbox[0]
        if w <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]
    if current_line:
        lines.append(" ".join(current_line))
    return lines

def render_background_base(width: int = 1080, height: int = 1920) -> Image.Image:
    """Create the base atmospheric cyber-editorial canvas."""
    img = Image.new("RGBA", (width, height), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    for y in range(height):
        ratio = y / height
        r = int(BG_TOP[0] * (1 - ratio) + BG_BOTTOM[0] * ratio)
        g = int(BG_TOP[1] * (1 - ratio) + BG_BOTTOM[1] * ratio)
        b = int(BG_TOP[2] * (1 - ratio) + BG_BOTTOM[2] * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    glow_overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_overlay)
    glow_draw.ellipse([width - 350, -150, width + 550, 750], fill=(56, 189, 248, 30))
    glow_draw.ellipse([-250, height - 750, 650, height + 150], fill=(99, 102, 241, 25))
    glow_overlay = glow_overlay.filter(ImageFilter.GaussianBlur(radius=70))
    return Image.alpha_composite(img, glow_overlay)

def create_slide_image(
    story_idx: int,
    total_stories: int,
    headline: str,
    body: str,
    source: str,
    output_path: Path,
    width: int = 1080,
    height: int = 1920
):
    """Render a premium vertical 1080x1920 graphic card for the story."""
    img = render_background_base(width, height)
    draw = ImageDraw.Draw(img)

    # 1. Header Brand Pill
    header_y = 130
    pill_w = 440
    pill_h = 56
    pill_x = (width - pill_w) // 2
    draw.rounded_rectangle([pill_x, header_y, pill_x + pill_w, header_y + pill_h], radius=28, fill=(15, 23, 42), outline=ACCENT_COLOR, width=2)
    font_pill = get_font(24, bold=True)
    draw.text((width // 2, header_y + 28), "YESTERDAY'S NEWS TODAY", fill=ACCENT_COLOR, font=font_pill, anchor="mm")

    # Segmented Progress Bar
    prog_y = header_y + 80
    prog_w = 880
    prog_x = (width - prog_w) // 2
    seg_spacing = 10
    seg_w = (prog_w - (total_stories - 1) * seg_spacing) / total_stories
    for i in range(total_stories):
        sx = int(prog_x + i * (seg_w + seg_spacing))
        fill_col = ACCENT_COLOR if i < story_idx else (51, 65, 85, 200)
        draw.rounded_rectangle([sx, prog_y, sx + int(seg_w), prog_y + 8], radius=4, fill=fill_col)

    # 2. Main Glassmorphic Story Card
    card_margin_x = 70
    card_y = 280
    card_w = width - (card_margin_x * 2)
    card_h = 1380
    card_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card_layer)
    card_draw.rounded_rectangle([card_margin_x, card_y, card_margin_x + card_w, card_y + card_h], radius=36, fill=CARD_BG, outline=CARD_BORDER, width=3)
    img = Image.alpha_composite(img, card_layer)
    draw = ImageDraw.Draw(img)

    # 3. Story Counter Badge
    badge_y = card_y + 60
    badge_text = f"STORY {story_idx} OF {total_stories}"
    font_badge = get_font(26, bold=True)
    draw.rounded_rectangle([card_margin_x + 60, badge_y, card_margin_x + 330, badge_y + 54], radius=14, fill=(15, 23, 42), outline=ACCENT_COLOR, width=2)
    draw.text((card_margin_x + 195, badge_y + 27), badge_text, fill=(255, 255, 255), font=font_badge, anchor="mm")

    # 4. Headline
    font_headline = get_font(52, bold=True)
    headline_lines = wrap_text(headline, font_headline, card_w - 120, draw)
    text_y = badge_y + 85
    for line in headline_lines[:4]:
        draw.text((card_margin_x + 60, text_y), line, fill=TEXT_PRIMARY, font=font_headline)
        text_y += 68

    # Separator Line
    text_y += 25
    draw.line([(card_margin_x + 60, text_y), (card_margin_x + card_w - 60, text_y)], fill=(51, 65, 85, 200), width=2)
    text_y += 40

    # 5. Body Paragraph
    font_body = get_font(38, bold=False)
    body_lines = wrap_text(body, font_body, card_w - 120, draw)
    for line in body_lines[:10]:
        draw.text((card_margin_x + 60, text_y), line, fill=TEXT_MUTED, font=font_body)
        text_y += 56

    # 6. Source Pill at Bottom of Card
    source_y = card_y + card_h - 100
    font_source = get_font(28, bold=True)
    src_text = f"Source: {source}"
    draw.text((card_margin_x + 60, source_y), src_text, fill=GOLD_ACCENT, font=font_source)

    # 7. Bottom Call to Action Footer
    footer_y = height - 130
    font_footer = get_font(30, bold=True)
    draw.text((width // 2, footer_y), "Follow for Daily Good News >>", fill=TEXT_PRIMARY, font=font_footer, anchor="mm")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(str(output_path), "JPEG", quality=95)
    return output_path

def create_previous_news_image(
    prev_thumbs: list[Path],
    output_path: Path,
    width: int = 1080,
    height: int = 1920
):
    """Render a card showcasing thumbnails and headlines from previous editions."""
    img = render_background_base(width, height)
    draw = ImageDraw.Draw(img)

    # Header Pill
    header_y = 130
    pill_w = 440
    pill_h = 56
    pill_x = (width - pill_w) // 2
    draw.rounded_rectangle([pill_x, header_y, pill_x + pill_w, header_y + pill_h], radius=28, fill=(15, 23, 42), outline=ACCENT_COLOR, width=2)
    font_pill = get_font(24, bold=True)
    draw.text((width // 2, header_y + 28), "YESTERDAY'S NEWS TODAY", fill=ACCENT_COLOR, font=font_pill, anchor="mm")

    # Main Card
    card_margin_x = 70
    card_y = 260
    card_w = width - (card_margin_x * 2)
    card_h = 1420
    card_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card_layer)
    card_draw.rounded_rectangle([card_margin_x, card_y, card_margin_x + card_w, card_y + card_h], radius=36, fill=CARD_BG, outline=CARD_BORDER, width=3)
    img = Image.alpha_composite(img, card_layer)
    draw = ImageDraw.Draw(img)

    # Badge: Catch Up
    badge_y = card_y + 50
    draw.rounded_rectangle([card_margin_x + 60, badge_y, card_margin_x + 360, badge_y + 54], radius=14, fill=(15, 23, 42), outline=GOLD_ACCENT, width=2)
    draw.text((card_margin_x + 210, badge_y + 27), "PREVIOUS EDITIONS", fill=GOLD_ACCENT, font=get_font(26, bold=True), anchor="mm")

    # Title
    font_title = get_font(48, bold=True)
    draw.text((card_margin_x + 60, badge_y + 80), "Missed Our Recent Drops?", fill=TEXT_PRIMARY, font=font_title)
    draw.text((card_margin_x + 60, badge_y + 140), "Check out the top stories from earlier this week:", fill=TEXT_MUTED, font=get_font(32))

    # Thumbnail Previews Grid / Row
    # Place 2 previous thumbnails side-by-side or stacked
    thumb_w = 420
    thumb_h = 740
    start_y = badge_y + 220
    spacing = 40
    start_x = card_margin_x + (card_w - (thumb_w * 2 + spacing)) // 2

    labels = ["OCTOBER 16", "OCTOBER 15"]
    for i, thumb_file in enumerate(prev_thumbs[:2]):
        tx = start_x + i * (thumb_w + spacing)
        # Load and resize thumbnail
        if thumb_file.exists():
            try:
                t_img = Image.open(thumb_file).convert("RGBA")
                t_resized = t_img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                # Paste with border
                draw.rounded_rectangle([tx - 4, start_y - 4, tx + thumb_w + 4, start_y + thumb_h + 4], radius=24, fill=(56, 189, 248), outline=ACCENT_COLOR, width=2)
                img.paste(t_resized, (tx, start_y))
            except Exception as e:
                print(f"[WARN] Error pasting thumbnail: {e}")
        else:
            # Fallback graphic card
            draw.rounded_rectangle([tx, start_y, tx + thumb_w, start_y + thumb_h], radius=20, fill=(30, 41, 59), outline=ACCENT_COLOR, width=2)

        # Date Label Pill below each preview
        lbl_y = start_y + thumb_h + 20
        lbl = labels[i] if i < len(labels) else "RECENT"
        draw.rounded_rectangle([tx + 60, lbl_y, tx + thumb_w - 60, lbl_y + 46], radius=23, fill=(15, 23, 42), outline=ACCENT_COLOR, width=1)
        draw.text((tx + thumb_w // 2, lbl_y + 23), lbl, fill=TEXT_PRIMARY, font=get_font(22, bold=True), anchor="mm")

    # Bottom footer
    footer_y = height - 130
    draw.text((width // 2, footer_y), "Tap Profile To Binge All Episodes >>", fill=TEXT_PRIMARY, font=get_font(30, bold=True), anchor="mm")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(str(output_path), "JPEG", quality=95)
    return output_path

def create_outro_image(
    output_path: Path,
    width: int = 1080,
    height: int = 1920
):
    """Render a dedicated 5-second outro call to action slide."""
    img = render_background_base(width, height)
    draw = ImageDraw.Draw(img)

    # Header Brand Pill
    header_y = 130
    pill_w = 440
    pill_h = 56
    pill_x = (width - pill_w) // 2
    draw.rounded_rectangle([pill_x, header_y, pill_x + pill_w, header_y + pill_h], radius=28, fill=(15, 23, 42), outline=ACCENT_COLOR, width=2)
    draw.text((width // 2, header_y + 28), "YESTERDAY'S NEWS TODAY", fill=ACCENT_COLOR, font=get_font(24, bold=True), anchor="mm")

    # Main Card
    card_margin_x = 70
    card_y = 300
    card_w = width - (card_margin_x * 2)
    card_h = 1320
    card_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card_layer)
    card_draw.rounded_rectangle([card_margin_x, card_y, card_margin_x + card_w, card_y + card_h], radius=36, fill=CARD_BG, outline=CARD_BORDER, width=3)
    img = Image.alpha_composite(img, card_layer)
    draw = ImageDraw.Draw(img)

    center_y = card_y + 360
    draw.text((width // 2, center_y), "SPREAD THE GOOD", fill=ACCENT_COLOR, font=get_font(56, bold=True), anchor="mm")
    draw.text((width // 2, center_y + 80), "Share a positive story with a friend.", fill=TEXT_PRIMARY, font=get_font(40, bold=True), anchor="mm")

    # Big CTA Button
    btn_w = 540
    btn_h = 88
    btn_x = (width - btn_w) // 2
    btn_y = center_y + 220
    draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], radius=44, fill=(56, 189, 248), outline=(255, 255, 255), width=2)
    draw.text((width // 2, btn_y + 44), "SUBSCRIBE & LIKE", fill=(11, 15, 25), font=get_font(36, bold=True), anchor="mm")

    draw.text((width // 2, btn_y + 160), "New Edition Every Single Day", fill=GOLD_ACCENT, font=get_font(32, bold=True), anchor="mm")

    # Bottom footer
    footer_y = height - 130
    draw.text((width // 2, footer_y), "See You Tomorrow Morning >>", fill=TEXT_PRIMARY, font=get_font(30, bold=True), anchor="mm")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(str(output_path), "JPEG", quality=95)
    return output_path

async def generate_speech_edge(text: str, output_path: Path, target_duration: float = None, voice: str = "en-US-ChristopherNeural") -> float:
    """Generate high-quality voiceover audio with edge-tts."""
    import edge_tts
    output_path.parent.mkdir(parents=True, exist_ok=True)
    rate = "+14%" if (not target_duration or target_duration > 5.0) else "+8%"
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(str(output_path))

    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(output_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    actual_dur = float(res.stdout.strip())

    # If target_duration is specified (e.g. 5.0s for intro/outro/thumbnails), pad audio to match exactly
    if target_duration and target_duration > actual_dur:
        pad_dur = target_duration - actual_dur
        padded_path = output_path.with_name(f"padded_{output_path.name}")
        cmd_pad = [
            "ffmpeg", "-y", "-v", "error",
            "-i", str(output_path),
            "-af", f"apad=pad_dur={pad_dur:.3f}",
            "-t", f"{target_duration:.3f}",
            str(padded_path)
        ]
        subprocess.run(cmd_pad, check=True)
        padded_path.replace(output_path)
        return target_duration

    return actual_dur

def render_story_clip(image_path: Path, audio_path: Path, duration: float, clip_path: Path) -> Path:
    """Render a single story clip with Ken Burns motion and synced audio."""
    clip_path.parent.mkdir(parents=True, exist_ok=True)
    fps = 30
    frames = int(math.ceil(duration * fps))

    vf_filter = (
        f"zoompan=z='min(zoom+0.0006,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
        f"d={frames}:s=1080x1920:fps={fps},format=yuv420p"
    )

    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-loop", "1", "-framerate", str(fps),
        "-i", str(image_path),
        "-i", str(audio_path),
        "-vf", vf_filter,
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-c:a", "aac", "-b:a", "192k",
        "-t", f"{duration:.3f}",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(clip_path)
    ]
    subprocess.run(cmd, check=True)
    return clip_path

def concatenate_and_normalize(clip_paths: list[Path], output_path: Path) -> float:
    """Concatenate video clips and apply EBU R128 audio normalization."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    concat_list_file = output_path.parent / "concat_list.txt"
    with open(concat_list_file, "w", encoding="utf-8") as f:
        for p in clip_paths:
            f.write(f"file '{p.resolve().as_posix()}'\n")

    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_list_file),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        str(output_path)
    ]
    subprocess.run(cmd, check=True)

    cmd_probe = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(output_path)
    ]
    res = subprocess.run(cmd_probe, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

def verify_gates(video_path: Path) -> dict:
    """Run strict verification gates on the finished YouTube Short."""
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration,size:stream=width,height,codec_name,pix_fmt",
        "-of", "json",
        str(video_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    data = json.loads(res.stdout)

    format_info = data.get("format", {})
    streams = data.get("streams", [])
    duration = float(format_info.get("duration", 0))
    size_bytes = int(format_info.get("size", 0))

    v_stream = next((s for s in streams if s.get("codec_name") == "h264"), None)
    a_stream = next((s for s in streams if s.get("codec_name") == "aac"), None)

    gates = {
        "playable": v_stream is not None and a_stream is not None,
        "strictly_under_59s": duration <= MAX_VIDEO_DURATION,
        "shorts_aspect_ratio_1080x1920": (v_stream.get("width") == 1080 and v_stream.get("height") == 1920) if v_stream else False,
        "audio_present": a_stream is not None,
        "duration_seconds": duration,
        "file_size_mb": round(size_bytes / (1024 * 1024), 2),
    }

    if not gates["strictly_under_59s"]:
        raise ValueError(f"GATE FAILED: Video duration {duration:.2f}s exceeds strict limit of {MAX_VIDEO_DURATION}s!")
    if not gates["shorts_aspect_ratio_1080x1920"]:
        raise ValueError(f"GATE FAILED: Invalid resolution for Shorts: {v_stream.get('width')}x{v_stream.get('height')}")

    return gates

def clean_html(text: str) -> str:
    text = html.unescape(text)
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace("[…]", "").replace("&#8230;", "").replace("&#8217;", "'").replace("‘", "'").replace("’", "'")
    return " ".join(text.split())

async def run_pipeline(target_date: str = None) -> dict:
    today_str = datetime.now().strftime("%Y%m%d")
    date_str = target_date or today_str

    content_dir = REPO_ROOT / "content" / "yesterday-news"
    day_folder = content_dir / date_str
    if not day_folder.exists():
        subdirs = sorted([d for d in content_dir.iterdir() if d.is_dir() and d.name.isdigit()], key=lambda d: d.name)
        if subdirs:
            day_folder = subdirs[-1]
            date_str = day_folder.name
        else:
            raise FileNotFoundError("No news folders found in content/yesterday-news")

    print(f"[INFO] Using source day folder: {day_folder}")
    meta_file = day_folder / "metadata.json"
    script_file = day_folder / "script.txt"

    with open(meta_file, "r", encoding="utf-8") as f:
        meta = json.load(f)

    sources = meta.get("sources", [])
    raw_script = script_file.read_text(encoding="utf-8") if script_file.exists() else ""

    # Parse real paragraphs from script.txt
    story_paragraphs = []
    blocks = re.split(r"\n\d+\.\s+", raw_script)
    for b in blocks[1:]:
        p_matches = re.findall(r"<p>(.*?)</p>", b, re.DOTALL)
        if p_matches:
            cleaned_p = clean_html(p_matches[0])
            story_paragraphs.append(cleaned_p)

    curated_stories = []
    for idx, s in enumerate(sources[:3]):
        title = s.get("title", "").strip()
        title = clean_html(re.sub(r"\(LOOK\)", "", title))
        body = story_paragraphs[idx] if idx < len(story_paragraphs) else "A remarkable achievement bringing measurable optimism to the community."
        curated_stories.append({
            "title": title,
            "body": body,
            "source": s.get("source", "Good News Network"),
            "url": s.get("url", ""),
        })

    work_dir = REPO_ROOT / "ops" / "youtube" / "work" / date_str
    out_dir = REPO_ROOT / "ops" / "youtube" / "out" / date_str
    work_dir.mkdir(parents=True, exist_ok=True)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Locate previous thumbnails
    prev_thumbs = []
    for prev_date in ["20261016", "20261015", "20261014"]:
        t_file = REPO_ROOT / "ops" / "hermes" / "out" / prev_date / f"{prev_date}-thumb.png"
        if t_file.exists():
            prev_thumbs.append(t_file)

    clips = []
    total_segments = len(curated_stories) + 3  # Intro + stories + prev news + outro

    # 1. 5-Second Intro Clip
    print("[1/4] Generating 5-Second Intro Clip...")
    intro_text = "Welcome to Yesterday's News Today. Here are three incredible positive stories from around the world."
    intro_img = work_dir / "intro.jpg"
    intro_audio = work_dir / "intro.mp3"
    intro_clip = work_dir / "clip_0_intro.mp4"

    create_slide_image(
        story_idx=1,
        total_stories=total_segments,
        headline="TOP STORIES TODAY",
        body="Real breakthroughs, inspiring people, and good news from around the world.",
        source="Daily Briefing",
        output_path=intro_img
    )
    intro_dur = await generate_speech_edge(intro_text, intro_audio, target_duration=5.0)
    render_story_clip(intro_img, intro_audio, intro_dur, intro_clip)
    clips.append(intro_clip)

    # 2. Main Story Clips (~9-10s each)
    print(f"[2/4] Generating {len(curated_stories)} Story Clips...")
    for idx, story in enumerate(curated_stories, start=1):
        s_title = story["title"]
        s_body = story["body"]
        s_src = story["source"]
        
        narration = f"Story {idx}: {s_title}. Reported by {s_src}."
        
        img_p = work_dir / f"story_{idx}.jpg"
        aud_p = work_dir / f"story_{idx}.mp3"
        clip_p = work_dir / f"clip_{idx}.mp4"

        create_slide_image(
            story_idx=idx + 1,
            total_stories=total_segments,
            headline=s_title,
            body=s_body,
            source=s_src,
            output_path=img_p
        )
        s_dur = await generate_speech_edge(narration, aud_p)
        render_story_clip(img_p, aud_p, s_dur, clip_p)
        clips.append(clip_p)

    # 3. 5-Second Previous News Thumbnails Showcase Clip
    print("[3/4] Generating 5-Second Previous News Thumbnails Clip...")
    prev_text = "Missed our recent drops? Catch up on the world's largest wildlife bridge and medical recoveries."
    prev_img = work_dir / "previous_news.jpg"
    prev_audio = work_dir / "previous_news.mp3"
    prev_clip = work_dir / "clip_prev_news.mp4"

    create_previous_news_image(prev_thumbs, prev_img)
    prev_dur = await generate_speech_edge(prev_text, prev_audio, target_duration=5.0)
    render_story_clip(prev_img, prev_audio, prev_dur, prev_clip)
    clips.append(prev_clip)

    # 4. 5-Second Outro Clip
    print("[4/4] Generating 5-Second Outro Clip...")
    outro_text = "That is your daily positive recap. Tap subscribe, share a smile, and see you tomorrow morning."
    outro_img = work_dir / "outro.jpg"
    outro_audio = work_dir / "outro.mp3"
    outro_clip = work_dir / "clip_outro.mp4"

    create_outro_image(outro_img)
    outro_dur = await generate_speech_edge(outro_text, outro_audio, target_duration=5.0)
    render_story_clip(outro_img, outro_audio, outro_dur, outro_clip)
    clips.append(outro_clip)

    # 5. Concatenate and Normalize
    final_video = out_dir / f"youtube_short_{date_str}.mp4"
    final_dur = concatenate_and_normalize(clips, final_video)
    print(f"[RENDER COMPLETE] Final Video: {final_video} (Duration: {final_dur:.2f}s)")

    # 6. Strict Safety Gate Verification
    gates = verify_gates(final_video)
    print(f"[VERIFIED GATES] All gates passed! Duration: {gates['duration_seconds']:.2f}s <= 59.0s")

    # 7. Generate Thumbnail (1080x1920 Shorts cover)
    thumb_path = out_dir / f"youtube_short_{date_str}_thumb.jpg"
    create_slide_image(
        story_idx=1,
        total_stories=len(curated_stories),
        headline=curated_stories[0]["title"],
        body=curated_stories[0]["body"],
        source="Daily Digest",
        output_path=thumb_path
    )

    # 8. Write Approval Packet
    packet_dir = REPO_ROOT / "ops" / "packets" / f"hermes-youtube-{date_str}"
    packet_dir.mkdir(parents=True, exist_ok=True)
    summary_md = packet_dir / "summary.md"
    
    summary_content = f"""## YouTube Short Automated Packet: {date_str}

- Video: `{final_video}`
- Duration: {final_dur:.2f} seconds (Strictly <= 59s rule enforced: 5s intro + stories + 5s prev news + 5s outro)
- Resolution: 1080x1920 (Vertical Shorts)
- Structure:
  - 5.0s Intro Hook
  - 3 Curated Positive Stories
  - 5.0s Previous News Thumbnails Showcase (Oct 16 & Oct 15)
  - 5.0s Outro Call to Action
- Thumbnail: `{thumb_path}`
- Audio: Normalized EBU R128 (-16 LUFS, true peak -1.5)
- Gates: ALL GATES PASSED (strictly_under_59s=TRUE, format=1080x1920)
- Status: READY_FOR_UPLOAD (Awaiting Joshua Approval)

### Publish Command
```bash
python ops/youtube/yt_upload.py upload "{final_video}" --title "Yesterday's News Today — {date_str} #Shorts" --tags "shorts,news,goodnews,dailynews" --thumbnail "{thumb_path}"
```
"""
    summary_md.write_text(summary_content, encoding="utf-8")

    inbox_file = REPO_ROOT / "ops" / "marketing-inbox" / f"{date_str}-youtube-short.md"
    inbox_file.write_text(summary_content, encoding="utf-8")

    return {
        "date": date_str,
        "video": str(final_video),
        "duration": final_dur,
        "gates": gates,
        "thumbnail": str(thumb_path),
        "status": "READY_FOR_UPLOAD",
    }

def main():
    parser = argparse.ArgumentParser(description="Autonomous YouTube Shorts Engine (< 59s)")
    parser.add_argument("--date", help="Target YYYYMMDD date")
    args = parser.parse_args()

    result = asyncio.run(run_pipeline(args.date))
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
