#!/data/data/com.termux/files/usr/bin/bash
# R-AI Terminal launcher (Android / Termux)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TUI="$SCRIPT_DIR/../Shared/r-ai-tui.py"

if command -v python3 >/dev/null 2>&1; then
    PYTHON=python3
elif command -v python >/dev/null 2>&1; then
    PYTHON=python
else
    echo "ERROR: Python not found. Run: pkg install python"
    exit 1
fi

# Android often runs the server on a non-default host; pass --host explicitly
# if you bind elsewhere. Defaults match localhost:3333.
exec "$PYTHON" "$TUI" "$@"
