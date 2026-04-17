#!/usr/bin/env python3
"""
HERMES Launcher - Runs HERMES with Ollama Cloud configuration
"""
import os
import sys
import subprocess
from datetime import datetime

# Set Ollama Cloud API key
os.environ['OLLAMA_CLOUD_API_KEY'] = 'e8aca871374c46878833f1f501147df3.hAtEUBNYJmp1cVWg8-IELnVD'

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
hermes_dir = os.path.join(script_dir, '..')

# Add the HERMES directory to Python path
sys.path.insert(0, hermes_dir)

print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Starting HERMES with Ollama Cloud...")
print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] HERMES Directory: {hermes_dir}")

# Change to HERMES directory
os.chdir(hermes_dir)

# Import and run HERMES
try:
    # Add the HERMES directory to Python path
    sys.path.append(hermes_dir)
    
    # Import the HERMES loop
    import hermes_loop
    
    # Run the main function
    hermes_loop.main()
    
except Exception as e:
    print(f"[ERROR] Failed to start HERMES: {e}")
    sys.exit(1)