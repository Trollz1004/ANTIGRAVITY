---
title: "Safety and Verification on a Small Dating Platform, Stated Plainly"
slug: dating-app-safety-and-verification
description: "What YouAndINotAI actually checks, what it doesn't, and how its verification, payments, and location handling work in plain terms."
keywords:
  - dating app safety
  - dating app verification
  - safe online dating
  - Bot-Shield
  - video chat before meeting
  - dating app privacy
date: 2026-09-03
author: YouAndINotAI
canonical: https://youandinotai.com/blog/dating-app-safety-and-verification
---

Most dating apps talk about safety in the abstract — "your safety is our priority," a page of general tips, a report button. All of that is fine as far as it goes, but it doesn't tell you what's actually being checked before you talk to someone. This post is the plain version: what YouAndINotAI's verification system does, what it doesn't do, and how the rest of the platform is built around not collecting more than it needs to.

## The verification step: Bot-Shield

Bot-Shield is a three-part checkpoint every verified account passes:

1. It starts from the public launch flow — no separate app, no side download.
2. It combines a liveness challenge with an account-bound Square payment. The liveness check confirms a real person is present in the moment; the payment step ties the account to a real, traceable transaction instead of a free, disposable signup.
3. The verified badge is only granted once both parts clear.

Verified profiles carry one of two visible marks: a green "Verified" badge or a blue "Bot-Shield ✓" badge. Either one tells you the account passed this checkpoint. Neither one is decorative — the badge only appears after the check clears, not as a default state.

## What this doesn't claim

Here's the part that matters most and is easiest for a platform to gloss over: Bot-Shield is not government-ID verification. The platform's own age policy says so directly — the current launch flow does not check a government-issued ID in production. What's verified is liveness and account accountability, not legal identity. That's a real, useful safety layer, but it's a different claim than "we confirm who this person legally is," and conflating the two would be dishonest.

What this means practically: a verified badge tells you the account isn't a bot and isn't a throwaway. It doesn't replace the judgment you'd use meeting anyone new, whether you met them on an app or anywhere else. The badge lowers your odds of talking to a script. It doesn't eliminate every other risk that exists in meeting strangers, because no verification system can.

## Ordinary precautions still apply, and still work

None of the following is specific to this platform — it's standard advice for meeting anyone from an online platform, and it's still the most reliable safety layer available to you regardless of what a verification badge says:

- **Video chat before you meet.** The platform includes built-in video calling specifically so you can see and talk to someone live before agreeing to meet in person. A live video call is a stronger real-time check than any static photo, verified badge or not.
- **Meet in public the first time.** Choose the place, choose a public one, and don't feel obligated to justify that choice.
- **Tell someone where you're going.** A friend knowing your plans, and roughly when to expect to hear from you, costs nothing and helps in the case that matters.
- **Trust a bad feeling over a good profile.** A verified badge describes a checkpoint the account passed at signup. It says nothing about how someone treats you in conversation. Weight the conversation more than the badge.

## How location data is handled

The platform includes GPS-aware meetup discovery — browsing and creating local events by category, with a choice of search radius. The location permission is opt-in per session: nothing is stored, and nothing is tracked in the background. If you don't grant location access, meetup discovery simply doesn't have it to work with. This is a narrower approach than apps that ask for constant location access up front; the tradeoff is that you grant it when you're actually using that specific feature, not once and forever.

## What data collection actually looks like

The platform's privacy policy is short enough to summarize accurately: it collects your email address, the profile information you provide, verification-state events, payment confirmation tied to your account, and any waitlist signup you submit. It states plainly that personal data is never sold. Cookies are minimal — session cookies only, no ad trackers. Third parties involved are limited to Square for payments, Cloudflare for hosting, and FormSubmit for waitlist capture, each governed by its own privacy policy. If you want your data deleted, that's a direct email request, not a multi-step retention maze.

## Why account-bound payments are a safety feature, not just a business one

It's worth connecting a dot that isn't obvious at first: requiring an account-bound Square payment for verification and membership isn't only a revenue mechanism, it's a structural deterrent against the kind of mass, disposable fake-account behavior that makes other platforms feel unsafe. Anonymous payment links are trivial to reuse across an unlimited number of throwaway accounts. A real, account-bound transaction is not. That friction is doing real safety work, even though it looks, on the surface, like a normal checkout step.

## The honest summary

Bot-Shield verification confirms liveness and account accountability, shown as a visible badge. It does not confirm legal identity, and the platform says so rather than implying otherwise. Location data for meetups is opt-in per session and isn't stored beyond that. Personal data collected is minimal, stated plainly, and never sold. None of this replaces ordinary judgment — video chat before meeting, meeting in public, telling someone your plans — but all of it is designed to make those ordinary precautions rest on a platform that isn't working against you.

## Verify your account

If a platform that tells you plainly what it checks, and what it doesn't, sounds like the baseline it should have been all along, [start Bot-Shield verification](https://youandinotai.com/app/verify) or look at [founder membership pricing](https://youandinotai.com/#pricing). Prefer to wait and watch first? [Join the list](https://youandinotai.com/#join) for updates.
