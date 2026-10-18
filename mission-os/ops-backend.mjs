// Local operational reads. No shell execution, arbitrary file reads, or personal browser attachment.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFile, spawn} from 'node:child_process';

export function guardRequest(req, port) {
  const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
  if (!hosts.includes(req.headers.host)) return 403;
  if (req.headers['sec-fetch-site'] === 'cross-site') return 403;
  const origin = req.headers.origin;
  if (origin && origin !== `http://${req.headers.host}`) return 403;
  if (!['GET','HEAD'].includes(req.method)) {
    if (origin !== `http://${req.headers.host}`) return 403;
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return 415;
  }
  return 0;
}
export function browserURL(value) {
  if (typeof value !== 'string' || value.length > 4096 || /[\x00-\x20]/.test(value)) throw new Error('A valid HTTP(S) URL is required');
  const u = new URL(value);
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) throw new Error('Only HTTP(S) without credentials is allowed');
  return u.href;
}
export function envelope(source, data = {}) {
  return {ok:true, generated:new Date().toISOString(), source, items:[], ...data};
}
function metadata(file, root) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) return null;
  return {name:path.relative(root,file).replaceAll('\\','/'), bytes:stat.size, modified:stat.mtime.toISOString(), status:'ON DISK', detail:`${stat.size} bytes · modified ${stat.mtime.toISOString()}`};
}
function filesIn(root, relative, depth=2, limit=250) {
  const items=[];
  function visit(dir, d) {
    try { for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
      if (items.length >= limit) return;
      if (e.isSymbolicLink() || /(?:^\.|credential|secret|token|auth|cookie|session)/i.test(e.name)) continue;
      const file=path.join(dir,e.name);
      if (e.isDirectory() && d>0) visit(file,d-1);
      else if (e.isFile() && /\.(md|txt|log|json|mp4|webm|wav|png)$/i.test(e.name)) {
        const m=metadata(file,root); if(m) items.push(m);
      }
    }} catch {}
  }
  visit(path.join(root,relative),depth);
  return items.sort((a,b)=>b.modified.localeCompare(a.modified));
}
function safeText(text) {
  return String(text).split(/\r?\n/).filter(line=>!/(?:api.?key|token|password|secret|authorization|bearer|cookie|BEGIN .*PRIVATE KEY|sk-[A-Za-z0-9]|gh[pousr]_[A-Za-z0-9])/i.test(line)).join('\n').replace(/https?:\/\/[^\s<>]+/g, raw=>{
    try { const u=new URL(raw); u.username=''; u.password=''; u.search=''; u.hash=''; return u.href; } catch {return '[URL withheld]';}
  });
}
function readSmall(file,max=65536) {
  const st=fs.lstatSync(file);
  if (!st.isFile() || st.isSymbolicLink() || st.size>max) throw new Error('Source unavailable or too large');
  return fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');
}
function journal(root) {
  const base=path.join(root,'.agents/journals'); const items=[];
  try {for(const e of fs.readdirSync(base,{withFileTypes:true})) {
    if (!e.isDirectory() || e.isSymbolicLink()) continue;
    const file=path.join(base,e.name,'STATE.md');
    try {const m=metadata(file,root);if(m) items.push({...m,name:e.name,status:'RECORDED / NOT LIVE',detail:m.detail,source:m.name});}catch{}
  }}catch{}
  return items;
}
function run(bin,args) {
  return new Promise(resolve=>execFile(bin,args,{timeout:6000,maxBuffer:128*1024,windowsHide:true,shell:false},(error,stdout)=>resolve({ok:!error,output:error?'':stdout.trim()})));
}
async function hardware() {
  const cpu0=os.cpus(); await new Promise(r=>setTimeout(r,120)); const cpu1=os.cpus();
  let idle=0,total=0;
  cpu1.forEach((c,i)=>{for(const k of Object.keys(c.times)){const delta=c.times[k]-(cpu0[i]?.times[k]||0);total+=delta;if(k==='idle')idle+=delta;}});
  const gpu=await run('nvidia-smi',['--query-gpu=name,memory.total,memory.used,utilization.gpu,temperature.gpu','--format=csv,noheader,nounits']);
  const gpus=gpu.ok?gpu.output.split(/\r?\n/).filter(Boolean).map(line=>{
    const [name,total,used,util,temp]=line.split(',').map(x=>x.trim());
    const num=x=>Number.isFinite(Number(x))?Number(x):null;
    return {name,memoryTotalMiB:num(total),memoryUsedMiB:num(used),utilizationPercent:num(util),temperatureC:num(temp)};
  }):[];
  const memory={totalBytes:os.totalmem(),freeBytes:os.freemem()};
  return envelope('node:os and nvidia-smi', {host:os.hostname(),platform:os.platform(),uptimeSeconds:os.uptime(),cpu:{model:cpu1[0]?.model,logicalCores:cpu1.length,utilizationPercent:total?100*(1-idle/total):null},memory,gpus,gpuStatus:gpu.ok?'MEASURED':'UNAVAILABLE',items:[{name:os.hostname(),status:'MEASURED',detail:`${cpu1.length} logical CPUs; ${memory.freeBytes} bytes RAM free`},...gpus.map(g=>({name:g.name,status:'MEASURED',detail:`${g.memoryUsedMiB}/${g.memoryTotalMiB} MiB VRAM; ${g.utilizationPercent}% GPU; ${g.temperatureC} C`}))]});
}
async function jsonProbe(url, identify) {
  try {const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(2500)});
    if(r.status===401||r.status===403)return {status:'AUTH REQUIRED',detail:`HTTP ${r.status}`,ok:false};
    if(!r.ok)return {status:'DOWN',detail:`HTTP ${r.status}`,ok:false};
    const data=await r.json();
    return identify(data)?{status:'UP',detail:'Expected API identity response verified',ok:true}:{status:'WRONG SERVICE',detail:'API identity did not match',ok:false};
  }catch{return {status:'UNAVAILABLE',detail:'No valid identity response at configured local endpoint',ok:false};}
}
async function video() {
  const services=await Promise.all([
    {id:'comfyui',name:'ComfyUI',url:'http://127.0.0.1:8188',probe:'/system_stats',identify:j=>Boolean(j.system&&Array.isArray(j.devices))},
    {id:'lightx2v',name:'LightX2V',url:'http://127.0.0.1:8001',probe:'/openapi.json',identify:j=>/lightx2v/i.test(j.info?.title||'')},
  ].map(async ({probe,identify,...s})=>({...s,...await jsonProbe(s.url+probe,identify)})));
  return envelope('Local ComfyUI /system_stats and LightX2V /openapi.json identity probes',{ok:services.some(s=>s.ok),services,items:services,detail:'Health only. No video generation or model readiness claimed. LightX2V endpoint defaults to port 8001.'});
}
const chromeCandidates=[`${process.env.PROGRAMFILES || 'C:/Program Files'}/Google/Chrome/Application/chrome.exe`,`${process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)'}/Google/Chrome/Application/chrome.exe`,path.join(os.homedir(),'AppData/Local/Google/Chrome/Application/chrome.exe')];
const chromeProfile=path.join(os.homedir(),'AppData/Local/mission-os/chrome-isolated');
let chromeChild=null, chromeEndpoint=null, chromeStarting=null;
async function chromeStart() {
  if(chromeEndpoint && chromeChild && chromeChild.exitCode===null)return;
  if(chromeStarting)return chromeStarting;
  chromeStarting=(async()=>{
    const binary=chromeCandidates.find(p=>fs.existsSync(p)); if(!binary)throw new Error('Google Chrome not installed in a supported location');
    fs.mkdirSync(chromeProfile,{recursive:true});
    // Never attach an old or personal debugging endpoint. A running old isolated profile must be closed first.
    const active=path.join(chromeProfile,'DevToolsActivePort');
    if(fs.existsSync(active))throw new Error('Isolated Chrome profile already has a debugging marker. Close its Chrome instance before retrying; no existing browser was attached.');
    chromeChild=spawn(binary,[`--user-data-dir=${chromeProfile}`,'--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--no-first-run','--no-default-browser-check','about:blank'],{shell:false,stdio:'ignore',windowsHide:false});
    let launchError=null;chromeChild.on('error',e=>{launchError=e;});
    chromeChild.on('exit',()=>{chromeEndpoint=null;});
    for(let i=0;i<40;i++){
      if(launchError)throw new Error('Chrome could not start');
      if(fs.existsSync(active)){
        const [p,browserPath]=fs.readFileSync(active,'utf8').trim().split(/\r?\n/);
        if(!/^\d+$/.test(p)||!browserPath?.startsWith('/devtools/browser/'))throw new Error('Invalid isolated Chrome endpoint');
        const endpoint=`http://127.0.0.1:${Number(p)}`;
        const response=await fetch(endpoint+'/json/version',{signal:AbortSignal.timeout(2000)});const v=await response.json();
        if(!v.webSocketDebuggerUrl?.endsWith(browserPath)||!/Chrome\//.test(v.Browser||''))throw new Error('Chrome identity mismatch');
        chromeEndpoint=endpoint;return;
      }
      await new Promise(r=>setTimeout(r,200));
    }
    throw new Error('Isolated Chrome did not provide a debugging endpoint');
  })();
  try {await chromeStarting;} finally {chromeStarting=null;}
}
async function browser() {
  if(!chromeEndpoint)return envelope('Mission Control isolated Chrome profile only',{ok:false,status:'NOT STARTED',tabs:[],items:[],installed:chromeCandidates.some(p=>fs.existsSync(p)),detail:'Open a URL to start isolated Chrome. Personal profiles are never read.'});
  try {
    const r=await fetch(chromeEndpoint+'/json/list',{signal:AbortSignal.timeout(2000)});const all=await r.json();
    const tabs=all.filter(t=>t.type==='page' && /^https?:/.test(t.url)).map(({id,title,url})=>({id,title:safeText(title),url:safeText(url)}));
    return envelope('Mission Control isolated Chrome /json/list',{tabs,status:'CONNECTED',items:tabs.map(t=>({...t,name:t.title,status:'OPEN',detail:t.url}))});
  }catch{return envelope('Mission Control isolated Chrome profile only',{ok:false,status:'UNAVAILABLE',tabs:[],items:[],detail:'Isolated debugging connection unavailable'});}
}
export async function openBrowser(value) {
  let url;try{url=browserURL(value);}catch(e){return envelope('URL validation',{ok:false,error:e.message});}
  try {
    await chromeStart();
    const r=await fetch(chromeEndpoint+'/json/new?'+encodeURIComponent(url),{method:'PUT',signal:AbortSignal.timeout(5000)});
    if(!r.ok)throw new Error('Chrome refused tab creation');
    const target=await r.json();
    const result=await browser();
    const verified=result.tabs.some(t=>t.id===target.id);
    return {...result,ok:verified,openedId:target.id,...(!verified?{error:'Tab creation not confirmed by read-back'}:{})};
  }catch(e){return envelope('Mission Control isolated Chrome',{ok:false,tabs:[],error:e.message});}
}
export async function readOps(view,{root,state,bridges}) {
  if(view==='node')return hardware();
  if(view==='browser')return browser();
  if(view==='video')return video();
  if(view==='board') {
    const journals=journal(root);let tasks=[],boardStatus='NOT FOUND';
    try {const j=JSON.parse(readSmall(path.join(root,'mission-os/wheel-state.json'),1048576));tasks=(Array.isArray(j.tasks)?j.tasks:[]).map(t=>({id:String(t.id||''),name:safeText(t.title||''),status:safeText(t.status||'RECORDED'),detail:safeText(t.assignee||''),verified:false}));boardStatus='RECORDED / NOT VERIFIED';}catch{}
    return envelope('.agents/journals/*/STATE.md and mission-os/wheel-state.json',{ok:journals.length>0||tasks.length>0,items:[...tasks,...journals],tasks,journals,boardStatus,detail:'Journal and task claims are recorded data, not live completion verification.'});
  }
  if(view==='memory') {
    const items=filesIn(root,'.agents/memory',3);
    return envelope('.agents/memory (metadata only)',{ok:items.length>0,items,files:items,limit:250,detail:'File metadata only; no credentials or memory contents exposed.'});
  }
  if(view==='logs') {
    const items=filesIn(root,'logs',0,100);
    // Do not expose raw application log lines: they may contain credentials or personal data.
    const log=path.join(root,'logs/t5500-keepalive.log');let events=[];
    try {const fd=fs.openSync(log,'r');try{const st=fs.fstatSync(fd);const b=Buffer.alloc(Math.min(16384,st.size));fs.readSync(fd,b,0,b.length,Math.max(0,st.size-b.length));events=b.toString('utf8').split(/\r?\n/).slice(-60).flatMap(line=>{
      const timestamp=line.match(/\d{4}-\d{2}-\d{2}[T ][\d:.+-]+/)?.[0];const status=line.match(/\b(UP|DOWN|HEAL|ERROR|WARN|OK|FAIL)\b/i)?.[0];
      return timestamp&&status?[{timestamp,status:status.toUpperCase(),detail:'Raw message withheld for credential/privacy safety'}]:[];
    });}finally{fs.closeSync(fd);}}catch{}
    return envelope('logs file metadata; t5500-keepalive.log bounded status/timestamp extraction',{ok:items.length>0,items,files:items,events,detail:'Raw log text is not exposed.'});
  }
  if(view==='settings') {
    const b=await bridges();return envelope('Local bridge executable/version probes',{items:b.bridges,bridges:b.bridges,detail:'Installed does not mean authenticated or inference verified. No credential values are returned.'});
  }
  if(view==='ecosystem') {
    const s=await state();return envelope('/api/mos-state.json',{items:s.services.map(v=>({...v,name:v.id,detail:v.what})),services:s.services});
  }
  if(view==='hermes') {
    const items=journal(root).filter(j=>j.name==='hermes');
    const health=await jsonProbe('http://127.0.0.1:8643/health',j=>j.status==='ok'&&/hermes/i.test(JSON.stringify(j)));
    return envelope('Hermes journal and local :8643 health',{ok:items.length>0||health.ok,items,health,toolsAvailable:false,dispatchMode:'model-proxy-only',detail:'The legacy hermes dispatch is an OmniRoute model request, not a Hermes agent/tool session.'});
  }
  const locations={support:'ops/hermes',youtube:'content/yesterday-news',marketing:'ops/marketing-inbox'};
  if(locations[view]) {const items=filesIn(root,locations[view],2);return envelope(locations[view]+' (file metadata)',{ok:items.length>0,items,files:items,detail:'Local artifact inventory only. No live inbox, publishing, revenue, or automation completion is inferred.'});}
  return envelope('No configured read source',{ok:false,error:'Unknown operational view'});
}
