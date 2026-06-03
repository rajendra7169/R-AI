# R-AI

**R-AI** is an air-gapped, zero-dependency local AI runtime that runs from a portable USB/SSD or an internal drive. It bundles isolated engine binaries, a portable Python interpreter, and a single-file web UI so models execute natively on your hardware with no installation, package manager, or internet connection required after first setup.

A unified `Shared/` volume lets you download a model once and use it across Windows, macOS, Linux, and Android.

---

## Highlights

- **Zero dependency.** Portable Python and isolated engine binaries — no system Python, no package manager, no registry edits.
- **Cross-platform.** One `Shared/` directory feeds Windows, macOS, Linux, and Android installs; ~5 GB models are downloaded once.
- **Fully offline.** Air-gapped after initial setup. Vendor UI assets (markdown, syntax highlighting, fonts, PDF.js) are mirrored locally.
- **LAN access with auth.** A per-install access token guards the server; loopback is exempt so the local browser launches without prompts.
- **Hardware accelerated.** AVX, NVIDIA CUDA, and Apple Metal are picked up automatically when present.

---

## Requirements

| Resource | Minimum | Recommended |
|---|---|---|
| Storage | USB 3.0 / SSD, 8 GB free | 16 GB+ |
| RAM | 8 GB (2B/4B models) | 16 GB+ (9B/12B models) |
| OS | Windows 10+, macOS 12+, Ubuntu/Debian, Termux/Android | — |

---

## Repository layout

```
R-AI/
├── Android/                  # Termux installer + launcher
├── Linux/                    # Linux installer + launcher
├── Mac/                      # macOS installer + launcher
├── Windows/                  # Windows installer + launcher
├── Shared/                   # Cross-platform runtime
│   ├── chat_server.py        # Zero-dep HTTP server (UI + chat storage + Ollama/llama.cpp proxy)
│   ├── FastChatUI.html       # Built UI artifact (do not edit by hand; see ui-src/)
│   ├── ui-src/               # UI source split into template + CSS + JS
│   │   ├── template.html
│   │   ├── styles/{fonts.css, main.css}
│   │   └── app.js
│   ├── config/               # Single source of truth for model catalogue + vendor assets
│   │   ├── models.json
│   │   └── ui-vendor-assets.json
│   ├── scripts/
│   │   ├── build-ui.py            # Concatenates ui-src/* → FastChatUI.html
│   │   ├── install-common.sh      # Shared bash helpers for Linux + Mac installers
│   │   ├── config_query.py        # Emits shell-quoted model vars from models.json
│   │   ├── download-ui-assets.{sh,ps1}
│   │   └── uninstall-common.sh
│   ├── bin/                  # (runtime) Engine binaries: ollama, llama-server, sd
│   ├── models/               # (runtime) GGUF weights + Ollama Modelfiles
│   ├── vendor/               # (runtime) Mirrored marked.js, highlight.js, PDF.js, fonts
│   ├── chat_data/            # (runtime) Per-chat JSON store, settings, access token
│   └── logs/                 # (runtime) Server logs
└── tests/                    # stdlib unittest smoke tests (no external deps)
```

Runtime directories (`bin/`, `models/`, `vendor/`, `chat_data/`, `logs/`) are `.gitignore`d.

---

## Quick start

### 1. Install the engine and download models

| OS | Command |
|---|---|
| Windows | Double-click `Windows/install.bat` |
| macOS | `bash Mac/install.command` (or drag into Terminal) |
| Linux | `bash Linux/install.sh` |
| Android (Termux) | `bash Android/install.sh` |

Installers pull the engine binary (~50 MB), download selected GGUF models, write Ollama `Modelfile` entries, and import them.

### 2. Launch

| OS | Command |
|---|---|
| Windows | `Windows/start-fast-chat.bat` |
| macOS | `bash Mac/start.command` |
| Linux | `bash Linux/start.sh` |
| Android | `bash Android/start.sh` |

The server starts on `http://localhost:3333`, your browser opens automatically, and chat history persists under `Shared/chat_data/`.

---

## LAN access

The server binds to `0.0.0.0:3333` so you can use it from a phone or another machine on the same network. Access is gated by a per-install token to keep the model and chat history off untrusted devices.

- The token is generated on first launch and stored at `Shared/chat_data/.access_token` (not committed).
- The startup banner prints the LAN URL with the token baked in:
  ```
  Network Access:  http://192.168.1.15:3333/?t=8x...Z9
  ```
- Open that URL once on the remote device; the server validates the token, sets an HttpOnly cookie, and redirects to `/`. Subsequent visits work without the query string.
- Loopback clients (`127.0.0.1`, `::1`) are always exempt, so the auto-launched browser is unaffected.
- Tokens can also be sent via `X-Auth-Token: <token>` or `Authorization: Bearer <token>`.

To disable auth (legacy behaviour, **not recommended on shared networks**):

```bash
R_AI_DISABLE_AUTH=1 python Shared/chat_server.py
# or
python Shared/chat_server.py --no-auth
```

If LAN pages don't load at all, confirm port `3333` is allowed through the host firewall.

---

## Models

The model catalogue lives in [`Shared/config/models.json`](Shared/config/models.json) and is consumed identically by every installer via `Shared/scripts/config_query.py`. Adding a model means editing one JSON file — no shell-script duplication.

| Model | Size | Notes |
|---|---|---|
| Gemma 2 2B (abliterated) | ~1.6 GB | Default recommendation. Fast, capable, low RAM. |
| Gemma 4 E4B Ultra Heretic | ~5.3 GB | Aggressively compliant fine-tune. |
| Qwen 3.5 9B Uncensored | ~5.2 GB | Large reasoning model. |
| NemoMix Unleashed 12B | ~7.0 GB | Heavyweight; needs 16 GB+ RAM. |
| Dolphin 2.9 Llama-3 8B | ~4.9 GB | General-purpose uncensored fine-tune. |
| Phi-3.5 Mini 3.8B | ~2.2 GB | Lightweight standard model. |
| CyberRealistic v3.3 (SD 1.5) | ~2.0 GB | Image model used by the SD engine. |
| **Custom GGUF** | varies | Paste any HuggingFace `.gguf` URL during install. |

Android installs use a slimmer catalogue tuned for phone RAM (Gemma 2 2B, SmolLM2 1.7B, Qwen 2.5 1.5B, Phi 3.5 Mini).

---

## Architecture

**Desktop (Windows / Linux / macOS).** Ollama serves models on `127.0.0.1:11434`. The Python server proxies `/ollama/*` to it, eliminating CORS handling on the UI side and presenting a single port to LAN clients.

**Android.** llama.cpp is compiled natively in Termux (the engine binary is not shipped — the install script clones `ggerganov/llama.cpp`, builds `llama-server` with CMake/Ninja, and pins it to `Shared/bin/llama-server-android`). The server runs in `--llama-cpp` mode and bridges OpenAI-style SSE responses back to the Ollama JSONL contract the UI expects.

**Image generation.** Optional `stable-diffusion.cpp` binary (`Shared/bin/sd-{windows,linux,mac}/sd`). The server enforces that Ollama is stopped before generating images so the RAM budget is exclusive; jobs are tracked in-process with progress polling at `/api/image-progress`.

**Chat persistence.** Chats are stored one file per conversation under `Shared/chat_data/chats/<id>.json`, with an `_index.json` keeping per-chat content hashes. Saves diff against the index and only rewrite changed files. A one-shot migration converts any legacy `chat_data/chats.json` on first run.

---

## Developing

### UI

The UI ships as a single HTML file (`Shared/FastChatUI.html`) so the runtime stays zero-build for end users. Source lives in `Shared/ui-src/` and is concatenated by a small build script:

```bash
python Shared/scripts/build-ui.py            # writes Shared/FastChatUI.html
python Shared/scripts/build-ui.py --check    # prints sha256 without writing
```

The template (`ui-src/template.html`) holds the page shell with `{{INCLUDE: relative/path}}` markers in place of the `<style>` and `<script>` bodies. The build is byte-deterministic and a test verifies it round-trips against the checked-in HTML.

### Installers

`Shared/scripts/install-common.sh` is the shared bash library used by `Linux/install.sh` and `Mac/install.command`. Helpers in the library:

- platform-aware `stat_size`, `free_gb`, `is_native_binary`
- model catalogue loader (`load_model_catalogue`)
- interactive menu and selection parsing (`print_model_menu`, `parse_model_selection`)
- drive-root pre-fill scan (`copy_from_drive_root`)
- download loop with retries (`run_model_downloads`)
- `Modelfile` writer and Ollama import (`create_modelfiles_and_list`, `import_models_into_ollama`)

Linux and Mac installers carry only platform-specific bits: engine archive URL, extract command, and (on macOS) `xattr -d com.apple.quarantine`.

### Tests

```bash
python -m unittest discover -s tests
```

The suite is stdlib-only and covers token lifecycle, chat round-trip, incremental save behaviour, legacy migration, chat-id sanitisation, and the UI build round-trip.

---

## Local-disk install

Identical to the portable workflow, just with the repo cloned to an internal drive:

```bash
git clone https://github.com/rajendra7169/R-AI.git
cd R-AI
# Then run the installer for your OS as above.
```

Running from an internal SSD is markedly faster than USB — near-instant model loading.

---

## Android (Termux) notes

- Install Termux from F-Droid (the Play Store build is outdated).
- Run `termux-setup-storage` once (the installer does this).
- Run `termux-wake-lock` before launch to keep the server alive in background.
- Use the 2B model on devices under 12 GB RAM; expect 3–10 tok/s vs 30–50+ on a desktop GPU.
- Plug in the charger — LLM inference is power-hungry.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `start-fast-chat.bat` closes instantly on Windows | Windows App Execution Aliases for `python` are intercepting. Disable them under Settings → Apps → Advanced app settings → App execution aliases, or run via `cmd`. |
| `Engine Not Found` | The install script hasn't been run yet, or `Shared/bin/` was excluded by sync software. |
| Phone gets `401 Access token required` | Open the LAN URL printed at startup *with* the `?t=…` suffix once; the cookie is set after that. |
| LAN access works on PC but not on phone | Host firewall is blocking port 3333. Allow it inbound. |
| Generation is very slow | Model is too large for available RAM. Switch to Gemma 2 2B. |

---

## License

MIT
