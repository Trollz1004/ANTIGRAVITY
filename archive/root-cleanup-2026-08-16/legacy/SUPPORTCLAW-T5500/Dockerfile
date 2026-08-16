FROM node:22-alpine
WORKDIR /app
RUN npm install express cors axios
RUN adduser -D -h /home/openclaw openclaw
COPY --chown=openclaw openclaw-gateway.js /app/
EXPOSE 18895

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:18895/health || exit 1

CMD ["node", "/app/openclaw-gateway.js"]
