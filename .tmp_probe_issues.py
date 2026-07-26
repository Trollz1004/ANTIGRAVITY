import urllib.request, json, sys
PCP="pcp_512d3544a84a957156c1fba92782dc5899c6a4ebba770670"
BASE="http://127.0.0.1:3120"
COMPANY="95bb6cb0-76aa-498b-b173-641028078d27"
HDR={"Authorization":"Bearer "+PCP,"Content-Type":"application/json"}

def req(method,path,body=None):
    url=BASE+path
    data=json.dumps(body).encode() if body is not None else None
    req=urllib.request.Request(url,data=data,headers=HDR,method=method)
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            out=r.read().decode()
            return r.status, out[:500]
    except Exception as e:
        return str(e), ""

# Try POST /api/issues with JSON body like agents endpoint
paths=[
    ("POST","/api/issues",{"title":"designer-daily","description":"daily branding assets","companyId":COMPANY,"state":"queued","priority":"medium"}),
    ("POST","/api/companies/"+COMPANY+"/issues",{"title":"designer-daily","description":"daily branding assets","state":"queued","priority":"medium"}),
    ("POST","/api/boards",{"name":"Daily Agency","companyId":COMPANY}),
    ("GET","/api/companies/"+COMPANY+"/boards",None),
    ("GET","/api/companies/"+COMPANY+"/issues",None),
]
for method,path,body in paths:
    code,out=req(method,path,body)
    print(f"{method} {path} => {code}: {out[:180]}")
