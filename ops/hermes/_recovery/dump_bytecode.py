"""Freeze everything recoverable out of the orphaned .pyc files.

The newsvideo/*.py and scripts/hermes-youtube/*.py sources were deleted; the
compiled bytecode is the only surviving copy of the daily pipeline. A Python
minor-version upgrade would make these .pyc unloadable and the loss permanent,
so dump a version-proof text record (disassembly + docstrings + string
constants) next to the raw bytes.
"""

from __future__ import annotations

import dis
import importlib.util
import io
import marshal
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[2]

SOURCES = [
    REPO / "ops" / "hermes" / "newsvideo",
    REPO / "scripts" / "hermes-youtube",
]


def walk_codes(code, depth=0):
    yield depth, code
    for const in code.co_consts:
        if hasattr(const, "co_code"):
            yield from walk_codes(const, depth + 1)


def dump(pyc: pathlib.Path, out_dir: pathlib.Path) -> str:
    raw = pyc.read_bytes()
    report = io.StringIO()
    w = report.write

    w(f"# {pyc.name}\n\n")
    w(f"bytes: {len(raw)}\n")
    w(f"magic: {raw[:4].hex()} (this interpreter: {importlib.util.MAGIC_NUMBER.hex()})\n")
    w(f"magic matches: {raw[:4] == importlib.util.MAGIC_NUMBER}\n\n")

    try:
        code = marshal.loads(raw[16:])
    except Exception as exc:  # unloadable bytecode is exactly what we are guarding against
        w(f"UNMARSHALLABLE: {exc!r}\n")
        (out_dir / f"{pyc.stem}.txt").write_text(report.getvalue(), encoding="utf-8")
        return f"{pyc.name}: UNMARSHALLABLE"

    w("## docstrings\n\n")
    for depth, c in walk_codes(code):
        doc = c.co_consts[0] if c.co_consts else None
        if isinstance(doc, str):
            w(f"{'  ' * depth}{c.co_name}:\n{doc}\n\n")

    w("## string constants\n\n")
    seen = set()
    for _, c in walk_codes(code):
        for const in c.co_consts:
            if isinstance(const, str) and const not in seen:
                seen.add(const)
                w(f"{const!r}\n")

    w("\n## disassembly\n\n")
    buf = io.StringIO()
    dis.dis(code, file=buf, depth=None)
    w(buf.getvalue())

    (out_dir / f"{pyc.stem}.txt").write_text(report.getvalue(), encoding="utf-8")
    names = [c.co_name for c in code.co_consts if hasattr(c, "co_code")]
    return f"{pyc.name}: {len(names)} top-level defs -> {', '.join(names)}"


def main() -> int:
    total = 0
    for src in SOURCES:
        if not src.is_dir():
            print(f"skip (missing): {src}")
            continue
        out_dir = HERE / "bytecode" / src.name
        out_dir.mkdir(parents=True, exist_ok=True)
        for pyc in sorted(src.glob("*.pyc")):
            print(dump(pyc, out_dir))
            total += 1
    print(f"\ndumped {total} modules under {HERE / 'bytecode'}")
    return 0 if total else 1


if __name__ == "__main__":
    sys.exit(main())
