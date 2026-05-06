from fastapi import APIRouter, BackgroundTasks
import uuid, datetime, asyncio
from ..envelope import make_envelope

router = APIRouter()

def register_run(run_id, command):
    # placeholder: just store in memory dict
    runs[run_id] = {"command": command, "status": "running", "started_at": datetime.datetime.utcnow().isoformat() + "Z", "log": []}

runs = {}

@router.post("/deploy/paperclip")
async def deploy_paperclip(background: BackgroundTasks):
    run_id = str(uuid.uuid4())
    # placeholder command
    command = "wrangler deploy"  # not actually run
    register_run(run_id, command)
    return {"run_id": run_id, "started_at": runs[run_id]["started_at"], "status": "running"}

@router.get("/deploy/runs")
async def list_deploys():
    return [{"run_id": k, **v} for k, v in runs.items()]

@router.get("/deploy/runs/{run_id}")
async def get_deploy(run_id: str):
    return runs.get(run_id, {"error": "not found"})

# SSE stream placeholder (not real streaming)
@router.get("/deploy/paperclip/stream/{run_id}")
async def stream_deploy(run_id: str):
    # return current log as plain text
    run = runs.get(run_id)
    if not run:
        return {"error": "not found"}
    return {"log": "".join(run["log"]) }
