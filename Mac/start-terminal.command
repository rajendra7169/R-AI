#!/bin/bash
# R-AI Terminal launcher (macOS)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TUI="$SCRIPT_DIR/../Shared/r-ai-tui.py"

if command -v python3 >/dev/null 2>&1; then
    PYTHON=python3
elif command -v python >/dev/null 2>&1; then
    PYTHON=python
else
    echo "ERROR: Python not found. Install Python 3 first."
    read -n 1 -s -r -p "Press any key to exit..."
    exit 1
fi

exec "$PYTHON" "$TUI" "$@"
