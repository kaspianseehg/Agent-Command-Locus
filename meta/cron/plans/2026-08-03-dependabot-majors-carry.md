# Plan: Dependabot majors carry (npm + Actions)

**Status:** OPEN — carry only (no unattended merge)  
**Owner:** `acl-deps-weekly` (light jobs only carry STATUS one-liners)  
**Filed:** 2026-08-03 (Mon deps-weekly)  
**Live refresh:** 2026-08-03 ~12:15 PT (harvest #2) — PR-set churn after #10  
**Repo tip at refresh:** meta `4d7872b` (impl majors_only); product safe `5279da0` (#10 tsx)

## Scope (open PRs — live `gh pr list`)

| PR | Title | Class | Live (2026-08-03 ~12:10) |
|----|-------|-------|--------------------------|
| #3 | actions/setup-node 4→7 | major Actions | MERGEABLE + CLEAN + checks green |
| #4 | actions/checkout 4→7 | major Actions | MERGEABLE + CLEAN + checks green |
| #6 | react + @types/react (18→19) | major product | MERGEABLE + CLEAN + checks green |
| #8 | @xterm/xterm 5→6 | major UI | MERGEABLE + CLEAN + checks green |
| #9 | @types/node 22→26 | major types | MERGEABLE + CLEAN + checks green |
| #11 | @vitejs/plugin-react 4→6 | major tooling | MERGEABLE + **UNSTABLE** (PR-branch CI red = non_ci_noise for main) |
| #12 | vite 6.4.3→8.2.0 | major tooling | MERGEABLE + CLEAN + checks green — **supersedes #7** |

**Closed/superseded:** #7 vite 6→8 **closed** same day after #10 lockfile — replaced by **#12**.  
**Already done safe:** #5 `@xterm/addon-fit` 0.10→0.11 (2026-07-29); #10 `tsx` 4.23.1→4.23.5 (2026-08-03).  
**merged_safe:** `[5, 10]` · `prefer_first: null` · light jobs = majors_only_carry only.

## Options (ASK_HERMES)

| Option | Action | Risk |
|--------|--------|------|
| **A — batch Actions only** | Merge #3 + #4 after one smoke on a throwaway branch / sequential | Low–med (workflow syntax only) |
| **B — staged product majors** | One major family per week: e.g. vite**#12** (+ coordinate **#11** plugin-react) → xterm#8 → react#6 → types#9 | Med–high; needs desktop smoke each; fix/recheck #11 before or with vite family |
| **C — hold** | Keep majors_only_carry until human picks A/B order | Default until decision |
| **D — close/defer some** | e.g. pin @types/node to 22.x deliberately; close #9 | Policy choice |

## NEVER

- Unattended merge of majors from impl daily cap “to use the slot”
- Treat a brand-new green major (#12) as `prefer_first` / safe minor
- Freeze closed numbers (#7) in STATUS or this plan without live `gh pr list`
- `npm audit fix --force`
- Codex

## Verify when shipping any option

- [ ] CI green on the merge commit (full SHA)
- [ ] `npm audit` 0 (prod + full) after lockfile land
- [ ] Desktop typecheck / health path if product deps touch
- [ ] STATUS: drop merged PR #s from `pending_deps_plans.prs`; leave remainder
- [ ] After any lockfile merge: re-query sibling mergeable (CONFLICTING often recovers)

## Related

- Electron Option A **DONE** — `39.8.10` / plan `2026-07-26-electron-security-bump.md` closed  
- Dependabot config: `.github/dependabot.yml` present  
- Open Dependabot security alerts API: **0** open (2026-08-03)  
- Light-job path: `cron-orchestration` majors_only_carry + live PR-set re-list (pitfall 56)
