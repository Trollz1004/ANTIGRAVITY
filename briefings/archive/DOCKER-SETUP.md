# Docker Setup Guide for ANTIGRAVITY

## Current Status
- **Issue**: Docker is not installed on SABRETOOTH (C:\ANTIGRAVITY)
- **Configuration Updated**: `.claude/settings.json` now includes Docker settings
- **Paths Fixed**: docker-compose.yml uses relative paths instead of absolute Windows paths

## Installation Steps

### 1. Install Docker Desktop for Windows
1. Download from: https://www.docker.com/products/docker-desktop
2. Run the installer as Administrator
3. Enable WSL 2 backend (recommended for Windows 10)
4. Restart Windows after installation

### 2. Verify Installation
```bash
docker --version
docker-compose --version
docker ps
```

### 3. Configure Docker Service
After installation, Docker Desktop should auto-start. If not:
- Open Docker Desktop application
- Settings → General → Start Docker Desktop when you log in (enable)

## Running Docker Services

### Local Development (SABRETOOTH - C:\ANTIGRAVITY)

**OpenClaw + Redis + Qdrant Stack:**
```bash
cd C:\ANTIGRAVITY
docker-compose up -d
```

**YouAndINotAI App Stack:**
```bash
cd C:\ANTIGRAVITY\backend\fastapi-app
docker-compose up -d
```

**View Running Containers:**
```bash
docker ps
docker-compose logs -f
```

**Stop All Services:**
```bash
docker-compose down
```

### Remote Docker (T5500 Node - 192.168.0.15)

According to CLAUDE.md, Docker services are primarily configured to run on T5500 (Linux node).

To connect to remote Docker:
```bash
export DOCKER_HOST=ssh://joshl@192.168.0.15
docker ps  # Now points to T5500
```

Or configure in .env:
```
DOCKER_HOST=ssh://joshl@192.168.0.15
```

## Troubleshooting

**"docker: command not found"**
- Docker Desktop is not installed or not in PATH
- Follow Installation Steps above
- Restart terminal/PowerShell after installing

**Permission Denied**
- Ensure Docker Desktop is running
- Windows user may need to be added to docker-users group
- Restart after group change

**Volume Mount Issues**
- Windows paths must use forward slashes in docker-compose.yml
- ✅ FIXED: Changed `E:/ANTIGRAVITY/logs` → `./logs` (relative path)
- Docker Desktop handles mount translation automatically

**Port Already in Use**
```bash
# Find process using port (e.g., 6379 for Redis)
netstat -ano | findstr :6379

# Kill process
taskkill /PID <PID> /F
```

## Environment Configuration

Claude Code settings now include:
- `DOCKER_HOST`: Unix socket (WSL 2) or SSH to T5500
- `COMPOSE_PROJECT_NAME`: antigravity (consistent naming)
- Permissions pre-configured for docker/docker-compose commands

## Notes
- Logs directory is created automatically on first `docker-compose up`
- All containers use `restart: unless-stopped` for auto-recovery
- Health checks are configured for critical services (postgres, uandinotai-app)
