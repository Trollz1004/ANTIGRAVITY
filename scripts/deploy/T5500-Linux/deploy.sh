#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# ENIGMA DEPLOY SCRIPT — T5500 Linux
# Deploys and enables auto-start for the dating platform
# Run as root or with sudo
# ═══════════════════════════════════════════════════════════════════════════════

set -e

DEPLOY_DIR="/opt/dateapp"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "═══════════════════════════════════════════════════════════════"
echo " ENIGMA DEPLOY — YouAndINotAI Dating Platform"
echo " Target: $DEPLOY_DIR"
echo "═══════════════════════════════════════════════════════════════"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  Please run as root or with sudo"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose v2 not found. Please install docker-compose-plugin"
    exit 1
fi

# Check NVIDIA Container Toolkit (for Ollama GPU)
if command -v nvidia-smi &> /dev/null; then
    if ! docker info 2>/dev/null | grep -q "nvidia"; then
        echo "⚠️  NVIDIA GPU detected but container toolkit not installed."
        echo "   Install with: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html"
    fi
fi

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/backend"
mkdir -p "$DEPLOY_DIR/ai-services"
mkdir -p "$DEPLOY_DIR/marketing-engine"
mkdir -p "$DEPLOY_DIR/frontend/dist"
mkdir -p "$DEPLOY_DIR/nginx"
mkdir -p "$DEPLOY_DIR/init-scripts"
mkdir -p "$DEPLOY_DIR/logs"

# Copy docker-compose and nginx config
echo "📄 Copying configuration files..."
cp "$SCRIPT_DIR/docker-compose.yml" "$DEPLOY_DIR/"
cp "$SCRIPT_DIR/nginx/default.conf" "$DEPLOY_DIR/nginx/"

# Check for .env file
if [ ! -f "$DEPLOY_DIR/.env" ]; then
    echo "⚠️  No .env file found!"
    echo "   Creating from template..."
    cp "$SCRIPT_DIR/.env.production" "$DEPLOY_DIR/.env"
    echo ""
    echo "❗ IMPORTANT: Edit $DEPLOY_DIR/.env and fill in your secrets!"
    echo "   Then re-run this script."
    exit 1
fi

# Install systemd service
echo "🔧 Installing systemd service..."
cp "$SCRIPT_DIR/systemd/dateapp.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable dateapp

# Pull Ollama model
echo "🤖 Pulling Ollama model (this may take a while)..."
docker pull ollama/ollama:latest

# Start the stack
echo "🚀 Starting services..."
cd "$DEPLOY_DIR"
docker compose pull
docker compose up -d

# Wait for health checks
echo "⏳ Waiting for services to become healthy..."
sleep 30

# Pull llama model into Ollama
echo "🧠 Pulling llama3.2 model into Ollama..."
docker exec dateapp-ollama ollama pull llama3.2 || echo "⚠️  Could not pull model. Do this manually: docker exec -it dateapp-ollama ollama pull llama3.2"

# Show status
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " ✅ DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo " Services:"
docker compose ps
echo ""
echo " Endpoints:"
echo "   Frontend:  http://localhost:8080"
echo "   Backend:   http://localhost:3000/health"
echo "   AI:        http://localhost:3002/health"
echo "   Marketing: http://localhost:4000/health"
echo ""
echo " Auto-start enabled: systemctl status dateapp"
echo "═══════════════════════════════════════════════════════════════"
