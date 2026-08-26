import subprocess, re, collections
pats = {
 'anthropic': re.compile(rb'sk-ant-[A-Za-z0-9_\-]{20,}'),
 'stripe'   : re.compile(rb'sk_live_[A-Za-z0-9]{20,}'),
 'github'   : re.compile(rb'\bghp_[A-Za-z0-9]{36}\b'),
 'square'   : re.compile(rb'\bEAAA[A-Za-z0-9_\-]{40,}'),
 'google'   : re.compile(rb'\bAIza[A-Za-z0-9_\-]{35}\b'),
 'xai'      : re.compile(rb'\bxai-[A-Za-z0-9]{40,}'),
}
objs=subprocess.run(['git','rev-list','--objects','--all'],capture_output=True).stdout.decode('utf-8','replace')
blobs=[]
for line in objs.splitlines():
    p=line.split(' ',1)
    if len(p)==2: blobs.append((p[0],p[1]))
hits=collections.defaultdict(set)
CH=400
for i in range(0,len(blobs),CH):
    chunk=blobs[i:i+CH]
    pr=subprocess.run(['git','cat-file','--batch'],input=''.join(s+'\n' for s,_ in chunk).encode(),capture_output=True)
    out=pr.stdout; pos=0
    for sha,path in chunk:
        nl=out.find(b'\n',pos)
        if nl<0: break
        h=out[pos:nl].split()
        if len(h)<3: pos=nl+1; continue
        size=int(h[2]); body=out[nl+1:nl+1+size]; pos=nl+1+size+1
        for name,rx in pats.items():
            if rx.search(body): hits[name].add(path)
for k in sorted(hits):
    print(f"{k}: {len(hits[k])} path(s)")
    for p in sorted(hits[k])[:6]: print("   ", p)
