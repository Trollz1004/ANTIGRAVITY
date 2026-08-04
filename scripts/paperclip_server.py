#!/usr/bin/env python3
"""
Paperclip — ANTIGRAVITY Task Orchestrator (:3120 WSL Ubuntu)
COPY TO: ~/.paperclip/paperclip_server.py

API:
  POST   /api/tasks                    Submit task
  GET    /api/tasks/{id}               Get task status
  GET    /api/harness/routing          View harness config
  GET    /api/skills/available         List available skills
  GET    /api/mission-control/status   Mission Control health
"""

import os
import sys
import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List

# Try FastAPI first, fallback to Flask if not available
try:
    from fastapi import FastAPI, HTTPException
    from fastapi.responses import JSONResponse
    app = FastAPI(title="Paperclip ANTIGRAVITY Orchestrator")
    WEB_FRAMEWORK = "fastapi"
except ImportError:
    from flask import Flask, request, jsonify
    app = Flask(__name__)
    WEB_FRAMEWORK = "flask"

# Config
REPO_ROOT = Path("/mnt/f/ANTIGRAVITY")
PAPERCLIP_PORT = int(os.getenv("PAPERCLIP_PORT", 3120))
OMNIROUTE_BASE = os.getenv("OMNIROUTE_BASE", "http://192.168.0.15:20128/api/v1/vscode/REDACTED_TOKEN/")
PIECES_MCP = "http://localhost:39300/model_context_protocol/2025-03-26/mcp"
MISSION_CONTROL_PORT = 3151

# In-memory task queue
tasks: Dict[str, dict] = {}


class TaskManager:
    @staticmethod
    def create_task(description: str, harness: str = "opencode") -> str:
        """Create new task"""
        task_id = str(uuid.uuid4())[:8]
        tasks[task_id] = {
            "id": task_id,
            "description": description,
            "harness": harness,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "result": None,
            "error": None
        }
        return task_id

    @staticmethod
    def get_task(task_id: str) -> Optional[dict]:
        """Get task status"""
        return tasks.get(task_id)

    @staticmethod
    def update_task(task_id: str, status: str, result: dict = None, error: str = None):
        """Update task status"""
        if task_id in tasks:
            tasks[task_id]["status"] = status
            if result:
                tasks[task_id]["result"] = result
            if error:
                tasks[task_id]["error"] = error
            tasks[task_id]["updated_at"] = datetime.now().isoformat()

    @staticmethod
    def list_tasks(status: str = None) -> List[dict]:
        """List tasks, optionally filtered by status"""
        if status:
            return [t for t in tasks.values() if t["status"] == status]
        return list(tasks.values())


def check_omniroute() -> bool:
    """Check OmniRoute health"""
    import http.client
    try:
        conn = http.client.HTTPConnection("192.168.0.15", 20128, timeout=2)
        conn.request("GET", "/api/v1/vscode/health")
        resp = conn.getresponse()
        return resp.status == 200
    except:
        return False


def get_available_skills() -> List[str]:
    """List available skills from .agents/skills/"""
    skills_dir = REPO_ROOT / ".agents" / "skills"
    if skills_dir.exists():
        return sorted([d.name for d in skills_dir.iterdir() if d.is_dir()])
    return []


# FastAPI routes (if available)
if WEB_FRAMEWORK == "fastapi":
    @app.post("/api/tasks")
    async def submit_task(task: dict):
        """Submit new task"""
        description = task.get("description", "")
        harness = task.get("harness", "opencode")
        if not description:
            raise HTTPException(status_code=400, detail="description required")
        
        task_id = TaskManager.create_task(description, harness)
        return {"task_id": task_id, "status": "pending"}

    @app.get("/api/tasks/{task_id}")
    async def get_task_status(task_id: str):
        """Get task status"""
        task = TaskManager.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="task not found")
        return task

    @app.get("/api/tasks")
    async def list_tasks(status: str = None):
        """List tasks"""
        return TaskManager.list_tasks(status)

    @app.get("/api/harness/routing")
    async def harness_routing():
        """View harness configuration"""
        omniroute_ok = check_omniroute()
        return {
            "primary_harness": "opencode",
            "omniroute_status": "healthy" if omniroute_ok else "unreachable",
            "harnesses": {
                "opencode": {"config": ".opencode/opencode.json"},
                "hermes": {"entry": "python .hermes/hermes_agent.py"},
                "fcc-claude": {"entry": "fcc-claude"}
            },
            "omniroute_base": OMNIROUTE_BASE,
            "pieces_mcp": PIECES_MCP
        }

    @app.get("/api/skills/available")
    async def list_skills():
        """List available skills"""
        return {
            "skills": get_available_skills(),
            "count": len(get_available_skills()),
            "skills_dir": str(REPO_ROOT / ".agents" / "skills")
        }

    @app.get("/api/mission-control/status")
    async def mission_control_status():
        """Check Mission Control status"""
        import http.client
        try:
            conn = http.client.HTTPConnection("localhost", MISSION_CONTROL_PORT, timeout=2)
            conn.request("GET", "/api/status")
            resp = conn.getresponse()
            return {"status": "running", "port": MISSION_CONTROL_PORT}
        except:
            return {"status": "not_running", "port": MISSION_CONTROL_PORT}

if __name__ == "__main__":
    print(f"[Paperclip] Starting on http://localhost:3120")
    print(f"[Paperclip] Framework: {WEB_FRAMEWORK}")
    
    if WEB_FRAMEWORK == "fastapi":
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=3120)
