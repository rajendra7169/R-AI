      /* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
   Portable AI ÔÇö Fast Chat ┬À Core Logic (unchanged)
   ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */

      // ÔöÇÔöÇ Config ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
      const IS_SERVED =
        location.protocol === 'http:' || location.protocol === 'https:';
      const OLLAMA = IS_SERVED ? '/ollama' : 'http://127.0.0.1:11434';
      const VISION_MODELS = [
        'llava',
        'moondream',
        'bakllava',
        'vision',
        'minicpm-v',
        'cogvlm',
        'qwen-vl',
        'phi-3-vision',
      ];

    const S = {
      convs: [],
      curId: null,
      theme: localStorage.getItem('g-theme') || 'dark',
      sbOpen: window.innerWidth > 768,
      streaming: false,
      abort: null,
      models: [],
      model: localStorage.getItem('g-model') || '',
      globalSys: '',
      logMode: localStorage.getItem('logMode') || 'errors_only',
      mode: 'chat', // 'chat' or 'image'

        // Attachments (multi-file)
        attachments: [],
      };

      // ÔöÇÔöÇ DOM ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
      const $ = (s) => document.querySelector(s);
      const $$ = (s) => document.querySelectorAll(s);

      const D = {
        sb: $('#sidebar'),
        ov: $('#overlay'),
        cvList: $('#cv-list'),
        welcome: $('#welcome'),
        msgs: $('#msgs'),
        chat: $('#chat'),
        inp: $('#msg-inp'),
        iw: $('#iw'),
        send: $('#send-btn'),
        att: $('#att-btn'),
        fInp: $('#f-inp'),
        fBar: $('#fbar'),
        nc: $('#nc-btn'),
        sbTog: $('#sb-tog'),
        thTop: $('#th-top'),
        thSb: $('#th-sb'),
        ca: $('#ca-btn'),
        toasts: $('#toasts'),
        modelBtn: $('#model-btn'),
        modelMenu: $('#model-menu'),
        modelName: $('#model-name'),
        tbTitle: $('#tb-title'),
        modelDd: $('#model-dd'),

      // Extensions
      sysBtn: $('#sys-prompt-btn'),
      sysOverlay: $('#sys-overlay'),
      sysPanel: $('#sys-panel'),
      sysCloseBtn: $('#sys-close-btn'),
      sysTa: $('#sys-ta'),
      logModeSel: $('#log-mode-select'),
      sysSet: $('#set-global-btn'),
      sysClr: $('#clear-global-btn'),
      warn: $('#vision-warn'),
      warnModel: $('#warn-model'),

      // Image generation
      modeTabs: $('#mode-tabs'),
      tabChat: $('#tab-chat'),
      tabImage: $('#tab-image'),
      imgPanel: $('#img-panel'),
      imgPrompt: $('#img-prompt'),
      imgNeg: $('#img-neg'),
      imgSteps: $('#img-steps'),
      imgCfg: $('#img-cfg'),
      imgWidth: $('#img-width'),
      imgHeight: $('#img-height'),
      imgSeed: $('#img-seed'),
      imgSampler: $('#img-sampler'),
      imgGenBtn: $('#img-gen-btn'),
      imgStopOllama: $('#img-stop-ollama'),
      imgStartOllama: $('#img-start-ollama'),
      imgPreview: $('#img-preview'),
      imgWarn: $('#img-warn'),
      chatEngineDot: $('#chat-engine-dot'),
      chatEngineStatus: $('#chat-engine-status'),
      imgEngineDot: $('#img-engine-dot'),
      imgEngineStatus: $('#img-engine-status'),
      inpArea: $('#inp-area'),
      imgProgress: $('#img-progress'),
      imgBarFill: $('#img-bar-fill'),
      imgStepText: $('#img-step-text'),
      imgTimeText: $('#img-time-text'),
      imgEtaText: $('#img-eta-text'),
      imgResult: $('#img-result'),
      imgResultImg: $('#img-result-img'),
      imgParamsGrid: $('#img-params-grid'),
      imgModal: $('#img-modal'),
      imgModalImg: $('#img-modal-img'),
      imgModalClose: $('#img-modal-close'),
      imgModalDownload: $('#img-modal-download'),
    };

      // ÔöÇÔöÇ Init ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
      async function init() {
        setupMarked();
        applyTheme(S.theme);
        // Initial sidebar state — match toggleSB's mobile vs desktop logic
        if (!S.sbOpen) {
          if (window.innerWidth <= 768) D.sb.classList.add('off');
          else D.sb.classList.add('mini');
        }

        await loadGlobalPrompt();
        await fetchModels();
        await load();

        renderSB();
        renderChat();
        bind();

        if (S.convs.length > 0) switchConv(S.convs[0].id);

        // Setup mode tabs
        D.tabChat.addEventListener('click', () => switchMode('chat'));
        D.tabImage.addEventListener('click', () => switchMode('image'));

        pollHW();
        setInterval(pollHW, 5000);
        setInterval(fetchModels, 15000);
      }

      // ÔöÇÔöÇ Hardware Stats ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
      async function pollHW() {
        if (!IS_SERVED) return;
        try {
          const r = await fetch('/api/stats');
          if (!r.ok) return;
          const d = await r.json();
          if (d.ram_percent === -1) return;
          setBar('cpu', d.cpu_percent);
          setBar('ram', d.ram_percent);
          const gpuRow = $('#gpu-row');
          const hasGpu = d.gpu_percent !== null && d.gpu_percent !== undefined;
          if (!hasGpu) {
            if (gpuRow) gpuRow.style.display = 'none';
          } else {
            if (gpuRow) gpuRow.style.display = '';
            setBar('gpu', d.gpu_percent);
            // VRAM elements are hidden in the DOM; keep the value updated so
            // the GPU label's tooltip can show both compute % and VRAM %.
            const vramPct = $('#vram-pct');
            if (vramPct) vramPct.textContent = (d.vram_percent || 0) + '%';
            const lbl = $('#gpu-label');
            if (lbl) {
              const vp = Math.round(d.vram_percent || 0);
              const name = d.gpu_name || 'GPU';
              lbl.title = `${name} · compute ${Math.round(d.gpu_percent)}% · VRAM ${vp}%`;
            }
          }
          // Update the collapsed chip label with the most relevant signal
          const mini = $('#hw-toggle-mini');
          if (mini) {
            const top = hasGpu
              ? `${Math.round(d.gpu_percent)}% GPU`
              : `${Math.round(d.cpu_percent)}% CPU`;
            mini.textContent = top;
          }
        } catch {}
      }
      function setBar(type, pct) {
        const bar = $(`#${type}-bar`);
        const lbl = $(`#${type}-pct`);
        if (!bar) return;
        bar.style.transform = `scaleX(${Math.max(0, Math.min(100, pct)) / 100})`;
        lbl.textContent = pct + '%';
        lbl.className =
          'hw-pct' + (pct >= 90 ? ' danger' : pct >= 70 ? ' warn' : '');
      }

    // Global Prompt
    async function loadGlobalPrompt() {
      if (IS_SERVED) {
        try {
          const r = await fetch('/api/settings');
          if (r.ok) {
            const s = await r.json();
            S.globalSys = s.globalSystemPrompt || '';
            S.logMode = s.logMode === 'all' ? 'all' : 'errors_only';
          }
        } catch { }
      } else {
        S.globalSys = localStorage.getItem('globalSystemPrompt') || '';
        S.logMode = localStorage.getItem('logMode') || 'errors_only';
      }
      updateSysUI();
    }
    async function saveGlobalPrompt() {
      S.globalSys = D.sysTa.value.trim();
      S.logMode = D.logModeSel.value === 'all' ? 'all' : 'errors_only';
      if (IS_SERVED) {
        try {
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              globalSystemPrompt: S.globalSys,
              logMode: S.logMode,
            }),
          });
        } catch { }
      } else {
        localStorage.setItem('globalSystemPrompt', S.globalSys);
        localStorage.setItem('logMode', S.logMode);
      }
      updateSysUI();
      toast('Default prompt saved');
    }
    async function clearGlobalPrompt() {
      S.globalSys = '';
      D.sysTa.value = '';
      S.logMode = D.logModeSel.value === 'all' ? 'all' : 'errors_only';
      if (IS_SERVED) {
        try {
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              globalSystemPrompt: '',
              logMode: S.logMode,
            }),
          });
        } catch { }
      } else {
        localStorage.removeItem('globalSystemPrompt');
        localStorage.setItem('logMode', S.logMode);
      }
      updateSysUI();
      toast('Default prompt cleared');
    }
    async function saveLogMode() {
      S.logMode = D.logModeSel.value === 'all' ? 'all' : 'errors_only';
      if (IS_SERVED) {
        try {
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logMode: S.logMode }),
          });
        } catch { }
      } else {
        localStorage.setItem('logMode', S.logMode);
      }
      toast(
        S.logMode === 'all'
          ? 'Logging: everything'
          : 'Logging: errors only',
      );
    }
    function updateSysUI() {
      D.logModeSel.value = S.logMode === 'all' ? 'all' : 'errors_only';
      if (S.globalSys) D.sysBtn.classList.add('has-global');
      else D.sysBtn.classList.remove('has-global');
    }

      // ÔöÇÔöÇ Models ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
      function isVision(name) {
        return VISION_MODELS.some((v) =>
          (name || '').toLowerCase().includes(v),
        );
      }

      async function fetchModels() {
        try {
          const r = await fetch(OLLAMA + '/api/tags');
          if (!r.ok) throw new Error();
          const d = await r.json();
          S.models = d.models || [];
          renderModelMenu();
          if (
            S.models.length &&
            (!S.model || !S.models.find((m) => m.name === S.model))
          ) {
            applyModel(S.models[0].name);
          } else if (S.model) {
            applyModel(S.model);
          }
        } catch {
          D.modelMenu.innerHTML =
            '<div style="padding:16px;font-size:12px;color:var(--red);text-align:center;">Engine Offline</div>';
        }
      }

      // ── Mode Switching ─────────────────────────────────────────
      function switchMode(mode) {
        S.mode = mode;
        D.tabChat.classList.toggle('act', mode === 'chat');
        D.tabImage.classList.toggle('act', mode === 'image');
        D.imgPanel.classList.toggle('on', mode === 'image');
        // Clear inline display when returning to chat so the stylesheet's
        // own display values apply (#chat is `flex` column, #inp-area is
        // `flex` column-centered). Setting `block` here previously broke
        // the input bar's centering when you switched modes.
        if (mode === 'chat') {
          D.chat.style.display = '';
          if (D.inpArea) D.inpArea.style.display = '';
        } else {
          D.chat.style.display = 'none';
          if (D.inpArea) D.inpArea.style.display = 'none';
        }
        if (mode === 'image') {
          updateEngineStatus();
        } else {
          // Reset image UI when leaving image mode
          D.imgProgress.style.display = 'none';
          D.imgResult.style.display = 'none';
          // If Ollama was unloaded for image generation, quietly bring it
          // back when the user returns to chat so the next message doesn't
          // hit a 502.
          ensureChatEngineRunning();
        }
      }

      // Quietly start Ollama if it's not running. Refreshes the model list
      // when it comes back up. Safe to call repeatedly.
      let _engineStartInflight = false;
      async function ensureChatEngineRunning() {
        if (_engineStartInflight) return;
        try {
          const r = await fetch('/api/engine-status');
          const d = await r.json();
          if (d && d.ollama) return; // already up
        } catch { return; }
        _engineStartInflight = true;
        try {
          toast('Restarting chat engine…');
          await fetch('/api/start-ollama', { method: 'POST' });
          const ok = await waitForEngineState(true);
          if (ok) {
            toast('Chat engine ready.');
            // Repopulate the model dropdown that earlier showed "Engine Offline".
            try { await fetchModels(); } catch {}
          }
        } catch {
          /* silent — UI will still show Engine Offline until the user retries */
        } finally {
          _engineStartInflight = false;
        }
      }

      // ── Engine Status ──────────────────────────────────────────
      async function updateEngineStatus() {
        try {
          const r = await fetch('/api/engine-status');
          const d = await r.json();
          const ollamaUp = d.ollama;
          const sdReady = d.sd_enabled;
          const sdHealthy = d.sd_healthy;

          // Image engine row
          if (!sdReady) {
            D.imgEngineDot.className = 'img-engine-dot off';
            D.imgEngineStatus.textContent = 'Not Installed';
            D.imgGenBtn.disabled = true;
          } else if (!sdHealthy) {
            D.imgEngineDot.className = 'img-engine-dot warn';
            D.imgEngineStatus.textContent = 'Missing VC++ Runtime';
            D.imgWarn.innerHTML = '<strong>⚠️ Missing VC++ Redistributable</strong><br>The image engine needs Microsoft Visual C++ Redistributable.<br>Re-run the Windows installer or download it from Microsoft.';
            D.imgWarn.style.display = 'block';
            D.imgGenBtn.disabled = true;
          } else {
            D.imgEngineDot.className = 'img-engine-dot on';
            D.imgEngineStatus.textContent = 'Ready';
            D.imgWarn.style.display = 'none';
          }

          // Chat engine row
          if (ollamaUp) {
            D.chatEngineDot.className = 'img-engine-dot on';
            D.chatEngineStatus.textContent = 'Running';
            D.imgStopOllama.style.display = 'inline-block';
            D.imgStartOllama.style.display = 'none';
            D.imgGenBtn.disabled = true;
          } else {
            D.chatEngineDot.className = 'img-engine-dot off';
            D.chatEngineStatus.textContent = 'Stopped';
            D.imgStopOllama.style.display = 'none';
            D.imgStartOllama.style.display = 'inline-block';
            if (sdReady && sdHealthy) {
              D.imgGenBtn.disabled = false;
            }
          }
        } catch {
          D.chatEngineDot.className = 'img-engine-dot warn';
          D.chatEngineStatus.textContent = 'Unknown';
          D.imgEngineDot.className = 'img-engine-dot warn';
          D.imgEngineStatus.textContent = 'Unknown';
          D.imgWarn.innerHTML = '<strong>⚠️ Offline</strong><br>Cannot reach the server.';
          D.imgWarn.style.display = 'block';
          D.imgGenBtn.disabled = true;
        }
      }

      async function waitForEngineState(desiredOllamaState, maxWaitMs = 15000) {
        const interval = 1000;
        const start = Date.now();
        while (Date.now() - start < maxWaitMs) {
          try {
            const r = await fetch('/api/engine-status');
            const d = await r.json();
            if (d.ollama === desiredOllamaState) {
              await updateEngineStatus();
              return true;
            }
          } catch {}
          await new Promise((res) => setTimeout(res, interval));
        }
        await updateEngineStatus();
        return false;
      }

      // ── Image Generation ───────────────────────────────────────
      function fmtMs(ms) {
        if (!ms || ms < 0) return '';
        const sec = Math.floor(ms / 1000);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
      }

      function showImgProgress() {
        // Clear any stale error/status messages
        D.imgPreview.querySelectorAll('.img-status').forEach((el) => el.remove());
        D.imgProgress.style.display = 'flex';
        D.imgResult.style.display = 'none';
        D.imgBarFill.style.width = '0%';
        D.imgStepText.textContent = 'Starting...';
        D.imgTimeText.textContent = '0s';
        D.imgEtaText.textContent = '';
      }

      function hideImgProgress() {
        D.imgProgress.style.display = 'none';
      }

      function updateImgProgressUI(data) {
        const step = data.step || 0;
        const total = data.total_steps || 0;
        const elapsed = data.elapsed_ms || 0;
        const eta = data.eta_ms;

        if (total > 0) {
          const pct = Math.min(100, Math.round((step / total) * 100));
          D.imgBarFill.style.width = `${pct}%`;
          D.imgStepText.textContent = `Step ${step} / ${total}`;
        } else {
          D.imgStepText.textContent = 'Working...';
        }

        D.imgTimeText.textContent = fmtMs(elapsed);

        if (eta && eta > 0 && step > 0 && step < total) {
          D.imgEtaText.textContent = `ETA: ${fmtMs(eta)} remaining`;
        } else if (step >= total && total > 0) {
          D.imgEtaText.textContent = 'Finishing up...';
        } else {
          D.imgEtaText.textContent = 'Calculating ETA...';
        }
      }

      function showImgResult(data) {
        hideImgProgress();
        D.imgResult.style.display = 'flex';
        D.imgResultImg.src = `data:${data.mime_type};base64,${data.image_b64}`;
        D.imgResultImg.style.cursor = 'zoom-in';
        D.imgResultImg.onclick = () => openImgModal(data.image_b64, data.mime_type);

        const p = data.params || {};
        const rows = [
          { k: 'Resolution', v: `${p.width || 512} × ${p.height || 512}` },
          { k: 'Steps', v: p.steps || 20 },
          { k: 'CFG Scale', v: p.cfg_scale || 7.0 },
          { k: 'Sampler', v: p.sampling_method || 'euler_a' },
          { k: 'Seed', v: p.seed ?? -1 },
          { k: 'Model', v: 'CyberRealistic v3.3' },
        ];
        if (p.negative_prompt) {
          rows.push({ k: 'Negative', v: p.negative_prompt });
        }
        D.imgParamsGrid.innerHTML = rows
          .map((r) => `<div class="img-param"><span class="img-param-key">${esc(r.k)}</span><span class="img-param-val">${esc(String(r.v))}</span></div>`)
          .join('');
      }

      async function generateImage() {
        const prompt = D.imgPrompt.value.trim();
        if (!prompt) {
          toast('Please enter a prompt.');
          return;
        }
        D.imgGenBtn.disabled = true;
        showImgProgress();

        const payload = {
          prompt,
          negative_prompt: D.imgNeg.value.trim(),
          steps: parseInt(D.imgSteps.value, 10) || 20,
          cfg_scale: parseFloat(D.imgCfg.value) || 7.0,
          width: parseInt(D.imgWidth.value, 10) || 512,
          height: parseInt(D.imgHeight.value, 10) || 512,
          seed: parseInt(D.imgSeed.value, 10),
          sampling_method: D.imgSampler.value,
        };

        let jobId = null;
        let pollInterval = null;

        try {
          const startR = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const startD = await startR.json();
          if (!startR.ok || startD.error) {
            const msg = startD.error || 'Failed to start image generation.';
            hideImgProgress();
            D.imgResult.style.display = 'none';
            D.imgPreview.insertAdjacentHTML('beforeend', `<div class="img-status" style="color:var(--red); margin-top:12px;">${esc(msg)}</div>`);
            D.imgGenBtn.disabled = false;
            if (startD.needs_stop) await updateEngineStatus();
            return;
          }

          jobId = startD.job_id;

          // Poll progress every 1.2 seconds
          pollInterval = setInterval(async () => {
            if (!jobId) return;
            try {
              const pr = await fetch(`/api/image-progress?job_id=${encodeURIComponent(jobId)}`);
              const pd = await pr.json();
              if (!pr.ok) return;

              if (pd.status === 'done') {
                clearInterval(pollInterval);
                pollInterval = null;
                showImgResult(pd);
                D.imgGenBtn.disabled = false;
              } else if (pd.status === 'error') {
                clearInterval(pollInterval);
                pollInterval = null;
                hideImgProgress();
                D.imgResult.style.display = 'none';
                D.imgPreview.insertAdjacentHTML('beforeend', `<div class="img-status" style="color:var(--red); margin-top:12px;">${esc(pd.error || 'Generation failed.')}</div>`);
                D.imgGenBtn.disabled = false;
              } else {
                updateImgProgressUI(pd);
              }
            } catch {
              // Ignore poll errors
            }
          }, 1200);
        } catch (e) {
          hideImgProgress();
          D.imgResult.style.display = 'none';
          D.imgPreview.insertAdjacentHTML('beforeend', `<div class="img-status" style="color:var(--red); margin-top:12px;">Network error: ${esc(e.message || 'Failed to generate image.')}</div>`);
          D.imgGenBtn.disabled = false;
          if (pollInterval) clearInterval(pollInterval);
        }
      }

      // ── Image Lightbox ─────────────────────────────────────────
      function openImgModal(b64Data, mimeType) {
        D.imgModalImg.src = `data:${mimeType};base64,${b64Data}`;
        D.imgModal.classList.add('on');
        // Set download handler
        D.imgModalDownload.onclick = () => {
          const link = document.createElement('a');
          link.href = `data:${mimeType};base64,${b64Data}`;
          link.download = `generated_${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          link.remove();
        };
      }

      function closeImgModal() {
        D.imgModal.classList.remove('on');
        D.imgModalImg.src = '';
      }

      async function stopChatEngine() {
        D.imgStopOllama.disabled = true;
        D.chatEngineStatus.textContent = 'Stopping...';
        try {
          await fetch('/api/stop-ollama', { method: 'POST' });
          const stopped = await waitForEngineState(false);
          toast(stopped ? 'Chat engine unloaded.' : 'Chat engine stop timed out — may still be running.');
        } catch {
          toast('Failed to stop chat engine.');
          await updateEngineStatus();
        }
        D.imgStopOllama.disabled = false;
      }

      async function startChatEngine() {
        D.imgStartOllama.disabled = true;
        D.chatEngineStatus.textContent = 'Starting...';
        try {
          await fetch('/api/start-ollama', { method: 'POST' });
          const started = await waitForEngineState(true);
          toast(started ? 'Chat engine loaded.' : 'Chat engine start timed out.');
        } catch {
          toast('Failed to start chat engine.');
          await updateEngineStatus();
        }
        D.imgStartOllama.disabled = false;
      }

      function renderModelMenu() {
        if (!S.models.length) return;
        D.modelMenu.innerHTML = S.models
          .map(
            (m) => `
        <div class="mm-opt ${m.name === S.model ? 'sel' : ''}" data-model="${m.name}">
            <div class="mmo-icon"><img src="./assets/r-ai-logo.png" alt=""/></div>
            <div class="mmo-info">
                <div class="mmo-name">${esc(m.name)}${isVision(m.name) ? ' <span class="mmo-tag"><i class="fa-solid fa-eye"></i> Vision</span>' : ''}</div>
                <div class="mmo-desc">${(m.size / 1e9).toFixed(1)} GB</div>
            </div>
            <i class="fa-solid fa-check mmo-chk"></i>
        </div>`,
          )
          .join('');

        $$('.mm-opt').forEach((opt) =>
          opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const model = opt.dataset.model;
            applyModel(model);
            const conv = getConv();
            if (conv) {
              conv.model = model;
              save();
            }
            toggleModelMenu(false);
          }),
        );
      }

      function applyModel(model) {
        S.model = model;
        localStorage.setItem('g-model', model);
        D.modelName.textContent = model;
        $$('.mm-opt').forEach((opt) =>
          opt.classList.toggle('sel', opt.dataset.model === model),
        );
        checkVisionWarn();
      }

      function toggleModelMenu(show) {
        const isOpen = D.modelMenu.classList.contains('on');
        const shouldOpen = show !== undefined ? show : !isOpen;
        D.modelMenu.classList.toggle('on', shouldOpen);
        D.modelBtn.classList.toggle('open', shouldOpen);
      }

      // ÔöÇÔöÇ File Attachments ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
      async function handleAttach(files) {
        const list = Array.from(files || []).filter(Boolean);
        if (!list.length) return;

        let added = 0;
        let rejected = 0;
        for (const file of list) {
          const ok = await handleSingleAttachment(file);
          if (ok) added++;
          else rejected++;
        }

        if (added) {
          renderAttachmentBar();
          checkVisionWarn();
          updateSend();
        }
        if (rejected) {
          toast(
            rejected === list.length
              ? 'No supported files selected'
              : `${rejected} file(s) skipped`,
          );
        }
      }

      async function handleSingleAttachment(file) {
        if (!file) return false;
        const name = file.name.toLowerCase();
        if (file.type.startsWith('image/')) return handleImg(file);
        if (file.type === 'application/pdf' || name.endsWith('.pdf'))
          return handlePdf(file);
        if (
          file.type === 'text/plain' ||
          name.endsWith('.md') ||
          name.endsWith('.txt')
        )
          return handleText(file);
        return false;
      }

      function handleImg(file) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target.result;
            const b64 = src.split(',')[1];
            S.attachments.push({
              id: gid(),
              type: 'image',
              name: file.name,
              mime: file.type || 'image/jpeg',
              b64,
              previewUrl: src,
            });
            resolve(true);
          };
          reader.onerror = () => resolve(false);
          reader.readAsDataURL(file);
        });
      }

      function removeAttachment(id) {
        S.attachments = S.attachments.filter((a) => a.id !== id);
        renderAttachmentBar();
        checkVisionWarn();
        updateSend();
      }

      function clearAttachments() {
        if (!S.attachments.length) return;
        S.attachments = [];
        renderAttachmentBar();
        checkVisionWarn();
        updateSend();
      }

      function renderAttachmentBar() {
        if (!S.attachments.length) {
          D.fBar.classList.remove('on');
          D.fBar.innerHTML = '';
          return;
        }

        D.fBar.classList.add('on');
        D.fBar.innerHTML = S.attachments
          .map((a) => {
            if (a.type === 'image') {
              return `<div class="img-preview"><img src="${a.previewUrl}" alt="${esc(a.name)}"><button class="f-rm" onclick="removeAttachment('${a.id}')"><i class="fa-solid fa-xmark"></i></button></div>`;
            }
            const icon = a.kind === 'pdf' ? 'fa-file-pdf' : 'fa-file-lines';
            const meta =
              a.kind === 'pdf'
                ? `${a.pages || '?'} page${a.pages === 1 ? '' : 's'}`
                : `Text file · ~${(a.text || '').length.toLocaleString()} chars`;
            return `<div class="pdf-preview"><i class="fa-solid ${icon}" style="color:var(--grad1);font-size:22px;"></i><div class="p-info"><strong>${esc(a.name)}</strong><span>${meta}</span></div><button class="f-rm" onclick="removeAttachment('${a.id}')"><i class="fa-solid fa-xmark"></i></button></div>`;
          })
          .join('');
      }

      function checkVisionWarn() {
        const hasImage = S.attachments.some((a) => a.type === 'image');
        if (!hasImage) {
          D.warn.classList.remove('on');
          return;
        }
        if (!isVision(S.model)) {
          D.warnModel.textContent = S.model;
          D.warn.classList.add('on');
        } else D.warn.classList.remove('on');
      }

      let pdfJsLoading = false;
      async function ensurePdfJs() {
        if (window.pdfjsLib) return true;
        if (pdfJsLoading)
          return new Promise((res) => {
            const iv = setInterval(() => {
              if (window.pdfjsLib || window._pdfFailed) {
                clearInterval(iv);
                res(!!window.pdfjsLib);
              }
            }, 100);
          });
        pdfJsLoading = true;
        try {
          const m = await import('./vendor/pdf.min.mjs');
          window.pdfjsLib = m;
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            './vendor/pdf.worker.min.mjs';
          return true;
        } catch {
          window._pdfFailed = true;
          return false;
        }
      }

      async function handlePdf(file) {
        const ok = await ensurePdfJs();
        if (!ok) return false;

        try {
          const buf = await file.arrayBuffer();
          const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const pg = await pdf.getPage(i);
            const c = await pg.getTextContent();
            text +=
              `--- Page ${i} ---\n` +
              c.items.map((x) => x.str).join(' ') +
              '\n\n';
          }
          S.attachments.push({
            id: gid(),
            type: 'doc',
            kind: 'pdf',
            name: file.name,
            text: text.trim(),
            pages: pdf.numPages,
          });
          return true;
        } catch (e) {
          return false;
        }
      }

      async function handleText(file) {
        const text = await file.text();
        S.attachments.push({
          id: gid(),
          type: 'doc',
          kind: 'text',
          name: file.name,
          text,
          pages: 0,
        });
        return true;
      }

      // ÔöÇÔöÇ Conversation CRUD ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
      function createConv() {
        const c = {
          id: gid(),
          title: 'New chat',
          msgs: [],
          ts: Date.now(),
          model: S.model,
          sys: S.globalSys,
        };
        S.convs.unshift(c);
        save();
        switchConv(c.id);
        renderSB();
        D.inp.focus();
      }

      function delConv(id) {
        S.convs = S.convs.filter((c) => c.id !== id);
        save();
        if (S.curId === id) {
          S.curId = null;
          S.convs.length > 0 ? switchConv(S.convs[0].id) : renderChat();
        }
        renderSB();
        toast('Chat deleted');
      }

      function clearAll() {
        S.convs = [];
        S.curId = null;
        save();
        renderSB();
        renderChat();
        toast('All chats cleared');
      }

      function switchConv(id) {
        S.curId = id;
        const conv = getConv();
        if (conv && conv.model) applyModel(conv.model);
        D.sysTa.value = conv?.sys || '';
        renderChat();
        renderSB();
        updateTitle();
        if (window.innerWidth <= 768) toggleSB(false);
      }
      function getConv() {
        return S.convs.find((c) => c.id === S.curId);
      }

      // ÔöÇÔöÇ Send / Stream to Ollama ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
      async function sendMsg(text) {
        if ((!text.trim() && !S.attachments.length) || S.streaming) return;

        let conv = getConv();
        if (!conv) {
          conv = {
            id: gid(),
            title: 'New chat',
            msgs: [],
            ts: Date.now(),
            model: S.model,
            sys: D.sysTa.value.trim(),
          };
          S.convs.unshift(conv);
          S.curId = conv.id;
        } else {
          conv.model = S.model;
          conv.sys = D.sysTa.value.trim();
          // Defensive: heal conv that somehow has no msgs array
          if (!Array.isArray(conv.msgs)) conv.msgs = [];
        }

        const baseText = text.trim();
        const docAttachments = S.attachments.filter((a) => a.type === 'doc');
        const imageAttachments = S.attachments.filter(
          (a) => a.type === 'image',
        );

        let finalText = baseText;
        if (docAttachments.length) {
          const blocks = docAttachments
            .map((a, idx) => {
              const maxChars = 12000;
              const body =
                (a.text || '').length > maxChars
                  ? (a.text || '').slice(0, maxChars) + '\n\n[truncated...]'
                  : a.text || '';
              return `Document ${idx + 1}: "${a.name}"\n\n${body}`;
            })
            .join('\n\n====================\n\n');
          finalText = `Attached document context:\n\n${blocks}\n\n---\nUser: ${baseText || '[no text]'}`;
        }

        const msgObj = {
          id: gid(),
          role: 'user',
          content: finalText,
          displayContent: baseText,
          ts: Date.now(),
        };
        if (imageAttachments.length) {
          msgObj.images = imageAttachments.map((a) => a.b64);
        }
        if (S.attachments.length) {
          msgObj._attachments = S.attachments.map((a) => ({
            id: a.id,
            type: a.type,
            kind: a.kind || null,
            name: a.name,
            mime: a.mime || null,
            b64: a.type === 'image' ? a.b64 : null,
          }));
        }

        conv.msgs.push(msgObj);
        if (conv.msgs.length === 1)
          conv.title =
            text.trim().substring(0, 40) +
            (text.trim().length > 40 ? '...' : '');

        D.inp.value = '';
        D.inp.style.height = 'auto';
        D.iw.classList.remove('ht');
        clearAttachments();
        updateSend();
        save();
        renderChat();
        renderSB();
        updateTitle();
        scrollEnd();

        await streamOllama(conv);
      }

      async function streamOllama(conv) {
        S.streaming = true;
        updateSend();

        const aiMsg = {
          id: gid(),
          role: 'assistant',
          content: '',
          ts: Date.now(),
          liked: false,
          disliked: false,
        };
        conv.msgs.push(aiMsg);
        renderChat();
        scrollEnd();

        const lastRow = D.msgs.lastElementChild;
        const contentEl = lastRow ? lastRow.querySelector('.mt') : null;
        if (contentEl)
          contentEl.innerHTML =
            '<div class="typ"><span></span><span></span><span></span></div>';

        S.abort = new AbortController();
        let apiMsgs = [];
        if (conv.sys) apiMsgs.push({ role: 'system', content: conv.sys });
        conv.msgs.slice(0, -1).forEach((m) => {
          const am = { role: m.role, content: m.content };
          if (m.images) am.images = m.images;
          apiMsgs.push(am);
        });

        try {
          // Default: ask Ollama to skip the model's internal <think>...</think>
          // reasoning phase. Reasoning models (Qwen 3.x / DeepSeek-style) can
          // otherwise burn many seconds — and on weaker hardware, all of the
          // token budget — on internal monologue before producing the actual
          // reply. The user can re-enable it via the brain toggle next to the
          // temperature input.
          const thinkOn =
            localStorage.getItem('g-think') === '1';
          const res = await fetch(OLLAMA + '/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: conv.model,
              messages: apiMsgs,
              stream: true,
              think: thinkOn,
              options: {
                temperature:
                  parseFloat(document.getElementById('temp-input')?.value) ||
                  0.7,
              },
            }),
            signal: S.abort.signal,
          });
          if (!res.ok) throw new Error('Ollama error ' + res.status);

          const reader = res.body.getReader();
          const dec = new TextDecoder();
          if (contentEl) contentEl.innerHTML = '';

          // While streaming, the bubble holds a live <details> for thinking
          // (so the user can click to expand it mid-stream and watch the
          // full trace fill in) plus a content area for the real reply.
          let thinkSummary = null;  // live "Thinking..." label inside <summary>
          let thinkBody = null;     // expandable trace body
          let contentBody = null;   // real content target
          let contentStarted = false;
          const ensureLiveShells = () => {
            if (!contentEl) return;
            if (!thinkBody && aiMsg.thinking) {
              contentEl.innerHTML =
                '<details class="think-block live" open>' +
                  '<summary>' +
                    '<span class="think-spin"></span>' +
                    '<span class="think-label">Thinking</span>' +
                    '<span class="think-meta" data-role="chars">0 chars</span>' +
                  '</summary>' +
                  '<div class="think-body" data-role="body"></div>' +
                '</details>' +
                '<div class="think-content"></div>';
              const detEl = contentEl.querySelector('.think-block');
              thinkSummary = detEl.querySelector('[data-role="chars"]');
              thinkBody = detEl.querySelector('[data-role="body"]');
              contentBody = contentEl.querySelector('.think-content');
              // Collapse the live trace once the user explicitly closes it;
              // until then keep auto-scrolling to the newest text.
            } else if (!contentBody) {
              contentEl.innerHTML = '<div class="think-content"></div>';
              contentBody = contentEl.querySelector('.think-content');
            }
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = dec.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              if (!line.trim()) continue;
              try {
                const p = JSON.parse(line);
                if (p.message?.thinking) {
                  aiMsg.thinking = (aiMsg.thinking || '') + p.message.thinking;
                  ensureLiveShells();
                  if (thinkSummary) {
                    thinkSummary.textContent = aiMsg.thinking.length + ' chars';
                  }
                  if (thinkBody) {
                    thinkBody.textContent = aiMsg.thinking;
                    // Auto-scroll the trace body so the newest tokens are in view
                    thinkBody.scrollTop = thinkBody.scrollHeight;
                  }
                }
                if (p.message?.content) {
                  aiMsg.content += p.message.content;
                  ensureLiveShells();
                  if (!contentStarted && contentEl) {
                    const det = contentEl.querySelector('.think-block.live');
                    if (det) {
                      det.classList.remove('live');
                      det.classList.add('done');
                      det.removeAttribute('open'); // auto-collapse when answer starts
                    }
                    contentStarted = true;
                  }
                  if (contentBody) contentBody.textContent = aiMsg.content;
                }
                scrollEnd();
              } catch {}
            }
          }
          // Final render. Collapse any thinking into a small details block
          // and render the answer below it.
          if (contentEl) {
            const renderedContent = aiMsg.content
              ? renderMd(aiMsg.content)
              : '';
            const renderedThinking = aiMsg.thinking
              ? `<details class="think-block" ${aiMsg.content ? '' : 'open'}>
                   <summary><span class="think-dot"></span> Reasoning <span class="think-meta">${aiMsg.thinking.length} chars</span></summary>
                   <div class="think-body">${renderMd(aiMsg.thinking)}</div>
                 </details>`
              : '';
            contentEl.innerHTML = (renderedThinking + renderedContent)
              || '<span style="color:var(--t3);font-style:italic;">[Model returned no output — try a simpler prompt or switch model.]</span>';
            contentEl.querySelectorAll('pre code').forEach((b) => {
              if (!b.classList.contains('hljs')) hljs.highlightElement(b);
            });
          }
        } catch (err) {
          if (err.name === 'AbortError') {
            if (aiMsg.content) {
              if (contentEl) contentEl.innerHTML = renderMd(aiMsg.content);
            } else if (contentEl)
              contentEl.innerHTML =
                '<span style="color:var(--t3);font-style:italic;">[Stopped]</span>';
          } else {
            if (contentEl)
              contentEl.innerHTML = `<span style="color:var(--red);">ÔÜá ${esc(err.message)}</span>`;
            conv.msgs.pop();
          }
        } finally {
          S.streaming = false;
          updateSend();
          save();
          scrollEnd();
          setTimeout(() => D.inp.focus(), 100);
        }
      }

      function stopStream() {
        if (S.abort) S.abort.abort();
      }

      // ÔöÇÔöÇ Markdown ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
      function setupMarked() {
        if (typeof marked === 'undefined') return;
        const rdr = new marked.Renderer();
        rdr.code = (code, lang) => {
          const sl = esc(lang || '');
          const dl = sl || 'code';
          let hi = esc(code);
          if (typeof hljs !== 'undefined') {
            try {
              hi =
                lang && hljs.getLanguage(lang)
                  ? hljs.highlight(code, { language: lang }).value
                  : hljs.highlightAuto(code).value;
            } catch {}
          }
          return `<div class="cblk"><div class="cbh"><span>${dl}</span><button class="cbc-btn" onclick="copyCB(this)"><i class="fa-regular fa-copy"></i> Copy</button></div><pre><code class="hljs${sl ? ' language-' + sl : ''}">${hi}</code></pre></div>`;
        };
        marked.setOptions({ gfm: true, breaks: true, renderer: rdr });
      }
      function renderMd(text) {
        if (typeof marked === 'undefined')
          return esc(text).replace(/\n/g, '<br>');
        return marked.parse(text, { breaks: true });
      }

      // ÔöÇÔöÇ Rendering ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
      function renderSB() {
        D.cvList.innerHTML = S.convs
          .map(
            (c) => `
        <div class="cv ${c.id === S.curId ? 'act' : ''}" onclick="switchConv('${c.id}')">
            <i class="fa-regular fa-message ci"></i>
            <span class="ct">${esc(c.title)}</span>
            <button class="cd" onclick="event.stopPropagation();delConv('${c.id}')" aria-label="Delete chat">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>`,
          )
          .join('');
      }

      function renderChat() {
        const conv = getConv();
        if (!conv || conv.msgs.length === 0) {
          D.welcome.style.display = 'flex';
          D.msgs.classList.remove('on');
          D.msgs.innerHTML = '';
          D.tbTitle.textContent = '';
          return;
        }
        D.welcome.style.display = 'none';
        D.msgs.classList.add('on');
        D.tbTitle.textContent = conv.title;

        D.msgs.innerHTML = conv.msgs
          .map((msg, i) =>
            msg.role === 'user'
              ? renderUser(msg)
              : renderAI(msg, i === conv.msgs.length - 1),
          )
          .join('');

        D.msgs.querySelectorAll('pre code:not(.hljs)').forEach((b) => {
          hljs.highlightElement(b);
        });
        scrollEnd();
      }

      function renderUser(msg) {
        let media = '';
        const atts = Array.isArray(msg._attachments) ? msg._attachments : [];
        atts.forEach((a) => {
          if (a.type === 'image' && a.b64) {
            media += `<img class="msg-img" src="data:${a.mime || 'image/jpeg'};base64,${a.b64}">`;
            return;
          }
          if (a.type === 'doc') {
            const icon = a.kind === 'pdf' ? 'fa-file-pdf' : 'fa-file-lines';
            media += `<div class="msg-pdf-pill"><i class="fa-solid ${icon}" style="color:var(--grad1)"></i>${esc(a.name || 'Document')}</div>`;
          }
        });

        let rawTxt = msg.displayContent || msg.content;
        if (!msg.displayContent && rawTxt.includes('\n\n---\nUser: ')) {
          rawTxt = rawTxt.split('\n\n---\nUser: ').pop() || '';
        }
        const textBubble = rawTxt.trim()
          ? `<div class="ub"><div class="mt">${esc(rawTxt)}</div></div>`
          : '';
        const mediaEl = media ? `<div class="usr-attach">${media}</div>` : '';
        return `<div class="mr usr"><div class="mc">${textBubble}${mediaEl}</div><div class="ma u">U</div></div>`;
      }

      function renderAI(msg, isLast) {
        const parsed =
          S.streaming && isLast ? esc(msg.content) : renderMd(msg.content);
        const thinkingHtml = msg.thinking
          ? `<details class="think-block" ${msg.content ? '' : 'open'}>
               <summary><span class="think-dot"></span> Reasoning <span class="think-meta">${msg.thinking.length} chars</span></summary>
               <div class="think-body">${renderMd(msg.thinking)}</div>
             </details>`
          : '';
        const body = thinkingHtml + (parsed || '');
        const finalBody = body || (msg.thinking || msg.content
          ? body
          : '<span style="color:var(--t3);font-style:italic;">[Empty response]</span>');
        const actions =
          !S.streaming || !isLast
            ? `
        <div class="mact">
            <button class="mab" onclick="copyMsg('${msg.id}')" title="Copy"><i class="fa-regular fa-copy"></i></button>
            <button class="mab ${msg.liked ? 'lk' : ''}" onclick="rateMsg('${msg.id}','like')" title="Good response"><i class="fa-regular fa-thumbs-up"></i></button>
            <button class="mab ${msg.disliked ? 'dlk' : ''}" onclick="rateMsg('${msg.id}','dislike')" title="Bad response"><i class="fa-regular fa-thumbs-down"></i></button>
        </div>`
            : '';

        return `<div class="mr">
        <div class="ma ai"><img src="./assets/r-ai-logo.png" alt="R-AI"/></div>
        <div class="mc"><div class="mt">${finalBody}</div>${actions}</div>
    </div>`;
      }

      // ÔöÇÔöÇ Actions ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
      function copyMsg(id) {
        const m = getConv()?.msgs.find((x) => x.id === id);
        if (m)
          navigator.clipboard.writeText(m.content).then(() => toast('Copied'));
      }
      function rateMsg(id, r) {
        const m = getConv()?.msgs.find((x) => x.id === id);
        if (!m) return;
        if (r === 'like') {
          m.liked = !m.liked;
          m.disliked = false;
        } else {
          m.disliked = !m.disliked;
          m.liked = false;
        }
        save();
        renderChat();
      }
      function copyCB(btn) {
        const code = btn.closest('.cblk').querySelector('code').innerText;
        navigator.clipboard.writeText(code).then(() => {
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
          setTimeout(
            () => (btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'),
            2000,
          );
        });
      }

      function applyTheme(t) {
        S.theme = t;
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('g-theme', t);
        const ic = t === 'dark' ? 'fa-moon' : 'fa-sun';
        D.thTop.querySelector('i').className = 'fa-solid ' + ic;
        D.thSb.querySelector('i').className = 'fa-solid ' + ic;
      }
      function toggleTheme() {
        applyTheme(S.theme === 'dark' ? 'light' : 'dark');
      }
      function toggleSB(force) {
        S.sbOpen = force !== undefined ? force : !S.sbOpen;
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          // Mobile: full off-canvas; show overlay so a tap outside closes it
          D.sb.classList.toggle('off', !S.sbOpen);
          D.sb.classList.remove('mini');
        } else {
          // Desktop: mini-rail when "closed" (icons only) — like ChatGPT
          D.sb.classList.toggle('mini', !S.sbOpen);
          D.sb.classList.remove('off');
        }
        D.ov.classList.toggle('on', S.sbOpen && isMobile);
      }

      function updateSend() {
        const has = D.inp.value.trim().length > 0 || S.attachments.length > 0;
        D.iw.classList.toggle('ht', has);
        if (S.streaming) {
          D.send.className = 'ib2 stbtn';
          D.send.innerHTML = '<i class="fa-solid fa-stop"></i>';
          D.send.disabled = false;
        } else {
          D.send.className = 'ib2 sbtn' + (has ? ' on' : '');
          D.send.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
          D.send.disabled = !has;
        }
      }
      function autoResize() {
        D.inp.style.height = 'auto';
        D.inp.style.height = Math.min(D.inp.scrollHeight, 200) + 'px';
      }
      function scrollEnd() {
        D.chat.scrollTop = D.chat.scrollHeight;
      }
      function updateTitle() {
        D.tbTitle.textContent = getConv()?.title || '';
      }
      function toast(msg) {
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = msg;
        D.toasts.appendChild(t);
        setTimeout(() => t.remove(), 2600);
      }

      // ÔöÇÔöÇ Persistence ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
      let saveTimer = null;
      function save() {
        if (IS_SERVED) {
          clearTimeout(saveTimer);
          saveTimer = setTimeout(
            () =>
              fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(S.convs),
              }).catch(() => {}),
            800,
          );
        } else {
          try {
            localStorage.setItem('g-convs', JSON.stringify(S.convs));
          } catch (e) {}
        }
      }
      async function load() {
        if (IS_SERVED) {
          try {
            const r = await fetch('/api/chats');
            if (r.ok) S.convs = await r.json();
          } catch {}
        } else {
          try {
            const d = localStorage.getItem('g-convs');
            if (d) S.convs = JSON.parse(d);
          } catch (e) {
            S.convs = [];
          }
        }
        // ÔöÇÔöÇ Sanitize: heal any conversation that is missing required fields
        // (handles old schema that used `messages` instead of `msgs`, or any
        //  partial/corrupted entries that snuck in from a previous version)
        S.convs = (Array.isArray(S.convs) ? S.convs : []).map((c) => ({
          id: c.id || gid(),
          title: c.title || 'Untitled',
          ts: c.ts || Date.now(),
          model: c.model || '',
          sys: c.sys || '',
          // migrate old `messages` key ÔåÆ `msgs`; fall back to []
          msgs: Array.isArray(c.msgs)
            ? c.msgs
            : Array.isArray(c.messages)
              ? c.messages
              : [],
        }));
      }

      function gid() {
        return (
          Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
        );
      }
      function esc(t) {
        const d = document.createElement('div');
        d.textContent = t;
        return d.innerHTML;
      }

      // ÔöÇÔöÇ Events ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
      function bind() {
        D.send.addEventListener('click', () =>
          S.streaming ? stopStream() : sendMsg(D.inp.value),
        );
        D.inp.addEventListener('input', () => {
          autoResize();
          updateSend();
        });
        D.inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!S.streaming) sendMsg(D.inp.value);
          }
          if (e.key === 'Escape' && S.streaming) stopStream();
        });
        D.nc.addEventListener('click', () => {
          if (!S.streaming) createConv();
        });
        D.sbTog.addEventListener('click', () => toggleSB());
        D.ov.addEventListener('click', () => toggleSB(false));
        // Sidebar-internal hamburger: toggles between expanded and the
        // mini-rail (or off-canvas on mobile). Earlier this was hard-coded
        // to toggleSB(false) which made re-expanding impossible.
        const sbTogInline = document.getElementById('sb-tog-inline');
        if (sbTogInline) {
          sbTogInline.addEventListener('click', () => toggleSB());
        }

        // Collapsible HW stats chip. Persist open/closed state.
        const hwWrap = document.querySelector('.hw-wrap');
        const hwToggle = document.getElementById('hw-toggle');
        if (hwWrap && hwToggle) {
          const setOpen = (open) => {
            hwWrap.classList.toggle('open', open);
            hwToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            try { localStorage.setItem('g-hw-open', open ? '1' : '0'); } catch (_) {}
          };
          setOpen(localStorage.getItem('g-hw-open') === '1');
          hwToggle.addEventListener('click', () => {
            setOpen(!hwWrap.classList.contains('open'));
          });
        }
        D.thTop.addEventListener('click', toggleTheme);
        D.thSb.addEventListener('click', toggleTheme);
        D.ca.addEventListener('click', () => {
          if (!S.streaming) clearAll();
        });
        D.att.addEventListener('click', () => D.fInp.click());
        D.fInp.addEventListener('change', async (e) => {
          await handleAttach(e.target.files);
          e.target.value = '';
        });
        $$('.sc').forEach((c) =>
          c.addEventListener('click', () => {
            const p = c.dataset.prompt;
            if (p) sendMsg(p);
          }),
        );

      // Brain (Think) toggle
      (function bindThinkToggle() {
        const btn = document.getElementById('think-tog');
        if (!btn) return;
        const apply = () => {
          const on = localStorage.getItem('g-think') === '1';
          btn.classList.toggle('on', on);
          btn.setAttribute('aria-pressed', on ? 'true' : 'false');
          btn.title = on
            ? 'Reasoning: on (slower, model thinks before replying). Click to disable.'
            : 'Reasoning: off (faster). Click to enable extended thinking on reasoning models.';
        };
        apply();
        btn.addEventListener('click', () => {
          const on = localStorage.getItem('g-think') === '1';
          localStorage.setItem('g-think', on ? '0' : '1');
          apply();
        });
      })();

      // Panel toggles
      const openSysPanel = () => {
        D.sysOverlay.classList.add('open');
        D.sysOverlay.setAttribute('aria-hidden', 'false');
        toggleModelMenu(false);
        setTimeout(() => { try { D.sysTa.focus(); } catch (_) {} }, 80);
      };
      const closeSysPanel = () => {
        D.sysOverlay.classList.remove('open');
        D.sysOverlay.setAttribute('aria-hidden', 'true');
      };

      D.modelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleModelMenu();
        closeSysPanel();
      });
      D.sysBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (D.sysOverlay.classList.contains('open')) closeSysPanel();
        else openSysPanel();
      });
      D.sysCloseBtn.addEventListener('click', closeSysPanel);
      // Click outside the panel (on the dimmed overlay) to close
      D.sysOverlay.addEventListener('click', (e) => {
        if (e.target === D.sysOverlay) closeSysPanel();
      });
      D.logModeSel.addEventListener('change', saveLogMode);
      D.sysSet.addEventListener('click', saveGlobalPrompt);
      D.sysClr.addEventListener('click', clearGlobalPrompt);

        // Image generation bindings
        D.imgGenBtn.addEventListener('click', generateImage);
        D.imgStopOllama.addEventListener('click', stopChatEngine);
        D.imgStartOllama.addEventListener('click', startChatEngine);

        // Image lightbox bindings
        D.imgModalClose.addEventListener('click', closeImgModal);
        D.imgModal.addEventListener('click', (e) => {
          if (e.target === D.imgModal) closeImgModal();
        });
        document.addEventListener('keydown', (e) => {
          if (e.key !== 'Escape') return;
          if (D.imgModal.classList.contains('on')) { closeImgModal(); return; }
          if (D.sysOverlay.classList.contains('open')) { closeSysPanel(); return; }
        });

        document.addEventListener('click', (e) => {
          if (!D.modelDd.contains(e.target)) toggleModelMenu(false);
        });
        window.addEventListener('resize', () => {
          if (window.innerWidth <= 768 && S.sbOpen) toggleSB(false);
        });

        // Drag-and-drop (image / PDF / text files)
        const mainEl = document.getElementById('main');
        mainEl.addEventListener('dragover', (e) => {
          e.preventDefault();
          mainEl.classList.add('drag-over');
        });
        mainEl.addEventListener('dragleave', () =>
          mainEl.classList.remove('drag-over'),
        );
        mainEl.addEventListener('drop', (e) => {
          e.preventDefault();
          mainEl.classList.remove('drag-over');
          handleAttach(e.dataTransfer.files);
        });
      }

      // ÔöÇÔöÇ Start ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
      init();
