#!/bin/bash

REPO_ROOT="/mnt/c/ANTIGRAVITY"
COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging.example" # User will copy to .env.staging

cd "$REPO_ROOT" || exit

echo "Starting Antigravity Staging Environment (OPU-52)"
echo "--------------------------------------------------"

# Ensure .env.staging exists (or instruct user to create it)
if [ ! -f ".env.staging" ]; then
    echo "ERROR: Missing .env.staging. Please copy .env.staging.example to .env.staging in the repo root and configure it."
    exit 1
fi

echo "Building frontend for staging..."
# The Dockerfile.staging handles the build process internally, so we just need to build the service.
# Docker Compose will build the frontend-mission-control-staging service.
# We'll pass the VITE_API_URL during the docker-compose build step.

echo "Bringing up Docker Compose stack with $COMPOSE_FILE..."
# The VITE_API_URL is passed as a build argument in docker-compose.staging.yml
docker-compose -f "$COMPOSE_FILE" --env-file ".env.staging" up --build -d

echo "Waiting for services to become healthy..."

# Wait for backend-fastapi-staging to be healthy
BACKEND_HEALTH_URL="http://localhost:8788/api/v1/health"
MAX_RETRIES=20
RETRY_COUNT=0

echo "Waiting for backend at $BACKEND_HEALTH_URL"
until $(curl --output /dev/null --silent --head --fail "$BACKEND_HEALTH_URL"); do
    printf '.'
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo -e "\\nERROR: Backend service did not become healthy in time."
        docker-compose -f "$COMPOSE_FILE" --env-file ".env.staging" logs backend-fastapi-staging
        exit 1
    fi
done
echo -e "\\nBackend service is healthy."

echo "Staging environment is up and running!"
echo "-------------------------------------"
echo "Antigravity Backend API: http://localhost:8788/api/v1"
echo "Antigravity Frontend:    http://localhost:5174"
echo "Qdrant UI:               http://localhost:6336"
echo "Redis CLI (connect):     redis-cli -p 6380"
echo "OpenClaw:                http://localhost:3201"
echo "Paperclip (assumed):     http://localhost:3100"
echo "Logs:                    ./logs-staging"

echo "To stop the staging environment, run: docker-compose -f $COMPOSE_FILE down"
