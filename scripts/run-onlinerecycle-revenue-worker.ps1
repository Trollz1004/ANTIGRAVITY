[CmdletBinding()]
param(
    [string]$RepoRoot = "E:\ANTIGRAVITY",
    [int]$BatchSize = 5
)

$ErrorActionPreference = "Stop"

$stateDir = Join-Path $RepoRoot "CodeX\state"
$marketingOut = Join-Path $stateDir "onlinerecycle-marketing-pack.md"
$replyOut = Join-Path $stateDir "onlinerecycle-response-templates.md"
$cashflowOut = Join-Path $stateDir "onlinerecycle-cashflow-checklist.md"
$crosslisterScript = Join-Path $RepoRoot "scripts\ewaste-crosslister-pipeline.js"
$exportHtmlScript = Join-Path $RepoRoot "scripts\export-ebay-ready-html.js"
$latestJson = Join-Path $RepoRoot "data\ewaste-intake\output\latest-ebay-listings-batch.json"
$latestMd = Join-Path $RepoRoot "data\ewaste-intake\output\latest-ebay-listings-batch.md"
$latestHtml = Join-Path $RepoRoot "CodeX\state\ebay-ready-batch-latest.html"

New-Item -ItemType Directory -Force -Path $stateDir | Out-Null

function Assert-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $Name"
    }
}

function Write-AsciiFile {
    param(
        [string]$OutputPath,
        [string]$Content
    )

    Set-Content -Path $OutputPath -Value $Content.Trim() -Encoding ascii
}

Assert-Command "node"

$marketingPack = @"
# OnlineRecycle Marketing Pack

## Today's Cash Moves
- Publish 5 intake-ready eBay listings before noon.
- Follow up on every open intake lead older than 24 hours.
- Reach out to 3 local businesses about cleanout or surplus electronics pickup.

## Local Posts
- Central Florida electronics cleanout? OnlineRecycle can help sort pickup or drop-off options for laptops, desktops, and mixed tech.
- Mount Dora, Sorrento, and Lake County: if you have a pile of old electronics sitting around, send the intake and we will help you move it.
- Office refresh, storage cleanup, or garage tech pile? OnlineRecycle handles practical electronics intake without the runaround.
- Need old laptops or desktops out of the way? Start with the OnlineRecycle intake form and we will map out the next step.
- Businesses with surplus monitors, laptops, or towers can send a quick item summary and preferred timing to start the review.
- If you want old electronics gone and still handled responsibly, OnlineRecycle is built for local, practical intake.

## Reddit Angles
- Local cleanup angle: short post about helping Lake County residents clear old electronics without dealing with marketplace flakes first.
- Small business angle: post about office cleanouts, storage overflow, and moving old IT gear into resale or recycle channels.
- Data-security angle: post about pickup plus chain-of-custody-aware handling for laptops and office devices.

## eBay / Resale Angles
- Tested and honestly described electronics move faster than perfect-looking listings.
- Small lots of matching office gear can beat single-item drift when time is tight.
- Clear condition notes and direct shipping terms save returns.
- Fast listing throughput matters more than writing museum copy for low-dollar hardware.

## Outreach Messages
- Business IT cleanout: We help move surplus laptops, desktops, towers, and mixed electronics through a simple intake and scheduling process. If you have a batch ready for review, send a rough item count and location and we will map out the fastest next step.
- Storage or garage cleanout: If you have old electronics taking up space, send a short item list and your city and we will help figure out pickup or drop-off from there.
- School or community surplus electronics: If you have outdated but still manageable tech inventory, send the rough count, item mix, and timing and we will review the best intake option.

## Quick Replies
- Data wipe: We can discuss data wipe and chain-of-custody handling when the device type and pickup flow are confirmed.
- Accepted items: We mainly focus on common electronics like laptops, desktops, towers, monitors, and similar tech that can be reviewed for reuse or recycling.
- Pickup flow: Start with the intake, then we confirm whether pickup or drop-off makes the most sense based on item count and location.
- Where proceeds go: Net proceeds follow the platform's 60/30/10 contractual revenue disbursement model.
- Payment for devices: Payment depends on what the equipment is, its condition, and whether the batch fits our current intake flow.
- Drop-off today: Send the item summary and your time window first so we can confirm the right next step.

## One-Hour Plan
1. Publish 2 listings from the current eBay-ready batch.
2. Reply to every open intake lead.
3. Send 3 local business cleanout messages.
4. Photograph the next 5 best resale items.
5. Queue tomorrow's first 3 listings before stopping.
"@

$replyTemplatePack = @"
# OnlineRecycle Response Templates

## Drop-Off Confirmation
**Subject:** OnlineRecycle intake received

**Reply:** Thanks for reaching out to OnlineRecycle. We received your intake and can help you sort out the next step. Reply with the item type, rough quantity, and your preferred day or time window, and we will confirm whether drop-off or pickup makes the most sense.

## Pickup Lead Confirmation
**Subject:** Pickup request received

**Reply:** Thanks for sending this over. We can review pickup options for your electronics. Reply with the device count, your city, and the best day or time window for access, and we will confirm the next step. If data wipe or chain-of-custody matters for this job, include that in your reply so we handle it correctly.

## Business Bulk Inventory Reply
**Subject:** Bulk electronics intake follow-up

**Reply:** Thanks for contacting OnlineRecycle about your inventory. We can help review bulk electronics intake for business cleanouts, office refreshes, and storage overflow. Reply with an item summary, estimated quantity, location, and any deadline you are working against, and we will map out the fastest next step.

## Scheduling Follow-Up
**Subject:** Best day and time for your electronics intake

**Reply:** Quick follow-up from OnlineRecycle. What day or time window works best for you, and is this a drop-off or a pickup request? Once we have that, we can confirm the next step and keep this moving.

## Unsupported Item / Decline Reply
**Subject:** Item review follow-up

**Reply:** Thanks for checking with OnlineRecycle. Based on the item you described, this is not something we can take through our current intake process. If you want, send a photo or short description and we can confirm, otherwise your local county solid waste or recycling program is the safest next place to check.

## Processed Follow-Up
**Subject:** Intake completed

**Reply:** Thanks again for working with OnlineRecycle. Your intake has been processed on our side. If you need a follow-up for chain-of-custody, data handling, or a future batch of electronics, reply here and we will pick it up from there.
"@

$cashflowChecklist = @"
# 7-Day Cashflow Checklist for OnlineRecycle.org

## Day 1
- List 5 intake-ready items on eBay before noon.
- Follow up on every open OnlineRecycle lead from the last 72 hours.
- Sort inbound inventory into sell now, test next, and recycle only.
- Send 3 outreach messages to local businesses with old IT gear.
- Block one pickup or drop-off window on the calendar.

## Day 2
- Publish 5 more eBay listings.
- Photograph the next 10 best resale items.
- Follow up on every unanswered lead from Day 1.
- Post one local pickup offer in Facebook or Nextdoor groups.
- Reach out to one school, one office, and one storage cleanout contact.

## Day 3
- Test and grade 5 more devices for resale.
- Publish at least 3 refreshed listings from yesterday's photo batch.
- Send one bulk intake follow-up to every business lead still open.
- Confirm upcoming pickup or drop-off windows.
- Review sold items and pack anything ready to ship.

## Day 4
- Publish 5 more listings or markdown stale inventory.
- Send direct outreach to 5 local businesses or property managers.
- Review intake form submissions and close every easy reply.
- Bundle low-value gear into faster-moving lots.
- Check Square booking flow and make sure next-step links are usable.

## Day 5
- Photograph and triage the next 10 items in line.
- Publish 5 more listings with honest condition notes.
- Follow up on pickup leads that went quiet.
- Post one local cleanout offer focused on offices, storage units, or garages.
- Prepare one shipment batch so sold items leave fast.

## Day 6
- Review what actually sold and what got no traction.
- Reprice or relist slow items with better titles and photos.
- Push one more round of business cleanout outreach.
- Confirm next week's pickup and drop-off pipeline.
- Clean the intake queue so nothing older than 48 hours sits unanswered.

## Day 7
- Count listings published, leads answered, pickups booked, and sales closed.
- Move unsold low-value items into bundles or recycle-only status.
- Draft next week's top 10 resale targets from current inventory.
- Prep Monday's first 5 listings before ending the day.
- Review what made money fastest and repeat that first next week.

## Non-Negotiables
- No donation language in any public or customer-facing copy.
- Every lead gets a same-day reply when possible.
- Every pickup or drop-off needs a clear next action.
- eBay throughput matters more than perfect formatting.
- Cashflow first, clutter second, drift never.
"@

Write-AsciiFile -OutputPath $marketingOut -Content $marketingPack
Write-AsciiFile -OutputPath $replyOut -Content $replyTemplatePack
Write-AsciiFile -OutputPath $cashflowOut -Content $cashflowChecklist

& node $crosslisterScript $BatchSize
if ($LASTEXITCODE -ne 0) {
    throw "Crosslister pipeline failed."
}

& node $exportHtmlScript
if ($LASTEXITCODE -ne 0) {
    throw "HTML export failed."
}

Write-Host ""
Write-Host "Revenue worker complete." -ForegroundColor Green
Write-Host "Marketing pack: $marketingOut"
Write-Host "Reply templates: $replyOut"
Write-Host "Cashflow checklist: $cashflowOut"
Write-Host "Latest JSON: $latestJson"
Write-Host "Latest Markdown: $latestMd"
Write-Host "Latest HTML: $latestHtml"
Write-Host "Ad hoc local drafts: scripts\\Run-OnlineRecycle-LocalWorker.ps1"
