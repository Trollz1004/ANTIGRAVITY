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
CMD ["node", "dist/index.js"]
