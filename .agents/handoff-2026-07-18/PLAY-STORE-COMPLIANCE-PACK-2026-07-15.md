# PLAY STORE COMPLIANCE PACK — You & I, Not AI
**2026-07-15 · issued by first-party Claude · for Josh (operator) + Hermes (executor)**
Everything between today and a live Play listing, in execution order. Items marked **[JOSH]** need a human with the credit card / identity docs. Items marked **[HERMES]** are in the ship directive.

---
## 0 · CRITICAL PATH — start the long-lead items TODAY
| # | Item | Lead time | Why it gates everything |
|---|---|---|---|
| 1 | **[JOSH] D-U-N-S number** for Trash Or Treasure Online Recycler LLC (free, dnb.com) | days–weeks | Play Console **organization** accounts require D-U-N-S. Org account matters: **personal** dev accounts created after Nov 2023 must run a closed test with 12+ testers for 14 straight days before production access. **Org accounts skip that.** The LLC is the fast lane. |
| 2 | **[JOSH] Live mailboxes**: `support@` and `safety@` youandinotai.com (Cloudflare Email Routing → your inbox, ~10 min) | minutes | `support@` is on every legal page + Console contact. `safety@` is the designated child-safety contact in the Play declaration. Dead mailboxes = rejection risk + broken deletion path. |
| 3 | **[JOSH] Play Console org account** — play.google.com/console, $25 one-time, verify identity + org (needs #1) | 1–3 days after D-U-N-S | Nothing submits without it. |
| 4 | **[HERMES] Host the 6 URLs** (privacy, terms, delete-account, child-safety, community-guidelines, safety) at clean routes on youandinotai.com | same day | Console asks for privacy-policy URL, deletion URL, child-safety-standards URL. |

## 1 · ARCHITECTURE DECISION (made — do not re-litigate)
**v1 ships FREE. Zero in-app purchases.**
- No IAP → Google Play Billing policy is never triggered → **Square stays web-only, doctrine intact.**
- Do **not** put purchase links/buttons inside the Android app in v1 — external-purchase link-out rules are in active litigation flux (Epic v. Google) and a free app sidesteps the entire question. Revisit only when adding IAP, as its own project.
- Fastest possible review path for a dating app: fewer policies engaged = fewer rejection vectors.

## 2 · TECHNICAL TARGET
- **Target API 36 (Android 16).** New submissions after Aug 31, 2026 require it; we build to it from day one so there is no re-release scramble. Bubblewrap: set in `twa-manifest.json` before build.
- Package as **.aab** (App Bundle) via Bubblewrap TWA. Keystore goes in the vault, never the repo. Enroll in Play App Signing.

## 3 · TWA BUILD (Bubblewrap) — prerequisites → commands
Prereqs (Hermes RECON D confirms): Node 18+, JDK 17+. PWA prereqs on the date app (ship directive Phase 2): `manifest.json` (name, short_name, start_url `/`, display `standalone`, theme/background `#020617`, 192+512 maskable icons), a service worker, HTTPS.
```
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://youandinotai.com/manifest.json
#   package id suggestion: com.youandinotai.app · appVersionName 1.0.0
bubblewrap build        # → app-release-bundle.aab + assetlinks.json
```
Host the generated `assetlinks.json` (contains your signing cert SHA-256) at
`https://youandinotai.com/.well-known/assetlinks.json` — without it the TWA shows a browser bar and looks broken in review.

## 4 · STORE LISTING (assets from Hermes RECON E)
- **App name (≤30):** `You & I, Not AI`
- **Short description (≤80):** `Dating for verified humans. Every profile ID-checked. No bots.`
- **Full description:** blunt product truth — identity + age verification before messaging, BoT-or-NoT, report/block on everything, 18+. Zero FL-496.405 restricted vocabulary (grep it like the site).
- Icon 512×512 · feature graphic 1024×500 · ≥2 phone screenshots · category **Dating** · contact email `support@youandinotai.com` · privacy policy URL `https://youandinotai.com/privacy`.

## 5 · DATA SAFETY FORM — row answers (match privacy.html exactly)
| Console question | Answer |
|---|---|
| Collects data? | Yes |
| Data types | Name, Email, Date of birth, Photos, Messages (in-app), User IDs, Device/other IDs, Approximate location (**only if** location matching ships in v1 — else omit) |
| Purposes | App functionality · Account management · Fraud prevention, security & compliance |
| Shared with third parties | Identity-verification provider (identity data, for verification) · payment processor **not** shared from the app (no IAP, web-only purchases) |
| Encrypted in transit | Yes |
| Deletion mechanism | Yes → `https://youandinotai.com/delete-account` |
| Data sold | No · Ads: No third-party ads |

## 6 · CONTENT RATING (IARC questionnaire)
Dating category → expect **Mature 17+**. Key answers: user interaction **Yes** · users can exchange content **Yes** · shares physical location: answer per shipped build · in-app digital purchases: **No** (v1 free) · unrestricted internet access **Yes**.

## 7 · CHILD SAFETY STANDARDS DECLARATION (Console → App content)
Social/Dating apps must complete it. Our answers are real because the artifacts exist:
- Published CSAE standards URL: `https://youandinotai.com/child-safety`
- In-app CSAE reporting mechanism: **Yes** (Report on every profile + message — v1 feature floor, ship directive Phase 3)
- Designated point of contact: `safety@youandinotai.com` (**must be live first**)
- Affirm compliance with applicable child-safety law (NCMEC reporting path is stated on the page).

## 8 · APP ACCESS (reviewer credentials)
Login-gated app ⇒ Console "App access" needs working demo credentials. Do it honestly:
- Create one **review account** whose verification step is pre-completed **server-side by allowlist** (flag on the account record). No client-side bypass, no "skip verification" code path reachable by real users.
- Document email/password in Console App access with a one-line note: "Verification pre-completed on this test account; production accounts must pass ID/age verification."

## 9 · v1 IN-APP FEATURE FLOOR (Google-facing, non-negotiable before submit)
1. **Report** control on every profile and message thread (wired — Phase 3).
2. **Block** control on every profile (wired — Phase 3).
3. 18+ date-of-birth gate at signup.
4. Links inside the app (settings/footer) to Privacy, Terms, Delete Account, Child Safety, Community Guidelines.
5. Working deletion path (in-app or the documented email path on `/delete-account`).

## 10 · RELEASE PATH & REVIEW
Internal testing (minutes, sanity) → **Production** (org account may skip mandatory closed testing). Typical review 1–7 days; dating category regularly pulls **extended human review** — answer Console questions fast, don't resubmit-spam. First submission with complete Data safety + child-safety declaration + working creds is the single biggest approval lever.

## 11 · REJECTION-RISK REGISTER (pre-mitigated)
| Risk | State |
|---|---|
| UGC app without report/block | Covered — Phase 3 feature floor |
| Broken/missing privacy or deletion URL | Covered — pages built, Hermes hosts + verifies 200s |
| Child-safety declaration incomplete | Covered — standards page + safety@ contact |
| Reviewer can't log in | Covered — §8 review account |
| Billing policy mismatch | Avoided — v1 free, no IAP |
| Age-gate absence | Covered — DOB gate + verification |
| Metadata policy (over-claiming) | Listing copy is product-truth only, no "guaranteed matches," no restricted vocabulary |

## 12 · WHAT ONLY JOSH CAN DO — today's list
1. Request D-U-N-S (dnb.com) — the clock item.
2. Turn on Cloudflare Email Routing: `support@`, `safety@` → your inbox. Send yourself a test to each.
3. Play Console org signup the moment D-U-N-S lands ($25).
4. Paste Hermes the recon prompt (done) and then the ship directive (next file).
5. Attorney pass on the 4 legal pages before the listing goes public. They're built to be reviewed, not to replace counsel.

*Everything else in this pack is Hermes-executable from the ship directive.*
