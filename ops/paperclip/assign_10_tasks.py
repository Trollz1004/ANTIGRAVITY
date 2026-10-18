import urllib.request
import json

assignments = [
    {
        "issueId": "c4cee095-4952-4509-9042-2dfac4f66c65",
        "ident": "HER-12",
        "title": "Triage open customer support tickets for onlinerecycle.net",
        "agentId": "4df01909-caf7-417c-9eb8-98db7db03b34",
        "agentName": "Support"
    },
    {
        "issueId": "14c33b6f-7a01-4c28-911f-9208f46f64c9",
        "ident": "HER-33",
        "title": "Audit API token usage and provider spend rates",
        "agentId": "9b78f82b-52da-491a-8163-377115f2601a",
        "agentName": "CFO"
    },
    {
        "issueId": "29b17bdf-905a-4182-a9b0-d3a7b617be27",
        "ident": "HER-5",
        "title": "Review competitor SEO keywords",
        "agentId": "b046726b-c574-4358-944e-af2a9f4a17da",
        "agentName": "CSEO"
    },
    {
        "issueId": "98b75110-cc75-42b7-9256-8f47f891fd36",
        "ident": "HER-3",
        "title": "Run ad conversion funnel analysis",
        "agentId": "21d2506d-f1e0-428c-bc81-91d0b5d70654",
        "agentName": "Marketing"
    },
    {
        "issueId": "46669896-ad27-4577-abc6-503db309b5bb",
        "ident": "HER-7",
        "title": "Verify SSL and DNS records for youandinotai.com",
        "agentId": "d4af331b-b2a0-45e9-8c8d-bc98290294a6",
        "agentName": "CTO"
    },
    {
        "issueId": "a27cbdb2-0d80-42df-852d-3109bfee33ca",
        "ident": "HER-6",
        "title": "Configure automated social share triggers",
        "agentId": "191fb756-d66f-4259-a4d3-f7247f553718",
        "agentName": "YouTube"
    },
    {
        "issueId": "599b5dee-297a-4178-966f-c50e9aff2966",
        "ident": "HER-45",
        "title": "Evaluate local LLM memory footprint and latency",
        "agentId": "e3997b4d-89c0-4181-b188-ea3f6433e9ea",
        "agentName": "Pi Research"
    },
    {
        "issueId": "f1a94d7f-f225-4b1a-947e-79cf0466dcd8",
        "ident": "HER-42",
        "title": "Audit local AI model fallback routing (Ollama/OmniRoute)",
        "agentId": "13409007-632a-42e8-9d14-bce72fa40acd",
        "agentName": "Gemini Research"
    },
    {
        "issueId": "f6dd5230-29d3-42de-9569-f4ffc2f9979b",
        "ident": "HER-46",
        "title": "Enforce strict context window and token efficiency rules",
        "agentId": "9d994dc2-8c2d-4050-8e00-4c4b727092d8",
        "agentName": "Adversary"
    },
    {
        "issueId": "9652b4d9-db28-483f-8cfb-bea74bb47157",
        "ident": "HER-26",
        "title": "Review pull request policy enforcement",
        "agentId": "3ff00008-6118-4745-ad53-b927e5948217",
        "agentName": "Codex Judge"
    }
]

print("=== ASSIGNING 10 HIGH VALUE TASKS ===")
for item in assignments:
    iid = item["issueId"]
    aid = item["agentId"]
    aname = item["agentName"]
    ident = item["ident"]
    title = item["title"]

    patch_data = {
        "assigneeAgentId": aid,
        "priority": "high",
        "status": "todo"
    }

    url = f"http://127.0.0.1:4747/api/issues/{iid}"
    req = urllib.request.Request(
        url,
        data=json.dumps(patch_data).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "Antigravity/1.0"},
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[ASSIGNED] {ident} -> {aname} ({resp.status}): {title}")
    except Exception as e:
        print(f"[ERROR] Failed to assign {ident} to {aname}: {e}")

print("\n=== VERIFYING AGENT HEARTBEATS ===")
agent_ids = {item["agentId"]: item["agentName"] for item in assignments}
for aid, aname in agent_ids.items():
    # Make sure agent heartbeat is enabled
    agent_url = f"http://127.0.0.1:4747/api/agents/{aid}"
    patch_agent = {
        "runtimeConfig": {
            "heartbeat": {
                "enabled": True,
                "intervalSec": 300,
                "wakeOnDemand": True
            }
        },
        "status": "idle",
        "errorReason": None
    }
    req = urllib.request.Request(
        agent_url,
        data=json.dumps(patch_agent).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "Antigravity/1.0"},
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[READY] {aname} heartbeat enabled & status set to idle")
    except Exception as e:
        print(f"[ERROR] Failed to update agent {aname}: {e}")

print("\n[ALL 10 TASKS ASSIGNED AND AGENTS ENABLED]")
