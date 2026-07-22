#!/usr/bin/env bash
# Package Agent Command Locus desktop for macOS (arm64/x64).
# Produces dist-package/Agent-Command-Locus-darwin-*/ and optional .zip
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> build packages"
npm run build

echo "==> build desktop main + renderer"
node apps/desktop/scripts/build-main.mjs
node node_modules/vite/bin/vite.js build --config apps/desktop/vite.config.ts --logLevel warn

# electron-packager needs app root with package.json main
STAGE="$ROOT/.package-stage"
rm -rf "$STAGE"
mkdir -p "$STAGE"

# Minimal electron app tree
cp apps/desktop/package.json "$STAGE/"
# point main correctly
node -e "
const fs=require('fs');
const p=JSON.parse(fs.readFileSync('$STAGE/package.json','utf8'));
p.name='agent-command-locus';
p.productName='Agent Command Locus';
p.main='out/main/index.js';
// production deps only for runtime resolve of workspace packages — bundle via asar unpack node_modules from monorepo
fs.writeFileSync('$STAGE/package.json', JSON.stringify(p,null,2));
"

mkdir -p "$STAGE/out"
cp -R apps/desktop/out/main "$STAGE/out/"
cp -R apps/desktop/out/renderer "$STAGE/out/"

# Copy runtime packages into stage node_modules
mkdir -p "$STAGE/node_modules/@acl"
for pkg in shared core adapters; do
  mkdir -p "$STAGE/node_modules/@acl/$pkg"
  cp -R "packages/$pkg/package.json" "$STAGE/node_modules/@acl/$pkg/"
  cp -R "packages/$pkg/dist" "$STAGE/node_modules/@acl/$pkg/" 2>/dev/null || true
done

# electron + node-pty + xterm deps from desktop
# Use packager with the monorepo desktop folder instead for simpler native modules
OUT="$ROOT/dist-package"
rm -rf "$OUT"
mkdir -p "$OUT"

ARCH=$(uname -m)
case "$ARCH" in
  arm64) EARCH=arm64 ;;
  x86_64) EARCH=x64 ;;
  *) EARCH=arm64 ;;
esac

echo "==> electron-packager ($EARCH)"
npx --yes electron-packager@17.1.2 apps/desktop \
  "Agent-Command-Locus" \
  --platform=darwin \
  --arch="$EARCH" \
  --out="$OUT" \
  --overwrite \
  --prune=true \
  --asar \
  --app-bundle-id=dev.acl.locus \
  --app-category-type=public.app-category.developer-tools \
  --extra-resource=README.md \
  --ignore="(src|scripts|tsconfig|vite\\.config|\\.map\$|test)"

APP_DIR=$(ls -d "$OUT"/Agent-Command-Locus-darwin-* | head -1)
echo "==> app dir: $APP_DIR"

# Ensure workspace packages inside Resources/app
RES_APP="$APP_DIR/Agent Command Locus.app/Contents/Resources/app"
if [ ! -d "$RES_APP" ]; then
  RES_APP="$APP_DIR/Agent-Command-Locus.app/Contents/Resources/app"
fi
if [ -d "$RES_APP" ]; then
  mkdir -p "$RES_APP/node_modules/@acl"
  for pkg in shared core adapters; do
    rm -rf "$RES_APP/node_modules/@acl/$pkg"
    mkdir -p "$RES_APP/node_modules/@acl/$pkg"
    cp packages/$pkg/package.json "$RES_APP/node_modules/@acl/$pkg/"
    cp -R packages/$pkg/dist "$RES_APP/node_modules/@acl/$pkg/"
  done
  # out already built into apps/desktop/out — packager includes it if not ignored
  if [ ! -d "$RES_APP/out" ]; then
    cp -R apps/desktop/out "$RES_APP/"
  fi
fi

ZIP="$OUT/Agent-Command-Locus-darwin-${EARCH}.zip"
echo "==> zip $ZIP"
ditto -c -k --sequesterRsrc --keepParent "$APP_DIR" "$ZIP"

# Optional DMG if hdiutil present
if command -v hdiutil >/dev/null 2>&1; then
  DMG="$OUT/Agent-Command-Locus-darwin-${EARCH}.dmg"
  echo "==> dmg $DMG"
  rm -f "$DMG"
  hdiutil create -volname "Agent Command Locus" -srcfolder "$APP_DIR" -ov -format UDZO "$DMG" >/dev/null
  ls -lh "$DMG"
fi

ls -lh "$ZIP"
echo "PACKAGE_OK"
rm -rf "$STAGE"
