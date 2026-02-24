---
name: iron-wall
description: "Verify Iron Wall separation between profit and charity"
---

Run the Iron Wall verification scan. This checks that PROFIT infrastructure has zero contamination from CHARITY operations.

**Scan commands (run on SABRETOOTH):**
```powershell
cd C:\crosslister-droid
findstr /s /i "192.168.0" hemorzoid-services\*.*
findstr /s /i "0x222a" hemorzoid-services\*.*
findstr /s /i "omega365" hemorzoid-services\*.*
findstr /s /i "aicollab" hemorzoid-services\*.*
```

**Expected result:** All four commands return EMPTY (no matches).

**If any match is found:**
1. STOP all operations immediately
2. Report the exact file and line to Josh
3. Do NOT modify or delete — Josh decides
4. This is a security incident

**Iron Wall rules reminder:**
- PROFIT: SABRETOOTH (.8), Trollz1004, youandinotai, onlinerecycle orgs
- CHARITY: T5500 (.15), 9020 (.5), aicollab4kids org
- OMEGA/OMEGA365: DO NOT TOUCH ever
- Never reference charity in commercial context
- Never mix funds, infrastructure, or data
