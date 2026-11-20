(function () {
  const headerEl = document.querySelector('.site-header');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const overviewEl = document.getElementById('overview');
  const stageCanvas = document.getElementById('onlinerecycle-stage-canvas');
  const markCanvas = document.getElementById('onlinerecycle-header-mark');
  const lineCanvas = document.getElementById('onlinerecycle-header-line');

  if (mobileMenuBtn && headerEl) {
    mobileMenuBtn.addEventListener('click', function () {
      const isOpen = headerEl.classList.toggle('menu-open');
      mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion && stageCanvas) {
    stageCanvas.setAttribute('data-stage-mode', 'reduced-motion');
  }

  function rotate3D(x, y, z, rx, ry, rz) {
    const cosX = Math.cos(rx), sinX = Math.sin(rx);
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    const x2 = x * cosY + z1 * sinY;
    const z2 = -x * sinY + z1 * cosY;
    const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
    const x3 = x2 * cosZ - y1 * sinZ;
    const y3 = x2 * sinZ + y1 * cosZ;
    return { x: x3, y: y3, z: z2 };
  }

  const phi = (1 + Math.sqrt(5)) / 2;
  const rawVerts = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ];
  const coreVerts = rawVerts.map(function (v) {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return { x: (v[0] / len) * 2.1, y: (v[1] / len) * 2.1, z: (v[2] / len) * 2.1 };
  });
  const coreEdges = [];
  for (let i = 0; i < coreVerts.length; i++) {
    for (let j = i + 1; j < coreVerts.length; j++) {
      const dx = coreVerts[i].x - coreVerts[j].x;
      const dy = coreVerts[i].y - coreVerts[j].y;
      const dz = coreVerts[i].z - coreVerts[j].z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 2.45) coreEdges.push([i, j]);
    }
  }

  const stars = [];
  let seed = 73109;
  function nextRand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: nextRand(),
      y: nextRand(),
      r: 0.8 + nextRand() * 1.3,
      signal: i % 8 === 0
    });
  }

  let hdrHeightCss = 64;
  let coldCardTopCss = 420;

  function syncSizes() {
    const vw = Math.max(window.innerWidth, 1);
    const vh = Math.max(window.innerHeight, 1);
    if (stageCanvas) {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      stageCanvas.width = Math.max(Math.floor(vw * dpr), 1);
      stageCanvas.height = Math.max(Math.floor(vh * dpr), 1);
    }
    if (lineCanvas) {
      lineCanvas.width = Math.max(vw, 320);
      lineCanvas.height = 4;
    }
    hdrHeightCss = headerEl ? headerEl.offsetHeight : 64;
    coldCardTopCss = vw <= 760 ? Math.round(vh * 0.36) : Math.round(vh * 0.42);
    if (overviewEl) {
      overviewEl.style.paddingTop = Math.max(coldCardTopCss - hdrHeightCss, 140) + 'px';
    }
  }
  syncSizes();

  const mountMs = performance.now();

  function renderAll(nowMs) {
    const t = prefersReducedMotion ? 2.4 : (nowMs - mountMs) / 1000;
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const scrollRatio = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);

    if (stageCanvas) {
      const ctx = stageCanvas.getContext('2d');
      if (ctx) {
        const w = stageCanvas.width;
        const h = stageCanvas.height;
        const dpr = Math.max(w / Math.max(window.innerWidth, 1), 1);
        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          const sx = ((s.x * w + t * (s.signal ? 14 : 5)) % w + w) % w;
          const sy = (s.y * h) % h;
          ctx.fillStyle = s.signal ? '#FFD21E' : '#3A3F45';
          ctx.beginPath();
          ctx.arc(sx, sy, s.r * dpr, 0, Math.PI * 2);
          ctx.fill();
        }

        const stageMidCss = (hdrHeightCss + coldCardTopCss) * 0.52;
        const stageBandCss = Math.max(coldCardTopCss - hdrHeightCss, 160);
        const cx = w * 0.5;
        const cy = stageMidCss * dpr;
        const baseScale = Math.min((stageBandCss * dpr * 0.36) / 2.4, (w * 0.38) / 3.5);

        function project(pt) {
          const fov = 7.5;
          const perspective = fov / Math.max(fov - pt.z, 1.8);
          return {
            x: cx + pt.x * baseScale * perspective,
            y: cy + pt.y * baseScale * perspective,
            s: perspective
          };
        }

        const coreHullRadius = baseScale * 1.95;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, coreHullRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(18, 21, 26, 0.78)';
        ctx.fill();
        ctx.lineWidth = 1.8 * dpr;
        ctx.strokeStyle = '#3A3F45';
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = '#F4F1EA';
        ctx.lineWidth = 2.0 * dpr;
        ctx.beginPath();
        for (let i = 0; i <= 72; i++) {
          const a = (i / 72) * Math.PI * 2;
          const p3 = rotate3D(Math.cos(a) * 3.1, Math.sin(a) * 3.1, 0, 1.02, t * 0.32 + scrollRatio, 0.12);
          const p2 = project(p3);
          if (i === 0) ctx.moveTo(p2.x, p2.y);
          else ctx.lineTo(p2.x, p2.y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#FFD21E';
        ctx.lineWidth = 2.8 * dpr;
        ctx.beginPath();
        for (let i = 0; i <= 72; i++) {
          const a = (i / 72) * Math.PI * 2;
          const p3 = rotate3D(Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0, -0.82, -t * 0.48 - scrollRatio, 0.25);
          const p2 = project(p3);
          if (i === 0) ctx.moveTo(p2.x, p2.y);
          else ctx.lineTo(p2.x, p2.y);
        }
        ctx.stroke();

        const projectedVerts = coreVerts.map(function (v) {
          const r3 = rotate3D(v.x, v.y, v.z, t * 0.36 + 0.48, t * 0.52 - 0.24, 0.1);
          const p2 = project(r3);
          return { x: p2.x, y: p2.y, s: p2.s, z: r3.z };
        });

        for (let i = 0; i < coreEdges.length; i++) {
          const e = coreEdges[i];
          const a = projectedVerts[e[0]];
          const b = projectedVerts[e[1]];
          const frontEdge = (a.z + b.z) * 0.5 >= 0;
          ctx.strokeStyle = frontEdge ? '#FFD21E' : '#F4F1EA';
          ctx.lineWidth = (frontEdge ? 2.1 : 1.3) * dpr;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        ctx.fillStyle = '#FFD21E';
        ctx.beginPath();
        ctx.arc(cx, cy, 4.0 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (markCanvas) {
      const mctx = markCanvas.getContext('2d');
      if (mctx) {
        mctx.clearRect(0, 0, 32, 32);
        mctx.strokeStyle = '#F4F1EA';
        mctx.lineWidth = 1.6;
        mctx.beginPath();
        for (let i = 0; i <= 36; i++) {
          const a = (i / 36) * Math.PI * 2;
          const p = rotate3D(Math.cos(a) * 12, Math.sin(a) * 12, 0, 0.65, t * 0.75, 0.25);
          if (i === 0) mctx.moveTo(16 + p.x, 16 + p.y);
          else mctx.lineTo(16 + p.x, 16 + p.y);
        }
        mctx.stroke();

        mctx.strokeStyle = '#FFD21E';
        mctx.lineWidth = 2.0;
        mctx.beginPath();
        for (let i = 0; i <= 36; i++) {
          const a = (i / 36) * Math.PI * 2;
          const p = rotate3D(Math.cos(a) * 9, Math.sin(a) * 9, 0, -0.58, -t * 0.95, -0.2);
          if (i === 0) mctx.moveTo(16 + p.x, 16 + p.y);
          else mctx.lineTo(16 + p.x, 16 + p.y);
        }
        mctx.stroke();

        mctx.fillStyle = '#FFD21E';
        mctx.beginPath();
        mctx.arc(16, 16, 2.5, 0, Math.PI * 2);
        mctx.fill();
      }
    }

    if (lineCanvas) {
      const lctx = lineCanvas.getContext('2d');
      if (lctx) {
        const lw = lineCanvas.width;
        const lh = lineCanvas.height;
        lctx.fillStyle = '#3A3F45';
        lctx.fillRect(0, 0, lw, lh);
        const ratio = Math.min(Math.max(0.2 + scrollRatio * 0.8, 0.2), 1);
        lctx.fillStyle = '#FFD21E';
        lctx.fillRect(0, 0, Math.round(lw * ratio), lh);
      }
    }
  }

  renderAll(performance.now());
  if (!prefersReducedMotion) {
    function tick(nowMs) {
      if (!document.hidden) renderAll(nowMs);
      window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }
  window.addEventListener('resize', function () {
    syncSizes();
    renderAll(performance.now());
  });
})();
