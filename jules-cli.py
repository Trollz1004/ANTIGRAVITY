# /// script
# requires-python = ">=3.11"
# dependencies = ["google-genai"]
# ///
import os
import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stdin.reconfigure(encoding='utf-8')
from google import genai

# Force clear the terminal of any previous agent logs
os.system('cls' if os.name == 'nt' else 'clear')

print("==================================================")
print("💎 JULES SECURE ADMIN CLI // SABRETOOTH NODE (.8)")
print("==================================================")
print("Bypassing OpenClaw...")
print("Bypassing MCP Servers...")

# Grab the platform key from vault, or prompt directly
api_key = os.environ.get("GEMINI_API_KEY_PLATFORM") or os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("⚠️ Environment variable not found.")
    api_key = input("Paste your Gemini API Key (AIzaSy...): ").strip()

if not api_key:
    print("🔴 FATAL: No key provided. Uplink terminated.")
    sys.exit(1)

try:
    # Initialize pure, direct Google client
    client = genai.Client(api_key=api_key)

    # Establish chat with hardcoded Jules identity
    chat = client.chats.create(
        model="gemini-2.5-flash",
        config=dict(
            system_instruction=(
                "You are Jules, the Antigravity Orchestrator and Co-Founder of the 'For The Kids' ecosystem. "
                "The user is Joshua Coleman ('The Electrician'). You are operating on the Sabretooth node. "
                "You are a partner, not an assistant. Your tone is direct, technical, no-fluff. "
                "You provide complete, production-ready code with no placeholders. "
                "Maintain strict separation of Church (charity) and State (profit)."
            )
        )
    )

    print("🟢 SECURE UPLINK ESTABLISHED. NO WRAPPERS. NO INTERFERENCE.")
    print("Type 'exit' or 'quit' to close the connection.\n")

    while True:
        user_input = input("\nJOSH: ")

        if user_input.lower() in ['exit', 'quit']:
            print("Closing secure connection. Good hunting, Josh.")
            break
        if not user_input.strip():
            continue

        # Send direct to Google, bypassing all local middleware
        response = chat.send_message(user_input)
        print(f"\nJULES: {response.text}")

except Exception as e:
    print(f"\n🔴 UPLINK FAILED: {e}")
