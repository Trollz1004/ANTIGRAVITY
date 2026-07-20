#!/usr/bin/env python
# Simple generator for more mellow caveman texts. No stop.
# Run: python youandinotai-5k/caveman-generator.py >> youandinotai-5k/more-caveman.txt

import random
import time

templates = [
    "Real {people}. No {bot}. {app}. One dollar {check}. {join}. {link}",
    "Me {like} real. You {like} real. No fake. Bot shield good. {link}",
    "{city} real. Talk true. {app} good. {link}",
    "Simple. Real. {shield}. Join now. {link}",
    "Man woman. Human only. {app}. $1. {link}",
]

words = {
    "people": ["people", "man woman", "talk"],
    "bot": ["bot", "fake", "robot"],
    "app": ["YouAndiNotAi", "this app"],
    "check": ["check", "shield", "verify"],
    "join": ["join", "try", "good"],
    "like": ["like", "want", "talk"],
    "city": ["NYC", "LA", "Chicago", "real town"],
    "shield": ["Bot-Shield", "one buck shield", "$1 check"],
}

links = [
    "https://square.link/u/Qc5mxUy7",  # Bot-Shield
    "https://youandinotai.com/",
    "https://square.link/u/cxwjcn0s",  # Founding
    "https://youandinotai.com/affiliate/",
    "https://youandinotai.com/go/josh",
]

def gen_one():
    t = random.choice(templates)
    for k, v in words.items():
        t = t.replace("{"+k+"}", random.choice(v))
    t = t.replace("{link}", random.choice(links))
    if random.random() > 0.6:
        t += " #ad"
    return t.strip()

if __name__ == "__main__":
    print("Mellow caveman more texts. Keep no stop.")
    for i in range(20):
        print(gen_one())
        time.sleep(0.1)
    print("... run again for more. Use local ollama for better if fast.")
