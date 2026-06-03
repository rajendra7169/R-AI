#!/bin/bash
# Shared library for Linux/Mac install scripts.
# Source this file; it defines helpers and does not execute the install itself.
# Callers must set:
#   USB_ROOT, SHARED_DIR, SHARED_BIN, MODELS_DIR, OLLAMA_DATA, VENDOR_DIR
# Callers may initialise: DOWNLOAD_ERRORS=()  (array used by helpers below)

# ── Colours ────────────────────────────────────────────────────
RED='\033[0;31m'; YLW='\033[1;33m'; GRN='\033[0;32m'
CYN='\033[0;36m'; MAG='\033[0;35m'; GRY='\033[0;37m'
DGR='\033[1;30m'; WHT='\033[1;37m'; RST='\033[0m'

# ── Platform detection ─────────────────────────────────────────
PLATFORM_OS="$(uname -s 2>/dev/null || echo unknown)"

stat_size() {
    # Print byte size of $1, or 0 on failure. Order matters per OS.
    if [ "$PLATFORM_OS" = "Darwin" ]; then
        stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || echo 0
    else
        stat -c%s "$1" 2>/dev/null || stat -f%z "$1" 2>/dev/null || echo 0
    fi
}

free_gb() {
    # Integer GB free on the filesystem containing $USB_ROOT, or -1 on failure.
    if [ "$PLATFORM_OS" = "Darwin" ]; then
        df -g "$USB_ROOT" 2>/dev/null | awk 'NR==2{print $4}' || echo -1
    else
        df -BG "$USB_ROOT" 2>/dev/null | awk 'NR==2{gsub("G","",$4); print $4}' || echo -1
    fi
}

is_native_binary() {
    # ELF on Linux, Mach-O / Universal on Mac.
    local path=$1
    [ -f "$path" ] || return 1
    local magic
    magic=$(head -c 4 "$path" 2>/dev/null | xxd -p 2>/dev/null \
            || head -c 4 "$path" 2>/dev/null | od -A n -t x1 | tr -d ' \n')
    case "$magic" in
        7f454c46) return 0 ;;  # ELF
        feedface|feedfacf|cffaedfe|cefaedfe) return 0 ;;  # Mach-O
        cafebabe|cafebabf) return 0 ;;  # Universal/Fat
        *) return 1 ;;
    esac
}

# ── Generic helpers ────────────────────────────────────────────
get_field() {
    local num=$1 field=$2
    eval echo "\${MODEL_${field}_${num}}"
}

file_ok() {
    local path=$1 minbytes=$2
    [ -f "$path" ] || return 1
    local size; size=$(stat_size "$path")
    [ "$size" -gt "$minbytes" ]
}

# Drive-root detection (caller can override DRIVE_ROOT first if needed).
detect_drive_root() {
    DRIVE_ROOT=$(df -P "$USB_ROOT" 2>/dev/null | awk 'NR==2{print $6}')
    [ -z "$DRIVE_ROOT" ] && DRIVE_ROOT="$USB_ROOT"
    [ "$DRIVE_ROOT" = "/" ] && DRIVE_ROOT="$USB_ROOT"
}

copy_from_drive_root() {
    local file=$1 dest=$2 minb=$3
    local src="$DRIVE_ROOT/$file"
    [ -f "$src" ] || return 1
    local size; size=$(stat_size "$src")
    [ "$size" -gt "$minb" ] || return 1
    local size_gb; size_gb=$(awk "BEGIN{printf \"%.2f\", $size/1073741824}")
    echo ""
    echo -e "${CYN}  Found '$file' in drive root (${size_gb} GB).${RST}"
    read -r -p "  Use this file instead of downloading? (yes/no): " USE_ROOT
    local USE_L; USE_L=$(echo "$USE_ROOT" | tr '[:upper:]' '[:lower:]')
    if [ "$USE_L" = "yes" ] || [ "$USE_L" = "y" ]; then
        cp "$src" "$dest"
        echo -e "${GRN}      Copied from drive root.${RST}"
        return 0
    fi
    return 1
}

# ── Model catalogue ────────────────────────────────────────────
load_model_catalogue() {
    # Pick a Python interpreter and source the shell-quoted model variables.
    local profile="${1:-desktop}"
    if command -v python3 >/dev/null 2>&1; then PYTHON_CMD="python3"
    elif command -v python >/dev/null 2>&1; then PYTHON_CMD="python"
    else
        echo -e "${RED}ERROR: Python is required to parse shared model config.${RST}"
        echo -e "${RED}Install python3, then rerun this installer.${RST}"
        return 1
    fi
    local cfg="$SHARED_DIR/scripts/config_query.py"
    if [ ! -f "$cfg" ]; then
        echo -e "${RED}ERROR: Missing shared config query script: $cfg${RST}"
        return 1
    fi
    eval "$("$PYTHON_CMD" "$cfg" models-shell "$profile")"
}

print_model_menu() {
    echo -e "${YLW}[1/7] Choose your AI model(s):${RST}"
    echo ""
    local NUM NAME SIZE LABEL BADGE LABEL_STR BADGE_STR
    for NUM in "${MODEL_NUMS[@]}"; do
        NAME=$(get_field "$NUM" NAME)
        SIZE=$(get_field "$NUM" SIZE)
        LABEL=$(get_field "$NUM" LABEL)
        BADGE=$(get_field "$NUM" BADGE)
        if [ "$LABEL" = "UNCENSORED" ]; then
            LABEL_STR="${RED}[UNCENSORED]${RST}"
        else
            LABEL_STR="${CYN}[STANDARD]${RST}"
        fi
        BADGE_STR=""; [ -n "$BADGE" ] && BADGE_STR="${MAG} - ${BADGE}${RST}"
        echo -e "  ${YLW}[${NUM}]${RST} ${WHT}${NAME}${RST} ${DGR}(~${SIZE} GB)${RST} ${LABEL_STR}${BADGE_STR}"
    done
    echo ""
    echo -e "  ${GRN}[C] CUSTOM - Enter your own HuggingFace GGUF URL${RST}"
    echo ""
    echo -e "  ${DGR}------------------------------------------------${RST}"
    echo -e "  ${GRY}Enter number(s) separated by commas  (e.g. 1,3)${RST}"
    echo -e "  ${GRY}Type 'all' for every preset model${RST}"
    echo -e "  ${GRY}Type 'c' to add a custom model${RST}"
    echo -e "  ${GRY}Mix them!  (e.g. 1,3,c)${RST}"
    echo ""
}

# Parses USER_CHOICE → populates SELECTED_NUMS, HAS_CUSTOM, plus CUSTOM_*
parse_model_selection() {
    SELECTED_NUMS=()
    HAS_CUSTOM=false
    CUSTOM_FILE=""; CUSTOM_URL=""; CUSTOM_LOCAL=""; CUSTOM_PROMPT=""

    CHOICE_LOWER=$(echo "$USER_CHOICE" | tr '[:upper:]' '[:lower:]' | tr -d ' ')

    if [ "$CHOICE_LOWER" = "all" ]; then
        SELECTED_NUMS=("${MODEL_NUMS[@]}")
    else
        local TOKEN T N S VALID ALREADY
        IFS=',' read -ra TOKENS <<< "$CHOICE_LOWER"
        for TOKEN in "${TOKENS[@]}"; do
            T=$(echo "$TOKEN" | tr -d ' ')
            if [ "$T" = "c" ] || [ "$T" = "custom" ]; then
                HAS_CUSTOM=true
            elif [[ "$T" =~ ^[0-9]+$ ]]; then
                VALID=false
                for N in "${MODEL_NUMS[@]}"; do [ "$T" -eq "$N" ] && VALID=true && break; done
                if $VALID; then
                    ALREADY=false
                    for S in "${SELECTED_NUMS[@]}"; do [ "$S" -eq "$T" ] && ALREADY=true && break; done
                    $ALREADY || SELECTED_NUMS+=("$T")
                else
                    echo -e "${RED}  Invalid number '$T' - skipping${RST}"
                fi
            else
                echo -e "${RED}  Unrecognized input '$T' - skipping${RST}"
            fi
        done
    fi

    if $HAS_CUSTOM; then
        echo ""
        echo -e "${GRN}  ---- Custom Model Setup ----${RST}"
        echo -e "${GRY}  Paste a direct link to a .gguf file from HuggingFace.${RST}"
        echo -e "${DGR}  Example: https://huggingface.co/user/model-GGUF/resolve/main/model-Q4_K_M.gguf${RST}"
        echo ""
        read -r -p "  GGUF URL: " CUSTOM_URL_RAW
        CUSTOM_URL=$(echo "$CUSTOM_URL_RAW" | tr -d ' ')
        if [ -z "$CUSTOM_URL" ]; then
            echo -e "${RED}  No URL entered - skipping custom model.${RST}"
            HAS_CUSTOM=false
        else
            if [[ "$CUSTOM_URL" != *.gguf* ]]; then
                echo -e "${RED}  WARNING: URL does not contain .gguf.${RST}"
                read -r -p "  Try anyway? (yes/no): " PROCEED
                local PROCEED_L; PROCEED_L=$(echo "$PROCEED" | tr '[:upper:]' '[:lower:]')
                if [ "$PROCEED_L" != "yes" ] && [ "$PROCEED_L" != "y" ]; then
                    echo -e "${YLW}  Skipping custom model.${RST}"
                    HAS_CUSTOM=false; CUSTOM_URL=""
                fi
            fi
        fi
        if $HAS_CUSTOM && [ -n "$CUSTOM_URL" ]; then
            CUSTOM_FILE=$(basename "${CUSTOM_URL%%\?*}")
            [[ "$CUSTOM_FILE" != *.gguf ]] && CUSTOM_FILE="${CUSTOM_FILE}.gguf"
            read -r -p "  Short name (e.g. mymodel-local): " CUSTOM_LOCAL_RAW
            CUSTOM_LOCAL=$(echo "${CUSTOM_LOCAL_RAW:-custom}" | tr '[:upper:]' '[:lower:]' | sed 's/[[:space:]]/-/g')
            [[ "$CUSTOM_LOCAL" != *-local ]] && CUSTOM_LOCAL="${CUSTOM_LOCAL}-local"
            read -r -p "  System prompt (Enter for default): " CUSTOM_PROMPT
            [ -z "$CUSTOM_PROMPT" ] && CUSTOM_PROMPT="You are a helpful AI assistant."
            echo -e "${GRN}  Custom model added!${RST}"
        fi
    fi
}

# Errors out (returns 1) if no models selected. Caller decides what to do.
selection_is_empty() {
    [ "${#SELECTED_NUMS[@]}" -eq 0 ] && ! $HAS_CUSTOM
}

space_warning() {
    local TOTAL_SIZE=0 NUM S
    for NUM in "${SELECTED_NUMS[@]}"; do
        S=$(get_field "$NUM" SIZE)
        TOTAL_SIZE=$(awk "BEGIN{print $TOTAL_SIZE + $S}")
    done
    local TOTAL_COUNT=${#SELECTED_NUMS[@]}
    $HAS_CUSTOM && TOTAL_COUNT=$((TOTAL_COUNT + 1))
    if [ "$TOTAL_COUNT" -ge 3 ] || [ "$CHOICE_LOWER" = "all" ]; then
        local NEEDED; NEEDED=$(awk "BEGIN{print int($TOTAL_SIZE + 4) + 1}")
        echo ""
        echo -e "${RED}  =============================================${RST}"
        echo -e "${RED}  WARNING: You selected ${TOTAL_COUNT} models!${RST}"
        echo -e "${RED}  Estimated download: ~${TOTAL_SIZE} GB${RST}"
        echo -e "${RED}  Need at least ~${NEEDED} GB free on the drive!${RST}"
        if [ "$FREE" -gt 0 ] 2>/dev/null && [ "$FREE" -lt "$NEEDED" ] 2>/dev/null; then
            echo -e "${YLW}  You only have ${FREE} GB free - this may NOT fit!${RST}"
        fi
        echo -e "${RED}  =============================================${RST}"
        echo ""
        read -r -p "  Continue? (yes/no): " CONT
        local CONT_L; CONT_L=$(echo "$CONT" | tr '[:upper:]' '[:lower:]')
        if [ "$CONT_L" != "yes" ] && [ "$CONT_L" != "y" ]; then
            echo -e "${YLW}  Cancelled.${RST}"
            return 1
        fi
    fi
    return 0
}

show_selection_summary() {
    echo ""
    echo -e "${GRN}  Selected model(s):${RST}"
    local NUM NAME SIZE
    for NUM in "${SELECTED_NUMS[@]}"; do
        NAME=$(get_field "$NUM" NAME); SIZE=$(get_field "$NUM" SIZE)
        echo -e "    ${WHT}+ ${NAME} (~${SIZE} GB)${RST}"
    done
    $HAS_CUSTOM && [ -n "$CUSTOM_URL" ] && echo -e "    ${WHT}+ Custom: ${CUSTOM_FILE}${RST}"
    echo ""
}

download_ui_vendor_assets() {
    local script="$SHARED_DIR/scripts/download-ui-assets.sh"
    if [ -f "$script" ]; then
        bash "$script" "$VENDOR_DIR"
    else
        echo -e "${YLW}      WARNING: Shared vendor bootstrap script not found. Skipping.${RST}"
    fi
}

# ── Model download loop ────────────────────────────────────────
# Caller initialises DOWNLOAD_ERRORS=() and MODEL_INDEX=0 beforehand.
download_one_model() {
    local NUM=$1 TOTAL=$2
    local NAME FILE URL MINB SIZE DEST
    NAME=$(get_field "$NUM" NAME)
    FILE=$(get_field "$NUM" FILE)
    URL=$(get_field "$NUM" URL)
    MINB=$(get_field "$NUM" MINB)
    SIZE=$(get_field "$NUM" SIZE)
    MODEL_INDEX=$((MODEL_INDEX + 1))
    DEST="$MODELS_DIR/$FILE"

    echo ""
    echo -e "  ${YLW}(${MODEL_INDEX}/${TOTAL}) ${NAME} (~${SIZE} GB)${RST}"

    if file_ok "$DEST" "$MINB"; then
        echo -e "${GRN}      Already downloaded! Skipping...${RST}"; return
    fi
    # Legacy dolphin Q5 detection (keeps existing user installs working)
    if [ "$(get_field "$NUM" LOCAL)" = "dolphin-local" ]; then
        local LEGACY="$MODELS_DIR/dolphin-2.9-llama3-8b-Q5_K_M.gguf"
        if file_ok "$LEGACY" 4000000000; then
            echo -e "${GRN}      Found existing Dolphin Q5_K_M - using that instead!${RST}"
            eval "MODEL_FILE_${NUM}=dolphin-2.9-llama3-8b-Q5_K_M.gguf"
            return
        fi
    fi
    if copy_from_drive_root "$FILE" "$DEST" "$MINB"; then return; fi

    echo -e "${MAG}      Downloading... Do NOT close this window!${RST}"
    local SUCCESS=false ATTEMPT ACTUAL ACTUAL_GB
    for ATTEMPT in 1 2; do
        [ "$ATTEMPT" -gt 1 ] && echo -e "${YLW}      Retry attempt ${ATTEMPT}...${RST}"
        curl -L "$URL" -o "$DEST"
        if file_ok "$DEST" "$MINB"; then SUCCESS=true; break; fi
        ACTUAL=$(stat_size "$DEST")
        ACTUAL_GB=$(awk "BEGIN{printf \"%.2f\", $ACTUAL/1073741824}")
        echo -e "${RED}      File seems too small (${ACTUAL_GB} GB). May be incomplete.${RST}"
    done
    if $SUCCESS; then
        echo -e "${GRN}      Download complete!${RST}"
    else
        DOWNLOAD_ERRORS+=("$NAME")
        echo -e "${RED}      ERROR: Download failed for ${NAME}!${RST}"
        echo -e "${DGR}      Manual URL: ${URL}${RST}"
    fi
}

download_custom_model() {
    local TOTAL=$1 DEST
    DEST="$MODELS_DIR/$CUSTOM_FILE"
    MODEL_INDEX=$((MODEL_INDEX + 1))
    echo ""
    echo -e "  ${YLW}(${MODEL_INDEX}/${TOTAL}) Custom: ${CUSTOM_FILE}${RST}"
    if file_ok "$DEST" 100000000; then
        echo -e "${GRN}      Already downloaded! Skipping...${RST}"; return
    fi
    if copy_from_drive_root "$CUSTOM_FILE" "$DEST" 100000000; then return; fi
    echo -e "${MAG}      Downloading custom model...${RST}"
    curl -L "$CUSTOM_URL" -o "$DEST"
    if file_ok "$DEST" 100000000; then
        echo -e "${GRN}      Download complete!${RST}"
    else
        DOWNLOAD_ERRORS+=("Custom: $CUSTOM_FILE")
        echo -e "${RED}      ERROR: Custom model download failed!${RST}"
    fi
}

run_model_downloads() {
    local TOTAL=$((${#SELECTED_NUMS[@]} + ($HAS_CUSTOM && true || false)))
    MODEL_INDEX=0
    local NUM
    for NUM in "${SELECTED_NUMS[@]}"; do download_one_model "$NUM" "$TOTAL"; done
    if $HAS_CUSTOM && [ -n "$CUSTOM_URL" ]; then
        download_custom_model "$TOTAL"
    fi
}

# ── Modelfile generation ───────────────────────────────────────
write_modelfile() {
    local LOCAL=$1 FILE=$2 PROMPT=$3
    printf 'FROM ./%s\nPARAMETER temperature 0.7\nPARAMETER top_p 0.9\nSYSTEM %s\n' \
        "$FILE" "$PROMPT" > "$MODELS_DIR/Modelfile-${LOCAL}"
}

create_modelfiles_and_list() {
    FIRST_LOCAL=""; FIRST_FILE=""; FIRST_PROMPT=""
    local NUM LOCAL FILE PROMPT NAME LABEL
    for NUM in "${SELECTED_NUMS[@]}"; do
        LOCAL=$(get_field "$NUM" LOCAL); FILE=$(get_field "$NUM" FILE)
        PROMPT=$(get_field "$NUM" PROMPT); NAME=$(get_field "$NUM" NAME)
        write_modelfile "$LOCAL" "$FILE" "$PROMPT"
        echo -e "${GRN}      Config: ${NAME} -> ${LOCAL}${RST}"
        [ -z "$FIRST_LOCAL" ] && FIRST_LOCAL="$LOCAL" && FIRST_FILE="$FILE" && FIRST_PROMPT="$PROMPT"
    done
    if $HAS_CUSTOM && [ -n "$CUSTOM_URL" ]; then
        write_modelfile "$CUSTOM_LOCAL" "$CUSTOM_FILE" "$CUSTOM_PROMPT"
        echo -e "${GRN}      Config: Custom -> ${CUSTOM_LOCAL}${RST}"
        [ -z "$FIRST_LOCAL" ] && FIRST_LOCAL="$CUSTOM_LOCAL" && FIRST_FILE="$CUSTOM_FILE" && FIRST_PROMPT="$CUSTOM_PROMPT"
    fi
    # Legacy single Modelfile (back-compat with old start scripts).
    printf 'FROM ./%s\nPARAMETER temperature 0.7\nPARAMETER top_p 0.9\nSYSTEM %s\n' \
        "$FIRST_FILE" "$FIRST_PROMPT" > "$MODELS_DIR/Modelfile"

    local INSTALLED_LIST=""
    for NUM in "${SELECTED_NUMS[@]}"; do
        LOCAL=$(get_field "$NUM" LOCAL); NAME=$(get_field "$NUM" NAME); LABEL=$(get_field "$NUM" LABEL)
        INSTALLED_LIST="${INSTALLED_LIST}${LOCAL}|${NAME}|${LABEL}\n"
    done
    $HAS_CUSTOM && INSTALLED_LIST="${INSTALLED_LIST}${CUSTOM_LOCAL}|Custom: ${CUSTOM_FILE}|CUSTOM\n"
    printf "$INSTALLED_LIST" > "$MODELS_DIR/installed-models.txt"
    echo -e "${DGR}      Saved model list to installed-models.txt${RST}"
}

# ── Ollama import ──────────────────────────────────────────────
# Caller must pass the Ollama binary path. PLATFORM_OS decides pkill pattern.
import_models_into_ollama() {
    local OLLAMA_BIN=$1
    if [ ! -x "$OLLAMA_BIN" ]; then
        echo -e "${RED}      ERROR: Ollama not found! Cannot import models.${RST}"
        return 1
    fi
    local OLLAMA_RUNTIME="$OLLAMA_DATA/../.ollama-runtime"
    mkdir -p "$OLLAMA_RUNTIME/runners" "$OLLAMA_RUNTIME/tmp"
    export OLLAMA_MODELS="$OLLAMA_DATA"
    export OLLAMA_HOME="$OLLAMA_RUNTIME"
    export OLLAMA_RUNNERS_DIR="$OLLAMA_RUNTIME/runners"
    export OLLAMA_TMPDIR="$OLLAMA_RUNTIME/tmp"
    export OLLAMA_ORIGINS="*"
    export OLLAMA_HOST="127.0.0.1:11434"

    pkill -f "$(basename "$OLLAMA_BIN")" 2>/dev/null
    sleep 2

    echo -e "${DGR}      Starting Ollama temporarily for import...${RST}"
    HOME="$OLLAMA_RUNTIME" "$OLLAMA_BIN" serve > "$OLLAMA_RUNTIME/install.log" 2>&1 &
    local OLLAMA_PID=$!

    local i
    for i in $(seq 1 30); do
        curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1 && break
        sleep 1
    done

    cd "$MODELS_DIR" || return 1

    local NUM LOCAL NAME FILE MINB GGUF
    _import_one() {
        local LOCAL=$1 NAME=$2 FILE=$3 MINB=$4
        local GGUF="$MODELS_DIR/$FILE"
        if ! file_ok "$GGUF" "$MINB"; then
            echo -e "${RED}      Skipping ${NAME} - GGUF not found or incomplete${RST}"
            return
        fi
        echo -e "${YLW}      Importing ${NAME}...${RST}"
        if "$OLLAMA_BIN" create "$LOCAL" -f "Modelfile-${LOCAL}" 2>&1; then
            echo -e "${GRN}      ${NAME} imported successfully!${RST}"
        else
            echo -e "${RED}      ERROR: Failed to import ${NAME}${RST}"
        fi
    }

    for NUM in "${SELECTED_NUMS[@]}"; do
        _import_one "$(get_field "$NUM" LOCAL)" "$(get_field "$NUM" NAME)" \
                    "$(get_field "$NUM" FILE)" "$(get_field "$NUM" MINB)"
    done
    if $HAS_CUSTOM && [ -n "$CUSTOM_URL" ]; then
        _import_one "$CUSTOM_LOCAL" "Custom: $CUSTOM_FILE" "$CUSTOM_FILE" 100000000
    fi

    echo -e "${DGR}      Stopping temporary Ollama server...${RST}"
    kill "$OLLAMA_PID" 2>/dev/null
    wait "$OLLAMA_PID" 2>/dev/null
}

# ── Final summary ──────────────────────────────────────────────
# Caller may set START_HINT (printed at the end).
print_final_summary() {
    local IMAGE_MODEL=$1
    echo ""
    echo -e "${CYN}==========================================================${RST}"
    if [ "${#DOWNLOAD_ERRORS[@]}" -gt 0 ]; then
        echo -e "${YLW}   SETUP COMPLETE (with some errors)                      ${RST}"
        echo -e "${CYN}==========================================================${RST}"
        echo ""
        echo -e "${RED}  The following had issues:${RST}"
        local ERR
        for ERR in "${DOWNLOAD_ERRORS[@]}"; do echo -e "${RED}    ! ${ERR}${RST}"; done
        echo ""
        echo -e "${YLW}  Re-run the installer to retry failed downloads.${RST}"
    else
        echo -e "${GRN}   SETUP COMPLETE! YOUR PORTABLE AI IS READY!             ${RST}"
        echo -e "${CYN}==========================================================${RST}"
    fi
    echo ""
    echo -e "${WHT}  Installed LLM models:${RST}"
    local NUM NAME LABEL TAG
    for NUM in "${SELECTED_NUMS[@]}"; do
        NAME=$(get_field "$NUM" NAME); LABEL=$(get_field "$NUM" LABEL)
        if [ "$LABEL" = "UNCENSORED" ]; then TAG="${RED}[UNCENSORED]${RST}"
        else TAG="${CYN}[STANDARD]${RST}"; fi
        echo -e "${GRY}    - ${NAME} ${TAG}"
    done
    $HAS_CUSTOM && [ -n "$CUSTOM_URL" ] && echo -e "${GRY}    - Custom: ${CUSTOM_FILE} ${GRN}[CUSTOM]${RST}"
    if [ -n "$IMAGE_MODEL" ] && file_ok "$IMAGE_MODEL" 2000000000; then
        echo ""
        echo -e "${WHT}  Installed Image model:${RST}"
        echo -e "${GRY}    - CyberRealistic v3.3 FP16 ${RED}[UNCENSORED]${RST}"
    fi
    echo ""
    [ -n "$START_HINT" ] && echo -e "${WHT}  $START_HINT${RST}"
    echo ""
}
