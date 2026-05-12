FROM node:22-alpine
WORKDIR /app
RUN npm install express cors axios
RUN adduser -D -h /home/openclaw openclaw
COPY --chown=openclaw openclaw-gateway.js /app/
EXPOSE 18895
CMD ["node", "/app/openclaw-gateway.js"]
