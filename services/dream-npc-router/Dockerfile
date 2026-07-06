# Build context is the REPO ROOT (see docker-compose.yml) so the workspace
# lockfile and pnpm-workspace.yaml are available, which is what makes
# --frozen-lockfile actually reproducible across builds.

FROM node:20-slim AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/dream-npc-router/package.json services/dream-npc-router/package.json
RUN pnpm install --filter @antigravity/dream-npc-router... --frozen-lockfile
COPY services/dream-npc-router services/dream-npc-router
RUN pnpm --filter @antigravity/dream-npc-router run build \
 && pnpm --filter @antigravity/dream-npc-router deploy --prod /out

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
RUN chown -R node:node /app
USER node
EXPOSE 8090
CMD ["node", "dist/server.js"]
