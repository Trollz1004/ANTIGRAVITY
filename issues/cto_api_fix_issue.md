# URGENT: API CONTAINER ISSUE FOR CTO FIX

## Problem Description

The uandinotai-app container is continuously restarting with the error:
'Error loading ASGI app. Could not import module app.main'

## Technical Details

- Dockerfile copies app directory to /app/app
- CMD tries to run 'uvicorn app.main:app'
- main.py exists at backend/fastapi-app/app/main.py
- Issue may be related to directory structure changes during repository reorganization

## Files to Check

1. backend/fastapi-app/Dockerfile
2. backend/fastapi-app/app/main.py
3. backend/fastapi-app/docker-compose.yml

## Root Cause Analysis

The issue appears to be with the volume mount in docker-compose.yml that overrides the copied app directory:

```
volumes:
  - ./app:/app/app
```

This volume mount maps the local ./app directory to /app/app in the container, which may be causing conflicts with the COPY command in the Dockerfile.

## Recommended Fix

1. Check that the local ./app directory has the correct structure and files
2. Verify that the volume mount is not masking issues with the copied files
3. Ensure proper Python package structure with **init**.py files
4. Validate that the uvicorn command path matches the actual file structure

This is blocking the backend service and needs immediate attention from the CTO.
