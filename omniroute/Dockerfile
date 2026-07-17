# OmniRouter — Multi-provider LLM routing dashboard
# Base: node:24-trixie-slim, Turbopack build, port 20128 (dashboard) + 20129 (API)

FROM node:24-trixie-slim AS builder

WORKDIR /app

# Enable Turbopack (faster builds)
ENV TURBOPACK=1

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json pnpm-lock.yaml* package-lock.json* ./

# Install deps
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile || npm ci

# Copy source
COPY . .

# Build
RUN pnpm build || npm run build

# Runtime stage
FROM node:24-trixie-slim

WORKDIR /app

ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=1024" \
    DASHBOARD_PORT=20128 \
    API_PORT=20129 \
    HOST=0.0.0.0

# Install runtime deps (optional: chromium for web profile)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 20128 20129

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=30s \
    CMD curl -f http://localhost:20128/health || exit 1

CMD ["node", "dist/server.js"]
