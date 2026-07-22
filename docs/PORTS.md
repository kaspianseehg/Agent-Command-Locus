# Ports

| Service | Default | Env |
|---------|---------|-----|
| ACL server HTTP/WS | `127.0.0.1:8450` | `ACL_BIND`, `ACL_PORT` |
| Desktop Vite dev | `5173` | (dev only) |

No other ports are required for core ACL.

**Security:** keep bind on loopback unless `ACL_SERVER_PASSWORD` is set.
