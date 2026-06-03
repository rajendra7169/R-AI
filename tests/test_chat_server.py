#!/usr/bin/env python3
"""
Smoke tests for Shared/chat_server.py.

Covers the bits most likely to regress when someone edits the server:
- access-token generation + persistence
- chat persistence round-trip
- chat persistence is incremental (unchanged chats aren't rewritten)
- legacy chats.json migrates into per-chat files exactly once
- chat-hash stability for the diff check

We import chat_server as a module and monkey-patch its data paths to a tmpdir
so the tests do not touch the real Shared/chat_data/.
"""
from __future__ import annotations

import importlib
import os
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SHARED = REPO_ROOT / "Shared"
sys.path.insert(0, str(SHARED))

import chat_server  # noqa: E402


class _IsolatedDataDir:
    """Context manager: redirect chat_server's data paths into a tmpdir."""

    def __init__(self):
        self._tmp = tempfile.TemporaryDirectory()
        self._saved = {}

    def __enter__(self):
        tmp = Path(self._tmp.name)
        for name, value in {
            "CHATS_DIR": str(tmp),
            "CHATS_FILE": str(tmp / "chats.json"),
            "CHATS_PER_DIR": str(tmp / "chats"),
            "CHATS_INDEX_FILE": str(tmp / "chats" / "_index.json"),
            "SETTINGS_FILE": str(tmp / "settings.json"),
            "TOKEN_FILE": str(tmp / ".access_token"),
        }.items():
            self._saved[name] = getattr(chat_server, name)
            setattr(chat_server, name, value)
        os.makedirs(tmp / "chats", exist_ok=True)
        self.tmp = tmp
        return self

    def __exit__(self, exc_type, exc, tb):
        for name, value in self._saved.items():
            setattr(chat_server, name, value)
        self._tmp.cleanup()


class TokenTests(unittest.TestCase):
    def test_load_creates_and_persists(self):
        with _IsolatedDataDir() as iso:
            t1 = chat_server._load_or_create_token()
            self.assertGreaterEqual(len(t1), 16)
            self.assertTrue(Path(iso.tmp / ".access_token").is_file())
            t2 = chat_server._load_or_create_token()
            self.assertEqual(t1, t2, "Token must be stable across reads")

    def test_short_or_missing_token_gets_regenerated(self):
        with _IsolatedDataDir() as iso:
            (iso.tmp / ".access_token").write_text("x")  # too short
            t = chat_server._load_or_create_token()
            self.assertGreaterEqual(len(t), 16)


class ChatHashTests(unittest.TestCase):
    def test_hash_stable_for_equal_dicts(self):
        a = {"id": "abc", "messages": [{"role": "user", "content": "hi"}]}
        b = {"messages": [{"role": "user", "content": "hi"}], "id": "abc"}
        self.assertEqual(chat_server._compute_chat_hash(a), chat_server._compute_chat_hash(b))

    def test_hash_differs_on_change(self):
        a = {"id": "abc", "messages": [{"role": "user", "content": "hi"}]}
        b = {"id": "abc", "messages": [{"role": "user", "content": "hello"}]}
        self.assertNotEqual(chat_server._compute_chat_hash(a), chat_server._compute_chat_hash(b))


class ChatPersistenceTests(unittest.TestCase):
    def _sample(self):
        return [
            {"id": "chat-1", "title": "first", "messages": [{"role": "user", "content": "hi"}]},
            {"id": "chat-2", "title": "second", "messages": [{"role": "assistant", "content": "hello"}]},
        ]

    def test_save_then_load_roundtrip(self):
        with _IsolatedDataDir():
            chats = self._sample()
            written, total = chat_server._save_chats_incremental(chats)
            self.assertEqual(total, 2)
            self.assertEqual(written, 2)
            loaded = chat_server._load_chats_aggregated()
            self.assertEqual(loaded, chats)

    def test_incremental_skips_unchanged(self):
        with _IsolatedDataDir():
            chats = self._sample()
            chat_server._save_chats_incremental(chats)
            written, _ = chat_server._save_chats_incremental(chats)
            self.assertEqual(written, 0, "Second identical save must rewrite nothing")

    def test_incremental_writes_only_changed(self):
        with _IsolatedDataDir():
            chats = self._sample()
            chat_server._save_chats_incremental(chats)
            chats[1]["title"] = "updated"
            written, _ = chat_server._save_chats_incremental(chats)
            self.assertEqual(written, 1, "Only the changed chat should be rewritten")

    def test_delete_removes_per_chat_file(self):
        with _IsolatedDataDir() as iso:
            chats = self._sample()
            chat_server._save_chats_incremental(chats)
            self.assertTrue((iso.tmp / "chats" / "chat-2.json").is_file())
            chat_server._save_chats_incremental([chats[0]])
            self.assertFalse((iso.tmp / "chats" / "chat-2.json").is_file())

    def test_missing_id_is_auto_assigned(self):
        with _IsolatedDataDir():
            chats = [{"title": "no id", "messages": []}]
            chat_server._save_chats_incremental(chats)
            loaded = chat_server._load_chats_aggregated()
            self.assertEqual(len(loaded), 1)
            self.assertIn("id", loaded[0])
            self.assertTrue(loaded[0]["id"])


class MigrationTests(unittest.TestCase):
    def test_legacy_chats_json_splits_once(self):
        with _IsolatedDataDir() as iso:
            legacy = [
                {"id": "old-1", "title": "legacy", "messages": []},
                {"id": "old-2", "title": "also legacy", "messages": []},
            ]
            (iso.tmp / "chats.json").write_text(
                __import__("json").dumps(legacy), encoding="utf-8"
            )
            chat_server._migrate_legacy_chats()
            self.assertTrue((iso.tmp / "chats" / "_index.json").is_file())
            self.assertTrue((iso.tmp / "chats" / "old-1.json").is_file())
            self.assertTrue((iso.tmp / "chats.json.legacy").is_file())
            # Running migration again is a no-op (index already exists).
            chat_server._migrate_legacy_chats()
            self.assertTrue((iso.tmp / "chats" / "old-1.json").is_file())


class SafeChatIdTests(unittest.TestCase):
    def test_strips_path_chars(self):
        self.assertEqual(chat_server._safe_chat_id("../../etc/passwd"), "etcpasswd")

    def test_rejects_empty_or_dot(self):
        self.assertIsNone(chat_server._safe_chat_id(""))
        self.assertIsNone(chat_server._safe_chat_id(".."))
        self.assertIsNone(chat_server._safe_chat_id(None))


if __name__ == "__main__":
    unittest.main()
