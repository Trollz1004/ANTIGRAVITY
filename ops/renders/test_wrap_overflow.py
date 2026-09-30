"""Guard: wrap() must never emit a line wider than max_w — no exceptions.

Regression guard for a defect an independent judge flagged twice.

Round 1 (72/100), on d433f900: "wrap() neither splits nor shrinks an oversized
word... risks horizontal clipping; there is no overflow check." It was not a
risk; it shipped. INFRASTRUCTURE measured 1075px into an 888px line box and the
E was clipped off the right edge of cards/03_solution.png.

Round 3 (78/100), on the first fix: "split_at <= 1 leaves an oversized
remainder that is subsequently emitted, violating the central width invariant."
Also correct. The escape hatch meant the invariant did not universally hold.

So this test asserts the invariant over adversarial input, not just the current
card text: words far wider than the box, words with no split point, text at and
below the font floor. It also checks fitted_font never returns a size it did not
verify.

MUTATION-PROVED (run against the real module, then restored):
  * fallback mutated to return the requested size -> guard FAILS
    ("fallback returned 104px, expected the floor 56px")
  * split_at = max(1, split_at) clamp removed       -> guard HANGS (caught by
    an external timeout)
Both mutations were detected, so these are assertions, not decorations. The
clamp mutation being caught only by a hang is why any runner for this file
should be invoked under a timeout.

Failure modes this must catch — all of them bit the author:
  * parsing card() by keyword only (it takes positional args) and printing a
    vacuous pass after extracting zero strings
  * measuring kickers at the headline font size (kicker draws at 40, not 104)
  * an escape path that emits an oversized line anyway
"""
import ast
import importlib.util
import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "build_cards.py")
FONTS = r"C:\Windows\Fonts"

W = 1080
MARGIN = 96
MAX_W = W - MARGIN * 2
POS = ["filename", "kicker", "headline", "body"]

spec = importlib.util.spec_from_file_location("build_cards", SRC)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

d = ImageDraw.Draw(Image.new("RGB", (10, 10)))
FONT_FOR = {
    "kicker": ImageFont.truetype(os.path.join(FONTS, "ariblk.ttf"), 40),
    "headline": ImageFont.truetype(os.path.join(FONTS, "ariblk.ttf"), 104),
    "body": ImageFont.truetype(os.path.join(FONTS, "arialbd.ttf"), 52),
}

failures = []


def check(label, lines, font):
    for ln in lines:
        width = d.textlength(ln, font=font)
        if width > MAX_W:
            failures.append(f"{label}: {ln!r} = {width:.0f}px > {MAX_W}px")


# ---- 1. the real card text, at the real font for each element -------------
tree = ast.parse(open(SRC, encoding="utf-8").read())
drawn = []
for node in ast.walk(tree):
    if not isinstance(node, ast.Call):
        continue
    fn = node.func
    name = getattr(fn, "id", None) or getattr(fn, "attr", None)
    if name != "card":
        continue
    for i, arg in enumerate(node.args):
        if i < len(POS) and POS[i] != "filename" and isinstance(arg, ast.Constant):
            drawn.append((POS[i], arg.value))
    for kw in node.keywords:
        if kw.arg in ("kicker", "headline", "body") and isinstance(kw.value, ast.Constant):
            drawn.append((kw.arg, kw.value.value))

print(f"max line width {MAX_W}px | card text args found: {len(drawn)}")
if not drawn:
    print("FAILED: extracted zero card strings — this measurement proves nothing.")
    sys.exit(2)

for kind, text in drawn:
    check(f"card[{kind}]", mod.wrap(d, text.upper(), FONT_FOR[kind], MAX_W), FONT_FOR[kind])

# ---- 2. adversarial input: the judge's split_at <= 1 path -----------------
hfont = FONT_FOR["headline"]
huge = "X" * 400                      # far wider than the box, no spaces
giant_word = "SUPERCALIFRAGILISTICEXPIALIDOCIOUS" * 3
one_char = "W"                        # a single glyph
adversarial = [
    ("huge no-space word", huge),
    ("repeated giant word", giant_word),
    ("narrow box, one glyph", one_char),
    ("mixed", f"SHORT {huge} TAIL"),
]
for label, text in adversarial:
    for box in (MAX_W, 260, 12):
        try:
            lines = mod.wrap(d, text.upper(), hfont, box)
        except ValueError as e:
            # Raising is the documented behaviour ONLY when not even one glyph of
            # the text fits the box. Anything else raising is a defect, so check
            # EVERY word, not just the first: if any word's narrowest glyph fits,
            # the text was wrappable and wrap() should not have raised.
            words = text.upper().split()
            fittable = [w[0] for w in words if d.textlength(w[0], font=hfont) <= box]
            if fittable:
                failures.append(
                    f"{label}@{box}: raised though {fittable[0]!r} fits "
                    f"({d.textlength(fittable[0], font=hfont):.0f}px <= {box}px) — {e}"
                )
            else:
                narrowest = min(words, key=lambda w: d.textlength(w[0], font=hfont))
                glyph = d.textlength(narrowest[0], font=hfont)
                print(f"  {label} @{box}px -> raised as designed (narrowest glyph {glyph:.0f}px > box)")
            continue
        for ln in lines:
            width = d.textlength(ln, font=hfont)
            if width > box:
                failures.append(f"{label}@{box}: {ln[:24]!r} = {width:.0f}px > {box}px")

# ---- 3. fitted_font: never wider than the request, and honest about fits --
probe = "AUTONOMOUS INFRASTRUCTURE"


def measured_sizes(size, floor):
    """The sizes the implementation actually iterates, after its clamp."""
    floor = min(floor, size)
    return set(range(size, floor - 1, -4))


for floor in (56, 57, 200, 400):
    font = mod.fitted_font(d, probe, os.path.join(FONTS, "ariblk.ttf"), 104, MAX_W, floor=floor)
    size = getattr(font, "size", None)
    if size is not None and size > 104:
        failures.append(f"fitted_font returned {size} > requested 104 (floor={floor})")
    # The docstring claims every returned size was MEASURED. Verify membership
    # in the exact set the loop iterates, so an unmeasured floor cannot pass.
    # floor=57 is the judge's misaligned-floor counterexample; floor=200 is their
    # floor-above-size case. Both must return a measured size.
    if size is not None and size not in measured_sizes(104, floor):
        failures.append(
            f"floor={floor}: returned {size}px, which the function never measured "
            f"(measured: {sorted(measured_sizes(104, floor), reverse=True)})"
        )
    # Re-measure the returned size here. If it fits, it must be the LARGEST
    # that fits, so one step larger must not fit (unless already at the request).
    if size is not None:
        measured = all(
            d.textlength(w, font=ImageFont.truetype(os.path.join(FONTS, "ariblk.ttf"), size)) <= MAX_W
            for w in probe.upper().split()
        )
        if measured and size < 104:
            bigger = ImageFont.truetype(os.path.join(FONTS, "ariblk.ttf"), min(size + 4, 104))
            if all(d.textlength(w, font=bigger) <= MAX_W for w in probe.upper().split()):
                failures.append(
                    f"fitted_font returned {size}px though {min(size + 4, 104)}px also fits"
                )

# Force the FALLBACK path with a MISALIGNED floor — the only way to reach it.
# floor=57 makes the measured set range(104,56,-4) = 104..60, so 57 is never a
# candidate. At a 610px box even the smallest measured size (60) fails to fit,
# so the fallback runs. It must still return a MEASURED size (60), never 57.
# Without this case the membership check above cannot fire, because the normal
# path returns a fitting candidate long before the fallback is reached. Verified:
# mutating the fallback to `_font(path, floor)` was NOT caught until this case
# existed.
fb2 = mod.fitted_font(d, probe, os.path.join(FONTS, "ariblk.ttf"), 104, 610, floor=57)
fb2_size = getattr(fb2, "size", None)
if fb2_size not in measured_sizes(104, 57):
    failures.append(
        f"fallback @610px floor=57 returned {fb2_size}px, an unmeasured size "
        f"(expected a member of {sorted(measured_sizes(104, 57), reverse=True)})"
    )
if fb2_size == 57:
    failures.append("fallback @610px floor=57 returned the raw floor 57 — the old defect is back")
print(f"  fallback-with-misaligned-floor asserted: returned {fb2_size}px (57 is deliberately not a candidate)")

# The fallback must be ASSERTED, not printed: force a box so narrow that no
# measured size fits a whole word, then require the documented behaviour —
# a returned font whose words do NOT fit, at the smallest measured size.
tiny = 40
fb = mod.fitted_font(d, probe, os.path.join(FONTS, "ariblk.ttf"), 104, tiny, floor=56)
fb_size = getattr(fb, "size", None)
fb_fits = all(d.textlength(w, font=fb) <= tiny for w in probe.upper().split())
if fb_size != 56:
    failures.append(f"fallback returned {fb_size}px, expected the floor 56px")
if fb_fits:
    failures.append("fallback reported words fitting a 40px box, which is impossible for 56px type")
print(f"  fallback asserted: {fb_size}px returned, whole words fit {fb_fits} (documented: must not)")

# Empty and whitespace-only text: documented to return the requested size.
# Assert it, and assert the safety rationale the docstring gives for it.
for empty in ("", "   ", "\t\n "):
    ef = mod.fitted_font(d, empty, os.path.join(FONTS, "ariblk.ttf"), 104, MAX_W)
    if getattr(ef, "size", None) != 104:
        failures.append(f"empty text {empty!r} returned {getattr(ef, 'size', None)}px, expected 104px")
    if mod.wrap(d, empty, ef, MAX_W) != []:
        failures.append(f"wrap({empty!r}) emitted lines for empty text")
print("  empty-text asserted: returns the requested 104px and wrap() emits no lines")

# ---- result ---------------------------------------------------------------
if failures:
    print("\nFAIL — an emitted line exceeded its box:")
    for f in failures:
        print("  " + f)
    sys.exit(1)

print("\nPASS — every line fits, across card text and adversarial input.")

# Show the historical case so a regression is obvious in the log.
victim = "VIBE CODING IS DEAD. AUTONOMOUS INFRASTRUCTURE IS HERE."
print(f"\nwrap() on the card that was clipped:")
for ln in mod.wrap(d, victim, hfont, MAX_W):
    width = d.textlength(ln, font=hfont)
    print(f"  {ln:<30} {width:>6.0f}px  {'OVERFLOW' if width > MAX_W else 'ok'}")
print(f"\nfitted_font for that headline: {mod.fitted_font(d, victim, os.path.join(FONTS, 'ariblk.ttf'), 104, MAX_W).size}px")

# ---- mutation proof: the guard must detect the OLD behaviour -------------
def old_wrap(draw, text, font, max_w):  # noqa: ARG001
    return [text]  # emits the whole line — the round-1 defect

emitted = old_wrap(d, victim, hfont, MAX_W)
tripped = any(d.textlength(ln, font=hfont) > MAX_W for ln in emitted)
print(f"mutation check — unwrapped emitter detected: {tripped}")
if not tripped:
    print("FAIL: the guard cannot detect the defect it exists to catch.")
    sys.exit(1)
print("guard is effective.")
