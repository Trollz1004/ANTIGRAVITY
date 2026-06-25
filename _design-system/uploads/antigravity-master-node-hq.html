
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SABRETOOTH // Node Orchestrator</title>
  <style>
    :root {
      --bg: #030303;
      --surface: #0a0a0a;
      --surface-2: #121212;
      --surface-3: #1a1a1a;
      --line: #222;
      --line-strong: #333;
      --ink: #e0e0e0;
      --ink-2: #b0b0b0;
      --ink-3: #808080;
      --ink-4: #505050;
      --odoo: #714b67;
      --odoo-line: #8a5f82;
      --copper: #b87917;
      --copper-line: #d48a26;
      --green: #2dbd5f;
      --rose: #c14254;
      --sky: #2f7db9;
      --sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --mono: 'JetBrains Mono', 'Fira Code', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      background: var(--bg); color: var(--ink); 
      font-family: var(--sans); font-size: 13px; 
      height: 100vh; overflow: hidden;
      display: flex; flex-direction: column;
    }

    .doctrine {
      display: flex; justify-content: space-between; align-items: center; 
      padding: 6px 12px; background: #000; border-bottom: 1px solid var(--line);
      font: 700 9px/1 var(--mono); letter-spacing: 0.2em; text-transform: uppercase;
      color: var(--ink-3); z-index: 100;
    }
    .highlight { color: var(--rose); }

    .hdr {
      display: flex; align-items: center; justify-content: space-between; 
      padding: 10px 20px; background: var(--surface); border-bottom: 1px solid var(--line);
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-mark {
      width: 36px; height: 36px; background: linear-gradient(135deg, var(--odoo), #301a32);
      border-radius: 8px; display: grid; place-items: center;
      color: #fff; font: 800 12px/1 var(--mono);
    }
    .brand-text .h { font: 800 14px/1 var(--mono); letter-spacing: 0.05em; }
    .brand-text .s { font: 600 9px/1 var(--mono); color: var(--ink-3); text-transform: uppercase; }

    .ops-container { 
      display: grid; 
      grid-template-columns: 320px 1fr 320px; 
      flex: 1; 
      overflow: hidden;
    }

    .panel-rail { 
      background: var(--surface); 
      border-right: 1px solid var(--line); 
      border-left: 1px solid var(--line);
      display: flex; flex-direction: column;
      overflow-y: auto;
      padding: 16px;
      gap: 20px;
    }
    .panel { background: var(--surface-2); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
    .panel-head { 
      padding: 8px 12px; background: var(--surface-3); border-bottom: 1px solid var(--line);
      font: 700 10px/1 var(--mono); text-transform: uppercase; color: var(--ink-2);
    }
    .panel-body { padding: 12px; }

    /* THE GLASS PANE */
    .center-stage { 
      display: flex; flex-direction: column; 
      background: #000; position: relative;
    }
    .browser-nav {
      height: 45px; background: var(--surface-3); border-bottom: 1px solid var(--line);
      display: flex; align-items: center; padding: 0 15px; gap: 10px;
    }
    .browser-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--line); }
    .url-bar { 
      flex: 1; background: var(--bg); border: 1px solid var(--line); 
      border-radius: 4px; font: 600 11px/1 var(--mono); color: var(--green); 
      padding: 4px 12px; text-align: center;
    }
    .main-frame { 
      flex: 1; width: 100%; border: none; 
      background: #fff;
    }

    /* RDP Access Matrix */
    .rdp-card { 
      background: var(--surface-3); border: 1px solid var(--line-strong); 
      border-radius: 6px; padding: 10px; margin-bottom: 10px;
      border-left: 3px solid var(--copper);
    }
    .rdp-card .node-name { font: 800 11px/1 var(--mono); color: var(--copper); margin-bottom: 6px; display: block; }
    .rdp-card .cred-row { 
      display: flex; justify-content: space-between; 
      font: 600 10px/1 var(--mono); color: var(--ink-2); margin-bottom: 4px;
    }
    .rdp-card .copy-btn { 
      cursor: pointer; color: var(--sky); font-size: 9px; text-decoration: underline; 
    }

    /* DAO & Buckets */
    .dao-row { display: flex; justify-content: space-between; padding: 4px 0; font: 600 10px/1 var(--mono); }
    .bucket-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .bucket-bar { flex: 1; height: 4px; background: var(--line); border-radius: 2px; overflow: hidden; }
    .bucket-fill { height: 100%; background: var(--copper); }

    .footer {
      padding: 6px 20px; background: #000; border-top: 1px solid var(--line);
      display: flex; justify-content: space-between; align-items: center;
      font: 700 9px/1 var(--mono); color: var(--ink-3); text-transform: uppercase;
    }
  </style>
</head>
<body>

<div class="doctrine">
  <span class="highlight">SABRETOOTH NODE ORCHESTRATOR :: NO CLOSED DOORS</span>
  <span class="live-dot">T5500 (DATE) | 9020 (BIZ) | SABRE (MASTER)</span>
</div>

<div class="hdr">
  <div class="brand">
    <div class="brand-mark">AG</div>
    <div class="brand-text">
      <div class="h">SABRETOOTH COMMAND CENTER v4.2</div>
      <div class="s">Node Management $\rightarrow$ Production Live-View</div>
    </div>
  </div>
  <div class="status-cluster">
    <span class="pill active">MASTER NODE</span>
    <span class="pill copper">OPUS-SABRE</span>
    <button class="btn" onclick="location.reload()">⟳ Refresh</button>
  </div>
</div>

<div class="ops-container">
  <!-- LEFT RAIL: Hardware & Access -->
  <div class="panel-rail">
    <div class="panel">
      <div class="panel-head">RDP Access Matrix</div>
      <div class="panel-body">
        <!-- 9020 Node -->
        <div class="rdp-card">
          <span class="node-name">NODE: 9020 (BIZ/AI)</span>
          <div class="cred-row"><span>USER:</span> <span id="user-9020">i7k32gb1050ti\joshl</span></div>
          <div class="cred-row"><span>PASS:</span> <span id="pass-9020">!!11Gravity</span></div>
          <div class="copy-btn" onclick="copyText('user-9020')">Copy User</div>
        </div>
        <!-- T5500 Node -->
        <div class="rdp-card">
          <span class="node-name">NODE: T5500 (DATE)</span>
          <div class="cred- la-mono row" style="display:flex; justify-content:space-between; font:600 10px/1 var(--mono); color:var(--ink-2); margin-bottom:4px;">
            <span>USER:</span> <span id="user-t5500">desktop-h4b53gl\joshl</span>
          </div>
          <div class="cred-row"><span>PASS:</span> <span id="pass-t5500">!!11Gravity</span></div>
          <div class="copy-btn" onclick="copyText('user-t5500')">Copy User</div>
        </div>
      </div>
    </div>

    <div class="panel" style="border-color: var(--gold)">
      <div class="panel-head">10% Kids Reserve</div>
      <div class="panel-body" id="bucket-root"></div>
    </div>
    
    <div class="panel">
      <div class="panel-head">Node Topology</div>
      <div class="panel-body">
        <div class="row" style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:4px;">
          <span>SABRETOOTH</span><span style="color:var(--green)">MASTER DEV</span>
        </div>
        <div class="row" style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:4px;">
          <span>T5500</span><span style="color:var(--sky)">DATE APP</span>
        </div>
        <div class="row" style="display:flex; justify-content:space-between; font-size:10px;">
          <span>9020</span><span style="color:var(--copper)">BIZ / AI-STORE</span>
        </div>
      </div>
    </div>
  </div>

  <!-- CENTER STAGE: THE GLASS PANE (Paperclip HQ) -->
  <div class="center-stage">
    <div class="browser-nav">
      <div class="browser-dot"></div><div class="browser-dot"></div><div class="browser-dot"></div>
      <div class="url-bar">http://localhost:3100 (LIVE PAPERCLIP HQ)</div>
      <button class="btn" style="padding:2px 6px; font-size:8px" onclick="window.open('http://localhost:3100', '_blank')">↗ PopOut</button>
    </div>
    <iframe src="http://localhost:3100" class="main-frame"></iframe>
  </div>

  <!-- RIGHT RAIL: Hermes I/O & Memory -->
  <div class="panel-rail">
    <div class="panel" style="border-color: var(--copper)">
      <div class="panel-head">Hermes Chat Live-View</div>
      <div class="panel-body">
        <div class="browser-window" style="height:250px; border:1px solid var(--line); border-radius:6px; overflow:hidden; background:#000;">
          <iframe src="http://localhost:9119" style="width:100%; height:100%; border:none;"></iframe>
        </div>
        <p class="muted" style="font-size:9px; color:var(--ink-4); margin-top:8px; text-align:center;">Port 9119 :: No trust, just code.</p>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"> la-mono Intelligence</div>
      <div class="panel-body">
        <div id="memory-box" style="font-family:var(--mono); font-size:10px; color:var(--ink-2); background:var(--surface-3); padding:8px; border-radius:6px; min-height:100px;">
          Synthesizing NotebookLM Ground Truth...
        </div>
        <textarea id="mem-in" placeholder="Operator Override..." style="width:100%; margin-top:10px; height:60px;"></textarea>
        <button class="btn" style="width:100%; margin-top:8px;" onclick="saveMem()">COMMIT</button>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head">DAO Staking</div>
      <div class="panel-body" id="dao-root"></div>
    </div>
  </div>
</div>

<div class="footer">
  <span class="highlight">#UntilNoKidInNeed · Base L2 · Soulbound</span>
  <span style="font-family:var(--mono)">SABRETOOTH-NODE-v4.2 :: <span id="clock">00:00:00</span></span>
</div>

<script>
  const DAO = [
    { s: '$LOVE', v: '2.5M', c: '#ff6eb4' }, { s: '$UKID', v: '2.5M', c: '#66b3ff' },
    { s: '$GREEN', v: '2.5M', c: '#8ff2c7' }, { s: '$AGRAV', v: '2.5M', c: '#ffd9 de la-mono' }
  ];
  const BUCKETS = [
    { n: 'Platform Subs', p: 40 }, { n: 'Super Likes', p: 20 },
    { n: 'LOVE Yield', p: 80 }, { n: 'AI-Solutions', p: 60 },
    { n: 'UKID Yield', p: 30 }, { n: 'Recycle', p: 10 },
    { n: 'GREEN Yield', p: 50 }, { n: 'Merch Net', p: 90 },
    { n: 'AGRAV Infra', p: 70 }, { n: 'AGRAV Yield', p: 40 }
  ];

  function copyText(id) {
    const text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text);
    alert('Copied: ' + text);
  }

  function init() {
    const dRoot = document.getElementById('dao-root');
    dRoot.innerHTML = DAO.map(x => `<div class="dao-row"><span>${x.s}</span><span style="color:${x.c}">${x.v}</span></div>`).join('');
    
    const bRoot = document.getElementById('bucket-root');
    bRoot.innerHTML = BUCKETS.map(x => `
      <div class="bucket-row">
        <span style="font-size:9px; width:80px; overflow:hidden; white-space:nowrap">${x.n}</span>
        <div class="bucket-bar"><div class="bucket-fill" style="width:${x.p}%"></div></div>
        <span style="font-size:9px; width:30px; text-align:right">${x.p}%</span>
      </div>
    `).join('');
  }

  function saveMem() {
    const val = document.getElementById('mem-in').value;
    document.getElementById('memory-box').textContent = val || 'SABRETOOTH Memory Clear...';
    localStorage.setItem('ag_final_mem_v4', val);
  }

  setInterval(() => {
    document.getElementById('clock').textContent = new Date().toLocaleTimeString('en-GB');
  }, 1000);

  window.onload = () => {
    init();
    const m = localStorage.getItem('ag_final_mem_v4');
    if(m) document.getElementById('memory-box').textContent = m;
  };
</script>
</body>
</html>
