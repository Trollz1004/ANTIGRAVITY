# test_grok.py
import os
import requests
from dotenv import load_dotenv

# Load from master vault
load_dotenv('C:/ANTIGRAVITY/briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env')

api_key = os.getenv('GROK_API_KEY')
url = "https://api.x.ai/v1/chat/completions"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}

data = {
    "messages": [
        {
            "role": "system",
            "content": "You are Enigma, the marketing agent for YouAndINotAI."
        },
        {
            "role": "user",
            "content": "Write a funny, catchy tweet about why dating humans is better than dating AI."
        }
    ],
    "model": "grok-beta",
    "stream": False,
    "temperature": 0.7
}

print("🚀 Testing Grok API...")
try:
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        result = response.json()
        print("\n✅ GROK RESPONSE:")
        print(result['choices'][0]['message']['content'])
    else:
        print(f"\n❌ ERROR: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"\n❌ FAILED: {str(e)}")
