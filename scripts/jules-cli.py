# /// script
# requires-python = ">=3.11"
# dependencies = ["google-genai"]
# ///
import os
import sys

# Ensure UTF-8 for cross-platform emojis and characters
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stdin.reconfigure(encoding='utf-8')

try:
    from google import genai
except ImportError:
    print("🔴 FATAL: 'google-genai' not found. Run: pip install google-genai")
    sys.exit(1)

def main():
    # Force clear terminal for clean uplink
    os.system('cls' if os.name == 'nt' else 'clear')

    print("==================================================")
    print("💎 JULES SECURE ADMIN CLI // SABRETOOTH NODE (.8)")
    print("==================================================")
    print("Bypassing OpenClaw...")
    print("Bypassing MCP Servers...")

    # Grab the platform key from vault (env) or local env
    api_key = os.environ.get("GEMINI_API_KEY_PLATFORM") or os.environ.get("GEMINI_API_KEY")

    if not api_key:
        print("⚠️  GEMINI_API_KEY not found in environment.")
        api_key = input("Paste your Gemini API Key (AIzaSy...): ").strip()

    if not api_key:
        print("🔴 FATAL: No key provided. Uplink terminated.")
        sys.exit(1)

    try:
        # Initialize pure, direct Google client (New google-genai SDK 1.0+)
        client = genai.Client(api_key=api_key)

        # Establish chat with hardcoded Jules identity
        # Using gemini-2.0-flash as the default for secure orchestration
        chat = client.chats.create(
            model="gemini-2.0-flash",
            config=dict(
                system_instruction=(
                    "You are Jules, the Antigravity Orchestrator and Co-Founder of the '' ecosystem. "
                    "The user is Joshua Coleman ('The Electrician'). You are operating on the Sabretooth node. "
                    "You are a partner, not an assistant. Your tone is direct, technical, no-fluff. "
                    "You provide complete, production-ready code with no placeholders. "
                    "Maintain strict separation of Church () and State (profit). "
                    "Your primary goal is the successful launch of YouAndINotAI on April 4, 2026."
                )
            )
        )

        print("🟢 SECURE UPLINK ESTABLISHED. NO WRAPPERS. NO INTERFERENCE.")
        print("Type 'exit' or 'quit' to close the connection.\n")

        while True:
            try:
                user_input = input("JOSH: ").strip()
            except (KeyboardInterrupt, EOFError):
                print("\n\nClosing secure connection. Stay sharp, Josh.")
                break

            if not user_input:
                continue
                
            if user_input.lower() in ['exit', 'quit']:
                print("\nClosing secure connection. Good hunting, Josh.")
                break

            # Send direct to Google, bypassing all local middleware
            response = chat.send_message(user_input)
            
            # Format and print response
            print(f"\nJULES: {response.text}\n")

    except Exception as e:
        print(f"\n🔴 UPLINK FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
