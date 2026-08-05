# Stage 1: Build TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev
RUN mkdir -p config data
EXPOSE 3099
ENV BRAIN_TRANSPORT=http
ENV BRAIN_PORT=3099

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3099/health || exit 1

CMD ["node", "dist/index.js"]
