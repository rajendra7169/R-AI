# R-AI on Linux — Full Instructions

Everything R-AI needs lives inside this repository/drive. Nothing is installed into your
system, no `pip install` runs, nothing is written to `~/.ollama`, and no root/`sudo` is
required. You can delete the folder and every trace is gone.

## Quick start

**Step 1 — install once (one terminal command).** Open a terminal in this folder and run:

```bash
bash Linux/install.sh
```

It downloads the engine and the models you pick, then adds an **R-AI** entry to your
application menu.

> Why a terminal for this one step? Modern GNOME (Ubuntu 22.04+) deliberately **won't run a
> launcher file by double-click** — it opens it in a text editor instead, and the old
> "Allow Launching" option has been removed. So there's no way around one command to
> bootstrap. After that, you never need the terminal again.

**Step 2 — from now on, just click.** Press `Super` (the Windows key), type **R-AI**, and
click the icon. The engine starts and the chat opens in your browser. Right-click the icon
in the dock → **Pin to Dash** to keep it one click away, and right-click it → **Stop R-AI**
to shut down.

### On KDE, XFCE, MATE, Cinnamon

Those file managers *do* let you run launchers directly, so you can skip the app menu and
double-click **Start R-AI** / **Install R-AI** right here in this folder (tick
*Properties → Permissions → Allow executing* the first time if asked). On GNOME these two
files just open as text — use the app-menu entry from Step 2 instead.

### Prefer the terminal for everything?

```bash
bash Linux/install.sh    # once
bash Linux/start.sh      # every time  (bash Linux/stop.sh to shut down)
```

---

## 1. Prerequisites

You need these on the system (all are in the default repos of every major distro):

| Tool | Used for |
|---|---|
| `bash` | the scripts themselves |
| `python3` | reads the model catalogue during install; runs the chat server |
| `curl` | downloading the engine and models |
| `tar` + `zstd` | extracting the Ollama archive (`.tar.zst`) |
| `unzip` | extracting the Stable Diffusion engine |

Install them:

```bash
# Debian / Ubuntu / Mint / Pop!_OS
sudo apt update && sudo apt install -y python3 curl zstd unzip tar

# Fedora / RHEL
sudo dnf install -y python3 curl zstd unzip tar

# Arch / Manjaro
sudo pacman -S --needed python curl zstd unzip tar
```

**Hardware:** x86_64 (64-bit Intel/AMD). 8 GB RAM is enough for the 2B model; 16 GB+ for
the 9B/12B models. You need ~8 GB free disk for a minimal install, more if you pick
several models. An NVIDIA or AMD GPU is used automatically if its drivers are present —
the Ollama archive ships the CUDA/ROCm/Vulkan runtimes — otherwise everything runs on CPU.

---

## 2. Install

```bash
cd /path/to/R-AI
bash Linux/install.sh
```

The installer walks through seven steps and is interactive at the start:

1. **Pick your models.** A menu lists the presets. Enter a single number (`1`), several
   separated by commas (`1,3`), `all` for every preset, or `C` to paste your own
   HuggingFace `.gguf` URL. Pressing Enter with no input defaults to **[1] Gemma 2 2B**,
   which is the right choice if you're unsure — it's fast and runs on 8 GB of RAM.
   Selecting 3+ models triggers a disk-space confirmation prompt.
2. **Folder structure** is created under `Shared/`.
3. **UI assets** (markdown renderer, syntax highlighting, PDF.js, fonts) are mirrored
   locally so the interface works with no internet afterwards.
4. **Model weights** download (this is the slow part — 1.6 GB to 7 GB each).
5. **Modelfiles** are written so Ollama knows each model's system prompt.
6. **The Ollama Linux engine** downloads (~1 GB) and extracts to `Shared/bin/`.
   **6b.** The **Stable Diffusion** image engine downloads to `Shared/bin/sd-linux/`.
   **6c.** The **CyberRealistic** image model (~2 GB) downloads.
7. **Models are imported** into the Ollama engine.
   **7b.** A **desktop launcher** is created so you can start R-AI with a click. It asks
   whether you also want an icon on your Desktop.

A summary prints at the end listing anything that failed. Re-running `install.sh` is safe
and cheap — it skips anything already downloaded and valid, so it doubles as a repair
command if a download was interrupted.

> **Tip:** if the model files are already sitting at the root of the drive, the installer
> offers to copy them instead of re-downloading.

---

## 3. Run

### Click the icon (the normal way)

Once the installer has run, open your applications (press `Super`), search for **R-AI**, and
click it. That is the whole workflow: the engine starts, the chat UI opens in your browser,
and chats save themselves to `Shared/chat_data/` as you go. Drag it to your dock/favourites
to keep it handy. (On KDE/XFCE you can instead double-click **Start R-AI** in this folder.)

- **Right-click → Stop R-AI** shuts down the engine and the server, freeing the RAM.
- **Right-click → Open terminal chat** launches the console client instead.
- Clicking it again while it is already running just reopens the browser tab; it will not
  fight over the port.
- If something goes wrong (engine missing, failed to start) you get a desktop notification
  rather than a silent no-op.

The launcher is created by step **[7b/7]** of the installer. You can also (re)create it at
any time, optionally dropping an icon on your Desktop:

```bash
bash Linux/install-shortcut.sh              # app menu only
bash Linux/install-shortcut.sh --desktop    # also put an icon on the Desktop
```

It writes a single file to `~/.local/share/applications/r-ai.desktop`. That is the only
thing R-AI ever puts outside its own folder, and `uninstall.sh` removes it again.

### From a terminal

```bash
bash Linux/start.sh    # start (Ctrl+C to shut down)
bash Linux/stop.sh     # stop, from anywhere
```

The scripts are executable, so `./Linux/start.sh` works from a terminal. (GNOME's Files
won't run scripts on double-click either, unless you enable *Preferences → Executable Text
Files → Run*; the app-menu entry from Step 2 is the click-to-run path on GNOME.)

### Terminal chat

If you'd rather stay in the console:

```bash
bash Linux/start-terminal.sh
```

It boots the server itself and gives you a TUI. Useful flags:

```bash
bash Linux/start-terminal.sh --model gemma2-2b-local   # start on a specific model
bash Linux/start-terminal.sh --no-auto                 # attach to an already-running server
bash Linux/start-terminal.sh --host 192.168.1.7 --token TOKEN   # connect to another machine
```

---

## 4. Using it from your phone or another computer

The server listens on `0.0.0.0:3333`, so other devices on your network can reach it. Access
is protected by a token so a stranger on the same Wi-Fi can't read your chats.

On startup the banner prints the LAN URL with the token already attached:

```
Network Access:  http://192.168.1.15:3333/?t=8x...Z9
```

Open **that full URL, including the `?t=…` part**, once on the phone. The server sets a
cookie and every visit after that works with the plain address. The token lives at
`Shared/chat_data/.access_token`. Requests from the local machine itself (`127.0.0.1`) never
need it, which is why the auto-opened browser just works.

If the page doesn't load at all from another device, your firewall is blocking port 3333:

```bash
sudo ufw allow 3333/tcp        # Ubuntu/Debian
sudo firewall-cmd --add-port=3333/tcp --permanent && sudo firewall-cmd --reload   # Fedora
```

---

## 5. GPU acceleration

The Ollama archive ships CUDA, ROCm and Vulkan runtimes, but they live in subdirectories
(`Shared/bin/lib/ollama/cuda_v13/`, etc.) — and **ggml only scans the single directory
that holds `llama-server`**. It does not descend into those subdirectories, and it ignores
`LD_LIBRARY_PATH` when hunting for backends. Left as shipped, the CUDA backend is never
discovered and every model runs 100% on CPU even with a perfectly good driver.

Step **[6a/7]** of the installer works around this: it reads your driver's CUDA version from
`nvidia-smi`, picks the matching `cuda_v12`/`cuda_v13` build, and copies those `.so` files
up one level next to `llama-server`.

To confirm the GPU is actually being used, load a model and ask the engine how it split it:

```bash
curl -s http://127.0.0.1:11434/api/ps | python3 -m json.tool | grep -E 'name|size'
```

`size_vram` should be close to `size`. If `size_vram` is `0`, everything is on the CPU.
`nvidia-smi` should also show a few GB of memory in use while a model is loaded.

**VRAM matters more than you'd think.** Ollama offloads as many layers as fit and runs the
rest on the CPU, so a model slightly larger than your VRAM still gets most of the benefit,
but one much larger than it will crawl. On a 6 GB card (e.g. RTX 4050 Laptop), the ~4.9 GB
Dolphin model lands about 86% on the GPU; Gemma 2 2B fits entirely. The 12B model will not.

---

## 6. Context length (why replies used to stop mid-sentence)

Ollama defaults every model to a **4096-token** context window regardless of what the model
supports (the Qwen model here can do 262,144). A conversation's tokens — the system prompt,
all previous turns, the reasoning trace if "Think" is on, and the reply being written — all
share that one budget. Several of the bundled models also cannot *context-shift* (drop old
tokens to make room), so once a chat fills 4096 tokens the reply simply **stops in the
middle of a sentence** instead of continuing.

`start.sh` fixes this by exporting `OLLAMA_CONTEXT_LENGTH=8192`, which doubles the window.
Measured on the RTX 4050 (6 GB), that roughly doubled a reply's length (923 → 1,644 tokens
for the same prompt) while VRAM stayed flat at ~4.8 GB — Ollama just offloads a couple fewer
layers to make room for the larger cache, so the speed cost is minor.

Raise it further for very long documents or chats — the model supports far more:

```bash
OLLAMA_CONTEXT_LENGTH=16384 bash Linux/start.sh
```

Bigger windows use more VRAM for the KV cache and slow down prompt processing on huge
histories, so 8192 is the balanced default. On a smaller GPU or the 12B model you can lower
it (e.g. `4096`) to keep more of the model itself on the GPU.

---

## 7. Image generation

The image engine (`Shared/bin/sd-linux/sd`) and the CyberRealistic model are installed by
default. The server **requires the Ollama engine to be stopped before generating an image**
so the whole RAM budget is available to Stable Diffusion — the UI handles this for you and
shows a progress bar. On CPU-only machines expect a few minutes per image; with a GPU it's
much faster.

---

## 8. Where everything lives

```
Shared/
├── bin/ollama-linux          # the AI engine
├── bin/lib/ollama/           # engine helpers + CUDA/ROCm/Vulkan runtimes
├── bin/sd-linux/sd           # Stable Diffusion image engine
├── models/                   # your .gguf weights + Modelfiles
├── models/ollama_data/       # Ollama's imported model store
├── .ollama-runtime/          # Ollama's HOME — keeps it out of your ~/
├── vendor/                   # offline UI assets
├── chat_data/                # your chats, settings, access token
└── logs/                     # server logs
```

`start.sh` sets `OLLAMA_MODELS`, `OLLAMA_HOME`, `OLLAMA_RUNNERS_DIR` and `OLLAMA_TMPDIR` to
these paths, which is what keeps the install fully self-contained and portable across
machines.

---

## 9. Adding more models later

Just run the installer again and pick the new ones — existing downloads are detected and
skipped:

```bash
bash Linux/install.sh
```

The catalogue itself is a single JSON file, [`Shared/config/models.json`](../Shared/config/models.json),
if you want to add a permanent entry rather than using the one-off `C` (custom URL) option.

---

## 10. Uninstall

```bash
bash Linux/uninstall.sh
```

This stops any running engine and removes the downloaded binaries and models from
`Shared/`. It refuses to delete anything outside `Shared/`, so your chats and the repo
itself are never at risk of an accidental wipe.

---

## 11. Troubleshooting

| Problem | Fix |
|---|---|
| Double-clicking "Start R-AI" / "Install R-AI" opens a text editor | Expected on GNOME (Ubuntu) — it won't run launcher files from a folder. Use the **R-AI** entry in your app menu instead (press `Super`, type R-AI). Create it with `bash Linux/install-shortcut.sh` if it isn't there. |
| The R-AI app-menu icon does nothing when clicked | Run `bash Linux/start.sh` in a terminal to see the real error. The launcher hides output by design, so a failure only surfaces as a notification. |
| No R-AI entry in the app menu | Run `bash Linux/install-shortcut.sh`. If it still doesn't appear, log out and back in. |
| `ERROR: Linux AI Engine Not Found!` | `install.sh` hasn't been run yet (or `Shared/bin/` was wiped). Run `bash Linux/install.sh`. |
| `tar: unrecognized option --use-compress-program` / extraction fails | `zstd` isn't installed. See the prerequisites above. |
| `ERROR: Python not found` | Install `python3` from your package manager. |
| Install fails partway through a big download | Just re-run `bash Linux/install.sh` — completed files are skipped and only the missing pieces retry. |
| Port 3333 already in use | Something else is on that port. Stop it, or edit `CHAT_SERVER_PORT` in `Shared/chat_server.py`. |
| Engine won't start / port 11434 busy | An old Ollama is still running: `pkill -f ollama-linux`. |
| Phone shows `401 Access token required` | Open the LAN URL *with* the `?t=…` suffix once, as printed in the startup banner. |
| Replies are painfully slow | The model is too big for your RAM and is swapping. Re-run the installer and pick Gemma 2 2B. |
| Reply stops mid-sentence in a longer chat | The token window filled up. `start.sh` already sets it to 8192; for very long chats raise it: `OLLAMA_CONTEXT_LENGTH=16384 bash Linux/start.sh`. See *Context length* below. |
| GPU isn't being used (everything runs on CPU) | First check `nvidia-smi` works — without a driver it correctly falls back to CPU. If the driver is fine, re-run `bash Linux/install.sh`: step **[6a/7]** stages the CUDA libraries where ggml can find them. See *GPU acceleration* below. |
