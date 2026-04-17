# Brother's Manual Task List — YouAndINotAI Launch

## DONE (Automation handled these)
- [x] Twitter API Key, Secret, Bearer — FOUND and configured
- [x] SendGrid API Key — FOUND and configured
- [x] Gmail SMTP — already working
- [x] 24 social posts seeded in database with timestamps
- [x] 14 marketing images generated in output/memes/
- [x] 7 email sequences loaded
- [x] Vault updated on SABRETOOTH + GitHub secrets (OPUStrustForTheKidsPlatform + ENIGMA-private)

## URGENT — Do RIGHT NOW (5 min total)

### 1. Verify SendGrid sender (1 min)
- [ ] **Check Gmail (joshlcoleman@gmail.com)** for email from SendGrid
- [ ] **Click the verification link** — this enables bulk email sending
- Without this, SendGrid emails will fail!

### 2. Twitter Access Token + Secret (2 min)
We have the API keys but need the Access Token to POST tweets.
- [ ] Go to **developer.twitter.com** (login: joshlcoleman@gmail.com)
- [ ] Click your app under "Projects & Apps"
- [ ] Click **"Keys and tokens"** tab
- [ ] Under "Authentication Tokens" -> "Access Token and Secret" -> click **"Generate"**
- [ ] Copy both values into `E:\DateApp\marketing-automation\.env`:
  - `TWITTER_ACCESS_TOKEN=paste_here`
  - `TWITTER_ACCESS_SECRET=paste_here`

### 3. Reddit/Devvit API (3 min)
- [ ] Go to **developers.reddit.com** (login: joshlcoleman@gmail.com)
- [ ] Create a new app/bot
- [ ] Name: `YouAndINotAI-Monitor`, Type: **script**
- [ ] Redirect URI: `http://localhost`
- [ ] Copy client_id and secret into `.env`:
  - `REDDIT_CLIENT_ID=paste_here`
  - `REDDIT_CLIENT_SECRET=paste_here`
  - `REDDIT_USERNAME=your_reddit_username`
  - `REDDIT_PASSWORD=your_reddit_password`

## Things the automation CAN'T do — Brother does these

### PRIORITY 1 — Before Feb 14

- [ ] **Film TikTok videos** — Scripts are in `market.md`:
  - "The Bot Test" (FaceTime skit)
  - "POV: Your Match Passes the Turing Test"
  - "Checking All the Red Flags" (checklist format)
- [ ] **Upload TikToks manually** — TikTok API has restrictions, upload by hand
- [ ] **Post Reddit threads manually** (the organic-looking ones, NOT from brand account):
  - r/dating_advice: "I've been catfished by AI three times"
  - r/Tinder: meme post
  - r/OnlineDating: "Unpopular opinion: Dating apps keep you single"
  - r/unpopularopinion: "$5/month = serious" debate post

### PRIORITY 2 — Launch Day (Feb 14)

- [ ] **Go live on Instagram/TikTok** at 10 AM EST (founder face on camera)
- [ ] **Start Reddit AMA** at 2 PM EST on r/IAmA
- [ ] **Post "We're Live" video** — Record yourself, 30-60 seconds
- [ ] **Monitor DMs/comments** — Respond personally

### PRIORITY 3 — Valentine's Day Stunts (If Possible)

- [ ] **Hold signs downtown** — "Tired of dating bots? YouAndINotAI.com"
- [ ] **Film reactions** — Post to Instagram/TikTok Stories

### PRIORITY 4 — Week 1 Follow-Up

- [ ] **Respond to Reddit alerts** — Automation finds threads, you post
- [ ] **DM 50 micro-influencers** — Template in market.md
- [ ] **Post daily Stories** — Use countdown images from `output/memes/` folder

### OPTIONAL — Copy vault to T5500
SSH can't handle the full file transfer. Next time you're on T5500 directly:
```
copy \\192.168.0.8\E$\OPUSONLY\.vault\MASTER-UNIVERSAL-ENV-TROLLZ1004.env C:\OPUSONLY\.vault\
```
Or copy the file via USB drive.

## Quick Start

```powershell
cd E:\DateApp\marketing-automation
.\Start-Marketing.ps1 -Install    # One-time: install Python deps
.\Start-Marketing.ps1 -Status     # Check what's connected
.\Start-Marketing.ps1 -Memes      # Generate all meme images
.\Start-Marketing.ps1              # Start the automation daemon
```
