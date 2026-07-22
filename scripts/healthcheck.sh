#!/usr/bin/env bash
# Local health for ACL monorepo + optional live server.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== packages"
npm run build >/dev/null
npm test >/dev/null
npm run secret-scan

echo "== desktop build artifacts"
node apps/desktop/scripts/build-main.mjs >/dev/null
test -f apps/desktop/out/main/index.js
test -f apps/desktop/out/main/preload.js

PORT="${ACL_PORT:-8450}"
if curl -sf "http://127.0.0.1:${PORT}/v1/health" >/tmp/acl-health.json 2>/dev/null; then
  echo "== server live :${PORT}"
  cat /tmp/acl-health.json
  echo
else
  echo "== server not running (ok)"
fi

echo "HEALTH_OK"
