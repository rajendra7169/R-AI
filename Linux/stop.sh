#!/bin/bash
# ===================================================
#  Portable AI - Shut everything down (Linux)
# ===================================================
#  Stops the chat server and the Ollama engine started
#  by start.sh. Safe to run when nothing is running.
# ===================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
USB_ROOT="$(dirname "$SCRIPT_DIR")"

STOPPED=0

if pkill -f "$USB_ROOT/Shared/chat_server.py" 2>/dev/null; then
    echo "[OK] Chat server stopped."
    STOPPED=1
fi

if pkill -f "$USB_ROOT/Shared/bin/ollama-linux" 2>/dev/null; then
    echo "[OK] AI engine stopped."
    STOPPED=1
fi

if [ "$STOPPED" -eq 0 ]; then
    echo "R-AI is not running."
else
    echo "R-AI shut down."
fi
