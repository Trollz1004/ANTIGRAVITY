FROM node:20-alpine AS build

WORKDIR /app/youandinotai

COPY youandinotai/package.json youandinotai/package-lock.json ./
RUN npm ci

COPY youandinotai/ ./
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app/youandinotai

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app/youandinotai ./

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["npm", "start"]
