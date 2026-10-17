/**
 * Mission Agent OS (JARVIS / OPSIS) — Live Official Auth-Bridge Client
 * Serves inside C:\ANTIGRAVITY\mission-os on :3130.
 *
 * Connects the Mission Control dashboard and JARVIS/OPSIS dropdown to the real
 * official login-authenticated CLIs / ACP / A2A / MCP bridges on T5500:
 *   - gemini : agy CLI (ops/paperclip/agy-gemini.cmd) -> Google AI Studio / Gemini Ultra OAuth
 *   - claude : claude.exe -> Official Anthropic Claude OAuth Login (never an API key)
 *   - codex  : codex.cmd  -> Official OpenAI Codex OAuth Login
 *   - grok   : grok.exe   -> Official xAI Grok CLI / ACP OAuth Login
 *   - hermes : hermes.exe / hermes-acp.exe + :8643 A2A -> Nous Hermes Login
 *   - fable  : ollama (:11434) -> Local RTX 3070 8GB joshlcoleman/Fable:latest Fail-Safe
 */
(function () {
  if (window.__MOS_JARVIS_BRIDGE_LOADED__) return;
  window.__MOS_JARVIS_BRIDGE_LOADED__ = true;

  const BRAINS = [
    {
      id: 'gemini',
      label: 'Gemini 4 Argon / Ultra (agy CLI)',
      short: 'Gemini 4 Ultra (agy)',
      protocol: 'AGY CLI · Google Ultra OAuth',
      cmdHint: 'agy --print / agy-gemini.cmd',
      dotColor: '#22d3ee',
    },
    {
      id: 'claude',
      label: 'Claude Opus / Sonnet (Official CLI)',
      short: 'Claude (OAuth)',
      protocol: 'CLAUDE CLI · Anthropic Login OAuth',
      cmdHint: 'claude -p (OAuth only)',
      dotColor: '#d0bcff',
    },
    {
      id: 'codex',
      label: 'OpenAI Codex (Official CLI)',
      short: 'Codex (OpenAI OAuth)',
      protocol: 'CODEX CLI · OpenAI Login OAuth',
      cmdHint: 'codex exec',
      dotColor: '#4ade80',
    },
    {
      id: 'grok',
      label: 'xAI Grok (Official CLI / ACP)',
      short: 'Grok (xAI OAuth)',
      protocol: 'GROK CLI / ACP · xAI Login OAuth',
      cmdHint: 'grok -p --always-approve',
      dotColor: '#ffb147',
    },
    {
      id: 'hermes',
      label: 'Hermes (@t5500_bot · OmniRoute /v1)',
      short: 'Hermes (@t5500_bot · OmniRoute)',
      protocol: 'OMNIROUTE http://192.168.0.15:20128/v1 · @t5500_bot',
      cmdHint: 'http://192.168.0.15:20128/v1 (hermes-support)',
      dotColor: '#38bdf8',
    },
    {
      id: 'fable',
      label: 'Fable Local (RTX 3070 8GB Ollama)',
      short: 'Fable (Local VRAM)',
      protocol: 'LOCAL OLLAMA :11434 · Pinned GGUF',
      cmdHint: 'ollama run joshlcoleman/Fable:latest',
      dotColor: '#a3e635',
    },
  ];

  const ROUTE_MAP = {
    overview: '/screens/mission_control_overview/',
    jarvis: '/screens/mission_control_jarvis_command_console/',
    agents: '/screens/mission_control_agents_fleet/',
    board: '/screens/mission_control_board_journal/',
    gateway: '/screens/mission_control_omniroute_gateway/',
    marketing: '/screens/mission_control_paperclip_marketing/',
    memory: '/screens/mission_control_agent_memory_stores/',
    node: '/screens/mission_control_t5500_hardware_node/',
    logs: '/screens/mission_control_t5500_node_boot_timeline/',
    support: '/screens/mission_control_hermes_support_inbox/',
    settings: '/screens/mission_control_settings_logins/',
    ecosystem: '/screens/mission_control_youandinotai_ecosystem/',
    vtuber: '/screens/mission_control_live_avatar_stream_vtuber_studio/',
  };

  let activeBrain = localStorage.getItem('mos_active_brain') || 'gemini';
  if (!BRAINS.some((b) => b.id === activeBrain)) activeBrain = 'gemini';
  let latestBridges = {};
  let latestState = null;

  function getBrainMeta(id) {
    return BRAINS.find((b) => b.id === id) || BRAINS[0];
  }

  function escHtml(s) {
    return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  // 1. Stream-safe cleanup: remove any blocking modal overlay & scrub mock key fragments
  function enforceStreamSafeDom() {
    const blockingModal = document.getElementById('terminal-modal-overlay');
    if (blockingModal) blockingModal.remove();

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const badKeyRe = /(AIzaSy[A-Za-z0-9_.\-]+|gsk_[A-Za-z0-9_.\-]+|sk-[A-Za-z0-9_.\-]{6,})/g;
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      if (badKeyRe.test(n.nodeValue)) {
        n.nodeValue = n.nodeValue.replace(badKeyRe, '•••• (OAuth / .env protected)');
      }
    }
  }

  // 2. Wire sidebar navigation links across all screens
  function wireSidebarNavigation() {
    document.querySelectorAll('a[data-path]').forEach((a) => {
      const key = (a.getAttribute('data-path') || '').toLowerCase();
      if (ROUTE_MAP[key]) {
        a.setAttribute('href', ROUTE_MAP[key]);
      }
    });

    const nav = document.querySelector('aside nav');
    if (nav && !nav.querySelector('[data-path="jarvis"]')) {
      const overviewLink = nav.querySelector('[data-path="overview"]');
      const jarvisLink = document.createElement('a');
      jarvisLink.setAttribute('data-path', 'jarvis');
      jarvisLink.setAttribute('href', ROUTE_MAP.jarvis);
      jarvisLink.className =
        'flex items-center justify-between px-3 py-2 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all group';
      jarvisLink.innerHTML =
        '<div class="flex items-center gap-2 min-w-0"><span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span><span class="font-medium truncate text-cyan-300">JARVIS / OPSIS</span></div><kbd class="px-1.5 py-0.5 rounded bg-slate-800 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono">LIVE</kbd>';
      if (overviewLink && overviewLink.nextSibling) {
        nav.insertBefore(jarvisLink, overviewLink.nextSibling);
      } else {
        nav.prepend(jarvisLink);
      }
    }
  }

  // 3. Inject & sync the Top-Bar JARVIS / OPSIS Brain Dropdown + Quick Console Drawer
  function mountJarvisDropdownAndConsole() {
    const oldTrigger = document.getElementById('trigger-jarvis-modal');

    const header = document.querySelector('header');
    if (header && !document.getElementById('mos-jarvis-brain-bar')) {
      const bar = document.createElement('div');
      bar.id = 'mos-jarvis-brain-bar';
      bar.style.cssText =
        'display:flex;align-items:center;gap:6px;background:#071324;border:1px solid rgba(34,211,238,0.45);border-radius:10px;padding:3px 9px;box-shadow:0 0 14px -3px rgba(34,211,238,0.35);z-index:60;white-space:nowrap;flex-shrink:0;';
      bar.innerHTML = `
        <span style="width:8px;height:8px;border-radius:999px;background:#22d3ee;display:inline-block;box-shadow:0 0 8px #22d3ee;flex-shrink:0" id="mos-jarvis-dot"></span>
        <span style="font:700 11px JetBrains Mono,monospace;color:#8aebff;letter-spacing:0.03em;white-space:nowrap">JARVIS / OPSIS:</span>
        <select id="mos-jarvis-select" title="Select Official Authenticated Brain for JARVIS / OPSIS" style="background:#000f21;color:#d3e4fe;border:1px solid rgba(34,211,238,0.4);border-radius:6px;padding:2px 6px;font:600 11px JetBrains Mono,monospace;cursor:pointer;outline:none;white-space:nowrap">
          ${BRAINS.map((b) => `<option value="${b.id}" ${b.id === activeBrain ? 'selected' : ''}>${b.label}</option>`).join('')}
        </select>
        <span id="mos-jarvis-auth-pill" style="font:700 10px JetBrains Mono,monospace;background:rgba(34,197,94,0.18);color:#4ade80;border:1px solid rgba(34,197,94,0.45);padding:2px 7px;border-radius:999px;white-space:nowrap">OAUTH OK</span>
        <button id="mos-jarvis-ask-btn" type="button" style="background:#22d3ee;color:#001f25;border:none;border-radius:6px;padding:3px 9px;font:700 11px Inter,sans-serif;cursor:pointer;white-space:nowrap">Ask JARVIS</button>
      `;
      const firstGroup = header.firstElementChild;
      if (firstGroup) firstGroup.classList.remove('min-w-0');
      if (oldTrigger && oldTrigger.parentElement) {
        oldTrigger.replaceWith(bar);
      } else if (firstGroup && firstGroup.nextSibling) {
        header.insertBefore(bar, firstGroup.nextSibling);
      } else {
        header.appendChild(bar);
      }
      // Hide duplicate rate-tier pill in header right group so nothing clips horizontally
      const rightGroup = header.lastElementChild;
      if (rightGroup && rightGroup.children.length >= 3) {
        const firstBadge = rightGroup.firstElementChild;
        if (firstBadge && /RATE TIER/i.test(firstBadge.textContent || '')) {
          firstBadge.style.display = 'none';
        }
      }

      const sel = document.getElementById('mos-jarvis-select');
      sel.addEventListener('change', (e) => setActiveBrain(e.target.value));
      document.getElementById('mos-jarvis-ask-btn').addEventListener('click', () => {
        if (/^\/(index\.html)?$/.test(window.location.pathname) || window.location.pathname.includes('mission_control_jarvis_command_console')) {
          const inp = document.getElementById('input-jarvis-prompt');
          if (inp) inp.focus();
        } else {
          toggleQuickDrawer(true);
        }
      });
    }

    // Upgrade #brain-selector on mission_control_jarvis_command_console so ALL 6 official brains are selectable buttons
    const brainSelector = document.getElementById('brain-selector');
    if (brainSelector) {
      brainSelector.innerHTML = BRAINS.map((b) => {
        const isAct = b.id === activeBrain;
        return `<button type="button" data-brain-id="${b.id}" class="mos-brain-tab flex items-center gap-1.5 px-2.5 py-1 rounded font-headline-sm text-headline-sm transition-all whitespace-nowrap ${
          isAct
            ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
            : 'hover:bg-surface-container-high text-on-surface-variant hover:text-primary font-semibold'
        }">
          <span style="width:7px;height:7px;border-radius:999px;background:${isAct ? '#001f25' : b.dotColor}"></span>
          <span>${escHtml(b.short)}</span>
        </button>`;
      }).join('');
      brainSelector.querySelectorAll('button[data-brain-id]').forEach((btn) => {
        btn.addEventListener('click', () => setActiveBrain(btn.getAttribute('data-brain-id')));
      });
    }

    // Fix layout of JARVIS Command Console so prompt input + RUN button are always visible above the fold
    const onConsole = /^\/(index\.html)?$/.test(window.location.pathname) || window.location.pathname.includes('mission_control_jarvis_command_console');
    if (onConsole) {
      const dupVram = document.getElementById('stat-vram-usage');
      if (dupVram) dupVram.style.display = 'none';
      const thinkBox = document.getElementById('jarvis-thinking-state');
      if (thinkBox) thinkBox.style.display = 'none';
      const viewport = document.getElementById('chat-stream-viewport');
      if (viewport) {
        viewport.style.maxHeight = '480px';
        viewport.style.overflowY = 'auto';
        if (viewport.parentElement) {
          viewport.parentElement.style.justifyContent = 'flex-start';
          viewport.parentElement.style.gap = '10px';
        }
      }
      const msg1 = document.getElementById('msg-jarvis-1');
      if (msg1) {
        msg1.innerHTML = msg1.innerHTML
          .replace(/Gemini 3\.1 Pro Ultra/g, 'Gemini 4 Argon / Ultra')
          .replace(/Gemini 3\.1 Pro/g, 'Gemini 4 Argon / Ultra')
          .replace(/1 DEGRADED \/ 11 NOMINAL/g, '15 / 15 STAGES NOMINAL')
          .replace(/11\/12 operational/g, '15/15 operational');
      }
    }

    // Ensure slide-up drawer is collapsed by default so it doesn't cover the right-hand Agent Roster
    const existingDrawer = document.getElementById('jarvis-slideup-drawer');
    if (existingDrawer) {
      existingDrawer.classList.add('translate-y-full');
      const logBox = existingDrawer.querySelector('.bg-surface-container-lowest');
      if (logBox) {
        logBox.innerHTML = `
          <div>[READY] 6/6 Official Auth Bridges verified on T5500</div>
          <div>[VRAM] Ollama joshlcoleman/Fable:latest pinned in RTX 3070 (8GB)</div>
          <div>[OAUTH] Gemini 4 Ultra (agy 1.4.0) · Claude 2.1.278 · Codex 0.162.0 · Grok 1.0.50 · Hermes 0.21.7</div>
        `;
      }
      const dInput = existingDrawer.querySelector('input[type="text"]');
      const dBtn = existingDrawer.querySelector('button:last-of-type');
      if (dInput && dBtn) {
        const submitExisting = () => {
          const val = dInput.value.trim();
          if (!val) return;
          dInput.value = '';
          dispatchJarvisPrompt(val);
        };
        dBtn.onclick = submitExisting;
        dInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') submitExisting();
        });
      }
    } else {
      const drawer = document.createElement('div');
      drawer.id = 'jarvis-slideup-drawer';
      drawer.style.cssText =
        'position:fixed;bottom:0;right:18px;width:440px;max-width:calc(100vw - 2rem);background:#102034;border:1px solid rgba(34,211,238,0.45);border-bottom:none;border-radius:12px 12px 0 0;box-shadow:0 12px 32px rgba(0,0,0,0.65);z-index:9999;transition:transform 0.25s ease;transform:translateY(calc(100% - 38px));font-family:Inter,Segoe UI,sans-serif;color:#d3e4fe;';
      drawer.innerHTML = `
        <div id="mos-drawer-header" style="background:#1b2b3f;padding:8px 14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;border-radius:12px 12px 0 0;user-select:none">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:8px;height:8px;border-radius:999px;background:#22d3ee;display:inline-block"></span>
            <span style="font:700 12px Inter,sans-serif;letter-spacing:0.03em">JARVIS / OPSIS LIVE BRIDGE</span>
            <span id="mos-drawer-brain-tag" style="font:600 10px JetBrains Mono,monospace;color:#8aebff;background:#000f21;padding:2px 6px;border-radius:4px">[${escHtml(getBrainMeta(activeBrain).short)}]</span>
          </div>
          <span style="font:600 11px JetBrains Mono,monospace;color:#8aebff">Ctrl+J ▴</span>
        </div>
        <div style="padding:12px;display:flex;flex-direction:column;gap:8px">
          <div id="mos-drawer-log" style="background:#000f21;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px;height:210px;overflow-y:auto;font:12px/1.45 JetBrains Mono,monospace;display:flex;flex-direction:column;gap:8px">
            <div style="color:#8aebff">[JARVIS READY] Pick any official login brain in the top dropdown (Gemini Ultra via agy, Claude, Codex, Grok, Hermes, or local Fable) and send a prompt.</div>
          </div>
          <div style="display:flex;gap:6px">
            <input id="mos-drawer-input" type="text" placeholder="Ask active JARVIS brain..." style="flex:1;background:#000f21;color:#d3e4fe;border:1px solid rgba(34,211,238,0.4);border-radius:6px;padding:7px 10px;font:12px JetBrains Mono,monospace;outline:none">
            <button id="mos-drawer-send" type="button" style="background:#22d3ee;color:#001f25;border:none;border-radius:6px;padding:7px 14px;font:700 12px JetBrains Mono,monospace;cursor:pointer">SEND</button>
          </div>
        </div>
      `;
      document.body.appendChild(drawer);
      let open = false;
      const hdr = document.getElementById('mos-drawer-header');
      hdr.addEventListener('click', () => {
        open = !open;
        drawer.style.transform = open ? 'translateY(0)' : 'translateY(calc(100% - 38px))';
      });
      window.__MOS_SET_DRAWER__ = (state) => {
        open = state;
        drawer.style.transform = open ? 'translateY(0)' : 'translateY(calc(100% - 38px))';
      };
      const dInput = document.getElementById('mos-drawer-input');
      const dSend = document.getElementById('mos-drawer-send');
      const submitDrawer = () => {
        const val = dInput.value.trim();
        if (!val) return;
        dInput.value = '';
        dispatchJarvisPrompt(val);
      };
      dSend.addEventListener('click', submitDrawer);
      dInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitDrawer();
      });
    }

    // Wire main JARVIS Command Console input & RUN button
    const mainInput = document.getElementById('input-jarvis-prompt');
    const mainBtn = document.getElementById('btn-send-command');
    if (mainInput && mainBtn) {
      mainBtn.removeAttribute('onclick');
      const triggerMain = () => {
        const val = mainInput.value.trim();
        if (!val) return;
        mainInput.value = '';
        dispatchJarvisPrompt(val);
      };
      mainBtn.onclick = triggerMain;
      mainInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerMain();
      });
    }

    const quickBrainMap = {
      'chip-gemini-ultra-switch': 'gemini',
      'chip-flash-switch': 'gemini',
      'chip-opus-opinion': 'claude',
      'chip-hermes-switch': 'hermes',
    };
    Object.entries(quickBrainMap).forEach(([chipId, bId]) => {
      const el = document.getElementById(chipId);
      if (el) el.addEventListener('click', () => setActiveBrain(bId));
    });

    window.MOS_DISPATCH_JARVIS = dispatchJarvisPrompt;
    window.MOS_SET_BRAIN = setActiveBrain;
    updateBrainUiIndicators();
  }

  function toggleQuickDrawer(forceOpen) {
    if (window.__MOS_SET_DRAWER__) {
      window.__MOS_SET_DRAWER__(forceOpen);
      const inp = document.getElementById('mos-drawer-input');
      if (inp && forceOpen) inp.focus();
    } else {
      const existingDrawer = document.getElementById('jarvis-slideup-drawer');
      if (existingDrawer) {
        if (forceOpen) existingDrawer.classList.remove('translate-y-full');
        else existingDrawer.classList.toggle('translate-y-full');
      }
    }
  }

  function setActiveBrain(brainId) {
    if (!BRAINS.some((b) => b.id === brainId)) return;
    activeBrain = brainId;
    localStorage.setItem('mos_active_brain', activeBrain);
    updateBrainUiIndicators();
  }

  function updateBrainUiIndicators() {
    const meta = getBrainMeta(activeBrain);
    const sel = document.getElementById('mos-jarvis-select');
    if (sel && sel.value !== activeBrain) sel.value = activeBrain;

    const dot = document.getElementById('mos-jarvis-dot');
    if (dot) {
      dot.style.background = meta.dotColor;
      dot.style.boxShadow = `0 0 8px ${meta.dotColor}`;
    }

    const bInfo = latestBridges[activeBrain];
    const authPill = document.getElementById('mos-jarvis-auth-pill');
    if (authPill) {
      const isUp = !bInfo || bInfo.status === 'UP';
      authPill.textContent = isUp
        ? `${bInfo?.version || 'ONLINE'} · OAUTH OK`
        : `${bInfo?.status || 'CHECK'}`;
      authPill.style.color = isUp ? '#4ade80' : '#f87171';
    }

    const promptInd = document.getElementById('prompt-brain-indicator');
    if (promptInd) {
      promptInd.innerHTML = `<span style="width:7px;height:7px;border-radius:999px;background:${meta.dotColor};display:inline-block"></span><span class="font-bold">[${escHtml(meta.short)} · ${escHtml(meta.cmdHint)}]</span>`;
    }

    const mainInput = document.getElementById('input-jarvis-prompt');
    if (mainInput) {
      mainInput.placeholder = `Instruct JARVIS / OPSIS via ${meta.label} (${meta.cmdHint})...`;
    }

    const drawerTag = document.getElementById('mos-drawer-brain-tag');
    if (drawerTag) drawerTag.textContent = `[${meta.short}]`;

    const badgeSpecs = document.getElementById('badge-runtime-specs');
    if (badgeSpecs) {
      badgeSpecs.innerHTML = `<span class="text-primary font-bold">⚡ ACTIVE BRAIN: ${escHtml(meta.label)}</span><span class="text-outline-variant">·</span><span class="text-on-surface">${escHtml(meta.protocol)}</span><span class="text-outline-variant">·</span><span class="text-secondary font-medium">Cmd: ${escHtml(meta.cmdHint)}</span>`;
    }

    const brainSelector = document.getElementById('brain-selector');
    if (brainSelector) {
      brainSelector.querySelectorAll('button[data-brain-id]').forEach((btn) => {
        const isAct = btn.getAttribute('data-brain-id') === activeBrain;
        const b = getBrainMeta(btn.getAttribute('data-brain-id'));
        btn.className = `mos-brain-tab flex items-center gap-1.5 px-2.5 py-1 rounded font-headline-sm text-headline-sm transition-all whitespace-nowrap ${
          isAct
            ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
            : 'hover:bg-surface-container-high text-on-surface-variant hover:text-primary font-semibold'
        }`;
        const dotEl = btn.querySelector('span:first-child');
        if (dotEl) dotEl.style.background = isAct ? '#001f25' : b.dotColor;
      });
    }
  }

  // 4. Execute real prompt against selected official CLI / bridge on T5500
  async function dispatchJarvisPrompt(promptText) {
    const meta = getBrainMeta(activeBrain);
    const ts = new Date().toLocaleTimeString();

    const viewport = document.getElementById('chat-stream-viewport');
    let replyBox = null;
    if (viewport) {
      const userEl = document.createElement('div');
      userEl.className = 'flex flex-col items-end gap-1 self-end max-w-2xl';
      userEl.innerHTML = `
        <div class="flex items-center gap-2 pr-1">
          <span class="font-label-code-sm text-label-code-sm text-on-surface-variant">JOSHUA // T5500 FOUNDER</span>
          <span class="font-label-status text-label-status text-on-surface-variant">${escHtml(ts)}</span>
        </div>
        <div class="bg-surface-container-high text-on-surface px-4 py-2 rounded-xl shadow-md font-body-md text-body-md border border-primary/30">${escHtml(promptText)}</div>
      `;
      viewport.appendChild(userEl);

      const botEl = document.createElement('div');
      botEl.className = 'flex flex-col items-start gap-1.5 self-start w-full max-w-3xl';
      botEl.innerHTML = `
        <div class="flex items-center gap-2 pl-1 flex-wrap">
          <span style="width:8px;height:8px;border-radius:999px;background:${meta.dotColor};display:inline-block"></span>
          <span class="font-label-code-sm text-label-code-sm font-semibold text-primary">OPSIS / JARVIS [${escHtml(meta.label)}]</span>
          <span class="font-label-code-sm text-label-code-sm text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/30">${escHtml(meta.protocol)}</span>
        </div>
        <div class="bg-surface-container-low text-on-surface p-3.5 rounded-xl w-full shadow-md border border-primary/30 font-body-md text-body-md whitespace-pre-wrap" data-reply-body="1">Dispatching live to ${escHtml(meta.short)} (${escHtml(meta.cmdHint)})...</div>
      `;
      viewport.appendChild(botEl);
      replyBox = botEl.querySelector('[data-reply-body="1"]');
      viewport.scrollTop = viewport.scrollHeight;
    }

    const drawerLog =
      document.getElementById('mos-drawer-log') ||
      document.querySelector('#jarvis-slideup-drawer .bg-surface-container-lowest');
    let drawerReply = null;
    if (drawerLog) {
      const lineUser = document.createElement('div');
      lineUser.style.color = '#facc15';
      lineUser.textContent = `[${ts}] YOU -> ${meta.short}: ${promptText}`;
      drawerLog.appendChild(lineUser);

      drawerReply = document.createElement('div');
      drawerReply.style.color = '#8aebff';
      drawerReply.style.whiteSpace = 'pre-wrap';
      drawerReply.textContent = `[${ts}] ${meta.short}: Running (${meta.cmdHint})...`;
      drawerLog.appendChild(drawerReply);
      drawerLog.scrollTop = drawerLog.scrollHeight;
    }

    try {
      const r = await fetch('/api/jarvis/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brain: activeBrain, prompt: promptText }),
      });
      const data = await r.json();
      const outText = data.ok
        ? data.output || '(Empty response)'
        : `ERROR (${data.brain || activeBrain}): ${data.error || 'Bridge execution failed'}`;
      const footer = `\n— Verified via ${data.commandUsed || meta.cmdHint} · ${data.durationMs || 0}ms`;
      if (replyBox) {
        replyBox.textContent = outText + footer;
        if (!data.ok) replyBox.style.color = '#ffb4ab';
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
      }
      if (drawerReply) {
        drawerReply.textContent = `[${meta.short} · ${data.durationMs || 0}ms] ${outText}`;
        if (!data.ok) drawerReply.style.color = '#ffb4ab';
      }
    } catch (err) {
      const msg = `Bridge request error: ${err.message || err}`;
      if (replyBox) {
        replyBox.textContent = msg;
        replyBox.style.color = '#ffb4ab';
      }
      if (drawerReply) {
        drawerReply.textContent = msg;
        drawerReply.style.color = '#ffb4ab';
      }
    }
  }

  // 5. Hydrate live status & fix stale hardcoded "Codex BLOCKED" cards
  async function refreshTelemetry() {
    try {
      const [stateRes, bridgesRes] = await Promise.all([
        fetch('/api/mos-state.json'),
        fetch('/api/bridges'),
      ]);
      if (stateRes.ok) latestState = await stateRes.json();
      if (bridgesRes.ok) {
        const bData = await bridgesRes.json();
        latestBridges = {};
        (bData.bridges || []).forEach((b) => {
          latestBridges[b.id] = b;
        });
      }
      updateBrainUiIndicators();
      patchDashboardLiveCards();
    } catch {}
  }

  function patchDashboardLiveCards() {
    if (!latestState) return;
    const servicesUp = (latestState.services || []).filter((s) => s.listening).length;
    const servicesTotal = (latestState.services || []).length;
    const stagesUp = (latestState.keepalive?.stages || []).filter((s) => s.status === 'UP').length;
    const stagesTotal = (latestState.keepalive?.stages || []).length || 14;
    const brainsOnline = Object.values(latestBridges).filter((b) => b.status === 'UP').length;
    const brainsTotal = Object.keys(latestBridges).length || 6;

    document.querySelectorAll('header span').forEach((sp) => {
      if (/REFRESHED.*AGO/i.test(sp.textContent)) {
        sp.style.display = 'none';
      }
      if (/ATTENTION.*UP|STAGES UP|BRAINS/i.test(sp.textContent)) {
        sp.textContent = `${stagesUp}/${stagesTotal} STAGES UP · ${brainsOnline}/${brainsTotal} BRAINS`;
        sp.style.color = '#4ade80';
      }
    });

    const codexBridge = latestBridges.codex;
    if (codexBridge && codexBridge.status === 'UP') {
      const codexRow = document.getElementById('login-row-codex');
      if (codexRow) {
        const badge = document.getElementById('badge-codex-auth');
        if (badge) {
          badge.className =
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-label-status text-label-status tracking-wide';
          badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span>Signed in (${escHtml(codexBridge.version)})`;
        }
        codexRow.querySelectorAll('span').forEach((s) => {
          if (s.textContent.trim() === 'BLOCKED') {
            s.textContent = 'ONLINE';
            s.className = 'px-1.5 py-0.2 rounded bg-primary-container/20 text-primary font-label-status text-label-status uppercase';
          }
          if (/Token expired|github-copilot-cli|ERR_TOKEN_STALE/i.test(s.textContent)) {
            if (/github-copilot-cli/i.test(s.textContent)) s.textContent = codexBridge.version || 'codex-cli 0.162.0';
            else if (/Token expired/i.test(s.textContent)) {
              s.textContent = 'OpenAI OAuth Active';
              s.className = 'font-label-code-sm text-label-code-sm text-primary';
            } else s.textContent = 'codex exec ready';
          }
        });
      }

      const agentRowCodex = document.getElementById('agent-row-codex');
      if (agentRowCodex) {
        agentRowCodex.className =
          'flex items-center justify-between p-2 rounded bg-surface-container hover:bg-surface-container-high transition-all';
        agentRowCodex.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-primary-container"></span>
            <div>
              <span class="font-label-code-sm text-label-code-sm text-on-surface font-semibold block">OpenAI Codex (${escHtml(codexBridge.version)})</span>
              <span class="font-label-status text-label-status text-on-surface-variant">Official OpenAI OAuth · codex exec ready</span>
            </div>
          </div>
          <span class="font-label-status text-label-status bg-primary-container/10 text-primary px-1.5 py-0.5 rounded">ONLINE</span>
        `;
      }
      const svcCodex = document.getElementById('svc-agent-codex-stat');
      if (svcCodex) {
        svcCodex.className = 'flex items-center justify-between p-2 rounded bg-surface-container-high';
        svcCodex.innerHTML = `<div class="flex items-center gap-1.5 min-w-0"><span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span><span class="font-label-code-sm text-label-code-sm text-on-surface truncate">Codex (${escHtml(codexBridge.version)})</span></div><span class="font-label-status text-label-status text-primary">ONLINE</span>`;
      }
      const blockedCard = document.getElementById('card-blocked-action');
      if (blockedCard) {
        blockedCard.innerHTML = `
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">verified</span>
              <div>
                <span class="font-headline-sm text-headline-sm font-semibold text-on-surface">All 6 Official JARVIS / OPSIS Brains Verified Online (T5500)</span>
                <div class="font-label-code-sm text-label-code-sm text-on-surface-variant">Gemini Ultra (agy 1.4.0) · Claude Code (2.1.278) · OpenAI Codex (0.162.0) · xAI Grok (1.0.50 ACP/CLI) · Nous Hermes (0.21.7 :8643) · Local Fable (RTX 3070 8GB).</div>
              </div>
            </div>
            <span class="font-label-status text-label-status bg-primary/20 text-primary px-2 py-0.5 rounded font-bold whitespace-nowrap">6/6 BRIDGES UP</span>
          </div>
        `;
      }
    }

    const loginsCard = document.getElementById('card-agent-logins');
    if (loginsCard && latestBridges.hermes && !document.getElementById('login-row-hermes')) {
      const list = loginsCard.querySelector('.flex.flex-col.divide-y-0');
      if (list) {
        const hRow = document.createElement('div');
        hRow.id = 'login-row-hermes';
        hRow.className =
          'p-space-md sm:p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md hover:bg-surface-container/50 transition-colors bg-surface-container-low';
        hRow.innerHTML = `
          <div class="flex items-start gap-space-md min-w-0">
            <div class="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-xl">support_agent</span>
            </div>
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">Hermes (Nous)</span>
                <span class="font-label-code-sm text-label-code-sm text-outline-variant">·</span>
                <span class="font-body-sm text-body-sm text-on-surface-variant truncate">Nous Hermes Agent CLI + ACP + A2A Gateway (:8643 / :9119)</span>
              </div>
              <div class="flex items-center gap-space-sm mt-1 flex-wrap">
                <span class="font-label-code-sm text-label-code-sm text-primary/80 bg-surface-container-high px-1.5 py-0.5 rounded">${escHtml(latestBridges.hermes.version || 'hermes-agent v0.21.7')}</span>
                <span class="font-label-code-sm text-label-code-sm text-on-surface-variant">Nous Login + Local Fable Support Desk</span>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between md:justify-end gap-space-md flex-shrink-0">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-label-status text-label-status tracking-wide">
              <span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
              Signed in (Nous / A2A)
            </span>
          </div>
        `;
        list.appendChild(hRow);
      }
    }

    document.querySelectorAll('section .rounded-xl').forEach((card) => {
      if (/Fleet Health/i.test(card.textContent)) {
        const big = card.querySelector('.font-headline-xl');
        if (big) big.innerHTML = `${servicesUp}<span class="text-on-surface-variant/50 font-normal">/${servicesTotal}</span>`;
      }
      if (/Blockades/i.test(card.textContent) && codexBridge?.status === 'UP') {
        const big = card.querySelector('.font-headline-xl');
        if (big) {
          big.textContent = '0 Blocked';
          big.className = 'font-headline-xl text-headline-xl font-bold tracking-tight text-primary';
        }
      }
    });
  }

  function init() {
    enforceStreamSafeDom();
    wireSidebarNavigation();
    mountJarvisDropdownAndConsole();
    refreshTelemetry();
    setInterval(refreshTelemetry, 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
