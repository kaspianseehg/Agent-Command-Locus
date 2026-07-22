#!/usr/bin/env bash
# Create/update GitHub Release for Agent Command Locus from package.json version.
#
# Usage:
#   scripts/release.sh --check              # report only (cron-safe)
#   scripts/release.sh --publish            # tag + gh release from CHANGELOG
#   scripts/release.sh --publish --with-packages   # also npm run package:mac + upload zip/dmg
#   scripts/release.sh --publish --draft    # create as draft release
#
# Rules:
# - Version source of truth: root package.json "version"
# - Tag: v$VERSION
# - Notes: CHANGELOG section for that version (fallback: generic body)
# - Never force-push tags that already exist with different SHA without --retarget (not default)
# - No secrets; assets from dist-package/ only
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="check"
WITH_PACKAGES=0
DRAFT=0

for arg in "$@"; do
  case "$arg" in
    --check) MODE="check" ;;
    --publish) MODE="publish" ;;
    --with-packages) WITH_PACKAGES=1 ;;
    --draft) DRAFT=1 ;;
    -h|--help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown arg: $arg" >&2
      exit 2
      ;;
  esac
done

VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"
REPO="${GITHUB_REPOSITORY:-kaspianseehg/Agent-Command-Locus}"

echo "==> version=$VERSION tag=$TAG mode=$MODE packages=$WITH_PACKAGES draft=$DRAFT"

if ! command -v gh >/dev/null; then
  echo "ERROR: gh CLI required" >&2
  exit 1
fi
gh auth status >/dev/null

extract_changelog() {
  local ver="$1"
  python3 - "$ver" <<'PY'
import sys, re
from pathlib import Path
ver = sys.argv[1]
text = Path("CHANGELOG.md").read_text(encoding="utf-8")
# ## 0.3.1 — ... until next ##
pat = rf"(?ms)^## {re.escape(ver)}\b.*?(?=^## |\Z)"
m = re.search(pat, text)
if not m:
    print(f"## {ver}\n\nSee CHANGELOG.md and git history.\n")
    sys.exit(0)
body = m.group(0).strip() + "\n"
print(body)
PY
}

NOTES_FILE=$(mktemp)
trap 'rm -f "$NOTES_FILE"' EXIT
extract_changelog "$VERSION" > "$NOTES_FILE"

TAG_EXISTS=0
if git ls-remote --tags origin "refs/tags/${TAG}" | grep -q .; then
  TAG_EXISTS=1
fi

RELEASE_EXISTS=0
if gh release view "$TAG" -R "$REPO" >/dev/null 2>&1; then
  RELEASE_EXISTS=1
fi

echo "tag_on_remote=$TAG_EXISTS release_exists=$RELEASE_EXISTS"

if [[ "$MODE" == "check" ]]; then
  if [[ "$RELEASE_EXISTS" -eq 1 ]]; then
    echo "OK: release $TAG already exists"
    gh release view "$TAG" -R "$REPO" --json url,isDraft,assets --jq '{url,isDraft,assets:[.assets[].name]}'
    echo "CHECK_RESULT=up_to_date"
  else
    echo "PENDING: no GitHub release for $TAG (package.json is $VERSION)"
    echo "CHECK_RESULT=needs_release"
  fi
  exit 0
fi

# --- publish ---
if [[ "$TAG_EXISTS" -eq 0 ]]; then
  echo "==> creating annotated tag $TAG"
  git tag -a "$TAG" -m "Release $TAG" 2>/dev/null || git tag "$TAG"
  git push origin "$TAG"
else
  echo "==> tag $TAG already on origin (skip retag)"
fi

if [[ "$RELEASE_EXISTS" -eq 0 ]]; then
  echo "==> creating GitHub release $TAG"
  if [[ "$DRAFT" -eq 1 ]]; then
    gh release create "$TAG" \
      -R "$REPO" \
      --title "Agent Command Locus $TAG" \
      --notes-file "$NOTES_FILE" \
      --draft
  else
    gh release create "$TAG" \
      -R "$REPO" \
      --title "Agent Command Locus $TAG" \
      --notes-file "$NOTES_FILE"
  fi
else
  echo "==> release exists; refreshing notes"
  gh release edit "$TAG" -R "$REPO" --notes-file "$NOTES_FILE" || true
fi

if [[ "$WITH_PACKAGES" -eq 1 ]]; then
  echo "==> building macOS packages (unsigned OSS builds)"
  bash scripts/package-macos.sh
  shopt -s nullglob
  ASSETS=(dist-package/*.zip dist-package/*.dmg)
  if [[ ${#ASSETS[@]} -eq 0 ]]; then
    echo "WARN: no dist-package assets found" >&2
  else
    echo "==> uploading assets: ${ASSETS[*]}"
    gh release upload "$TAG" "${ASSETS[@]}" -R "$REPO" --clobber
  fi
fi

echo "RELEASE_URL=$(gh release view "$TAG" -R "$REPO" --json url -q .url)"
echo "PUBLISH_OK=$TAG"
