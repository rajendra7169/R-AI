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

INCLUDE_RE = re.compile(r"^(?P<indent>\s*)\{\{INCLUDE:\s*(?P<path>[^}]+?)\s*\}\}\s*$")


def _read_text(path: Path) -> str:
    with open(path, "r", encoding="utf-8", newline="") as f:
        return f.read()


def build() -> str:
    if not TEMPLATE.is_file():
        raise FileNotFoundError(f"Missing template: {TEMPLATE}")
    lines = _read_text(TEMPLATE).splitlines(keepends=True)
    out_lines: list[str] = []
    for line in lines:
        m = INCLUDE_RE.match(line.rstrip("\r\n"))
        if not m:
            out_lines.append(line)
            continue
        include_path = (UI_SRC / m.group("path")).resolve()
        if not str(include_path).startswith(str(UI_SRC.resolve())):
            raise ValueError(f"Refusing to include outside ui-src/: {include_path}")
        out_lines.append(_read_text(include_path))
        if not out_lines[-1].endswith("\n"):
            out_lines.append("\n")
    return "".join(out_lines)


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
