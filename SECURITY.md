# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.3.x   | Yes |
| < 0.3   | Best effort |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security problems.

- Prefer GitHub **Private vulnerability reporting** on this repository, or
- Contact the maintainer via GitHub (@kaspianseehg)

Include: affected component (desktop/server), version/commit, reproduction, impact.

## Security model (summary)

- ACL runs **local-first**. Server defaults to loopback.
- PTY sessions are full user shells — network exposure is high risk.
- Always set `ACL_SERVER_PASSWORD` before binding beyond `127.0.0.1`.
- No secrets belong in the repository. Use environment variables / OS keychain.
- CI runs `npm run secret-scan`.

See also [docs/SECURITY.md](docs/SECURITY.md).
