#!/usr/bin/env python3
"""
TWITTER BLITZ - Bulk Tweet Poster & URL Scraper
YouAndINotAI Marketing Automation
Usage: python twitter-blitz.py [post|scrape|both]

Requires: .env file in same directory with Twitter API keys
"""

import tweepy
import json
import os
import time
import sys
from pathlib import Path
from datetime import datetime

# --- CONFIG ---
SCRIPT_DIR = Path(__file__).parent
ENV_FILE = SCRIPT_DIR / ".env"
TRACKER_FILE = SCRIPT_DIR.parent / "marketing-automation" / "post-tracker.json"
QUEUE_FILE = SCRIPT_DIR.parent / "TASK-QUEUE-100.md"

BRAND = {
    "domain": "youandinotai.com",
    "usp": "V8 Cloud Verification",
    "price": "$14.99/mo",
    "handle": "@YouAndiNotAi",
}

# Tier 3 cities (not yet posted)
TIER3_CITIES = [
    ("El Paso", "TX", ["#ElPaso", "#Texas"]),
    ("Detroit", "MI", ["#Detroit", "#Michigan"]),
    ("Fresno", "CA", ["#Fresno", "#California"]),
    ("Mesa", "AZ", ["#Mesa", "#Arizona"]),
    ("Bakersfield", "CA", ["#Bakersfield", "#California"]),
    ("Aurora", "CO", ["#Aurora", "#Colorado"]),
    ("Stockton", "CA", ["#Stockton", "#California"]),
    ("Henderson", "NV", ["#Henderson", "#Nevada"]),
    ("Newark", "NJ", ["#Newark", "#NewJersey"]),
    ("Rochester", "NY", ["#Rochester", "#NewYork"]),
    ("Toledo", "OH", ["#Toledo", "#Ohio"]),
    ("Buffalo", "NY", ["#Buffalo", "#NewYork"]),
    ("Anchorage", "AK", ["#Anchorage", "#Alaska"]),
    ("Lexington", "KY", ["#Lexington", "#Kentucky"]),
    ("Plano", "TX", ["#Plano", "#Texas"]),
    ("Chandler", "AZ", ["#Chandler", "#Arizona"]),
    ("Scottsdale", "AZ", ["#Scottsdale", "#Arizona"]),
    ("Madison", "WI", ["#Madison", "#Wisconsin"]),
    ("Durham", "NC", ["#Durham", "#NorthCarolina"]),
    ("Savannah", "GA", ["#Savannah", "#Georgia"]),
    ("Charleston", "SC", ["#Charleston", "#SouthCarolina"]),
    ("Knoxville", "TN", ["#Knoxville", "#Tennessee"]),
    ("Chattanooga", "TN", ["#Chattanooga", "#Tennessee"]),
    ("Little Rock", "AR", ["#LittleRock", "#Arkansas"]),
    ("Springfield", "MO", ["#Springfield", "#Missouri"]),
    ("Huntsville", "AL", ["#Huntsville", "#Alabama"]),
    ("Grand Rapids", "MI", ["#GrandRapids", "#Michigan"]),
    ("Des Moines", "IA", ["#DesMoines", "#Iowa"]),
    ("Tallahassee", "FL", ["#Tallahassee", "#Florida"]),
    ("Baton Rouge", "LA", ["#BatonRouge", "#Louisiana"]),
    ("Providence", "RI", ["#Providence", "#RhodeIsland"]),
    ("Spokane", "WA", ["#Spokane", "#Washington"]),
    ("Tacoma", "WA", ["#Tacoma", "#Washington"]),
    ("Greensboro", "NC", ["#Greensboro", "#NorthCarolina"]),
    ("Winston Salem", "NC", ["#WinstonSalem", "#NorthCarolina"]),
    ("Dayton", "OH", ["#Dayton", "#Ohio"]),
    ("Akron", "OH", ["#Akron", "#Ohio"]),
    ("Tulsa", "OK", ["#Tulsa", "#Oklahoma"]),
    ("Wichita", "KS", ["#Wichita", "#Kansas"]),
    ("Laredo", "TX", ["#Laredo", "#Texas"]),
    ("Lubbock", "TX", ["#Lubbock", "#Texas"]),
    ("Corpus Christi", "TX", ["#CorpusChristi", "#Texas"]),
    ("Reno", "NV", ["#Reno", "#Nevada"]),
    ("Fayetteville", "AR", ["#Fayetteville", "#Arkansas"]),
    ("Columbia", "SC", ["#Columbia", "#SouthCarolina"]),
    ("Augusta", "GA", ["#Augusta", "#Georgia"]),
    ("Macon", "GA", ["#Macon", "#Georgia"]),
    ("Jackson", "MS", ["#Jackson", "#Mississippi"]),
    ("Sioux Falls", "SD", ["#SiouxFalls", "#SouthDakota"]),
    ("Fargo", "ND", ["#Fargo", "#NorthDakota"]),
]

# Tweet templates - rotated for variety
TEMPLATES = [
    "{city}'s dating scene just changed. {usp} = zero bots, real connections. {price}/mo founding price locked forever. Only 100 spots left.\n\n{domain}\n\n{tags} #DatingApp ",
    "{city}, are you tired of fake profiles? V8 Cloud Verified. Real humans only. 100 founding members at {price}/mo forever.\n\n{domain}\n\n{tags} #DatingApp ",
    "{city} deserves real connections. 60% of dating app matches are suspected bots—not us. {usp} + {price}/mo founding price (locked).\n\n{domain}\n\n{tags} #DatingApp ",
    "{city} singles: What if your dating app actually verified real humans? V8 Cloud tech. 100 founding spots at {price}/mo forever.\n\n{domain}\n\n{tags} #DatingApp ",
    "{city}, stop swiping on bots. Join 100 founding members with {usp}. Real humans only. {price}/mo locked forever.\n\n{domain}\n\n{tags} #DatingApp ",
    "Only 100 founding spots left in {city}. Real humans. {usp}. {price}/mo price locked forever. No bots. No games.\n\n{domain}\n\n{tags} #DatingApp ",
]


def load_env():
    """Load .env file into os.environ"""
    if not ENV_FILE.exists():
        print(f"[!] No .env file found at {ENV_FILE}")
        print(f"[!] Copy keys from Sabretooth vault:")
        print(f"    TWITTER_API_KEY=...")
        print(f"    TWITTER_API_SECRET=...")
        print(f"    TWITTER_ACCESS_TOKEN=...")
        print(f"    TWITTER_ACCESS_SECRET=...")
        sys.exit(1)

    with open(ENV_FILE, encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()


def get_client():
    """Create authenticated tweepy client"""
    client = tweepy.Client(
        consumer_key=os.environ["TWITTER_API_KEY"],
        consumer_secret=os.environ["TWITTER_API_SECRET"],
        access_token=os.environ["TWITTER_ACCESS_TOKEN"],
        access_token_secret=os.environ["TWITTER_ACCESS_SECRET"],
    )
    # Verify
    me = client.get_me()
    print(f"[+] Authenticated as @{me.data.username} (id: {me.data.id})")
    return client, me.data.id


def generate_tweet(city, state, tags, index):
    """Generate tweet text from template"""
    template = TEMPLATES[index % len(TEMPLATES)]
    tag_str = " ".join(tags)
    return template.format(
        city=city,
        usp=BRAND["usp"],
        price=BRAND["price"],
        domain=BRAND["domain"],
        tags=tag_str,
    )


def post_tweets(client, user_id, dry_run=False):
    """Post all Tier 3 city tweets with rate limiting"""
    results = []
    for i, (city, state, tags) in enumerate(TIER3_CITIES):
        text = generate_tweet(city, state, tags, i)

        if dry_run:
            print(f"[DRY] {i+1}. {city}, {state}: {text[:80]}...")
            results.append({"city": city, "state": state, "status": "dry_run"})
            continue

        try:
            response = client.create_tweet(text=text)
            tweet_id = response.data["id"]
            url = f"https://x.com/{BRAND['handle'].lstrip('@')}/status/{tweet_id}"
            print(f"[+] {i+1}. {city}, {state} | {url}")
            results.append({
                "city": city,
                "state": state,
                "tweet_id": tweet_id,
                "url": url,
                "posted": datetime.now().isoformat(),
            })
            # Rate limit: Twitter allows ~50 tweets/15min on free tier
            # Space them 20 seconds apart to be safe
            if i < len(TIER3_CITIES) - 1:
                time.sleep(20)
        except tweepy.TooManyRequests:
            print(f"[!] Rate limited at tweet {i+1}. Waiting 15 minutes...")
            time.sleep(900)
            # Retry
            try:
                response = client.create_tweet(text=text)
                tweet_id = response.data["id"]
                url = f"https://x.com/{BRAND['handle'].lstrip('@')}/status/{tweet_id}"
                print(f"[+] {i+1}. {city}, {state} | {url}")
                results.append({
                    "city": city, "state": state, "tweet_id": tweet_id,
                    "url": url, "posted": datetime.now().isoformat(),
                })
            except Exception as e:
                print(f"[X] {i+1}. {city}, {state} FAILED: {e}")
                results.append({"city": city, "state": state, "error": str(e)})
        except tweepy.Forbidden as e:
            if "duplicate" in str(e).lower():
                print(f"[=] {i+1}. {city}, {state} DUPLICATE (already posted)")
                results.append({"city": city, "state": state, "status": "duplicate"})
            else:
                print(f"[X] {i+1}. {city}, {state} FORBIDDEN: {e}")
                results.append({"city": city, "state": state, "error": str(e)})
        except Exception as e:
            print(f"[X] {i+1}. {city}, {state} ERROR: {e}")
            results.append({"city": city, "state": state, "error": str(e)})

    # Save results
    out_file = SCRIPT_DIR / f"tweet-results-{datetime.now().strftime('%Y%m%d-%H%M')}.json"
    with open(out_file, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n[+] Results saved to {out_file}")
    return results


def scrape_tweets(client, user_id):
    """Get all tweets from the account and their URLs"""
    print("[*] Fetching all tweets from account...")
    tweets = []
    paginator = tweepy.Paginator(
        client.get_users_tweets,
        user_id,
        max_results=100,
        tweet_fields=["created_at", "text", "public_metrics"],
    )
    for page in paginator:
        if page.data:
            for tweet in page.data:
                url = f"https://x.com/{BRAND['handle'].lstrip('@')}/status/{tweet.id}"
                tweets.append({
                    "id": str(tweet.id),
                    "text": tweet.text[:100],
                    "url": url,
                    "created_at": str(tweet.created_at) if tweet.created_at else None,
                    "metrics": dict(tweet.public_metrics) if tweet.public_metrics else {},
                })
                print(f"  [{len(tweets)}] {tweet.text[:60]}... | {url}")

    out_file = SCRIPT_DIR / f"all-tweets-{datetime.now().strftime('%Y%m%d-%H%M')}.json"
    with open(out_file, "w") as f:
        json.dump(tweets, f, indent=2)
    print(f"\n[+] {len(tweets)} tweets scraped to {out_file}")
    return tweets


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "both"
    dry_run = "--dry" in sys.argv

    print("=" * 60)
    print("  TWITTER BLITZ - YouAndINotAI Marketing")
    print(f"  Mode: {mode} | Dry Run: {dry_run}")
    print(f"  Cities: {len(TIER3_CITIES)} Tier 3")
    print("=" * 60)

    load_env()
    client, user_id = get_client()

    if mode in ("post", "both"):
        print(f"\n--- POSTING {len(TIER3_CITIES)} TWEETS ---")
        post_tweets(client, user_id, dry_run=dry_run)

    if mode in ("scrape", "both"):
        print(f"\n--- SCRAPING ALL TWEETS ---")
        scrape_tweets(client, user_id)

    print("\n[+] BLITZ COMPLETE")


if __name__ == "__main__":
    main()
