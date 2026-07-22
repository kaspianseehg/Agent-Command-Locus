# Security Policy

## Reporting

If you find a vulnerability in Agent Command Locus, open a **private** security advisory on GitHub
or email the maintainer. Do not file a public issue for exploitable bugs.

## Scope

- Desktop Electron app
- Server edition (HTTP/WS on loopback by default)
- Packaging scripts

## Non-goals / expected risk

- PTY sessions are full user shells. Anyone with access to a running ACL server without a password can run commands as the host user.
- Always set `ACL_SERVER_PASSWORD` before binding beyond loopback.
- No secrets belong in the repository. Use env / OS keychain only.

## Supported versions

Latest `main` only until a stable tagged release.
