Check deployment state for all surfaces. Read briefings/DEPLOY-SOURCE-OF-TRUTH.md and report:
- youandinotai.com: host, last deploy, live/stale
- onlinerecycle.org: host, last deploy, live/stale  
- ai-solutions.store: host, last deploy, live/stale
- GCR backend: last deploy SHA, live/stale
- Any UNKNOWN rows: attempt to discover via curl -I and update the file.
