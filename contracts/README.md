# Contracts

Active contract deployment is disabled.

YouAndINotAI checkout and membership verification run through Square and the
FastAPI backend. Historical contract artifacts are retained only under
`contracts/archive/` for reference.

Run:

```bash
npm run compile
```

The command is a fail-closed no-op that confirms no active on-chain deploy path
is configured.
