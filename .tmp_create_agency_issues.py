import urllib.request, json, sys
PCP="pcp_512d3544a84a957156c1fba92782dc5899c6a4ebba770670"
BASE="http://127.0.0.1:3120"
COMPANY="95bb6cb0-76aa-498b-b173-641028078d27"
HDR={"Authorization":"Bearer "+PCP,"Content-Type":"application/json"}
# Adapter matrix from runtime probe
ADAPTERS=[
("Designer","designer","Tier 2 execution",["visual design","layout","branding","component library","accessibility audit"]),
("UX Master","ux-master","Tier 2 execution",["interaction design","usability","a11y","checkout flow","task completion"]),
("YouTube Creator","youtube-creator","Tier 2 execution",["strategy","scripting","production","editing","SEO"]),
("Content Poster","content-poster","Tier 3 worker",["captions","calendar","A/B tests","compliance gate","approved links only"]),
("Information Architect","information-architect","Tier 2 execution",["sitemap","navigation","taxonomy","tree testing","findability"]),
("Content Strategist / Conversion Psychologist","content-strategist","Tier 2 execution",["messaging","persuasion","pricing copy","landing CRO","compliance gate"]),
]
def api(method,path,body=None):
    url=BASE+path
    data=json.dumps(body).encode() if body is not None else None
    req=urllib.request.Request(url,data=data,headers=HDR,method=method)
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return r.status, json.load(r)
    except Exception as e:
        return str(e), None
# Fetch existing issues
status, issues = api("GET", f"/api/companies/{COMPANY}/issues")
existing_titles = []
if isinstance(issues, list):
    existing_titles = [i.get("title","") for i in issues]
print("existing issues:", len(existing_titles))

def ensure(title,body,priority="medium",state="queued"):
    if title in existing_titles:
        print("skip existing:", title)
        return
    payload={"title":title,"description":body,"state":state,"priority":priority,"companyId":COMPANY}
    code,out=api("POST", f"/api/companies/{COMPANY}/issues", payload)
    print(f"create {title}: {code} {getattr(out,'get',lambda *a:'')( 'id', '') if isinstance(out,dict) else ''}")

# One issue per agency role, with daily deliverables template
for name,kind,tier,skills in ADAPTERS:
    body=f"""## Owner: {name}
## Type: {kind}
## Tier: {tier}
## Skills: {', '.join(skills)}

## Daily deliverables
1. Status check-in: what shipped, what’s next, blocker
2. One tangible artifact aligned to skill list above
3. One compliance gate result (copy tone, links, language)

## Boundaries
- Execute within approved product copy and Square checkout paths
- No cause/mission language on public surfaces
- One CTA per asset; approved links only
- Escalate to Hermes/CEO lane on compliance risk or revenue blocker
- Do not create additional agents or lanes without Joshua approval
"""
    ensure(name, body, priority="medium", state="queued")

print("done")
