#!/bin/bash
# ===================================================
#  Portable AI - Fast Web Chat (Linux)
# ===================================================

echo "==================================================="
echo "    Portable AI - Fast Web Chat Mode (Linux)"
echo "==================================================="
echo ""
echo "  Launches the AI engine + browser chat UI."
echo "  All chats auto-save to the USB drive."
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
USB_ROOT="$(dirname "$SCRIPT_DIR")"
SHARED_DIR="$USB_ROOT/Shared"
OLLAMA_RUNTIME="$SHARED_DIR/.ollama-runtime"
mkdir -p "$OLLAMA_RUNTIME"

# Clicking the desktop launcher twice must not fight over port 3333. If the
# chat server is already up, just bring the window back and get out.
if curl -s -o /dev/null "http://127.0.0.1:3333/" 2>/dev/null; then
    echo "[OK] R-AI is already running - reopening the chat window."
    command -v xdg-open >/dev/null 2>&1 && xdg-open "http://localhost:3333" >/dev/null 2>&1 &
    exit 0
fi

# ---- Full portability: keep EVERYTHING on the USB ----
export OLLAMA_MODELS="$SHARED_DIR/models/ollama_data"
export OLLAMA_HOME="$OLLAMA_RUNTIME"
export OLLAMA_RUNNERS_DIR="$OLLAMA_RUNTIME/runners"
export OLLAMA_TMPDIR="$OLLAMA_RUNTIME/tmp"
export OLLAMA_ORIGINS="*"
export OLLAMA_HOST="127.0.0.1:11434"
mkdir -p "$OLLAMA_RUNTIME/runners" "$OLLAMA_RUNTIME/tmp"
# -------------------------------------------------------

# When launched from the desktop icon there is no terminal attached, so a
# blocking "press any key" would hang forever with nothing on screen. Report
# failures through a desktop notification instead and exit.
die() {
    echo "ERROR: $1"
    if [ ! -t 0 ] && command -v notify-send >/dev/null 2>&1; then
        notify-send -i dialog-error "R-AI" "$1"
    elif [ -t 0 ]; then
        read -n 1 -s -r -p "Press any key to close..."
        echo ""
    fi
    exit 1
}

# Check if the portable Linux engine is downloaded
if [ ! -f "$SHARED_DIR/bin/ollama-linux" ]; then
    die "AI engine not installed. Run 'bash Linux/install.sh' first."
fi

# Check if Ollama is already running
if curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
    echo "[OK] Ollama engine is already running!"
else
    echo "Starting offline Linux AI Engine..."
    HOME="$OLLAMA_RUNTIME" "$SHARED_DIR/bin/ollama-linux" serve &
    OLLAMA_PID=$!

    echo "Waiting for engine to initialize..."
    ENGINE_UP=0
    for _ in $(seq 1 60); do
        if curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
            ENGINE_UP=1
            break
        fi
        # If the engine died on startup, stop waiting for something that is
        # never going to answer.
        kill -0 "$OLLAMA_PID" 2>/dev/null || break
        sleep 1
    done
    [ "$ENGINE_UP" -eq 1 ] || die "The AI engine failed to start. Try 'bash Linux/install.sh' to repair it."
    echo "[OK] Engine is online!"
fi

echo ""
echo "==================================================="
echo "  AI ENGINE IS RUNNING"
echo "  Chat UI will open automatically."
echo "  Press Ctrl+C to shut down."
echo "==================================================="
echo ""

# Launch Python chat server using system Python
if command -v python3 &> /dev/null; then
    python3 "$SHARED_DIR/chat_server.py"
elif command -v python &> /dev/null; then
    python "$SHARED_DIR/chat_server.py"
else
    echo "ERROR: Python not found. Please install python3 via your package manager."
    exit 1
fi

# Cleanup
if [ -n "$OLLAMA_PID" ]; then
    kill -9 $OLLAMA_PID 2>/dev/null
fi
echo "Goodbye!"
