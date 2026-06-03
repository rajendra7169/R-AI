#!/bin/bash
# ================================================================
#  PORTABLE UNCENSORED AI - Linux Setup Script
# ================================================================
#  Thin wrapper around Shared/scripts/install-common.sh.
# ================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
USB_ROOT="$(dirname "$SCRIPT_DIR")"
SHARED_DIR="$USB_ROOT/Shared"
SHARED_BIN="$SHARED_DIR/bin"
MODELS_DIR="$SHARED_DIR/models"
OLLAMA_DATA="$MODELS_DIR/ollama_data"
VENDOR_DIR="$SHARED_DIR/vendor"

mkdir -p "$SHARED_BIN" "$MODELS_DIR" "$OLLAMA_DATA" "$VENDOR_DIR"

# shellcheck source=../Shared/scripts/install-common.sh
. "$SHARED_DIR/scripts/install-common.sh"

DOWNLOAD_ERRORS=()
detect_drive_root
load_model_catalogue desktop || exit 1

# ── Header ─────────────────────────────────────────────────────
echo ""
echo -e "${CYN}==========================================================${RST}"
echo -e "${CYN}   PORTABLE AI USB - Multi-Model Setup (Linux)            ${RST}"
echo -e "${CYN}==========================================================${RST}"
echo ""

FREE=$(free_gb)
if [ "$FREE" -gt 0 ] 2>/dev/null; then
    echo -e "${DGR}  USB Free Space: ${FREE} GB${RST}"
    echo ""
fi

# ── Step 1: Model selection ────────────────────────────────────
print_model_menu
read -r -p "  Your choice: " USER_CHOICE
if [ -z "$USER_CHOICE" ]; then
    echo ""
    echo -e "${YLW}  No input! Defaulting to [1] Gemma 2 2B...${RST}"
    USER_CHOICE="1"
fi
parse_model_selection
if selection_is_empty; then
    echo ""
    echo -e "${RED}  ERROR: No models selected!${RST}"
    read -n 1 -s -r -p "Press any key to exit..."
    echo ""; exit 1
fi
space_warning || { read -n 1 -s -r -p "Press any key to exit..."; echo ""; exit 0; }
show_selection_summary

# ── Step 2: Folder structure ───────────────────────────────────
echo -e "${YLW}[2/7] Verifying folder structure...${RST}"
mkdir -p "$MODELS_DIR" "$SHARED_BIN" "$OLLAMA_DATA" "$VENDOR_DIR"
echo -e "${GRN}      Done.${RST}"

# ── Step 3: UI vendor assets ───────────────────────────────────
echo ""
echo -e "${YLW}[3/7] Downloading UI assets (offline markdown/pdf/fonts)...${RST}"
download_ui_vendor_assets

# ── Step 4: Model downloads ────────────────────────────────────
echo ""
echo -e "${YLW}[4/7] Downloading AI Model(s)...${RST}"
run_model_downloads

# ── Step 5: Modelfile configs ──────────────────────────────────
echo ""
echo -e "${YLW}[5/7] Creating AI model configurations...${RST}"
create_modelfiles_and_list

# ── Step 6: Ollama Linux engine ────────────────────────────────
echo ""
echo -e "${YLW}[6/7] Downloading Ollama AI Engine (Linux)...${RST}"

OLLAMA_BIN="$SHARED_BIN/ollama-linux"
if [ -f "$OLLAMA_BIN" ] && is_native_binary "$OLLAMA_BIN" && file_ok "$OLLAMA_BIN" 10000000; then
    echo -e "${GRN}      Ollama already installed! Skipping...${RST}"
else
    rm -f "$OLLAMA_BIN"
    if copy_from_drive_root "ollama-linux" "$OLLAMA_BIN" 10000000; then
        if is_native_binary "$OLLAMA_BIN"; then
            chmod +x "$OLLAMA_BIN"
            echo -e "${GRN}      Ollama engine ready (copied from drive root)!${RST}"
        else
            echo -e "${RED}      WARNING: Copied file is not a valid ELF binary.${RST}"
            rm -f "$OLLAMA_BIN"
        fi
    fi
    if [ ! -f "$OLLAMA_BIN" ]; then
        ARCHIVE_URL="https://github.com/ollama/ollama/releases/latest/download/ollama-linux-amd64.tar.zst"
        echo -e "      Downloading Ollama engine (streaming - stops after binary extracted)..."
        # bin/ollama is first in the archive, so tar exits early and we skip
        # the trailing CUDA libs.
        curl -L --fail "$ARCHIVE_URL" | \
            tar --use-compress-program=zstd -xf - -C "$SHARED_BIN" \
                --strip-components=1 bin/ollama 2>/dev/null
        PIPE_RC=${PIPESTATUS[1]}
        [ -f "$SHARED_BIN/ollama" ] && mv "$SHARED_BIN/ollama" "$OLLAMA_BIN"
        if [ "$PIPE_RC" -ne 0 ] || ! is_native_binary "$OLLAMA_BIN"; then
            echo -e "${RED}      ERROR: Extraction failed or binary is invalid!${RST}"
            rm -f "$OLLAMA_BIN"
            DOWNLOAD_ERRORS+=("Ollama Engine")
        else
            chmod +x "$OLLAMA_BIN"
            echo -e "${GRN}      Ollama Linux Engine ready!${RST}"
        fi
    fi
fi

# ── Step 6b: Stable Diffusion engine ───────────────────────────
echo ""
echo -e "${YLW}[6b/7] Downloading Stable Diffusion Image Engine (Linux)...${RST}"

SD_DIR="$SHARED_BIN/sd-linux"
SD_BIN="$SD_DIR/sd"
SD_ZIP_URL="https://github.com/leejet/stable-diffusion.cpp/releases/download/master-656-0e4ee04/sd-master-0e4ee04-bin-Linux-Ubuntu-24.04-x86_64.zip"

if [ -f "$SD_BIN" ] && file_ok "$SD_BIN" 1000000; then
    echo -e "${GRN}      Stable Diffusion engine already installed! Skipping...${RST}"
else
    rm -rf "$SD_DIR"
    mkdir -p "$SD_DIR"
    SD_ZIP="$SHARED_BIN/sd-linux.zip"
    echo -e "      Downloading Stable Diffusion engine..."
    curl -L --fail "$SD_ZIP_URL" -o "$SD_ZIP"
    if [ -f "$SD_ZIP" ]; then
        unzip -q "$SD_ZIP" -d "$SD_DIR" 2>/dev/null || true
        rm -f "$SD_ZIP"
        SUBDIR=$(find "$SD_DIR" -maxdepth 1 -mindepth 1 -type d | head -n 1)
        if [ -n "$SUBDIR" ]; then
            mv "$SUBDIR"/* "$SD_DIR"/ 2>/dev/null || true
            rmdir "$SUBDIR" 2>/dev/null || true
        fi
        if [ -f "$SD_DIR/sd" ]; then
            chmod +x "$SD_DIR/sd"
            echo -e "${GRN}      Stable Diffusion engine installed!${RST}"
        elif [ -f "$SD_DIR/sd-cli" ]; then
            chmod +x "$SD_DIR/sd-cli"
            ln -sf "$SD_DIR/sd-cli" "$SD_DIR/sd" 2>/dev/null || true
            echo -e "${GRN}      Stable Diffusion engine installed!${RST}"
        else
            echo -e "${RED}      ERROR: SD binary not found after extraction.${RST}"
            DOWNLOAD_ERRORS+=("Stable Diffusion Engine")
        fi
    else
        echo -e "${RED}      ERROR: Stable Diffusion engine download failed!${RST}"
        DOWNLOAD_ERRORS+=("Stable Diffusion Engine")
    fi
fi

# ── Step 6c: CyberRealistic image model ────────────────────────
echo ""
echo -e "${YLW}[6c/7] Downloading CyberRealistic Image Model (~1.99 GB)...${RST}"
IMAGE_MODEL="$MODELS_DIR/CyberRealistic_V3.3_FP16.safetensors"
IMAGE_URL="https://huggingface.co/cyberdelia/CyberRealistic/resolve/main/CyberRealistic_V3.3_FP16.safetensors"

if file_ok "$IMAGE_MODEL" 2000000000; then
    echo -e "${GRN}      CyberRealistic model already downloaded! Skipping...${RST}"
elif copy_from_drive_root "CyberRealistic_V3.3_FP16.safetensors" "$IMAGE_MODEL" 2000000000; then
    :
else
    curl -L --fail "$IMAGE_URL" -o "$IMAGE_MODEL"
    if file_ok "$IMAGE_MODEL" 2000000000; then
        echo -e "${GRN}      CyberRealistic model downloaded successfully!${RST}"
    else
        echo -e "${RED}      ERROR: CyberRealistic model download failed!${RST}"
        DOWNLOAD_ERRORS+=("CyberRealistic Image Model")
    fi
fi

# ── Step 7: Import into Ollama ─────────────────────────────────
echo ""
echo -e "${YLW}[7/7] Importing AI models into the Ollama engine...${RST}"
import_models_into_ollama "$OLLAMA_BIN"

# ── Final ──────────────────────────────────────────────────────
START_HINT="To start your AI: Run  bash Linux/start.sh"
print_final_summary "$IMAGE_MODEL"
read -n 1 -s -r -p "Press any key to close this installer..."
echo ""
