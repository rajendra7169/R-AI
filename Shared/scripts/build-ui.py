#!/usr/bin/env python3
"""
Concatenate Shared/ui-src/* into Shared/FastChatUI.html.

The UI ships as a single HTML file so the runtime stays zero-build. Source
files in ui-src/ are kept split for editability; this script glues them back
together. Template lines of the form

    {{INCLUDE: relative/path}}

are replaced verbatim with the contents of that file (path is relative to
ui-src/). Indentation on the include line is preserved.
"""
from __future__ import annotations

import argparse
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UI_SRC = ROOT / "ui-src"
TEMPLATE = UI_SRC / "template.html"
OUTPUT = ROOT / "FastChatUI.html"

# Matches both single-line `{{INCLUDE: path}}` markers AND Prettier-reformatted
# variants that split the braces across lines (e.g. "{\n  {\n    INCLUDE: path;\n  }\n}").
# The single-line form is the canonical one; the multi-line form is just a
# defensive recovery so an over-eager auto-formatter can't silently break the
# build. Each match consumes the full block including surrounding whitespace.
INCLUDE_RE = re.compile(r"^(?P<indent>\s*)\{\{INCLUDE:\s*(?P<path>[^}]+?)\s*\}\}\s*$")
INCLUDE_BLOCK_RE = re.compile(
    r"\{\s*\{\s*INCLUDE:\s*(?P<path>[A-Za-z0-9_./\-]+)\s*;?\s*\}\s*\}",
    re.DOTALL,
)


def _read_text(path: Path) -> str:
    with open(path, "r", encoding="utf-8", newline="") as f:
        return f.read()


def _inline(path_str: str) -> str:
    include_path = (UI_SRC / path_str.strip()).resolve()
    if not str(include_path).startswith(str(UI_SRC.resolve())):
        raise ValueError(f"Refusing to include outside ui-src/: {include_path}")
    body = _read_text(include_path)
    return body if body.endswith("\n") else body + "\n"


def build() -> str:
    if not TEMPLATE.is_file():
        raise FileNotFoundError(f"Missing template: {TEMPLATE}")
    raw = _read_text(TEMPLATE)
    # First pass: single-line `{{INCLUDE: path}}` markers (the canonical form).
    out_lines: list[str] = []
    for line in raw.splitlines(keepends=True):
        m = INCLUDE_RE.match(line.rstrip("\r\n"))
        if m:
            out_lines.append(_inline(m.group("path")))
        else:
            out_lines.append(line)
    text = "".join(out_lines)
    # Second pass: recover any markers that an auto-formatter split across
    # lines (e.g. Prettier turning `{{INCLUDE: app.js}}` into a multi-line
    # object literal). Match the broken form and replace with the file body.
    def _replace(match: re.Match) -> str:
        return _inline(match.group("path"))
    text = INCLUDE_BLOCK_RE.sub(_replace, text)
    return text


def main() -> int:
    parser = argparse.ArgumentParser(description="Build FastChatUI.html from ui-src/.")
    parser.add_argument("--check", action="store_true",
                        help="Print sha256 of the build output and exit without writing.")
    parser.add_argument("--out", default=str(OUTPUT),
                        help=f"Output path (default: {OUTPUT}).")
    args = parser.parse_args()

    content = build()
    digest = hashlib.sha256(content.encode("utf-8")).hexdigest()

    if args.check:
        print(f"sha256 {digest}  ({len(content)} bytes)")
        return 0

    with open(args.out, "w", encoding="utf-8", newline="") as f:
        f.write(content)
    print(f"Wrote {args.out} ({len(content)} bytes, sha256 {digest})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
