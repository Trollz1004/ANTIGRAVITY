# ANTIGRAVITY Frontend — Production Build (OPU-53)
# Multi-stage build: build with Vite, serve with Nginx

FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (Docker layer caching)
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
RUN if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; fi

# Copy source code
COPY . .

# Build with Vite — VITE_API_URL is passed as build arg from docker-compose
ARG VITE_API_URL=http://localhost/api/v1
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ── Production stage: serve with Nginx ──
FROM nginx:alpine AS production

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA + API-proxy config. Templated so the backend origin is injected at
# container start rather than baked in; the previous config proxied to an
# upstream group named "upstreams" that this file never defined, so nginx
# refused to start anywhere the outer nginx wasn't also present.
ENV API_UPSTREAM=http://localhost:8000
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
