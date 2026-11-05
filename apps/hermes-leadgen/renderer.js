'use strict';

// ============================================================================
// OPSIS · SABRETOOTH DESK v1 (:8392) — RENDERER & PURE PANEL RENDER FUNCTIONS
// Built on DREAM Space tokens with WCAG AAA (>= 7:1) contrast verification,
// runtime bearer header injection, Three.js MIT dark orbital stage, 4 views,
// and 5-tab workspace bottom dock.
// ============================================================================

const DREAM_SPACE_TOKENS = {
  ink: '#0A0B0D',
  panel: '#12151A',
  card: '#1A1E25',
  hull: '#3A3F45',
  porcelain: '#F4F1EA',
  fog: '#C9CBCE',
  slate: '#9DA3AA',
  signal: '#FFD21E',
  dotGreen: '#22C55E',
  dotAmber: '#F59E0B',
  dotRed: '#EF4444',
  dotGrey: '#9DA3AA',
};

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseHexRgb(hex) {
  const clean = String(hex || '')
    .replace('#', '')
    .trim();
  if (clean.length !== 6) return [0, 0, 0];
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}

function relativeLuminance(hex) {
  const [r, g, b] = parseHexRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fgHex, bgHex) {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function verifyWcagAaaPalette() {
  const pairs = [
    { id: 'porcelain-on-ink', fg: DREAM_SPACE_TOKENS.porcelain, bg: DREAM_SPACE_TOKENS.ink },
    { id: 'porcelain-on-panel', fg: DREAM_SPACE_TOKENS.porcelain, bg: DREAM_SPACE_TOKENS.panel },
    { id: 'porcelain-on-card', fg: DREAM_SPACE_TOKENS.porcelain, bg: DREAM_SPACE_TOKENS.card },
    { id: 'fog-on-ink', fg: DREAM_SPACE_TOKENS.fog, bg: DREAM_SPACE_TOKENS.ink },
    { id: 'fog-on-panel', fg: DREAM_SPACE_TOKENS.fog, bg: DREAM_SPACE_TOKENS.panel },
    { id: 'fog-on-card', fg: DREAM_SPACE_TOKENS.fog, bg: DREAM_SPACE_TOKENS.card },
    { id: 'signal-on-ink', fg: DREAM_SPACE_TOKENS.signal, bg: DREAM_SPACE_TOKENS.ink },
    { id: 'signal-on-panel', fg: DREAM_SPACE_TOKENS.signal, bg: DREAM_SPACE_TOKENS.panel },
    { id: 'signal-on-card', fg: DREAM_SPACE_TOKENS.signal, bg: DREAM_SPACE_TOKENS.card },
    { id: 'ink-on-signal-btn', fg: DREAM_SPACE_TOKENS.ink, bg: DREAM_SPACE_TOKENS.signal },
    { id: 'slate-on-ink', fg: DREAM_SPACE_TOKENS.slate, bg: DREAM_SPACE_TOKENS.ink },
  ].map((p) => ({ ...p, ratio: contrastRatio(p.fg, p.bg) }));

  const lowestPair = pairs.reduce((min, cur) => (cur.ratio < min.ratio ? cur : min), pairs[0]);
  const allPassAaa = pairs.every((p) => p.ratio >= 7.0);
  return { allPassAaa, lowestPair, pairs };
}

function normalizeDotColor(dot, fallbackUp) {
  const allowed = new Set(['green', 'amber', 'red', 'grey']);
  if (allowed.has(dot)) return dot;
  if (fallbackUp === true) return 'green';
  if (fallbackUp === false) return 'red';
  return 'grey';
}

function buildRuntimeAuthHeaders(runtimeToken, extraHeaders = {}) {
  const headers = { ...extraHeaders };
  const trimmed = String(runtimeToken || '').trim();
  if (trimmed) {
    headers.Authorization = `Bearer ${trimmed}`;
  }
  return headers;
}

// ============================================================================
// PURE DATA PANEL RENDERERS (USED BY BROWSER + NODE FAKE-PAYLOAD UNIT TESTS)
// ============================================================================

function renderOverviewPanelMarkup(payload = {}) {
  const ports = Array.isArray(payload.requiredPorts) ? payload.requiredPorts : [];
  const cronJobs = Array.isArray(payload.cronJobs) ? payload.cronJobs : [];
  const jobQueue = Array.isArray(payload.jobQueue) ? payload.jobQueue : [];
  const logTail = Array.isArray(payload.logTail) ? payload.logTail.slice(-10) : [];
  const skillsLoaded = Array.isArray(payload.skillsLoaded) ? payload.skillsLoaded : [];

  const portsRowsHtml = ports
    .map((p) => {
      const dot = normalizeDotColor(p.dot, p.up);
      const stateLabel = p.up ? 'UP' : 'DOWN';
      return `<tr data-port="${escapeHtml(p.port)}">
        <td class="mono"><strong>:${escapeHtml(p.port)}</strong></td>
        <td>${escapeHtml(p.name || 'Service')}</td>
        <td class="mono">${escapeHtml(p.url || `http://127.0.0.1:${p.port}`)}</td>
        <td><span class="pill-tag"><span class="status-dot ${dot}"></span>${stateLabel}</span></td>
      </tr>`;
    })
    .join('');

  const sidebarPortsHtml = ports
    .map((p) => {
      const dot = normalizeDotColor(p.dot, p.up);
      return `<div class="port-mini-row"><span>:${escapeHtml(p.port)} ${escapeHtml(p.name || '')}</span><span><span class="status-dot ${dot}"></span> ${p.up ? 'UP' : 'DOWN'}</span></div>`;
    })
    .join('');

  const cronRowsHtml = cronJobs
    .map((c) => {
      const dot = normalizeDotColor(c.statusDot, true);
      return `<tr data-cron-id="${escapeHtml(c.id)}">
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td class="mono"><code>${escapeHtml(c.schedule)}</code></td>
        <td class="mono">${escapeHtml(c.lastRun)}</td>
        <td><span class="status-dot ${dot}"></span> ${escapeHtml(c.lastResult)}</td>
      </tr>`;
    })
    .join('');

  const queueRowsHtml = jobQueue
    .map((j) => {
      const dot = normalizeDotColor(j.statusDot, true);
      return `<tr data-job-id="${escapeHtml(j.id)}">
        <td><strong>${escapeHtml(j.title)}</strong><div class="cell-secondary">${escapeHtml(j.detail || '')}</div></td>
        <td>${escapeHtml(j.lane)}</td>
        <td class="mono">${escapeHtml(j.stage)}</td>
        <td><span class="pill-tag"><span class="status-dot ${dot}"></span>${escapeHtml(j.state)}</span></td>
      </tr>`;
    })
    .join('');

  const logTailHtml = logTail
    .map((l) => {
      const tsShort = String(l.ts || '').slice(11, 19) || '00:00:00';
      return `<div class="mono-log-line" data-log-id="${escapeHtml(l.id)}">
        <span class="mono-log-ts">[${escapeHtml(tsShort)}]</span>
        <span class="mono-log-lane">${escapeHtml(l.profile || 'opsis')}</span>
        <span class="mono-log-msg">$ ${escapeHtml(l.cmd)} &mdash; ${escapeHtml(l.output)}</span>
      </div>`;
    })
    .join('');

  const skillsHtml = skillsLoaded
    .map(
      (s) => `<div class="skill-step-row" data-skill-step="${escapeHtml(s.step)}">
        <div class="skill-step-name">${escapeHtml(s.step)} · ${escapeHtml(s.skill)}</div>
        <div class="skill-step-desc">${escapeHtml(s.purpose)}</div>
      </div>`,
    )
    .join('');

  return {
    portsRowsHtml,
    sidebarPortsHtml,
    cronRowsHtml,
    queueRowsHtml,
    logTailHtml,
    skillsHtml,
    logLineCount: logTail.length,
  };
}

function renderYoutubeDeskMarkup(payload = {}) {
  const stages = Array.isArray(payload.pipelineStages) ? payload.pipelineStages : [];
  const uploads = Array.isArray(payload.uploads) ? payload.uploads : [];

  const pipelineRailHtml = stages
    .map((s, idx) => {
      const dot = normalizeDotColor(s.statusDot, true);
      return `<div class="pipeline-step-card" data-stage-id="${escapeHtml(s.id)}">
        <div class="pipeline-step-top">
          <span>STAGE 0${idx + 1}</span>
          <span><span class="status-dot ${dot}"></span> ${escapeHtml(s.state)}</span>
        </div>
        <div class="pipeline-step-title">${escapeHtml(s.name)}</div>
        <div class="pipeline-step-detail">${escapeHtml(s.detail)}</div>
      </div>`;
    })
    .join('');

  const uploadsRowsHtml = uploads.length === 0
    ? `<tr><td colspan="6" style="text-align: center; color: var(--text-slate); padding: 24px;">No private uploads queued. Josh publishes in Studio.</td></tr>`
    : uploads
    .map((u) => {
      const dot = normalizeDotColor(u.statusDot, true);
      const syntheticValue = u.containsSyntheticMedia === true ? 'true' : 'false';
      const syntheticLabel =
        u.syntheticMediaLabel ||
        (u.containsSyntheticMedia
          ? 'containsSyntheticMedia: true (Realistic AI voice/scene disclosed)'
          : 'containsSyntheticMedia: false');
      const publishNote = u.studioPublishNote || 'Josh publishes in Studio';
      const tribute = u.descriptionTribute || "CLAUDE's N Joshua's · #TeamClaudeForLife";
      return `<tr data-upload-id="${escapeHtml(u.id)}">
        <td>
          <strong>${escapeHtml(u.title)}</strong>
          <div class="cell-secondary">Tribute: <code>${escapeHtml(tribute)}</code></div>
        </td>
        <td>
          <div>${escapeHtml(u.lane || 'YouTube Studio')}</div>
          <div class="cell-secondary mono">${escapeHtml(u.encoder || 'h264_amf')} · ${escapeHtml(u.duration || '58s')}</div>
        </td>
        <td>
          <span class="pill-tag"><span class="status-dot ${dot}"></span>${escapeHtml(u.stage || 'Private Upload')}</span>
          <div class="cell-secondary">${escapeHtml(u.state || 'Private · Ready for Josh in Studio')}</div>
        </td>
        <td><span class="pill-tag signal">privacyStatus: private</span></td>
        <td>
          <code>containsSyntheticMedia: ${syntheticValue}</code>
          <div class="cell-secondary">${escapeHtml(syntheticLabel)}</div>
        </td>
        <td>
          <strong>${escapeHtml(publishNote)}</strong>
          <div class="cell-secondary"><a href="${escapeHtml(u.studioUrl || 'https://studio.youtube.com/channel/UCJnFUOdEfSOJiXLnx6lXSzg/videos')}" target="_blank" rel="noopener noreferrer">Open in YouTube Studio</a></div>
        </td>
      </tr>`;
    })
    .join('');

  return { pipelineRailHtml, uploadsRowsHtml, uploadCount: uploads.length };
}

function renderClayLeadGenMarkup(payload = {}, filters = {}, selectedId = null) {
  const allLeads = Array.isArray(payload.leads) ? payload.leads : [];
  const stageFilter = filters.stage && filters.stage !== 'ALL' ? filters.stage : null;
  const sourceFilter = filters.source && filters.source !== 'ALL' ? filters.source : null;

  const filteredLeads = allLeads.filter((l) => {
    const matchStage = !stageFilter || l.stage === stageFilter;
    const matchSource = !sourceFilter || l.source === sourceFilter;
    return matchStage && matchSource;
  });

  const activeLead = filteredLeads.find((l) => l.id === selectedId) || filteredLeads[0] || allLeads[0] || null;

  const tableRowsHtml = filteredLeads.length === 0
    ? `<tr><td colspan="7" style="text-align: center; color: var(--text-slate); padding: 24px;">No leads matching current filters.</td></tr>`
    : filteredLeads
    .map((l) => {
      const isSelected = activeLead && activeLead.id === l.id;
      const approved = l.approvalState === 'Approved by Josh' || l.approved === true;
      const dot = approved ? 'green' : 'amber';
      const approvalText = l.approvalState || (approved ? 'Approved by Josh' : 'Awaiting Josh Approval');
      return `<tr class="${isSelected ? 'selected-row' : ''}" data-lead-row="${escapeHtml(l.id)}">
        <td>
          <strong>${escapeHtml(l.company)}</strong>
          <div class="cell-secondary">${escapeHtml(l.contact)}</div>
        </td>
        <td><span class="pill-tag">${escapeHtml(l.stage)}</span></td>
        <td><code>${escapeHtml(l.source)}</code></td>
        <td>${escapeHtml(l.owner)}</td>
        <td class="mono">${escapeHtml(l.lastTouch)}</td>
        <td>${escapeHtml(l.nextStep)}</td>
        <td>
          <span class="pill-tag ${approved ? 'signal' : ''}">
            <span class="status-dot ${dot}"></span>${escapeHtml(approvalText)}
          </span>
        </td>
      </tr>`;
    })
    .join('');

  const detailData = activeLead
    ? {
        id: activeLead.id,
        company: activeLead.company,
        contact: activeLead.contact,
        source: activeLead.source,
        stageOwner: `${activeLead.stage} · ${activeLead.owner}`,
        lastTouch: activeLead.lastTouch,
        nextStep: activeLead.nextStep,
        signal: activeLead.signal || 'Verified official API business signal.',
        draft: activeLead.draft || activeLead.outreachDraft || 'Draft waiting on Josh.',
        approvalState:
          activeLead.approvalState || (activeLead.approved ? 'Approved by Josh' : 'Awaiting Josh Approval'),
      }
    : null;

  const hasSampleLeads = allLeads.some(
    (l) => l.isSample || (l.company && l.company.includes('SAMPLE')) || (l.contact && l.contact.includes('SAMPLE')),
  );

  return {
    tableRowsHtml,
    filteredCount: filteredLeads.length,
    totalCount: allLeads.length,
    activeLead: detailData,
    hasSampleLeads,
  };
}

function renderMarketingDeskMarkup(payload = {}) {
  const campaigns = Array.isArray(payload.campaigns) ? payload.campaigns : [];

  const linksRowsHtml = campaigns
    .map((c) => {
      return `<tr data-campaign-id="${escapeHtml(c.id)}">
        <td>
          <strong>${escapeHtml(c.title)}</strong>
          <div class="cell-secondary">${escapeHtml(c.productCopy)}</div>
          <div class="cell-secondary mono"><a href="${escapeHtml(c.utmUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.utmUrl)}</a></div>
        </td>
        <td class="mono">
          <div>source=<code>${escapeHtml(c.utmSource)}</code> · medium=<code>${escapeHtml(c.utmMedium)}</code></div>
          <div class="cell-secondary">campaign=<code>${escapeHtml(c.utmCampaign)}</code> · ref=<code>${escapeHtml(c.refCode)}</code></div>
        </td>
        <td class="mono">
          <a href="${escapeHtml(c.qrSvgPath)}" target="_blank" rel="noopener noreferrer"><code>${escapeHtml(c.fileName)}</code></a>
        </td>
      </tr>`;
    })
    .join('');

  const qrGalleryHtml = campaigns
    .map((c) => {
      return `<div class="qr-printable-card" data-qr-card="${escapeHtml(c.id)}">
        <div class="qr-card-tribute">
          <span>${escapeHtml(c.cardHeader || "CLAUDE's N Joshua's")}</span>
          <span>${escapeHtml(c.tribute || '#TeamClaudeForLife')}</span>
        </div>
        <img src="${escapeHtml(c.qrSvgPath)}" alt="Printable SVG QR card for ${escapeHtml(c.title)}" loading="lazy" />
        <div style="font-weight:700;color:var(--text-porcelain);font-size:13px">${escapeHtml(c.title)}</div>
        <div class="cell-secondary">${escapeHtml(c.productCopy)}</div>
      </div>`;
    })
    .join('');

  return { linksRowsHtml, qrGalleryHtml, campaignCount: campaigns.length };
}

function renderBottomDockMarkup(payload = {}) {
  const termLines = Array.isArray(payload.terminal) ? payload.terminal : [];
  const files = Array.isArray(payload.files) ? payload.files : [];
  const git = payload.git || {};
  const browser = Array.isArray(payload.browser) ? payload.browser : [];
  const previews = Array.isArray(payload.previews) ? payload.previews : [];

  const terminalHtml = `<div class="dock-grid-list">${termLines
    .slice(-4)
    .map(
      (t) =>
        `<div class="dock-item"><code>[${escapeHtml(String(t.ts || '').slice(11, 19))}] $ ${escapeHtml(t.cmd)}</code><div class="cell-secondary">${escapeHtml(t.output)}</div></div>`,
    )
    .join('')}</div>`;

  const filesHtml = `<div class="dock-grid-list">${files
    .map(
      (f) =>
        `<div class="dock-item"><code>${escapeHtml(f.path)}</code><div class="cell-secondary">${escapeHtml(f.role)} · ${escapeHtml(f.state)}</div></div>`,
    )
    .join('')}</div>`;

  const gitHtml = `<div class="dock-grid-list">
    <div class="dock-item"><strong>Branch:</strong> <code>${escapeHtml(git.branch || 'ai/opsis-desk-v1')}</code><div class="cell-secondary">Base: <code>${escapeHtml(git.base || 'origin/main')}</code></div></div>
    <div class="dock-item"><strong>PR Title:</strong> <code>${escapeHtml(git.prTitle || 'opsis: desk v1 (house shell, four views)')}</code><div class="cell-secondary">${escapeHtml(git.policy || 'PR only against main; never merge, never push main')}</div></div>
  </div>`;

  const browserHtml = `<div class="dock-grid-list">${browser
    .map(
      (b) =>
        `<div class="dock-item"><span class="status-dot ${normalizeDotColor(b.dot, true)}"></span> <strong>${escapeHtml(b.label)}</strong><div class="cell-secondary"><code>${escapeHtml(b.url)}</code> · ${escapeHtml(b.mode)}</div></div>`,
    )
    .join('')}</div>`;

  const previewsHtml = `<div class="dock-grid-list">${previews
    .map(
      (p) =>
        `<div class="dock-item"><strong>${escapeHtml(p.title)}</strong><div class="cell-secondary"><code>${escapeHtml(p.path)}</code> (${escapeHtml(p.kind)})</div></div>`,
    )
    .join('')}</div>`;

  return { terminalHtml, filesHtml, gitHtml, browserHtml, previewsHtml };
}

// ============================================================================
// BROWSER CONTROLLER & THREE.JS MIT SLOW DARK HEADER STAGE
// ============================================================================

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  let cachedLeadsPayload = { leads: [] };
  let selectedLeadId = 'lead-aff-01';

  function getRuntimeBearerToken() {
    const input = document.getElementById('runtime-bearer-input');
    if (input && input.value && input.value.trim()) {
      return input.value.trim();
    }
    if (typeof window.__HERMES_LEADGEN_RUNTIME_TOKEN__ === 'string') {
      return window.__HERMES_LEADGEN_RUNTIME_TOKEN__.trim();
    }
    return '';
  }

  function updateBearerPosturePill() {
    const pill = document.getElementById('bearer-posture-pill');
    if (!pill) return;
    const tok = getRuntimeBearerToken();
    if (tok) {
      pill.innerHTML = '<span class="status-dot green"></span>Bearer Armed (Runtime)';
    } else {
      pill.innerHTML = '<span class="status-dot green"></span>Loopback :8392';
    }
  }

  document.getElementById('runtime-bearer-input')?.addEventListener('input', updateBearerPosturePill);

  async function apiFetch(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const isWriteOrProxy = method !== 'GET' || String(url).startsWith('/proxy/');
    const headers = isWriteOrProxy
      ? buildRuntimeAuthHeaders(getRuntimeBearerToken(), options.headers || {})
      : { ...(options.headers || {}) };
    return fetch(url, { ...options, method, headers });
  }

  // --------------------------------------------------------------------------
  // SLOW DARK THREE.JS HEADER STAGE (MIT, IN-HOUSE, PREFERS-REDUCED-MOTION)
  // --------------------------------------------------------------------------
  function initThreeHeaderStage() {
    const canvas = document.getElementById('three-stage-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Build orbital lattice points on a sphere + outer telemetry ring
    const nodes = [];
    const latSteps = 6;
    const lonSteps = 12;
    for (let i = 1; i < latSteps; i++) {
      const phi = (Math.PI * i) / latSteps;
      for (let j = 0; j < lonSteps; j++) {
        const theta = (2 * Math.PI * j) / lonSteps;
        nodes.push({
          x: Math.sin(phi) * Math.cos(theta),
          y: Math.cos(phi),
          z: Math.sin(phi) * Math.sin(theta),
          signal: (i + j) % 5 === 0,
        });
      }
    }

    let cameraYaw = 0.42;
    const cameraPitch = 0.24;

    function projectPoint(pt, yaw, width, height) {
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(cameraPitch);
      const sinP = Math.sin(cameraPitch);

      const x1 = pt.x * cosY - pt.z * sinY;
      const z1 = pt.x * sinY + pt.z * cosY;
      const y2 = pt.y * cosP - z1 * sinP;
      const z2 = pt.y * sinP + z1 * cosP;

      const radius = Math.min(width, height) * 0.41;
      const perspective = 2.8 / (2.8 - z2 * 0.65);
      return {
        sx: width * 0.5 + x1 * radius * perspective,
        sy: height * 0.5 + y2 * radius * perspective,
        depth: z2,
      };
    }

    function drawStageFrame(yaw) {
      const w = canvas.width || 680;
      const h = canvas.height || 124;
      ctx.fillStyle = DREAM_SPACE_TOKENS.ink;
      ctx.fillRect(0, 0, w, h);

      // Subtle horizon coordinate hairlines in Hull #3A3F45
      ctx.strokeStyle = DREAM_SPACE_TOKENS.hull;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(w, h * 0.5);
      ctx.moveTo(w * 0.5, 0);
      ctx.lineTo(w * 0.5, h);
      ctx.stroke();

      // Project all sphere nodes
      const projected = nodes.map((n) => ({ ...n, ...projectPoint(n, yaw, w, h) }));

      // Connect neighboring orbital nodes
      for (let i = 0; i < projected.length; i++) {
        const a = projected[i];
        for (let j = i + 1; j < projected.length; j++) {
          const b = projected[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dz = a.z - b.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < 0.36) {
            ctx.strokeStyle = a.signal && b.signal ? DREAM_SPACE_TOKENS.signal : DREAM_SPACE_TOKENS.hull;
            ctx.lineWidth = a.signal && b.signal ? 1.2 : 0.85;
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }
      }

      // Draw outer orbital meridian ring in Signal #FFD21E
      ctx.strokeStyle = DREAM_SPACE_TOKENS.signal;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      for (let s = 0; s <= 48; s++) {
        const ang = (2 * Math.PI * s) / 48;
        const ringPt = projectPoint(
          { x: Math.cos(ang) * 1.28, y: Math.sin(ang) * 0.22, z: Math.sin(ang) * 1.28 },
          yaw * 0.8,
          w,
          h,
        );
        if (s === 0) ctx.moveTo(ringPt.sx, ringPt.sy);
        else ctx.lineTo(ringPt.sx, ringPt.sy);
      }
      ctx.stroke();

      // Draw nodes (Signal #FFD21E for primary beacons, Porcelain #F4F1EA for front hemisphere)
      projected.forEach((p) => {
        const r = p.signal ? 2.8 : p.depth > 0 ? 2.0 : 1.3;
        ctx.fillStyle = p.signal
          ? DREAM_SPACE_TOKENS.signal
          : p.depth > 0
            ? DREAM_SPACE_TOKENS.porcelain
            : DREAM_SPACE_TOKENS.hull;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw immediate deterministic first frame
    drawStageFrame(cameraYaw);

    // Load self-hosted MIT Three.js module in-house to attach scene math metadata
    import('/vendor/three.module.js')
      .then((THREE) => {
        const vec = new THREE.Vector3(1, 0, 0);
        canvas.setAttribute('data-three-revision', String(THREE.REVISION || '175'));
        canvas.setAttribute('data-three-vec', `${vec.x},${vec.y},${vec.z}`);
      })
      .catch(() => {
        canvas.setAttribute('data-three-revision', 'in-house-fallback');
      });

    if (!reducedMotion) {
      const tick = () => {
        cameraYaw += 0.0018;
        drawStageFrame(cameraYaw);
        window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    }
  }

  // --------------------------------------------------------------------------
  // VIEW SWITCHING (OVERVIEW, YOUTUBE, LEADGEN, MARKETING)
  // --------------------------------------------------------------------------
  function switchDeskView(viewId) {
    document.querySelectorAll('.view-nav-btn').forEach((btn) => {
      const isMatch = btn.getAttribute('data-view') === viewId;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
    document.querySelectorAll('.desk-view').forEach((sec) => {
      const isMatch = sec.getAttribute('data-view-panel') === viewId;
      sec.classList.toggle('active', isMatch);
    });
  }

  document.querySelectorAll('.view-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const viewId = btn.getAttribute('data-view');
      if (viewId) switchDeskView(viewId);
    });
  });

  // --------------------------------------------------------------------------
  // BOTTOM DOCK SWITCHING (TERMINAL, FILES, GIT, BROWSER, PREVIEWS)
  // --------------------------------------------------------------------------
  function switchDockTab(dockId) {
    document.querySelectorAll('.dock-tab-btn').forEach((btn) => {
      const isMatch = btn.getAttribute('data-dock') === dockId;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
    ['terminal', 'files', 'git', 'browser', 'previews'].forEach((id) => {
      const pane = document.getElementById(`dock-pane-${id}`);
      if (pane) pane.classList.toggle('active', id === dockId);
    });
  }

  document.querySelectorAll('.dock-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dockId = btn.getAttribute('data-dock');
      if (dockId) switchDockTab(dockId);
    });
  });

  // --------------------------------------------------------------------------
  // DATA LOADERS FOR ALL 4 VIEWS + BOTTOM DOCK
  // --------------------------------------------------------------------------
  async function loadOverviewView() {
    try {
      const res = await apiFetch('/api/overview');
      const data = await res.json();
      const rendered = renderOverviewPanelMarkup(data);

      const portsTbody = document.getElementById('overview-ports-tbody');
      if (portsTbody) portsTbody.innerHTML = rendered.portsRowsHtml;

      const sidebarPorts = document.getElementById('sidebar-ports-list');
      if (sidebarPorts && rendered.sidebarPortsHtml) {
        sidebarPorts.innerHTML = rendered.sidebarPortsHtml;
      }

      const cronTbody = document.getElementById('overview-cron-tbody');
      if (cronTbody) cronTbody.innerHTML = rendered.cronRowsHtml;

      const queueTbody = document.getElementById('overview-queue-tbody');
      if (queueTbody) queueTbody.innerHTML = rendered.queueRowsHtml;

      const logBox = document.getElementById('overview-log-tail');
      if (logBox) logBox.innerHTML = rendered.logTailHtml;

      const skillsBox = document.getElementById('skills-step-list');
      if (skillsBox && rendered.skillsHtml) {
        skillsBox.innerHTML = rendered.skillsHtml;
      }
    } catch (err) {
      console.error('Overview load error:', err);
    }
  }

  async function loadYoutubeView() {
    try {
      const res = await apiFetch('/api/youtube/desk');
      const data = await res.json();
      const rendered = renderYoutubeDeskMarkup(data);

      const rail = document.getElementById('youtube-pipeline-rail');
      if (rail) rail.innerHTML = rendered.pipelineRailHtml;

      const tbody = document.getElementById('youtube-uploads-tbody');
      if (tbody) tbody.innerHTML = rendered.uploadsRowsHtml;

      const statUploads = document.getElementById('stage-stat-uploads');
      if (statUploads) statUploads.textContent = String(rendered.uploadCount);
    } catch (err) {
      console.error('YouTube desk load error:', err);
    }
  }

  function paintClayLeadGen() {
    const stageSelect = document.getElementById('clay-stage-filter');
    const sourceSelect = document.getElementById('clay-source-filter');
    const filters = {
      stage: stageSelect ? stageSelect.value : 'ALL',
      source: sourceSelect ? sourceSelect.value : 'ALL',
    };

    const rendered = renderClayLeadGenMarkup(cachedLeadsPayload, filters, selectedLeadId);
    const tbody = document.getElementById('clay-leads-tbody');
    if (tbody) tbody.innerHTML = rendered.tableRowsHtml;

    const countEl = document.getElementById('clay-count-summary');
    if (countEl) {
      countEl.textContent = `Showing ${rendered.filteredCount} of ${rendered.totalCount} leads · 0 scraped · 0 from YouTube`;
    }

    const banner = document.getElementById('sample-leads-banner');
    if (banner) {
      banner.style.display = rendered.hasSampleLeads ? 'flex' : 'none';
    }

    const statLeads = document.getElementById('stage-stat-leads');
    if (statLeads) statLeads.textContent = String(rendered.filteredCount);

    if (rendered.activeLead) {
      selectedLeadId = rendered.activeLead.id;
      const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setTxt('detail-company-name', rendered.activeLead.company);
      setTxt('detail-approval-badge', rendered.activeLead.approvalState);
      setTxt('detail-contact', rendered.activeLead.contact);
      setTxt('detail-source', rendered.activeLead.source);
      setTxt('detail-stage-owner', rendered.activeLead.stageOwner);
      setTxt('detail-last-touch', rendered.activeLead.lastTouch);
      setTxt('detail-next-step', rendered.activeLead.nextStep);
      setTxt('detail-signal', rendered.activeLead.signal);
      setTxt('detail-draft', rendered.activeLead.draft);
    }
  }

  async function loadClayLeadGenView() {
    try {
      const res = await apiFetch('/api/leads');
      cachedLeadsPayload = await res.json();
      paintClayLeadGen();
    } catch (err) {
      console.error('Clay leads load error:', err);
    }
  }

  document.getElementById('clay-stage-filter')?.addEventListener('change', paintClayLeadGen);
  document.getElementById('clay-source-filter')?.addEventListener('change', paintClayLeadGen);

  document.getElementById('clay-leads-tbody')?.addEventListener('click', (e) => {
    const row = e.target.closest?.('[data-lead-row]');
    if (row) {
      selectedLeadId = row.getAttribute('data-lead-row');
      paintClayLeadGen();
    }
  });

  document.getElementById('btn-approve-selected-lead')?.addEventListener('click', async () => {
    if (!selectedLeadId) return;
    const current = (cachedLeadsPayload.leads || []).find((l) => l.id === selectedLeadId);
    const nextState =
      current && current.approvalState === 'Approved by Josh' ? 'Awaiting Josh Approval' : 'Approved by Josh';
    try {
      await apiFetch('/api/leads/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedLeadId, approvalState: nextState }),
      });
      await loadClayLeadGenView();
    } catch (err) {
      console.error('Lead approval update error:', err);
    }
  });

  async function loadMarketingView() {
    try {
      const res = await apiFetch('/api/marketing/campaigns');
      const data = await res.json();
      const rendered = renderMarketingDeskMarkup(data);

      const tbody = document.getElementById('marketing-links-tbody');
      if (tbody) tbody.innerHTML = rendered.linksRowsHtml;

      const gallery = document.getElementById('marketing-qr-gallery');
      if (gallery) gallery.innerHTML = rendered.qrGalleryHtml;

      const statQrs = document.getElementById('stage-stat-qrs');
      if (statQrs) statQrs.textContent = String(rendered.campaignCount);
    } catch (err) {
      console.error('Marketing view load error:', err);
    }
  }

  async function loadBottomDock() {
    try {
      const res = await apiFetch('/api/dock/snapshot');
      const data = await res.json();
      const rendered = renderBottomDockMarkup(data);

      const setHtml = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      setHtml('dock-pane-terminal', rendered.terminalHtml);
      setHtml('dock-pane-files', rendered.filesHtml);
      setHtml('dock-pane-git', rendered.gitHtml);
      setHtml('dock-pane-browser', rendered.browserHtml);
      setHtml('dock-pane-previews', rendered.previewsHtml);
    } catch (err) {
      console.error('Bottom dock load error:', err);
    }
  }

  async function refreshAllDeskData() {
    await Promise.all([
      loadOverviewView(),
      loadYoutubeView(),
      loadClayLeadGenView(),
      loadMarketingView(),
      loadBottomDock(),
    ]);
  }

  document.getElementById('btn-refresh-desk')?.addEventListener('click', refreshAllDeskData);
  document.getElementById('btn-overview-probe')?.addEventListener('click', loadOverviewView);

  window.addEventListener('DOMContentLoaded', () => {
    initThreeHeaderStage();
    updateBearerPosturePill();

    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get('view');
    if (requestedView && ['overview', 'youtube', 'leadgen', 'marketing'].includes(requestedView)) {
      switchDeskView(requestedView);
    }
    const requestedDock = params.get('dock');
    if (requestedDock && ['terminal', 'files', 'git', 'browser', 'previews'].includes(requestedDock)) {
      switchDockTab(requestedDock);
    }

    refreshAllDeskData();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DREAM_SPACE_TOKENS,
    contrastRatio,
    verifyWcagAaaPalette,
    buildRuntimeAuthHeaders,
    renderOverviewPanelMarkup,
    renderYoutubeDeskMarkup,
    renderClayLeadGenMarkup,
    renderMarketingDeskMarkup,
    renderBottomDockMarkup,
  };
}
