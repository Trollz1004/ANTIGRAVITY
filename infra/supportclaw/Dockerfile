FROM node:20-alpine

RUN npm install -g openclaw@2026.3.13

RUN adduser -D -h /home/openclaw openclaw

USER openclaw

ENV OPENCLAW_STATE_DIR=/var/lib/supportclaw/state
WORKDIR /var/lib/supportclaw/workspace

CMD ["sh", "-lc", "openclaw gateway start --config /var/lib/supportclaw/state/openclaw.json --port 18895"]
