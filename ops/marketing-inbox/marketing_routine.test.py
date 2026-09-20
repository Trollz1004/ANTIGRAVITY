"""Pytest-style smoke test for marketing_routine.py.

This is a pure-Python test suite (no vitest). Run:

    python -m pytest ops/marketing-inbox/marketing_routine.test.py -v

Or directly:

    python ops/marketing-inbox/marketing_routine.test.py

The tests assert the local score_copy() and sanitize() match JARVIS's
official SlopMonster-derived copy-score rubric on known fixtures, so
that future drafts produced by the marketing_routine.py cron will pass
JARVIS's check at proposal-filing time.
"""
from __future__ import annotations

import importlib.util
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent.resolve()
ROUTINE = HERE / "marketing_routine.py"
spec = importlib.util.spec_from_file_location("marketing_routine", ROUTINE)
mr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mr)  # type: ignore

# --- fixtures ---

# A clean paragraph should score 5/5 with no trips.
CLEAN = (
    "DREAM Online shipped a new patch this week. It fixes three bugs "
    "and adds a settings screen. Users noticed a faster load time."
)

# The canonical dirty paragraph that exercises every category.
DIRTY = (
    "Delve into our seamless, robust platform — it will unlock — and leverage "
    "— your potential — today! When it comes to results, at the end of the day, "
    "our bespoke, meticulously crafted, curated toolkit helps you to streamline "
    "your workflow. Our service is fast, reliable, and affordable for everyone. "
    "Imagine a world where youandinotai.com makes dating human again. "
    "Whether you're 25 or 55, the journey of finding a real connection should "
    "be effortless and transformative. Say goodbye to bots with our "
    "game-changing verification. Our holistic paradigm shift will revolutionize "
    "dating. Whether you're skeptical or hopeful, level up your love life today. "
    "Buckle up and let's dive in. Join 12,000 happy customers who trust our "
    "platform."
)


# --- tests ---

def test_score_copy_clean_returns_5():
    score, tripped = mr.score_copy(CLEAN)
    assert score == 5, f"expected 5, got {score} with {tripped}"
    assert tripped == []


def test_score_copy_dirty_returns_low():
    score, tripped = mr.score_copy(DIRTY)
    assert score < 5, f"dirty should score < 5, got {score}"
    cats = {c for c, _ in tripped}
    assert "vocab" in cats
    assert "punctuation" in cats
    assert "phrases" in cats
    assert "rhythm" in cats
    assert "proof" in cats


def test_clean_to_score_5_lifts_dirty_to_5():
    clean, replacements, score = mr.clean_to_score_5(DIRTY)
    assert score == 5, f"expected 5 after cleaning, got {score}"
    assert replacements > 0
    # The cleaned text should not contain the canonical dirty tokens.
    lower = clean.lower()
    for banned in ["delve", "seamless", "robust", "unlock", "leverage",
                   "bespoke", "meticulously", "crafted", "curated",
                   "streamline", "holistic", "paradigm", "game-changing",
                   "level up", "buckle up"]:
        assert banned not in lower, f"cleaned text still contains '{banned}'"
    # The invented proof number must be gone.
    assert "12,000" not in clean
    # Rule-of-three should be broken: "fast, reliable, and affordable" should
    # no longer match the tricolon pattern.
    score_after, _ = mr.score_copy(clean)
    assert score_after == 5


def test_sanitize_replaces_vocab():
    text = "Our robust platform will streamline your dating experience."
    clean, n = mr.sanitize(text)
    assert "robust" not in clean.lower()
    assert "streamline" not in clean.lower()
    assert n >= 2


def test_sanitize_breaks_tricolon_with_oxford_comma():
    text = "Our service is fast, reliable, and affordable."
    clean, n = mr.sanitize(text)
    # The tricolon must no longer match: either "fast and reliable affordable"
    # or some other 4+ char restructure. Easiest check is via score_copy.
    score, tripped = mr.score_copy(clean)
    rhythm = [r for c, r in tripped if c == "rhythm"]
    assert not rhythm, f"tricolon still trips: {rhythm}"
    assert n >= 1


def test_sanitize_strips_invented_proof():
    text = "Join 12,000 happy customers today."
    clean, n = mr.sanitize(text)
    assert "12,000" not in clean
    score, tripped = mr.score_copy(clean)
    proof = [r for c, r in tripped if c == "proof"]
    assert not proof, f"proof still trips: {proof}"


def test_sanitize_caps_em_dashes_per_sentence():
    text = "Look into this — it is — really — important."
    clean, n = mr.sanitize(text)
    # After capping at 1 em-dash per sentence, the cleaned text has
    # at most 1 em-dash per sentence. For a single sentence with 3
    # em-dashes the result should split into multiple sentences with
    # at most 1 em-dash each.
    score, tripped = mr.score_copy(clean)
    punct = [r for c, r in tripped if c == "punctuation" and "em-dash" in r]
    assert not punct, f"em-dash still trips: {punct}"


def test_sanitize_idempotent_when_already_clean():
    text = "Plain copy. Two sentences. No banned words."
    clean, n = mr.sanitize(text)
    # Clean input should remain clean and not increase the trip count.
    assert n == 0 or n < 5  # may strip harmless phrases; the point is no score drop
    score, _ = mr.score_copy(clean)
    assert score == 5


def test_sanitize_handles_inflected_banned_words():
    # 'streamlined', 'fostering', 'showcases' must all be caught.
    text = "Our streamlined app showcases a curated experience, fostering real connections."
    clean, n = mr.sanitize(text)
    for w in ["streamlined", "showcases", "curated", "fostering"]:
        assert w.lower() not in clean.lower(), f"inflected '{w}' not stripped"
    assert n >= 4


def test_sanitize_strips_minor_adjacent_terms():
    # 18+ venue check rejects any mention of kids/teens/students etc.
    text = "Don't treat it like talking to a kid. Most students under 25 struggle with apps."
    out, _n = mr.sanitize(text)
    for term in ("kid", "kids", "teen", "teens", "student", "students", "minor", "child"):
        assert term not in out.lower(), f"{term!r} still present in {out!r}"


def test_score_copy_handles_empty():
    score, tripped = mr.score_copy("")
    assert score == 5
    assert tripped == []


def test_score_copy_handles_punctuation_density():
    # 4 semicolons in 60 chars should trip punctuation.
    text = "Fast; reliable; simple; easy; done. " * 2
    score, tripped = mr.score_copy(text)
    assert any(c == "punctuation" for c, _ in tripped)


def test_clean_to_score_5_max_iters_safe():
    # Even when the rubric is impossible to satisfy (e.g. every word is
    # banned), the function must not hang or crash. It returns the best
    # attempt.
    text = "delve seamless robust elevate unlock unleash empower streamline holistic"
    clean, _n, score = mr.clean_to_score_5(text, max_iters=2)
    assert isinstance(clean, str)
    assert isinstance(score, int)
    assert 0 <= score <= 5


# --- Reddit-specific tests ---

def test_reddit_subreddits_constant():
    assert mr.REDDIT_SUBREDDITS == ["dating_advice", "OnlineDating", "dating"]


def test_next_reddit_topic_returns_a_string():
    t = mr.next_reddit_topic()
    assert isinstance(t, str)
    assert t in mr.REDDIT_TOPICS


def test_next_reddit_topic_skips_already_filed():
    # Mark the first reddit topic as used and confirm we get a different one.
    first = mr.next_reddit_topic()
    marker = mr.INBOX / "reddit_topics_filed.txt"
    marker.parent.mkdir(parents=True, exist_ok=True)
    with marker.open("a", encoding="utf-8") as f:
        f.write(first.lower() + "\n")
    try:
        second = mr.next_reddit_topic()
        assert second != first
        assert second in mr.REDDIT_TOPICS
    finally:
        # Clean up: remove the marker we added so we don't pollute future runs.
        if marker.exists():
            lines = marker.read_text(encoding="utf-8").splitlines()
            kept = [l for l in lines if l.strip().lower() != first.lower()]
            if kept:
                marker.write_text("\n".join(kept) + "\n", encoding="utf-8")
            else:
                marker.unlink()


def test_next_subreddit_round_robins():
    seen = set()
    for _ in range(20):
        seen.add(mr.next_subreddit())
    assert seen.issubset(set(mr.REDDIT_SUBREDDITS))


def test_brand_mention_check_excludes_footer():
    # The footer line is REQUIRED by Fable's rubric and must NOT trip the
    # brand-mention heuristic. Only an actual brand mention in the body
    # should fire the warning.
    text = "Some discussion about dating apps in general. " + mr.ADULT_FOOTER
    body_only = re.sub(re.escape(mr.ADULT_FOOTER), "", text, flags=re.IGNORECASE).lower()
    assert body_only.count("youandinotai.com") == 0


def test_brand_mention_check_catches_actual_mention():
    # An actual brand mention in the body (not the footer) should fire.
    text = "Try youandinotai.com today for a better experience. " + mr.ADULT_FOOTER
    body_only = re.sub(re.escape(mr.ADULT_FOOTER), "", text, flags=re.IGNORECASE).lower()
    assert body_only.count("youandinotai.com") == 1


# --- X / Twitter tests ---

def test_x_topics_constant_is_nonempty():
    assert isinstance(mr.X_TOPICS, list)
    assert len(mr.X_TOPICS) >= 20
    for t in mr.X_TOPICS:
        assert isinstance(t, str)
        assert len(t) > 5


def test_next_x_topic_returns_string():
    t = mr.next_x_topic()
    assert isinstance(t, str)
    assert t in mr.X_TOPICS


def test_x_topic_marker_isolated_from_other_topics():
    # Mark one X topic as used; confirm we get a different one next.
    first = mr.next_x_topic()
    marker = mr.INBOX / "x_topics_filed.txt"
    marker.parent.mkdir(parents=True, exist_ok=True)
    with marker.open("a", encoding="utf-8") as f:
        f.write(first.lower() + "\n")
    try:
        second = mr.next_x_topic()
        assert second != first
        assert second in mr.X_TOPICS
    finally:
        if marker.exists():
            lines = marker.read_text(encoding="utf-8").splitlines()
            kept = [l for l in lines if l.strip().lower() != first.lower()]
            if kept:
                marker.write_text("\n".join(kept) + "\n", encoding="utf-8")
            else:
                marker.unlink()


def test_footer_strip_handles_inline_footer():
    # When sanitize() collapses newlines, the footer ends up on the same
    # line as the prose. The strip regex must NOT eat the prose.
    body = "Real prose that we want to keep. " + mr.ADULT_FOOTER
    out = re.sub(r"(?im)\s*\byouandinotai\.com is for adults 18 and over\.\s*$", "", body).strip()
    assert "Real prose" in out, f"prose was eaten by regex: {out!r}"
    assert "youandinotai" not in out.lower(), f"footer not stripped: {out!r}"


def test_footer_strip_handles_standalone_footer():
    # When the footer is on its own line, the strip regex should remove
    # only the footer line.
    body = "Real prose.\n\n" + mr.ADULT_FOOTER
    out = re.sub(r"(?im)\s*\byouandinotai\.com is for adults 18 and over\.\s*$", "", body).strip()
    assert "Real prose" in out
    assert "youandinotai" not in out.lower()


def test_footer_strip_handles_no_footer():
    # No footer present: regex is a no-op.
    body = "Just prose, no footer."
    out = re.sub(r"(?im)\s*\byouandinotai\.com is for adults 18 and over\.\s*$", "", body).strip()
    assert out == body


if __name__ == "__main__":
    failed = 0
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print(f"  PASS  {name}")
                passed += 1
            except AssertionError as e:
                print(f"  FAIL  {name}: {e}")
                failed += 1
            except Exception as e:
                print(f"  ERROR {name}: {type(e).__name__}: {e}")
                failed += 1
    print(f"\n{passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)
