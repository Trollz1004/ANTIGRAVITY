# RESOLVED: Fix API Container Restart Issue

## Description

The uandinotai-app container was continuously restarting with the error:
"Error loading ASGI app. Could not import module app.main"

## Resolution

**Status**: RESOLVED ✅ (commit `595c4739`)

The conflicting `./app:/app/app` volume mount in docker-compose.yml was removed. The volume was overriding the Dockerfile's `COPY ./app /app/app` at runtime, masking the baked-in application code.

## Root Cause

The docker-compose.yml had a volume mount:
```
volumes:
  - ./app:/app/app
```

This mapped the local `./app` directory to `/app/app` in the container, which overrode the files copied during the Docker build. In some cases (e.g., when the local directory was empty, had different content, or structure changes during repo reorganization), this caused uvicorn to fail with "Could not import module app.main" because the expected Python module structure wasn't present at runtime.

## What Was Done

1. Removed `- ./app:/app/app` volume mount from docker-compose.yml
2. Verified that remaining volume mounts (`./uploads:/app/uploads`, `../data/ewaste-intake:/app/ewaste-intake-data`) don't conflict with application code
3. Verified that the Dockerfile correctly copies the app code to `/app/app`
4. Verified Python package structure with `__init__.py` files in all sub-packages
5. Verified that `uvicorn app.main:app` resolves correctly from the WORKDIR `/app`
6. Confirmed 537 tests pass with full import chain working

## Verification

- All 537 tests pass
- Module imports verified: app.auth, app.cache, app.database, app.graphql.schema, app.middleware, app.monitoring, app.security, app.telemetry, all routers
- Coverage: 64% (threshold: 60%)

## Priority

Critical

## Assignee

CTO (b02a21c7-737e-4177-91ac-6d8e57805801)
