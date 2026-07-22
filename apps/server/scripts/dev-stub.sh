#!/usr/bin/env bash
# Minimal server edition scaffold — Phase 3 foundation
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${ACL_PORT:-8450}"
BIND="${ACL_BIND:-127.0.0.1}"
echo "[ACL server] Phase 3 scaffold — full WS PTY not yet wired"
echo "  bind would be ${BIND}:${PORT}"
echo "  data: ${ACL_DATA_DIR:-default userData}"
echo "  Next: express/fastify + static renderer + pty WS"
exit 0
