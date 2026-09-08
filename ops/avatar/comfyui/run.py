#!/usr/bin/env python3
"""Run a ComfyUI API-format workflow and pull the outputs back. Stdlib only.

  python ops/avatar/comfyui/run.py                                  # still avatar, default workflow
  python ops/avatar/comfyui/run.py --seed 7 --prompt "..."          # new head / new prompt
  python ops/avatar/comfyui/run.py --workflow ops/avatar/comfyui/workflow_api.wan22-i2v.json \
         --image ops/avatar/out/fable-avatar_00001_.png              # animate a still (uploads it first)
  python ops/avatar/comfyui/run.py --set 5.steps=40 --set 4.width=768   # any node.input override

Talks to ComfyUI's HTTP API: POST /prompt, poll /history/<id>, GET /view. Identity is checked
first: /system_stats must answer with a "system" block, a port being open is not ComfyUI.
Outputs land in --out (default ops/avatar/out/, gitignored). Prints the exact files written and
the prompt id so the packet can cite them.
"""
import argparse, json, os, sys, time, uuid, mimetypes
import urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))


def http(url, data=None, headers=None, timeout=60):
    req = urllib.request.Request(url, data=data, headers=headers or {})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.headers


def identity(host):
    try:
        body, _ = http(f'{host}/system_stats', timeout=10)
        st = json.loads(body)
        if 'system' not in st:
            return 'WRONG SERVICE: /system_stats answered without a system block'
        dev = (st.get('devices') or [{}])[0]
        return f"UP: ComfyUI {st['system'].get('comfyui_version', '?')} on {dev.get('name', '?')}"
    except urllib.error.URLError as e:
        return f'DOWN: {e.reason}'
    except Exception as e:  # noqa: BLE001
        return f'DOWN: {e}'


def upload_image(host, path):
    name = os.path.basename(path)
    boundary = '----fable' + uuid.uuid4().hex
    ctype = mimetypes.guess_type(path)[0] or 'application/octet-stream'
    with open(path, 'rb') as fh:
        blob = fh.read()
    body = (
        f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\n'
        f'Content-Type: {ctype}\r\n\r\n'
    ).encode() + blob + f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{boundary}--\r\n'.encode()
    out, _ = http(f'{host}/upload/image', body, {'Content-Type': f'multipart/form-data; boundary={boundary}'}, timeout=120)
    return json.loads(out).get('name', name)


def apply_overrides(wf, sets):
    for s in sets:
        key, _, val = s.partition('=')
        node, _, inp = key.partition('.')
        if node not in wf or 'inputs' not in wf[node]:
            sys.exit(f'--set {s}: node {node} not in workflow')
        cur = wf[node]['inputs'].get(inp)
        try:
            val = type(cur)(val) if isinstance(cur, (int, float)) and not isinstance(cur, bool) else val
        except ValueError:
            pass
        wf[node]['inputs'][inp] = val


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--host', default=os.environ.get('COMFYUI_URL', 'http://127.0.0.1:8188'))
    ap.add_argument('--workflow', default=os.path.join(HERE, 'workflow_api.json'))
    ap.add_argument('--out', default=os.path.join(REPO, 'ops', 'avatar', 'out'))
    ap.add_argument('--prompt', help='replace the positive prompt text')
    ap.add_argument('--seed', type=int)
    ap.add_argument('--image', help='upload this file and point the LoadImage node at it')
    ap.add_argument('--set', action='append', default=[], help='node.input=value override, repeatable')
    ap.add_argument('--timeout', type=int, default=1800, help='seconds to wait for the job')
    a = ap.parse_args()

    print('comfyui:', identity(a.host))
    if not identity(a.host).startswith('UP'):
        sys.exit(2)

    wf = json.load(open(a.workflow, encoding='utf-8'))
    wf.pop('_comment', None)
    for n in wf.values():
        n.pop('_meta', None)

    if a.image:
        name = upload_image(a.host, a.image)
        for n in wf.values():
            if n['class_type'] == 'LoadImage':
                n['inputs']['image'] = name
        print('uploaded start image as', name)
    if a.prompt:
        pos = [n for n in wf.values() if n['class_type'] == 'CLIPTextEncode']
        pos[0]['inputs']['text'] = a.prompt
    if a.seed is not None:
        for n in wf.values():
            if n['class_type'] == 'KSampler':
                n['inputs']['seed'] = a.seed
    apply_overrides(wf, a.set)

    client = 'fable-' + uuid.uuid4().hex[:8]
    body, _ = http(f'{a.host}/prompt', json.dumps({'prompt': wf, 'client_id': client}).encode(),
                   {'Content-Type': 'application/json'})
    resp = json.loads(body)
    if resp.get('node_errors'):
        print(json.dumps(resp['node_errors'], indent=2))
        sys.exit('ComfyUI rejected the workflow (missing model file or node?)')
    pid = resp['prompt_id']
    print('prompt id:', pid)

    t0 = time.time()
    while time.time() - t0 < a.timeout:
        hist, _ = http(f'{a.host}/history/{pid}', timeout=30)
        h = json.loads(hist).get(pid)
        if h and h.get('status', {}).get('completed', False) or (h and h.get('outputs')):
            break
        time.sleep(3)
    else:
        sys.exit('timed out waiting for the job')

    os.makedirs(a.out, exist_ok=True)
    written = []
    for node_id, out in h.get('outputs', {}).items():
        for kind in ('images', 'gifs', 'videos'):
            for item in out.get(kind, []):
                fn, sub, typ = item['filename'], item.get('subfolder', ''), item.get('type', 'output')
                q = urllib.parse.urlencode({'filename': fn, 'subfolder': sub, 'type': typ})
                data, _ = http(f'{a.host}/view?{q}', timeout=300)
                dest = os.path.join(a.out, fn)
                with open(dest, 'wb') as fh:
                    fh.write(data)
                written.append(dest)
    for w in written:
        print('wrote', w, os.path.getsize(w), 'bytes')
    if not written:
        print('job finished but produced no files; status:', json.dumps(h.get('status'), indent=2))
        sys.exit(1)


if __name__ == '__main__':
    import urllib.parse  # noqa: E402
    main()
