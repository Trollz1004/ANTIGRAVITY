#!/usr/bin/env python3
"""OPU-54: Add Docker container health checks to all Dockerfiles and docker-compose configs."""

import subprocess
import os
import glob
import re

REPO = '/mnt/c/ANTIGRAVITY'
os.chdir(REPO)

def run(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    return result.stdout.strip(), result.stderr.strip(), result.returncode

def read_file(path):
    with open(path, 'r') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w') as f:
        f.write(content)

# Step 1: Update issue status to in_progress
print("=== Step 1: Update issue status to in_progress ===")
out, err, rc = run(
    'curl -fsS -X PATCH http://localhost:3100/api/issues/19f0eb05-ac4a-4580-9a00-443e243e25cc6e16 '
    '-H "Content-Type: application/json" -d \'{"status":"in_progress"}\''
)
print(f"stdout: {out}\nstderr: {err}\nrc: {rc}")

# Step 2: Find all Dockerfiles
print("\n=== Step 2: Find all Dockerfiles ===")
dockerfiles = []
for pattern in ['Dockerfile', 'Dockerfile.*']:
    dockerfiles.extend(glob.glob(os.path.join(REPO, '**', pattern), recursive=True))
# Also maxdepth 3
for root, dirs, files in os.walk(REPO):
    depth = root.replace(REPO, '').count(os.sep)
    if depth > 3:
        continue
    for f in files:
        if f.startswith('Dockerfile'):
            full = os.path.join(root, f)
            if full not in dockerfiles:
                dockerfiles.append(full)
dockerfiles = sorted(set(dockerfiles))
print(f"Found Dockerfiles: {dockerfiles}")

# Step 3: Find all docker-compose files
print("\n=== Step 3: Find all docker-compose files ===")
compose_files = []
for root, dirs, files in os.walk(REPO):
    depth = root.replace(REPO, '').count(os.sep)
    if depth > 3:
        continue
    for f in files:
        if f.startswith('docker-compose') and (f.endswith('.yml') or f.endswith('.yaml')):
            compose_files.append(os.path.join(root, f))
compose_files = sorted(set(compose_files))
print(f"Found compose files: {compose_files}")

# Print contents of each Dockerfile
for df in dockerfiles:
    print(f"\n--- {df} ---")
    print(read_file(df))

# Print contents of each compose file
for cf in compose_files:
    print(f"\n--- {cf} ---")
    print(read_file(cf))
