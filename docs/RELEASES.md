# Releases & packages

## How a release is cut

1. Bump `package.json` (and app versions if needed)
2. Document under `CHANGELOG.md` as `## X.Y.Z — date`
3. Merge to `main` (CI green)
4. Run:

```bash
# notes + tag + GitHub Release only
npm run release

# also build unsigned macOS zip/dmg and upload as release assets
npm run release:packages

# cron-safe probe
npm run release:check
```

Script: `scripts/release.sh`

## What cron does

Job **acl-release-hygiene** (weekly; also after version bumps):

- If `v$version` release missing → create from CHANGELOG
- Attach `dist-package/*.zip` and `*.dmg` when building packages (heavy; once per version)
- Refresh release notes when CHANGELOG section updates

## Artifacts

| Asset | Contents |
|-------|----------|
| GitHub Release | Tag, notes, optional binaries |
| `*-darwin-arm64.zip` | Packaged Electron app (unsigned) |
| `*-darwin-arm64.dmg` | Disk image (unsigned) |

Gatekeeper may warn on unsigned macOS builds — expected for OSS beta until notarization.

## npm package

This monorepo is **not** published to the public npm registry by default.  
“Packages” here means **GitHub Release assets** (desktop binaries), not `npm publish`.
