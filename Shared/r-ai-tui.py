#!/usr/bin/env python3
"""
R-AI Terminal — zero-dependency text UI for local AI chat.

Talks to the R-AI HTTP server (chat_server.py) over loopback. If the server
is not running it boots one automatically. Uses only the Python standard
library — no pip install, no third-party packages — so it ships and runs
straight from the same portable Python embedded in R-AI.

Run:
    python Shared/r-ai-tui.py            # auto-start server, open REPL
    python Shared/r-ai-tui.py --no-auto  # don't boot the server, assume running
    python Shared/r-ai-tui.py --host 192.168.1.7 --port 3333 --token TOKEN
"""
from __future__ import annotations

import argparse
import json
import os
import platform
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SERVER_SCRIPT = SCRIPT_DIR / "chat_server.py"
TOKEN_FILE = SCRIPT_DIR / "chat_data" / ".access_token"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 3333
DEFAULT_TEMP = 0.7

# ── ANSI colours (24-bit truecolor; falls back gracefully) ────────────
class C:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    ITALIC = "\033[3m"
    CLEAR_LINE = "\033[2K\r"
    BLUE = "\033[38;2;66;133;244m"
    PURPLE = "\033[38;2;145;100;255m"
    PINK = "\033[38;2;232;88;180m"
    GREEN = "\033[38;2;109;213;140m"
    RED = "\033[38;2;244;67;54m"
    ORANGE = "\033[38;2;253;176;57m"
    GRAY = "\033[38;2;160;160;160m"
    SOFT = "\033[38;2;200;200;200m"
    BG_HEAD = "\033[48;2;30;33;42m"


def _enable_ansi_on_windows() -> None:
    """Turn on VT100 escape processing on Windows 10+ consoles."""
    if platform.system() != "Windows":
        return
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        # ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004
        for handle_id in (-11, -12):  # stdout, stderr
            handle = kernel32.GetStdHandle(handle_id)
            mode = ctypes.c_ulong()
            if kernel32.GetConsoleMode(handle, ctypes.byref(mode)):
                kernel32.SetConsoleMode(handle, mode.value | 0x0004)
    except Exception:
        pass


def _force_utf8_stdio() -> None:
    """Make stdout/stderr emit UTF-8 so the logo & emoji-class chars survive.

    The default Windows console encoding is cp1252 which chokes on box-drawing
    characters in the logo. reconfigure() is a no-op when the stream is
    already UTF-8.
    """
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass


def _stdout_supports_unicode() -> bool:
    enc = (getattr(sys.stdout, "encoding", "") or "").lower()
    return "utf" in enc


# ── HTTP helpers (urllib only) ────────────────────────────────────────
class ServerClient:
    def __init__(self, host: str, port: int, token: str | None):
        self.host = host
        self.port = port
        self.token = token
        self.base = f"http://{host}:{port}"

    def _headers(self) -> dict[str, str]:
        h = {"Content-Type": "application/json"}
        if self.token:
            h["X-Auth-Token"] = self.token
        return h

    def alive(self, timeout: float = 2.0) -> bool:
        try:
            req = urllib.request.Request(f"{self.base}/api/engine-status", headers=self._headers())
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.status == 200
        except Exception:
            return False

    def get_json(self, path: str, timeout: float = 10.0):
        req = urllib.request.Request(f"{self.base}{path}", headers=self._headers())
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))

    def list_models(self) -> list[dict]:
        try:
            data = self.get_json("/ollama/api/tags", timeout=5.0)
            return data.get("models", []) or []
        except Exception:
            return []

    def stream_chat(self, model: str, messages: list[dict], temperature: float, on_token):
        """POST /ollama/api/chat and feed each streamed token chunk to on_token.

        Returns the assembled text. Raises on network/HTTP errors so the
        caller can decide how to surface them.
        """
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {"temperature": float(temperature)},
        }
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base}/ollama/api/chat",
            data=body,
            method="POST",
            headers=self._headers(),
        )
        full = []
        with urllib.request.urlopen(req, timeout=600) as r:
            for raw_line in r:
                line = raw_line.strip()
                if not line:
                    continue
                try:
                    msg = json.loads(line)
                except Exception:
                    continue
                token = (msg.get("message") or {}).get("content", "")
                if token:
                    full.append(token)
                    on_token(token)
                if msg.get("done"):
                    break
        return "".join(full)


# ── Header / Logo ─────────────────────────────────────────────────────
LOGO_LINES_UNICODE = [
    "██████╗       █████╗ ██╗",
    "██╔══██╗     ██╔══██╗██║",
    "██████╔╝     ███████║██║",
    "██╔══██╗ ─── ██╔══██║██║",
    "██║  ██║     ██║  ██║██║",
    "╚═╝  ╚═╝     ╚═╝  ╚═╝╚═╝",
]

LOGO_LINES_ASCII = [
    " ____         _   ___ ",
    "|  _ \\       / \\ |_ _|",
    "| |_) |     / _ \\ | | ",
    "|  _ <  --- / ___ \\| | ",
    "| |_) |    / /   \\ \\ |",
    "|____/    /_/     \\_\\_|",
]


def _print_logo() -> None:
    lines = LOGO_LINES_UNICODE if _stdout_supports_unicode() else LOGO_LINES_ASCII
    grad = [C.BLUE, C.BLUE, C.PURPLE, C.PURPLE, C.PINK, C.PINK]
    for color, line in zip(grad, lines):
        print(f"  {color}{line}{C.RESET}")
    print()


def _print_header(model_name: str, server_url: str, token_set: bool) -> None:
    unicode_ok = _stdout_supports_unicode()
    width = shutil.get_terminal_size((80, 24)).columns
    bar_ch = "─" if unicode_ok else "-"
    dot = "·" if unicode_ok else "|"
    bar = bar_ch * min(width - 4, 76)
    print()
    _print_logo()
    print(f"  {C.BOLD}R-AI Terminal{C.RESET}{C.GRAY} {dot} local AI, offline{C.RESET}")
    print(f"  {C.GRAY}{bar}{C.RESET}")
    print(f"  {C.SOFT}Model :{C.RESET} {C.GREEN}{model_name}{C.RESET}")
    print(f"  {C.SOFT}Server:{C.RESET} {C.BLUE}{server_url}{C.RESET}"
          f"{C.GRAY} {dot} auth {'on' if token_set else 'off'}{C.RESET}")
    print(f"  {C.GRAY}Type /help for commands {dot} /web to open the GUI {dot} /quit to exit{C.RESET}")
    print(f"  {C.GRAY}{bar}{C.RESET}")
    print()


# ── Token / server lifecycle ──────────────────────────────────────────
def read_local_token() -> str | None:
    try:
        return TOKEN_FILE.read_text(encoding="utf-8").strip() or None
    except FileNotFoundError:
        return None
    except Exception:
        return None


def port_in_use(host: str, port: int) -> bool:
    s = socket.socket()
    s.settimeout(0.5)
    try:
        s.connect((host, port))
        s.close()
        return True
    except Exception:
        return False


def auto_start_server(host: str, port: int) -> subprocess.Popen | None:
    """Spawn chat_server.py in the background if nothing is listening yet."""
    if port_in_use(host, port):
        return None
    if not SERVER_SCRIPT.is_file():
        return None
    print(f"  {C.GRAY}Starting R-AI server…{C.RESET}", end="", flush=True)
    kwargs = {"stdout": subprocess.DEVNULL, "stderr": subprocess.DEVNULL}
    if platform.system() == "Windows":
        kwargs["creationflags"] = 0x00000008  # DETACHED_PROCESS
    try:
        proc = subprocess.Popen(
            [sys.executable, str(SERVER_SCRIPT), "--no-browser"], **kwargs
        )
    except Exception:
        print(f"\r  {C.RED}Could not start server.{C.RESET}")
        return None
    # Wait up to ~10 s for the port to come up
    for _ in range(40):
        if port_in_use(host, port):
            print(f"\r  {C.GREEN}Server online.{C.RESET}{' ' * 20}")
            return proc
        time.sleep(0.25)
    print(f"\r  {C.ORANGE}Server slow to start; continuing anyway.{C.RESET}")
    return proc


# ── REPL ──────────────────────────────────────────────────────────────
COMMANDS_HELP = """
  Commands
    /help                 Show this help
    /web                  Open the R-AI web UI in your browser
    /model                Pick a different model
    /models               List available models
    /system <text>        Set system instructions for this chat
    /system               Show / clear the current system instructions
    /temp <0.0-2.0>       Set sampling temperature
    /new   |  /clear      Start a fresh conversation
    /quit  |  /exit       Leave R-AI Terminal
"""


def _print_help() -> None:
    print(C.GRAY + COMMANDS_HELP + C.RESET)


def _read_input(prompt: str) -> str:
    """Read a line from the user, returning '' on Ctrl-D (EOF)."""
    try:
        return input(prompt)
    except EOFError:
        return "/quit"


def _pick_model(client: ServerClient, current: str) -> str:
    models = client.list_models()
    if not models:
        print(f"  {C.RED}No models available. Is Ollama running?{C.RESET}")
        return current
    print()
    print(f"  {C.BOLD}Available models{C.RESET}")
    for i, m in enumerate(models, 1):
        name = m.get("name", "?")
        size = m.get("size", 0)
        size_gb = (size / 1e9) if isinstance(size, (int, float)) else 0.0
        marker = f"{C.GREEN}●{C.RESET}" if name == current else " "
        print(f"   {marker} {C.SOFT}[{i}]{C.RESET} {name}  {C.GRAY}({size_gb:.1f} GB){C.RESET}")
    raw = _read_input(f"\n  Pick a number (Enter to keep {C.GREEN}{current}{C.RESET}): ")
    raw = raw.strip()
    if not raw:
        return current
    try:
        idx = int(raw) - 1
        if 0 <= idx < len(models):
            new = models[idx].get("name") or current
            print(f"  {C.GREEN}Switched to {new}.{C.RESET}")
            return new
    except ValueError:
        pass
    print(f"  {C.ORANGE}No change.{C.RESET}")
    return current


def _handle_command(line: str, state: dict, client: ServerClient) -> bool:
    """Returns True if the command was handled, False to fall through.

    Mutates `state` in place. Returns False on /quit | /exit to signal exit.
    """
    parts = line.strip().split(maxsplit=1)
    cmd = parts[0].lower()
    arg = parts[1] if len(parts) > 1 else ""

    if cmd in ("/quit", "/exit", "/q"):
        return False
    if cmd == "/help":
        _print_help()
    elif cmd == "/web":
        host = client.host
        port = client.port
        url = f"http://{host}:{port}/"
        if client.token:
            url += f"?t={client.token}"
        try:
            webbrowser.open(url)
            print(f"  {C.GRAY}Opened {url}{C.RESET}")
        except Exception as e:
            print(f"  {C.RED}Could not open browser: {e}{C.RESET}")
    elif cmd == "/model":
        state["model"] = _pick_model(client, state["model"])
    elif cmd == "/models":
        models = client.list_models()
        if not models:
            print(f"  {C.RED}No models reported by the server.{C.RESET}")
        for m in models:
            name = m.get("name", "?")
            marker = f"{C.GREEN}●{C.RESET}" if name == state["model"] else "·"
            print(f"   {marker} {name}")
    elif cmd == "/system":
        if not arg:
            cur = state.get("system") or ""
            if cur:
                print(f"  {C.SOFT}Current system prompt:{C.RESET}\n    {C.ITALIC}{cur}{C.RESET}")
                yn = _read_input("  Clear it? [y/N]: ").strip().lower()
                if yn == "y":
                    state["system"] = ""
                    state["messages"] = [m for m in state["messages"] if m["role"] != "system"]
                    print(f"  {C.GREEN}Cleared.{C.RESET}")
            else:
                print(f"  {C.GRAY}No system prompt set. Use /system <text> to set one.{C.RESET}")
        else:
            state["system"] = arg
            state["messages"] = [m for m in state["messages"] if m["role"] != "system"]
            state["messages"].insert(0, {"role": "system", "content": arg})
            print(f"  {C.GREEN}System prompt set.{C.RESET}")
    elif cmd == "/temp":
        try:
            t = float(arg)
            if 0.0 <= t <= 2.0:
                state["temp"] = t
                print(f"  {C.GREEN}Temperature → {t}{C.RESET}")
            else:
                print(f"  {C.ORANGE}Temperature must be between 0.0 and 2.0.{C.RESET}")
        except ValueError:
            print(f"  {C.ORANGE}Usage: /temp 0.7{C.RESET}")
    elif cmd in ("/new", "/clear"):
        sys_msg = next((m for m in state["messages"] if m["role"] == "system"), None)
        state["messages"] = [sys_msg] if sys_msg else []
        print(f"  {C.GREEN}Started a new conversation.{C.RESET}")
    else:
        print(f"  {C.ORANGE}Unknown command: {cmd}. Try /help.{C.RESET}")
    return True


def _stream_response(client: ServerClient, state: dict) -> str:
    """Stream the model's reply to stdout, return the full text."""
    arrow = "›" if _stdout_supports_unicode() else ">"
    sys.stdout.write(f"  {C.BLUE}{C.BOLD}R-AI{C.RESET} {C.GRAY}{arrow}{C.RESET} ")
    sys.stdout.flush()

    def on_token(tok: str) -> None:
        sys.stdout.write(tok)
        sys.stdout.flush()

    started = time.time()
    try:
        full = client.stream_chat(
            model=state["model"],
            messages=state["messages"],
            temperature=state["temp"],
            on_token=on_token,
        )
    except urllib.error.HTTPError as e:
        sys.stdout.write(f"\n  {C.RED}HTTP {e.code}: {e.reason}{C.RESET}\n")
        if e.code == 401:
            sys.stdout.write(f"  {C.GRAY}The access token did not match. "
                             f"Re-run with --token <value>.{C.RESET}\n")
        return ""
    except urllib.error.URLError as e:
        sys.stdout.write(f"\n  {C.RED}Network error: {e.reason}{C.RESET}\n")
        return ""
    except KeyboardInterrupt:
        sys.stdout.write(f"\n  {C.ORANGE}Stopped.{C.RESET}\n")
        return ""
    elapsed = time.time() - started
    tokens = max(1, len(full.split()))
    print(f"\n  {C.DIM}{tokens} tokens in {elapsed:.1f}s "
          f"({tokens/elapsed:.1f} tok/s · ~word-based){C.RESET}\n")
    return full


def repl(client: ServerClient, initial_model: str) -> None:
    state = {
        "model": initial_model,
        "temp": DEFAULT_TEMP,
        "system": "",
        "messages": [],
    }
    while True:
        try:
            arrow = "›" if _stdout_supports_unicode() else ">"
            user = _read_input(f"  {C.PURPLE}{C.BOLD}You{C.RESET}  {C.GRAY}{arrow}{C.RESET} ")
        except KeyboardInterrupt:
            print(f"\n  {C.GRAY}Use /quit to exit (or Ctrl-C again).{C.RESET}")
            try:
                _read_input("")
            except KeyboardInterrupt:
                print(f"  {C.GRAY}Goodbye.{C.RESET}")
                return
            continue
        user = (user or "").rstrip()
        if not user:
            continue
        if user.startswith("/"):
            if not _handle_command(user, state, client):
                print(f"  {C.GRAY}Goodbye.{C.RESET}")
                return
            continue
        state["messages"].append({"role": "user", "content": user})
        reply = _stream_response(client, state)
        if reply:
            state["messages"].append({"role": "assistant", "content": reply})


# ── Entry point ───────────────────────────────────────────────────────
def main() -> int:
    parser = argparse.ArgumentParser(description="R-AI terminal chat client.")
    parser.add_argument("--host", default=DEFAULT_HOST,
                        help=f"Server host (default {DEFAULT_HOST})")
    parser.add_argument("--port", default=DEFAULT_PORT, type=int,
                        help=f"Server port (default {DEFAULT_PORT})")
    parser.add_argument("--token", default=None,
                        help="Access token. Default: read from chat_data/.access_token")
    parser.add_argument("--no-auto", action="store_true",
                        help="Do not auto-start the server if it isn't running")
    parser.add_argument("--model", default=None, help="Initial model name")
    args = parser.parse_args()

    _force_utf8_stdio()
    _enable_ansi_on_windows()

    server_proc: subprocess.Popen | None = None
    if args.host in ("127.0.0.1", "localhost") and not args.no_auto:
        server_proc = auto_start_server(args.host, args.port)

    token = args.token or read_local_token()
    client = ServerClient(args.host, args.port, token)

    # Wait briefly for the server if we just spawned it
    deadline = time.time() + 6.0
    while not client.alive(timeout=1.0) and time.time() < deadline:
        time.sleep(0.25)

    if not client.alive(timeout=2.0):
        print(f"\n  {C.RED}R-AI server is not reachable at {client.base}.{C.RESET}")
        print(f"  {C.GRAY}Start it with: python {SERVER_SCRIPT}{C.RESET}\n")
        return 1

    models = client.list_models()
    if not models:
        print(f"\n  {C.ORANGE}No models found — make sure Ollama is running and has at least one model.{C.RESET}")
        print(f"  {C.GRAY}Pull one with: ollama pull qwen2.5:3b{C.RESET}\n")
        return 1

    initial_model = args.model
    if not initial_model or not any(m.get("name") == initial_model for m in models):
        initial_model = models[0].get("name", "")

    _print_header(initial_model, client.base, token_set=bool(token))

    try:
        repl(client, initial_model)
    finally:
        if server_proc is not None:
            # Leave the server running so the web UI/other clients stay usable.
            # Users can stop it from its own terminal window.
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
