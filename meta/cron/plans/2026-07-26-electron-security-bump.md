# Plan: Electron security bump (devDependency)

**Status:** awaiting Hermes/Coda approval + smoke window  
**Filed by:** acl-deps-weekly 2026-07-26  
**Why-ship:** clear npm audit **high** on `electron@34.5.8` (many GHSA; audit meta ≤39.8.4). Desktop app ships Electron — security debt is real even though dep is listed under `devDependencies` for the monorepo workspace.  
**Not a product feature** — allowed under IMPL_SCOPE once approved for major + smoke.

## Current

| Item | Value |
|------|--------|
| Manifest | `apps/desktop/package.json` → `"electron": "^34.3.0"` |
| Resolved | `34.5.8` (latest 34.x) |
| Audit | 1 high; fixAvailable `43.2.0` major |
| In-range patch | **none** |

## Recommended path (staged)

### Option A — conservative (preferred default)

1. Bump to **electron@^39.8.10** (or minimum **≥38.8.6** if 39 proves painful).  
2. `npm install` at repo root; rebuild native (`node-pty`) as needed.  
3. Verify: `npm test`, `npm run typecheck`, `npm run health`, desktop `npm run typecheck -w @acl/desktop`.  
4. Manual/smoke: `npm run dev:desktop` — PTY, multi-agent canvas, packaging path if time.  
5. Optional: `npm run package:mac` / release assets only if version bump ships.  
6. Re-run `npm audit`; if still high, continue to Option B.

### Option B — audit-recommended single jump

1. Bump directly to **electron@^43.2.0** (matches `npm audit fix --force` target).  
2. Same verify + desktop smoke + native rebuild.  
3. Expect more breaking surface (Electron 35–43 release notes: utility process, defaults, ASAR, etc.).

### Explicit non-goals for first PR

- No React 19 / Vite 8 / TS 7 ride-alongs  
- No `audit fix --force` without reviewing lockfile diff  
- No silent version product bump unless release hygiene job is intentionally chained

## PR shape (when approved)

- Branch: `deps/electron-security-39` or `deps/electron-security-43`  
- Title: `deps(desktop): bump electron for GHSA floor (34 → 39|43)`  
- Body: link this plan + audit before/after + smoke checklist  
- Cap: 1 deps PR; CI green; Coda may merge per POLICY when green  
- After merge: re-run deps or ci-health dual-signal; close this plan

## Smoke checklist

- [ ] `npm audit --omit=dev` still 0  
- [ ] `npm audit` electron high cleared or reduced with documented residual  
- [ ] `npm test` pass  
- [ ] `npm run typecheck` pass  
- [ ] Desktop typecheck pass  
- [ ] `node-pty` loads under new Electron  
- [ ] Dev launch: terminal PTY + canvas basic path  
- [ ] (optional) mac package script  

## Rollback

Revert the single deps PR; lockfile restores 34.5.8. No data migration.

## Decision needed

**ASK_HERMES:** Option A (39.x floor) vs Option B (43.2.0), and whether Coda may open the PR in the next maintenance window without further user approval (security/deps scope — recommended yes once option chosen).
