# Avatar head — ComfyUI workflow kit (offline fallback)

**Primary path is OmniRoute, not this kit** (Joshua, 2026-09-08). `npm run fable -- workflow avatar` runs `scripts/fable/workflows/avatar.json`: a chat model drafts the character prompt, `antigravity/gemini-3.1-flash-image` renders it through the gateway (VERIFIED 200, about 10 s), and the PNG lands in `ops/avatar/out/fable-avatar.png`. `npm run fable -- omni image-gen --prompt "..." --out file.png` does a single render. This ComfyUI kit stays for when the gateway is down or a local model is wanted.

Two API-format workflows plus a runner, for the `hermes-youtube-avatar-head` pipeline. Business-only, no real face, no likeness: both prompts ask for an illustrated original character.

| File | What it makes | Needs |
|---|---|---|
| `workflow_api.json` | one 1024x1024 avatar still (`fable-avatar_*.png`) | any SDXL checkpoint in `ComfyUI/models/checkpoints/` (default name `sd_xl_base_1.0.safetensors`) |
| `workflow_api.wan22-i2v.json` | a 5 s 24 fps head clip from that still (`fable-avatar-clip_*.mp4`) | Wan 2.2 TI2V 5B GGUF + umt5-xxl text encoder + Wan 2.2 VAE + the ComfyUI-GGUF custom node |
| `run.py` | submits either workflow to ComfyUI's HTTP API, waits, downloads outputs to `ops/avatar/out/` | Python 3, stdlib only |

Both JSON files are the format ComfyUI's **Save (API)** button exports: `{ "<node id>": { "class_type", "inputs" } }`. `_comment` and `_meta` are stripped by `run.py` before submit. They also load in the ComfyUI UI through **Load** (the UI accepts API format).

## Run

```
python ops/avatar/comfyui/run.py                                   # still
python ops/avatar/comfyui/run.py --seed 7                          # another head
python ops/avatar/comfyui/run.py --prompt "front-facing bust portrait of ..."
python ops/avatar/comfyui/run.py --workflow ops/avatar/comfyui/workflow_api.wan22-i2v.json --image ops/avatar/out/fable-avatar_00001_.png
python ops/avatar/comfyui/run.py --set 5.steps=40 --set 4.width=768 --set 4.height=768
```

`run.py` checks identity first (`/system_stats` must answer with a `system` block) and reports UP / DOWN / WRONG SERVICE. `COMFYUI_URL` overrides the default `http://127.0.0.1:8188`.

## What is on this box (2026-09-08)

- **No ComfyUI installed**, port 8188 closed. GPU is an **AMD RX 6800 on Windows 10**, so ComfyUI runs through DirectML or ZLUDA, not CUDA. ComfyUI Desktop does not ship an AMD-on-Windows build.
- **AI Dev Gallery** (Microsoft Store, 0.6.0) is installed with its model cache at `~/.cache/aigallery`. It already holds **Stable Diffusion v1.4 ONNX** (its Generate Image sample, runs on DirectML), Whisper Tiny, and MiniLM. Its Foundry Local catalog file lists 41 CPU-only chat/whisper/VL models, none downloaded; Foundry Local is not installed. That is the fastest still-avatar path today: open Generate Image, paste the positive prompt from `workflow_api.json`, save the PNG to `ops/avatar/out/`.
- **Hugging Face cache** (`~/.cache/huggingface/hub`) already has complete downloads of `Wan-AI/Wan2.2-TI2V-5B-Diffusers` (13.5 GB, Diffusers layout, not loadable by ComfyUI as-is), `unsloth/Wan2.2-TI2V-5B-GGUF` (Q4_K_M, 3.3 GB, the one the i2v workflow uses), and `unsloth/Z-Image-Turbo-unsloth-bnb-4bit` (6.5 GB, Diffusers layout, not ComfyUI-loadable).
- `ffmpeg` and `ffprobe` are on PATH for the assemble step. Free disk: C: ~100 GB, D: ~860 GB. Put ComfyUI and its models on D:.

## Install ComfyUI for this GPU

```
git clone https://github.com/comfyanonymous/ComfyUI "D:\ComfyUI"
cd /d D:\ComfyUI
python -m venv .venv && .venv\Scripts\activate
pip install torch-directml
pip install -r requirements.txt
git clone https://github.com/city96/ComfyUI-GGUF custom_nodes\ComfyUI-GGUF
pip install -r custom_nodes\ComfyUI-GGUF\requirements.txt
python main.py --directml --listen 127.0.0.1 --port 8188
```

Models:

- still: any SDXL checkpoint into `models/checkpoints/` (or an SD1.5 one; then set `4.width=512 4.height=512` and node 1's name).
- clip: copy `Wan2.2-TI2V-5B-Q4_K_M.gguf` from the HF cache snapshot into `models/unet/`; download Comfy-Org's `umt5_xxl_fp8_e4m3fn_scaled.safetensors` into `models/text_encoders/` and `wan2.2_vae.safetensors` into `models/vae/`.

DirectML with a 5B video model at 1280x704x121 frames is slow and memory-hungry on a 16 GB card; start with `--set 6.length=49` (2 s) and `--set 6.width=832 --set 6.height=480` to prove the pipe, then scale up. ZLUDA is the faster route if DirectML is too slow.

## Pipeline position

still → (optional) i2v clip → voiceover → ffmpeg assemble (1080x1920 or 1920x1080, h264, yuv420p) → packet under `ops/packets/hermes-youtube-avatar-<slug>/`. The i2v pass gives idle/talking motion, not lip-sync: mark lip-sync UNVERIFIED unless a lip-sync stage is added. No publish without Joshua's recorded approval.
