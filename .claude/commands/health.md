Run health checks across the stack:
1. FastAPI backend: `curl -s https://youandinotai-backend-731395189513.us-east1.run.app/health`
2. mission-mcp: check services/mission-mcp/dist/server.js exists and last build time
3. Cloudflare tunnels: check briefings/T5500-NODE-STATUS.md for last verified state
4. Square: report live product links from CLAUDE.md payments section
Report each as OK / STALE / UNKNOWN with timestamp.
