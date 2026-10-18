import urllib.request
import json
import sys

def get(path):
    try:
        url = f"http://127.0.0.1:4747/api{path}"
        req = urllib.request.Request(url, headers={"User-Agent": "Antigravity/1.0"})
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"error": str(e)}

def main():
    companies = get("/companies")
    if not isinstance(companies, list):
        print(f"Failed to fetch companies: {companies}")
        return

    print(f"Found {len(companies)} companies in Paperclip.\n")

    for c in companies:
        cid = c["id"]
        cname = c["name"]
        print(f"==================================================")
        print(f"Company: {cname} (ID: {cid})")
        print(f"==================================================")

        agents = get(f"/companies/{cid}/agents")
        agent_map = {}
        if isinstance(agents, list):
            print(f"Total Agents: {len(agents)}")
            for a in agents:
                aid = a.get("id")
                aname = a.get("name")
                agent_map[aid] = aname
                arole = a.get("role")
                astatus = a.get("status")
                adapter = a.get("adapterType")
                hb = a.get("lastHeartbeatAt")
                err = a.get("errorReason")
                print(f"  * Agent: {aname} ({arole})")
                print(f"    Status: {astatus} | Adapter: {adapter}")
                print(f"    Last Heartbeat: {hb}")
                if err:
                    print(f"    Error/Warning: {err}")
        else:
            print(f"  Error fetching agents: {agents}")

        issues = get(f"/companies/{cid}/issues?status=todo,in_progress,blocked")
        if isinstance(issues, list):
            print(f"\nActive Issues ({len(issues)} total):")
            if not issues:
                print("  No pending todo/in_progress/blocked issues.")
            for iss in issues:
                ident = iss.get("identifier")
                title = iss.get("title")
                status = iss.get("status")
                prio = iss.get("priority")
                assignee_id = iss.get("assigneeAgentId")
                assignee_name = agent_map.get(assignee_id, assignee_id or "Unassigned")
                print(f"  - [{ident}] {title}")
                print(f"    Status: {status} | Priority: {prio} | Assignee: {assignee_name}")
        else:
            print(f"  Error fetching issues: {issues}")
        print()

if __name__ == "__main__":
    main()
