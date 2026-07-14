#!/bin/bash
# ===================================================
#  Portable AI - Shut everything down (Linux)
# ===================================================
#  Stops the chat server and the Ollama engine started
#  by start.sh. Safe to run when nothing is running.
# ===================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
USB_ROOT="$(dirname "$SCRIPT_DIR")"

SERVER_PAT="$USB_ROOT/Shared/chat_server.py"
ENGINE_PAT="$USB_ROOT/Shared/bin/ollama-linux"
# Ollama spawns a llama-server child that holds the model in VRAM. If the
# engine is killed hard, that child can orphan and keep the GPU memory
# reserved — so the next launch can't fit the model on the GPU and falls back
# to the (much slower) CPU. Clean it up here too.
RUNNER_PAT="$USB_ROOT/Shared/bin/lib/ollama/llama-server"

alive() { pgrep -f "$1" >/dev/null 2>&1; }

WAS_UP=0
alive "$SERVER_PAT" && WAS_UP=1
alive "$ENGINE_PAT" && WAS_UP=1
alive "$RUNNER_PAT" && WAS_UP=1

if [ "$WAS_UP" -eq 0 ]; then
    echo "R-AI is not running."
    exit 0
fi

# Ask politely, then insist. Killing the chat server makes start.sh run its
# own engine cleanup, so the two can race - report on what is actually still
# alive afterwards rather than on any single pkill's exit code.
pkill -f "$SERVER_PAT" 2>/dev/null
pkill -f "$ENGINE_PAT" 2>/dev/null
pkill -f "$RUNNER_PAT" 2>/dev/null

for _ in $(seq 1 10); do
    alive "$SERVER_PAT" || alive "$ENGINE_PAT" || alive "$RUNNER_PAT" || break
    sleep 0.5
done

if alive "$SERVER_PAT" || alive "$ENGINE_PAT" || alive "$RUNNER_PAT"; then
    pkill -9 -f "$SERVER_PAT" 2>/dev/null
    pkill -9 -f "$ENGINE_PAT" 2>/dev/null
    pkill -9 -f "$RUNNER_PAT" 2>/dev/null
    sleep 1
fi

if alive "$SERVER_PAT" || alive "$ENGINE_PAT" || alive "$RUNNER_PAT"; then
    echo "WARNING: something would not shut down. Still running:"
    pgrep -af "$SERVER_PAT" 2>/dev/null
    pgrep -af "$ENGINE_PAT" 2>/dev/null
    pgrep -af "$RUNNER_PAT" 2>/dev/null
    exit 1
fi

echo "[OK] Chat server stopped."
echo "[OK] AI engine stopped."
echo "R-AI shut down."
