#!/usr/bin/env bash
# Fail on likely secrets in tracked files. No network.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  FILES=$(git ls-files)
else
  FILES=$(find . -type f ! -path './.git/*' ! -path './node_modules/*')
fi

# Patterns: private keys, common API key assignments (not .env.example empty)
FAIL=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    *.png|*.jpg|*.jpeg|*.gif|*.webp|*.ico|*.woff*|*.zip) continue ;;
    LICENSE|.gitignore) continue ;;
  esac
  if grep -nE 'BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY|AKIA[0-9A-Z]{16}|xai-[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|api[_-]?key\s*=\s*["'\''][^"'\''$\{]' "$f" 2>/dev/null; then
    echo "SECRET_SCAN_FAIL: $f"
    FAIL=1
  fi
done <<< "$FILES"

if [ "$FAIL" -ne 0 ]; then
  echo "secret-scan: FAILED"
  exit 1
fi
echo "secret-scan: ok"
