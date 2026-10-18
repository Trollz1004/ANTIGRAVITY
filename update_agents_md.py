import re
import io

file_path = r"C:\ANTIGRAVITY\AGENTS.md"

with io.open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Pattern to replace the Runtime and Dashboard Boundary block
pattern = r"## Runtime and Dashboard Boundary.*?(?=## Public Product Boundary)"

replacement = """## Runtime, Dashboard, and Swarm Boundaries

Mission Control is the operational dashboard, and Mission Control is Paperclip: `paperclipai` running securely on the **T5500 node** at `http://127.0.0.1:3100` (Company: `ANTIGRAVITY Marketing Co`). All legacy references to Sabretooth hosting Paperclip are dead.

Paperclip is strictly the business and marketing command layer. The Git repository and marketing lanes are air-gapped by role to prevent cross-contamination:

- **Gemini Ultra (CEO):** Architect and Commander of the Paperclip marketing bridge. Translates repo-level code features into strategic marketing playbooks.
- **Claude (General Counsel & Code Judge):** Enforces compliance, safety rules, and code verification before any code hits `main`.
- **Grok (X/Twitter Lane):** The edgy, math-obsessed disruptor. Calls out affiliate grifts and pitches the 50% revenue share to massive tech accounts. Operates in Paperclip. Zero Git access.
- **Emergent (Reddit Lane):** The organic, anti-bot undercover agent. Infiltrates algorithm frustration threads. Operates in Paperclip. Zero Git access.
- **Muse (Meta Lane):** The highly visual hook-generator for Instagram Reels and Facebook Groups. Operates in Paperclip. Zero Git access.

A running process, port, or HTTP status alone is not proof of the intended service: verify the expected identity response and report **UP**, **DOWN**, **WRONG SERVICE**, **AUTH MISSING**, **AUTH REJECTED**, or **NOT CONFIGURED**.

Paperclip is an active runtime and is the agent command layer. It does not hold Git delivery. The source-control wall is absolute. Lane assignments and their time gates live in Paperclip. A run refused outside its permitted window is policy, not a fault; do not chase it as a red.

"""

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with io.open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("AGENTS.md updated successfully.")
