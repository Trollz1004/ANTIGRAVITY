# Urgent: Fix API Container Restart Issue

## Description

The uandinotai-app container is continuously restarting with the error:
"Error loading ASGI app. Could not import module app.main"

This is a critical blocker for the backend service and needs immediate attention.

## Technical Details

- Dockerfile copies app directory to /app/app
- CMD tries to run 'uvicorn app.main:app'
- main.py exists at backend/fastapi-app/app/main.py
- Issue may be related to directory structure changes during repository reorganization

## Root Cause Analysis

The issue appears to be with the volume mount in docker-compose.yml that overrides the copied app directory:

```
volumes:
  - ./app:/app/app
```

This volume mount maps the local ./app directory to /app/app in the container, which may be causing conflicts with the COPY command in the Dockerfile.

## Files to Check

1. backend/fastapi-app/Dockerfile
2. backend/fastapi-app/app/main.py
3. backend/fastapi-app/docker-compose.yml

## Requirements

- Resolve the import error preventing container startup
- Ensure volume mounts don't conflict with application code
- Verify proper Python package structure with **init**.py files
- Test container startup and validate health checks

## Priority

Critical

## Assignee

CTO (b02a21c7-737e-4177-91ac-6d8e57805801)
