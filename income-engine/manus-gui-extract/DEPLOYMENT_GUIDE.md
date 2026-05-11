# ManusClaw - Deployment & Setup Guide

This guide covers everything needed to deploy ManusClaw and integrate it with your AI infrastructure.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Configuration](#configuration)
5. [Integrations](#integrations)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js** 22.13.0 or higher
- **pnpm** 10.4.1 or higher
- **MySQL/TiDB** 5.7+ for database
- **Git** for version control

### Required Services

- **Paperclip** instance (for task management)
- **Ollama** (local) or **Ollama Cloud** (hosted)
- **OpenRouter** API key (optional, for cloud models)
- **Manus** account (for orchestration)

### System Requirements

- **Disk Space**: 2GB minimum
- **RAM**: 4GB minimum (8GB recommended)
- **CPU**: 2 cores minimum (4+ recommended)
- **Network**: Stable internet connection

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/manusclaw.git
cd manusclaw
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create `.env.local` in the project root:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/manusclaw

# Manus OAuth
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login

# JWT Secret
JWT_SECRET=your-secret-key-here

# Owner Info
OWNER_OPEN_ID=your-manus-open-id
OWNER_NAME=Your Name

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

### 4. Set Up Database

```bash
# Generate migrations
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate
```

### 5. Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### 6. Run Tests

```bash
pnpm test
```

## Production Deployment

### 1. Build for Production

```bash
pnpm build
```

This creates:
- `dist/index.js` - Server bundle
- `dist/client/` - Client assets

### 2. Deploy to Cloud

#### Option A: Manus Hosting (Recommended)

ManusClaw is built on Manus and includes built-in hosting:

1. Go to the Manus Management UI
2. Click **Publish** button
3. Select deployment region
4. Configure custom domain (optional)
5. Deploy

#### Option B: Docker

```bash
# Build Docker image
docker build -t manusclaw:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=mysql://... \
  -e JWT_SECRET=... \
  manusclaw:latest
```

#### Option C: Railway, Render, Vercel

See `DEPLOYMENT_PROVIDERS.md` for provider-specific instructions.

### 3. Configure Production Environment

Set these environment variables in your hosting platform:

```env
NODE_ENV=production
DATABASE_URL=your-production-db-url
JWT_SECRET=your-production-secret
# ... other env vars from .env.local
```

### 4. Set Up HTTPS

- Manus hosting: Automatic SSL
- Docker/Self-hosted: Use Let's Encrypt with nginx/Apache
- Cloud providers: Built-in SSL support

### 5. Database Backups

```bash
# Automated daily backups (recommended)
mysqldump -u user -p database > backup-$(date +%Y%m%d).sql

# Restore from backup
mysql -u user -p database < backup-20260507.sql
```

## Configuration

### Paperclip Integration

1. **Get Paperclip Instance URL**
   - Local: `http://localhost:3000`
   - Cloud: Your Paperclip cloud URL

2. **Generate API Key**
   - In Paperclip: Settings → API Keys → Create New
   - Copy the key

3. **Configure in ManusClaw**
   - Open Settings → Paperclip
   - Enter API URL, API Key, Company ID
   - Click Save

### Ollama Setup

#### Local Ollama

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Start Ollama server
ollama serve

# Pull a model
ollama pull llama2

# Configure in ManusClaw
# Settings → Ollama
# Base URL: http://localhost:11434
# Leave API Key empty
```

#### Ollama Cloud

1. Sign up at https://ollama.com
2. Create API key in settings
3. Configure in ManusClaw:
   - Base URL: `https://ollama.com/v1`
   - API Key: Your Ollama Cloud API key

### OpenRouter Integration

1. Sign up at https://openrouter.ai
2. Get API key from dashboard
3. Configure in ManusClaw:
   - Base URL: `https://openrouter.ai/api/v1`
   - API Key: Your OpenRouter API key

### Manus Integration

1. Create Manus account at https://manus.im
2. Create OAuth application
3. Get credentials:
   - App ID
   - App Secret
4. Configure in environment variables

## Integrations

### Paperclip

See `PAPERCLIP_INTEGRATION.md` for complete setup guide.

**Key Features:**
- Create and assign tasks from chat
- Real-time task status updates
- Agent coordination
- Budget tracking

### Ollama

See `INTEGRATION_GUIDE.md` for Ollama setup.

**Key Features:**
- Local model inference
- No API costs
- Full model control
- Privacy-first

### Manus API

**Key Features:**
- Task orchestration
- Agent coordination
- Lead notifications
- Analytics

### FETCHER Agent

**Key Features:**
- Automated lead hunting
- Multi-source scanning
- Qualification filtering
- Owner notifications

## Troubleshooting

### Database Connection Issues

**Error**: `ECONNREFUSED` on port 3306

**Solution**:
```bash
# Check MySQL is running
sudo systemctl status mysql

# Start MySQL if stopped
sudo systemctl start mysql

# Verify connection string
echo $DATABASE_URL
```

### Ollama Connection Issues

**Error**: `Failed to connect to Ollama`

**Solution**:
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Verify base URL in settings
```

### Paperclip Authentication Issues

**Error**: `Unauthorized` or `Invalid API key`

**Solution**:
1. Verify API key in Paperclip settings
2. Check Company ID is correct
3. Ensure API key has required permissions
4. Regenerate API key if needed

### Build Errors

**Error**: `TypeScript compilation failed`

**Solution**:
```bash
# Clear build cache
rm -rf dist .next

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build
```

### Memory Issues

**Error**: `JavaScript heap out of memory`

**Solution**:
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 pnpm build

# Or in production
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

### Performance Issues

**Slow chat responses**:
- Check network latency to Ollama/OpenRouter
- Verify model is appropriate for task
- Check server CPU/memory usage
- Consider using smaller model

**Slow database queries**:
- Add database indexes
- Check query logs
- Optimize slow queries
- Consider caching

## Monitoring

### Health Checks

```bash
# Check server health
curl http://localhost:3000/health

# Check database
curl http://localhost:3000/api/health/db

# Check Ollama
curl http://localhost:11434/api/tags
```

### Logs

```bash
# View server logs
tail -f .manus-logs/devserver.log

# View browser console logs
tail -f .manus-logs/browserConsole.log

# View network requests
tail -f .manus-logs/networkRequests.log
```

### Metrics

Monitor these key metrics:

- **Response Time**: < 500ms for chat
- **Database Queries**: < 100ms
- **Model Inference**: Varies by model
- **Error Rate**: < 1%
- **Uptime**: > 99.5%

## Scaling

### Horizontal Scaling

```bash
# Run multiple instances behind load balancer
docker run -p 3000:3000 manusclaw:latest
docker run -p 3001:3000 manusclaw:latest
docker run -p 3002:3000 manusclaw:latest

# Use nginx for load balancing
```

### Vertical Scaling

- Increase server RAM to 16GB+
- Use faster CPU (4+ cores)
- Upgrade database to larger instance
- Use SSD for faster I/O

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_messages_session ON chat_messages(session_id);
CREATE INDEX idx_fetcher_logs_user ON fetcher_logs(user_id);
```

## Security

### Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use secret management (Vault, Secrets Manager)
   - Rotate API keys regularly

2. **Database**
   - Use strong passwords
   - Enable SSL connections
   - Regular backups
   - Principle of least privilege

3. **API Keys**
   - Store securely
   - Rotate quarterly
   - Use separate keys for dev/prod
   - Monitor key usage

4. **HTTPS**
   - Always use HTTPS in production
   - Use strong TLS version (1.2+)
   - Keep certificates updated

## Support

For issues or questions:

1. Check troubleshooting section above
2. Review relevant integration guide
3. Check logs in `.manus-logs/`
4. Open GitHub issue
5. Contact support@manus.im

---

**Happy deploying! 🚀**
