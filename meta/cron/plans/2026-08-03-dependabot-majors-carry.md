# Plan: Dependabot majors carry (npm + Actions)

**Status:** OPEN — carry only (no unattended merge)  
**Owner:** `acl-deps-weekly` (light jobs only carry STATUS one-liners)  
**Filed:** 2026-08-03 (Mon deps-weekly)  
**Repo tip at file:** product merge `5279da0` (#10 tsx in-range) after impl `d11991b`

## Scope (open PRs)

| PR | Title | Class | Live (2026-08-03) |
|----|-------|-------|-------------------|
| #3 | actions/setup-node 4→7 | major Actions | MERGEABLE + CLEAN + checks green |
| #4 | actions/checkout 4→7 | major Actions | MERGEABLE + CLEAN + checks green |
| #6 | react + @types/react (18→19) | major product | MERGEABLE + CLEAN + checks green |
| #7 | vite 6→8 | major tooling | MERGEABLE + CLEAN + checks green |
| #8 | @xterm/xterm 5→6 | major UI | MERGEABLE + CLEAN + checks green |
| #9 | @types/node 22→26 | major types | MERGEABLE + CLEAN + checks green |

**Already done:** #5 `@xterm/addon-fit` 0.10→0.11 (safe minor, 2026-07-29).  
**This week safe:** #10 `tsx` 4.23.1→4.23.5 (in-range, merged 2026-08-03).

## Options (ASK_HERMES)

| Option | Action | Risk |
|--------|--------|------|
| **A — batch Actions only** | Merge #3 + #4 after one smoke on a throwaway branch / sequential | Low–med (workflow syntax only) |
| **B — staged product majors** | One major family per week: e.g. vite#7 → xterm#8 → react#6 → types#9 | Med–high; needs desktop smoke each |
| **C — hold** | Keep majors_only_carry until human picks A/B order | Default until decision |
| **D — close/defer some** | e.g. pin @types/node to 22.x deliberately; close #9 | Policy choice |

## NEVER

- Unattended merge of majors from impl daily cap “to use the slot”
- `npm audit fix --force`
- Codex

## Verify when shipping any option

- [ ] CI green on the merge commit (full SHA)
- [ ] `npm audit` 0 (prod + full) after lockfile land
- [ ] Desktop typecheck / health path if product deps touch
- [ ] STATUS: drop merged PR #s from `pending_deps_plans.prs`; leave remainder

## Related

- Electron Option A **DONE** — `39.8.10` / plan `2026-07-26-electron-security-bump.md` closed  
- Dependabot config: `.github/dependabot.yml` present  
- Open Dependabot security alerts API: **0** open (2026-08-03)
