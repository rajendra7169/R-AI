# R-AI

**R-AI** is a fully air-gapped, zero-dependency, plug-and-play local AI environment designed to run seamlessly from your **local hard drive** or a **portable USB/SSD**. It bypasses complex installations — natively executing large language models directly on your hardware with no internet required.

With a unified architecture, you can initialize your AI models once and choose to keep them on your system or carry them with you across Windows, macOS, Linux, and Android.

## Core Features

* **Zero Dependency Setup:** Ships with portable Python and isolated engine binaries. No system permissions, registry edits, or package managers required.
* **Cross-Platform:** Uses an intelligent `Shared` volume system — download your 5GB+ AI models *once*, and use them natively on Windows, macOS, Linux, and Android without duplication.
* **Fully Offline:** Runs completely air-gapped after initial setup. Your data never leaves your machine.
* **Network Proxied UI:** The custom Python HTTP server serves a blazing-fast dark mode chat UI. Access the AI from your phone or tablet on the same WiFi — no CORS headaches.
* **Hardware Accelerated:** Natively capitalizes on AVX CPU instructions, NVIDIA CUDA, or Apple Metal GPU accelerators dynamically when plugged into different host machines.

---

## System Requirements

- **Storage:** USB 3.0+ flash drive or SSD with at least **8 GB** free (16 GB recommended).
- **RAM:** At least **8 GB** for 2B/4B models, **16 GB** for 9B/12B models.

---

## Folder Architecture

```text
[R-AI Drive]
 ├── 📁 Android    # Native Android (Termux) installers & launchers
 ├── 📁 Linux      # Native Ubuntu/Debian offline installers & launchers
 ├── 📁 Mac        # Native macOS offline installers & launchers
 ├── 📁 Windows    # Native Windows offline automatic UI menus
 └── 📁 Shared     # Unified Data System
      ├── 📁 bin         (Isolated executables: ollama-windows.exe, ollama-darwin...)
      ├── 📁 chat_data   (Cross-platform persistent conversation history)
      ├── 📁 models      (HuggingFace GGUF weights & local database mapping)
      └── 📁 python      (Isolated portable python environment)
```

---

## AI Model Library

Curated installer for high-quality, locally operable models:

| Model | Size | Notes |
|---|---|---|
| **Gemma 2 2B Abliterated** | ~1.6 GB | Fast, smart for its size. Great starting point. |
| **Gemma 4 E4B Ultra** | ~5.34 GB | Aggressively compliant fine-tune. |
| **Qwen 3.5 9B** | ~5.2 GB | Large reasoning model, raw unbiased answers. |
| **Custom .gguf** | Varies | Download any GGUF weight from HuggingFace directly. |

---

## Quick Start

### Step 1: Initialize the Engine

Run the install script for your OS:

| OS | Command |
|---|---|
| **Windows** | Double-click `Windows/install.bat` |
| **macOS** | Open Terminal -> drag `Mac/install.command` -> Enter |
| **Linux** | `bash Linux/install.sh` |
| **Android** | Open Termux -> `bash Android/install.sh` |

> **Note:** This just downloads the tiny ~50MB execution engine for your OS to the `Shared/bin` folder.

### Step 2: Download AI Models

Recommended via **Windows** (`Windows/install.bat`) for the interactive model catalog.
Otherwise, manually drop `.gguf` files into `Shared/models`.

### Step 3: Launch

| OS | Command |
|---|---|
| **Windows** | `Windows/start-fast-chat.bat` |
| **macOS** | `Mac/start.command` |
| **Linux** | `bash Linux/start.sh` |
| **Android** | `bash Android/start.sh` |

The engine spins up and your browser opens the locally-served Chat UI.

---

## Local Disk Installation

Works beautifully as a lightweight local AI setup too:

1. Clone this repo to any folder on your drive.
2. Navigate to your OS folder (Windows/Mac/Linux).
3. Run the install script and choose your models.
4. Run the start script.

Running from an internal SSD is significantly faster than USB — near-instant model loading.

---

## Android (Termux)

Run AI **directly on your phone** — no PC required.

**Requirements:**
- Termux from F-Droid (not Play Store)
- 6 GB+ RAM (8 GB+ recommended)
- WiFi/data for initial setup only
- ARM64 processor

**Setup:**
```bash
# Copy R-AI to your device, then in Termux:
bash Android/install.sh
# Select your model (Gemma 2 2B recommended)
```

**Launch:**
```bash
bash Android/start.sh
```

**Tips:**
- Run `termux-wake-lock` first to prevent Android from killing the process
- Keep Termux in foreground for best performance
- Close other apps to free RAM
- Use the 2B model on devices under 12 GB RAM
- Plug in charger — LLM inference drains battery
- Expect ~3-10 tokens/sec on 2B (vs 30-50+ on PC with GPU)

---

## LAN Mobile Access

Use your PC's AI from your phone on the couch:

1. PC running the start script + phone on same WiFi.
2. Terminal shows a **Network Access** IP (e.g., `http://192.168.1.15:3333`).
3. Open that URL on your phone browser.

> If pages don't load, check that Windows Firewall allows port `3333`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Script closes instantly (Windows) | Windows App Execution Aliases conflict. Run via cmd or as Admin. |
| "Engine Not Found" | Run the install script before the start script. |
| Slow generation | Model too large for your RAM. Use the Gemma 2 2B model. |

---

## License

MIT

---

> *R-AI — your AI, your hardware, zero cloud.*