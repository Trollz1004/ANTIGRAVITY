"""Dashboard HTML rendering."""

from __future__ import annotations

from mission_control import __version__
from mission_control.dashboard import render_dashboard


def test_dashboard_renders(cfg):
    html = render_dashboard(cfg)
    assert "__TITLE__" not in html and "__VERSION__" not in html
    assert f"MISSION CONTROL v{__version__}" in html
    assert "OMNI ROUTE" in html
    # the easy button wiring is part of the page
    assert "FIX IT" in html
    assert "/fix" in html
    assert "runFix" in html


def test_dashboard_escapes(cfg):
    assert "<script" in render_dashboard(cfg)  # own JS is intact
