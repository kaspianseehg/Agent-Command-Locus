# Ports

| Service | Default | Bind | Notes |
|---------|---------|------|-------|
| ACL Server | **8450** | 127.0.0.1 | Browser / mobile companion |
| ACL Bus HTTP (optional) | 8451 | 127.0.0.1 | Local agent bus |

On the operator machine that also runs Hermes, check:

`~/.hermes/docs/PORT_REGISTRY.md`

before binding anything outside the defaults. Do not steal locked Hermes ports (8000, 8010, 8765, 5225, 8100, …).
