#!/bin/bash
# ================================================================
#  R-AI - Desktop launcher (Linux)
# ================================================================
#  Creates a clickable R-AI entry in the application menu so the
#  chat can be started without touching a terminal.
#
#  Left-click  -> start.sh (engine + chat UI, browser opens itself)
#  Right-click -> "Stop R-AI" action
#
#  Safe to re-run; it simply rewrites the entry. Nothing is written
#  outside your home directory, and uninstall.sh removes it again.
#
#  Usage:  bash Linux/install-shortcut.sh [--desktop]
#            --desktop  also drop a copy on your Desktop
# ================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
USB_ROOT="$(dirname "$SCRIPT_DIR")"
ICON="$USB_ROOT/Shared/assets/r-ai-logo.png"

APPS_DIR="$HOME/.local/share/applications"
ENTRY="$APPS_DIR/r-ai.desktop"

GRN='\033[0;32m'; YLW='\033[1;33m'; DGR='\033[1;30m'; RST='\033[0m'

if [ ! -f "$SCRIPT_DIR/start.sh" ]; then
    echo "ERROR: start.sh not found next to this script."
    exit 1
fi

mkdir -p "$APPS_DIR"

# Terminal=false so a click just works; start.sh reports any failure through
# notify-send instead of a console nobody is watching.
cat > "$ENTRY" <<EOF
[Desktop Entry]
Type=Application
Version=1.0
Name=R-AI
GenericName=Local AI Chat
Comment=Offline AI chat and image generation - runs entirely on this machine
Exec=bash "$SCRIPT_DIR/start.sh"
Path=$USB_ROOT
Icon=$ICON
Terminal=false
StartupNotify=true
Categories=Utility;
Keywords=AI;LLM;Chat;Offline;Ollama;
Actions=Stop;Terminal;

[Desktop Action Stop]
Name=Stop R-AI
Exec=bash "$SCRIPT_DIR/stop.sh"

[Desktop Action Terminal]
Name=Open terminal chat
Exec=bash "$SCRIPT_DIR/start-terminal.sh"
EOF

chmod +x "$ENTRY"
echo -e "${GRN}      Launcher installed:${RST} $ENTRY"

# Refresh the menu so the entry shows up without a re-login.
command -v update-desktop-database >/dev/null 2>&1 && \
    update-desktop-database "$APPS_DIR" >/dev/null 2>&1

# Optional copy on the Desktop. GNOME ignores .desktop files it does not
# consider trusted, so mark it as such via gio when that is available.
if [ "$1" = "--desktop" ]; then
    DESK="$(xdg-user-dir DESKTOP 2>/dev/null)"
    [ -z "$DESK" ] && DESK="$HOME/Desktop"
    if [ -d "$DESK" ]; then
        cp -f "$ENTRY" "$DESK/r-ai.desktop"
        chmod +x "$DESK/r-ai.desktop"
        gio set "$DESK/r-ai.desktop" metadata::trusted true 2>/dev/null
        echo -e "${GRN}      Desktop icon added:${RST} $DESK/r-ai.desktop"
        echo -e "${DGR}      (If it looks like a text file, right-click it and choose 'Allow Launching'.)${RST}"
    else
        echo -e "${YLW}      No Desktop folder found. Skipped the desktop icon.${RST}"
    fi
fi

echo -e "${DGR}      Search your apps for \"R-AI\" and click it to start.${RST}"
