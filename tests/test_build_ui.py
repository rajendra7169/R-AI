#!/usr/bin/env python3
"""
Verify Shared/scripts/build-ui.py reproduces Shared/FastChatUI.html
byte-for-byte from ui-src/. Catches accidental drift when someone edits the
checked-in HTML directly without updating the source files (or vice versa).
"""
from __future__ import annotations

import hashlib
import importlib.util
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SHARED = REPO_ROOT / "Shared"
FASTCHAT = SHARED / "FastChatUI.html"
BUILD_SCRIPT = SHARED / "scripts" / "build-ui.py"


def _load_build_module():
    spec = importlib.util.spec_from_file_location("build_ui", BUILD_SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class BuildUITests(unittest.TestCase):
    def test_build_matches_checked_in_html(self):
        if not FASTCHAT.is_file():
            self.skipTest("FastChatUI.html not present")
        mod = _load_build_module()
        rebuilt = mod.build()
        with open(FASTCHAT, "r", encoding="utf-8", newline="") as f:
            current = f.read()
        if rebuilt != current:
            rebuilt_sha = hashlib.sha256(rebuilt.encode("utf-8")).hexdigest()
            current_sha = hashlib.sha256(current.encode("utf-8")).hexdigest()
            self.fail(
                "ui-src/ no longer reproduces FastChatUI.html. "
                f"rebuilt={rebuilt_sha}  current={current_sha}. "
                "Run: python Shared/scripts/build-ui.py"
            )


if __name__ == "__main__":
    unittest.main()
