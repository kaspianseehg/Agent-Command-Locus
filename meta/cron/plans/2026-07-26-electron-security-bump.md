# Plan: Electron security bump (devDependency)

**Status:** DONE — Option A shipped on branch/PR `deps/electron-security-39` (2026-07-28 backlog clearance)  
**Resolved:** electron `34.5.8` → **`39.8.10`** (`^39.8.10`)  
**Audit after:** `npm audit` → **0 vulnerabilities**  
**Also:** fixed pre-existing desktop `onUsage` typecheck; added `.github/dependabot.yml`

## Verify
- [x] npm ls electron → 39.8.10
- [x] npm audit 0
- [x] npm test pass
- [x] desktop typecheck pass
- [x] health HEALTH_OK
- [ ] CI green on PR (pending push)
- [ ] Optional: manual `npm run dev:desktop` smoke (Kas)

## Rollback
Revert the deps PR.
