/* Local Mission Control. API content is always rendered as text, never markup. */
(() => {
  'use strict';
  const routes = [
    ['overview','Overview','Mission status','/api/mos-state.json'],
    ['jarvis','JARVIS','Command console','/api/bridges'],
    ['agents','Agents','Agent bridges','/api/bridges'],
    ['board','Board','Work & journals'], ['gateway','Gateway','Routing & connectivity','/api/mos-state.json'],
    ['marketing','Marketing','Marketing workspace'], ['memory','Memory','Knowledge stores'],
    ['node','Node','Local hardware'], ['logs','Logs','Operational events'], ['support','Support','Support inbox'],
    ['hermes','Hermes','Agent workspace'], ['settings','Settings','Configuration & access'],
    ['chrome','Chrome Browser','Managed browser','/api/ops/browser'],
    ['lightx2v','LightX2V Studio','Video generation','/api/ops/video'],
    ['comfyui','ComfyUI','Workflow studio','/api/ops/video'], ['youtube','YouTube Studio','Publishing workspace'],
    ['ecosystem','Ecosystem','Connected applications']
  ].map(([id,label,subtitle,endpoint]) => ({id,label,subtitle,endpoint:endpoint || `/api/ops/${id}`}));
  function safeURL(value) {
    try {
      const url = new URL(value);
      if (!['http:','https:'].includes(url.protocol) || url.username || url.password) return null;
      if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname)) return null;
      return url.href;
    } catch { return null; }
  }
  function sanitize(value, key = '') {
    if (/token|password|secret|authorization|api.?key|credential/i.test(key)) return '[redacted]';
    if (Array.isArray(value)) return value.map(v => sanitize(v));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,sanitize(v,k)]));
    if (typeof value === 'string') return value.replace(/\b(?:sk-|gsk_|AIzaSy)[\w.-]+/g,'[redacted]').replace(/Bearer\s+\S+/gi,'Bearer [redacted]');
    return value;
  }
  globalThis.OpsDashboard = { routes, safeURL, sanitize };
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
  const title = key => key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[_-]/g,' ').replace(/^./,c => c.toUpperCase());
  let generation = 0, active, busy = false;
  const history = [], drafts = {prompt:'', brain:'hermes', url:''};
  async function request(path, body, timeout = 30000) {
    const response = await fetch(path, {method:body ? 'POST':'GET', cache:'no-store', headers:body ? {'Content-Type':'application/json'} : {}, body:body ? JSON.stringify(body):undefined, signal:AbortSignal.timeout(timeout)});
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${path}`);
    if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected JSON; the service returned another page.');
    const data = sanitize(await response.json());
    if (data === null || typeof data !== 'object') throw new Error('The source returned no structured data.');
    return data;
  }
  function detail(value) {
    const d = el('details'); d.append(el('summary','Inspect source fields'),el('pre',JSON.stringify(value,null,2))); return d;
  }
  function fields(obj) {
    const list = el('dl',undefined,'fields');
    for (const [key,value] of Object.entries(obj)) {
      list.append(el('dt',title(key)));
      const dd = el('dd');
      if (value && typeof value === 'object') dd.append(detail(value));
      else dd.textContent = value === null ? 'Not reported' : String(value);
      list.append(dd);
    }
    return list;
  }
  function table(items) {
    if (!items.length) return el('p','No records returned by this source.','muted');
    if (!items.every(i => i && typeof i === 'object' && !Array.isArray(i))) return el('pre',items.map(i => typeof i === 'object' ? JSON.stringify(i) : String(i)).join('\n'));
    const keys = [...new Set(items.flatMap(i => Object.keys(i)))];
    const priority = ['name','title','id','status','detail','summary','message','updated','generated'];
    keys.sort((a,b) => (priority.indexOf(a) < 0 ? 99:priority.indexOf(a)) - (priority.indexOf(b) < 0 ? 99:priority.indexOf(b)));
    const visible = keys.slice(0,6), wrap=el('div',undefined,'table-wrap'), t=el('table'), head=el('thead'), row=el('tr');
    visible.forEach(k => { const th=el('th',title(k)); th.scope='col'; row.append(th); });
    if (keys.length>6) row.append(el('th','More'));
    head.append(row); t.append(head); const body=el('tbody');
    for (const item of items) { const r=el('tr'); for(const key of visible) { const cell=el('td'); const v=item[key]; if(v && typeof v==='object')cell.append(detail(v)); else cell.textContent=v === undefined || v === null ? '—' : String(v); r.append(cell); } if(keys.length>6){const cell=el('td');cell.append(detail(item));r.append(cell);} body.append(r); }
    t.append(body); wrap.append(t); return wrap;
  }
  function panel(name, data) { const p=el('section',undefined,'panel');p.append(el('h2',name)); p.append(Array.isArray(data) ? table(data):data && typeof data==='object' ? fields(data):el('p',String(data))); return p; }
  function renderData(data, route) {
    const target=$('data');target.replaceChildren();
    if(data.ok===false) target.append(el('div',data.error || data.detail || 'This capability is unavailable.','notice'));
    if(route.id==='overview')target.append(el('div','Local snapshot · Review each source’s timestamp and verification level before acting.','notice'));
    if(['marketing','youtube'].includes(route.id)) target.append(el('div','Approval gate · Publishing is not authorized from this workspace. Review drafts in the source application.','notice'));
    if(['lightx2v','comfyui'].includes(route.id) && Array.isArray(data.services)) {
      const p=el('section',undefined,'panel');p.append(el('h2','Studio availability'));
      const services=data.services.filter(s => route.id==='comfyui' ? /comfy/i.test(`${s.id} ${s.name}`) : /light|ltx/i.test(`${s.id} ${s.name}`));
      if(!services.length)p.append(el('p','No matching studio was reported. Availability is unverified.','muted'));
      for(const s of services){const row=el('div',undefined,'studio'),info=el('div');info.append(el('h3',s.name || s.id),el('p',s.status || 'UNVERIFIED','badge'),el('p',s.detail || 'No identity evidence reported.','muted'));row.append(info);const url=safeURL(s.url);if(url){const a=el('a','Open studio ↗','launch');a.href=url;a.target='_blank';a.rel='noopener noreferrer';row.append(a);}p.append(row);}target.append(p);
    }
    const scalar={}, nested=[];
    for(const [key,value] of Object.entries(data)){if(value && typeof value==='object')nested.push([key,value]);else scalar[key]=value;}
    if(Object.keys(scalar).length)target.append(panel('Source report',scalar));
    nested.forEach(([key,value])=>target.append(panel(title(key),value)));
    if(!Object.keys(data).length)target.append(el('div','The endpoint returned an empty object; no data is available.','empty'));
  }
  function transcript() { const out=$('transcript'); if(!out)return;out.replaceChildren();for(const msg of history){const item=el('div',undefined,'message');item.append(el('small',msg.role),el('div',msg.text,msg.error ? 'error':''));out.append(item);} }
  function jarvis() {
    const p=el('section',undefined,'panel');p.append(el('h2','Talk to JARVIS'),el('p','Send a real request to your selected bridge. No conversation is preloaded. Requests may execute tools; publishing still requires explicit approval.','muted'));
    const form=el('form'),label=el('label','Brain');label.htmlFor='brain'; const select=el('select');select.id='brain';
    ['hermes','gemini','claude','codex','grok','fable'].forEach(id=>{const opt=el('option',title(id));opt.value=id;select.append(opt);});select.value=drafts.brain;select.onchange=()=>drafts.brain=select.value;
    const promptLabel=el('label','Your request');promptLabel.htmlFor='prompt';promptLabel.style.marginTop='16px';const input=el('textarea');input.id='prompt';input.required=true;input.maxLength=16000;input.placeholder='Ask a question or give a specific instruction…';input.value=drafts.prompt;input.oninput=()=>drafts.prompt=input.value;
    const foot=el('div',undefined,'form-footer'),status=el('span',busy?'Request in progress…':'Bridge availability is reported below.','muted');status.id='dispatch-status';status.setAttribute('role','status');const submit=el('button',busy?'Sending…':'Send request','primary');submit.type='submit';submit.id='send';submit.disabled=busy;foot.append(status,submit);form.append(label,select,promptLabel,input,foot);
    const log=el('div',undefined,'transcript');log.id='transcript';log.setAttribute('role','log');log.setAttribute('aria-live','polite');p.append(form,log);$('actions').append(p);transcript();
    form.onsubmit=async event=>{event.preventDefault();const prompt=input.value.trim();if(!prompt || busy)return;const brain=select.value;busy=true;submit.disabled=true;submit.textContent='Sending…';status.textContent='Waiting for the bridge. Do not resend while this request is running.';history.push({role:'YOU → '+title(brain),text:prompt});transcript();try{const data=await request('/api/jarvis/dispatch',{brain,prompt},180000);if(data.ok!==true)throw new Error(data.error || 'Bridge did not confirm success.');history.push({role:'JARVIS / '+title(brain),text:typeof data.output==='string' ? data.output : 'The bridge returned no response text.'});drafts.prompt='';if($('prompt'))$('prompt').value='';}catch(error){history.push({role:'REQUEST FAILED / '+title(brain),text:error.message+' A timeout does not prove execution stopped; check the bridge before retrying.',error:true});}finally{busy=false;if($('send')){$('send').disabled=false;$('send').textContent='Send request';$('dispatch-status').textContent='Request finished. See the result below.';}transcript();}};
  }
  function browserActions() {
    const p=el('section',undefined,'panel');p.append(el('h2','Managed Chrome'),el('p','Open a URL through the local managed-browser API. This is a tab controller, not an embedded copy of Chrome. Existing managed tabs are listed below.','muted'));
    const form=el('form',undefined,'form-row'),group=el('div',undefined,'grow'),label=el('label','URL to open');label.htmlFor='browser-url';const input=el('input');input.id='browser-url';input.type='url';input.required=true;input.placeholder='https://example.com';input.value=drafts.url;input.oninput=()=>drafts.url=input.value;group.append(label,input);const button=el('button','Open managed tab','primary');button.type='submit';const feedback=el('p','','muted');feedback.setAttribute('role','status');form.append(group,button);p.append(form,feedback);$('actions').append(p);
    form.onsubmit=async event=>{event.preventDefault();const url=safeURL(input.value);if(!url){feedback.textContent='Use an HTTP(S) URL without credentials. Other private network nodes are not allowed.';return;}button.disabled=true;feedback.textContent='Requesting a managed tab…';try{const result=await request('/api/ops/browser/open',{url});if(result.ok!==true)throw new Error(result.error || 'Browser did not confirm the request.');feedback.textContent='Open request accepted. Refreshing the actual tab list below.';await refresh();}catch(error){feedback.textContent='Unavailable: '+error.message;}finally{button.disabled=false;}};
  }
  async function refresh() {
    const seq=++generation,route=active;if(!route)return;$('refresh').disabled=true;$('data').setAttribute('aria-busy','true');$('fetch-status').textContent='Reading source…';$('data').replaceChildren(el('div','Loading source data…','empty'));
    try {const data=await request(route.endpoint);if(seq!==generation)return;renderData(data,route);$('fetch-status').textContent=(data.ok===false ? 'Source reports unavailable':'Received')+' · '+new Date().toLocaleTimeString();}
    catch(error){if(seq!==generation)return;$('data').replaceChildren(el('div','Unavailable · '+error.message+' Use Refresh to retry.','notice'));$('fetch-status').textContent='Source unavailable — no fallback data shown';}
    finally{if(seq===generation){$('refresh').disabled=false;$('data').setAttribute('aria-busy','false');}}
  }
  function navigate() {const id=location.hash.slice(1)||'overview';active=routes.find(r=>r.id===id)||routes[0];$('page-title').textContent=active.label;$('breadcrumb').textContent=active.label;$('subtitle').textContent=active.subtitle;$('source').textContent=active.endpoint;document.title=active.label+' · Mission Control';document.querySelectorAll('#navigation a').forEach(a=>{if(a.hash==='#'+active.id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});$('actions').replaceChildren();if(active.id==='jarvis')jarvis();if(active.id==='chrome')browserActions();refresh();}
  routes.forEach((route,index)=>{if([0,6,12].includes(index))$('navigation').append(el('div',index===0?'Command':index===6?'Operations':'Studio & applications','nav-group'));const a=el('a');a.href='#'+route.id;a.append(el('span',String(index+1).padStart(2,'0'),'index'),el('span',route.label));$('navigation').append(a);});
  $('refresh').onclick=refresh;window.addEventListener('hashchange',navigate);navigate();
})();
