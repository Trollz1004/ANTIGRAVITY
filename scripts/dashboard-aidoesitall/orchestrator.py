#!/usr/bin/env python3
"""
Sabretooth Orchestrator - Multi-Node Task Dispatcher
NO Telegram on worker nodes. NO OpenClaw on worker nodes.
Only SSH + script execution.
Authority: Josh Coleman
Date: 2026-03-19
"""

import subprocess
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("orchestrator")

# Node topology (from node-targets.json)
NODES = {
    "9020": {
        "host": "192.168.0.5",
        "role": "marketing",
        "ssh_alias": "9020",
        "work_dir": "C:\\Antigravity",
        "capabilities": ["crossfire", "content_gen", "social_posting"]
    },
    "t5500": {
        "host": "192.168.0.15",
        "role": "build",
        "ssh_alias": "t5500",
        "work_dir": "C:\\ANTIGRAVITY",
        "capabilities": ["build", "deploy", "docker"]
    }
}


class NodeOrchestrator:
    """Orchestrates tasks across worker nodes via SSH only."""
    
    def __init__(self):
        self.results = {}
        
    def ssh_exec(self, node_alias: str, command: str, timeout: int = 60) -> Dict:
        """Execute command on remote node via SSH."""
        try:
            result = subprocess.run(
                ["ssh", node_alias, command],
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "SSH timeout", "stdout": "", "stderr": ""}
        except Exception as e:
            return {"success": False, "error": str(e), "stdout": "", "stderr": ""}
    
    def check_node_health(self, node_id: str) -> Dict:
        """Check if node is reachable and healthy."""
        node = NODES.get(node_id)
        if not node:
            return {"success": False, "error": "Unknown node"}
        
        # Simple connectivity test
        result = self.ssh_exec(node["ssh_alias"], "echo healthy", timeout=10)
        
        if result["success"] and "healthy" in result["stdout"]:
            return {
                "success": True,
                "node": node_id,
                "status": "online",
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "success": False,
                "node": node_id,
                "status": "offline",
                "error": result.get("stderr", result.get("error", "Unknown"))
            }
    
    def dispatch_task(self, node_id: str, task_type: str, params: Dict = None) -> Dict:
        """Dispatch a task to a specific node."""
        node = NODES.get(node_id)
        if not node:
            return {"success": False, "error": f"Node {node_id} not found"}
        
        log.info(f"Dispatching {task_type} to {node_id}")
        
        # Build command based on task type
        if task_type == "run_script":
            script_path = params.get("script")
            args = params.get("args", "")
            cmd = f'cd {node["work_dir"]} && python "{script_path}" {args}'
            
        elif task_type == "start_service":
            service = params.get("service")
            if service == "crossfire_backend":
                cmd = f'cd {node["work_dir"]}\\crossfire\\backend && start python -m uvicorn app.main:app --host 0.0.0.0 --port 8000'
            elif service == "crossfire_frontend":
                cmd = f'cd {node["work_dir"]}\\crossfire\\frontend && start npm run dev'
            else:
                return {"success": False, "error": f"Unknown service: {service}"}
                
        elif task_type == "check_service":
            service_url = params.get("url", "http://localhost:8000/api/health")
            cmd = f'curl -s {service_url} || echo "service_not_running"'
            
        elif task_type == "execute_command":
            cmd = params.get("command", "echo no_command")
            
        else:
            return {"success": False, "error": f"Unknown task type: {task_type}"}
        
        # Execute via SSH
        result = self.ssh_exec(node["ssh_alias"], cmd, timeout=params.get("timeout", 60))
        
        return {
            "success": result["success"],
            "node": node_id,
            "task": task_type,
            "timestamp": datetime.now().isoformat(),
            "output": result.get("stdout", ""),
            "error": result.get("stderr", "") or result.get("error", "")
        }
    
    def broadcast_task(self, task_type: str, params: Dict = None, 
                       nodes: List[str] = None) -> Dict:
        """Broadcast a task to multiple nodes."""
        target_nodes = nodes or list(NODES.keys())
        results = {}
        
        for node_id in target_nodes:
            results[node_id] = self.dispatch_task(node_id, task_type, params)
        
        return {
            "broadcast": True,
            "task": task_type,
            "nodes": target_nodes,
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_node_status(self) -> Dict:
        """Get status of all nodes."""
        status = {}
        for node_id in NODES:
            status[node_id] = self.check_node_health(node_id)
        return status


# Singleton instance
_orchestrator = None

def get_orchestrator() -> NodeOrchestrator:
    """Get orchestrator singleton."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = NodeOrchestrator()
    return _orchestrator


if __name__ == "__main__":
    import sys
    
    orch = get_orchestrator()
    
    if len(sys.argv) < 2:
        print("Usage: python orchestrator.py <command> [args]")
        print("")
        print("Commands:")
        print("  status              - Check all node health")
        print("  health <node>       - Check specific node")
        print("  run <node> <script> - Run script on node")
        print("  exec <node> <cmd>   - Execute command on node")
        sys.exit(1)
    
    cmd = sys.argv[1]
    
    if cmd == "status":
        status = orch.get_node_status()
        print(json.dumps(status, indent=2))
    
    elif cmd == "health" and len(sys.argv) > 2:
        node_id = sys.argv[2]
        result = orch.check_node_health(node_id)
        print(json.dumps(result, indent=2))
    
    elif cmd == "run" and len(sys.argv) > 3:
        node_id = sys.argv[2]
        script = sys.argv[3]
        result = orch.dispatch_task(node_id, "run_script", {"script": script})
        print(json.dumps(result, indent=2))
    
    elif cmd == "exec" and len(sys.argv) > 3:
        node_id = sys.argv[2]
        command = " ".join(sys.argv[3:])
        result = orch.dispatch_task(node_id, "execute_command", {"command": command})
        print(json.dumps(result, indent=2))
