# Security notes (operational)

Companion to root [SECURITY.md](../SECURITY.md).

## Defaults are local-first

- Server binds `127.0.0.1` by default
- Empty password = open on that bind (dev convenience only)

## PTY risk

A connected client can drive a full user shell. Do not expose ACL server to untrusted networks without auth and OS-level controls.

## Secrets

- Never commit `.env`, keys, or agent auth files
- Agent CLIs use **user-installed** credentials outside this repo
- `npm run secret-scan` runs in CI

## Data directory

See [DATA_DIR.md](./DATA_DIR.md). Prefer one writer process per data dir.
