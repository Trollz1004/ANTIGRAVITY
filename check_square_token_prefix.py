import os
import sys

sys.path.insert(0, "C:/ANTIGRAVITY/youandinotai-api")
from app.config import get_settings

def main():
    settings = get_settings()
    token = settings.square_access_token
    print(f"Token starts with: {token[:4]}")

if __name__ == '__main__':
    main()
