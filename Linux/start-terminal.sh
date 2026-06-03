#!/bin/bash
# R-AI Terminal launcher (Linux)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TUI="$SCRIPT_DIR/../Shared/r-ai-tui.py"

if command -v python3 >/dev/null 2>&1; then
    PYTHON=python3
elif command -v python >/dev/null 2>&1; then
    PYTHON=python
else
    echo "ERROR: Python not found. Install python3 first."
    exit 1
fi

exec "$PYTHON" "$TUI" "$@"
