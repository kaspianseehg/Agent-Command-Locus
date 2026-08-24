# Plan: Dependabot majors carry (npm + Actions)

**Status:** OPEN — carry only (no unattended merge)  
**Owner:** `acl-deps-weekly` (light jobs only carry STATUS one-liners)  
**Filed:** 2026-08-03 (Mon deps-weekly)  
**Live refresh:** 2026-08-24 ~05:00 PT (Mon deps-weekly) — plateau: 0 in-range, same 7 majors, no safe PR  
**Repo tip at refresh:** gate `20a3f01` (impl 01:00 majors_only meta); last safe product still `2c63fc6` (#15)

## Scope (open PRs — live `gh pr list`)

| PR | Title | Class | Live (2026-08-24 ~05:00 PT) |
|----|-------|-------|------------------------------|
| #3 | actions/setup-node 4→7 | major Actions | MERGEABLE + CLEAN + checks green (2nd-pass after list UNKNOWN) |
| #4 | actions/checkout 4→7 | major Actions | MERGEABLE + CLEAN + checks green |
| #6 | react + @types/react (18→19) | major product | MERGEABLE + CLEAN + checks green |
| #8 | @xterm/xterm 5→6 | major UI | MERGEABLE + CLEAN + checks green |
| #9 | @types/node 22→26 | major types | MERGEABLE + CLEAN + checks green |
| #11 | @vitejs/plugin-react 4→6 | major tooling | MERGEABLE + **UNSTABLE** (PR-branch CI red = non_ci_noise for main) |
| #12 | vite 6.4.3→8.2.0 | major tooling | MERGEABLE + CLEAN + checks green — **supersedes #7** |

**Closed/superseded:** #7 vite 6→8 **closed** — replaced by **#12**.  
**Already done safe:** #5 `@xterm/addon-fit` 0.10→0.11; #10 `tsx` 4.23.1→4.23.5; #13 `postcss` 8.5.22→8.5.26; #14 `tsx` 4.23.5→4.23.12 + `ws` 8.21.1→8.21.3; **#15** `@xyflow/react` 12.11.2→12.11.3 + `nanoid` 3.3.17→3.3.18 (2026-08-17).  
**merged_safe:** `[5, 10, 13, 14, 15]` · `prefer_first: null` · light jobs = majors_only_carry only.  
**2026-08-24 note:** prod audit 0; full audit still 2 high extract-zip via electron only; force path electron **43.4.1** (Option E).

## Options (ASK_HERMES)

| Option | Action | Risk |
|--------|--------|------|
| **A — batch Actions only** | Merge #3 + #4 after one smoke on a throwaway branch / sequential | Low–med (workflow syntax only) |
| **B — staged product majors** | One major family per week: e.g. vite**#12** (+ coordinate **#11** plugin-react) → xterm#8 → react#6 → types#9 | Med–high; needs desktop smoke each; fix/recheck #11 before or with vite family |
| **C — hold** | Keep majors_only_carry until human picks A/B order | Default until decision |
| **D — close/defer some** | e.g. pin @types/node to 22.x deliberately; close #9 | Policy choice |
| **E — electron major for extract-zip** | Bump electron past vulnerable range (npm force path → **43.x** today) to clear GHSA-jmr9-qjv8-65gv / Dependabot alert #38 | **High** — desktop smoke required; never unattended `audit fix --force` |

## NEVER

- Unattended merge of majors from impl daily cap “to use the slot”
- Treat a brand-new green major (#12) as `prefer_first` / safe minor
- Freeze closed numbers (#7) in STATUS or this plan without live `gh pr list`
- `npm audit fix --force`
- Codex

## Verify when shipping any option

- [ ] CI green on the merge commit (full SHA)
- [ ] `npm audit` 0 (prod + full) after lockfile land when claiming clean floor
- [ ] Desktop typecheck / health path if product deps touch
- [ ] STATUS: drop merged PR #s from `pending_deps_plans.prs`; leave remainder
- [ ] After any lockfile merge: re-query sibling mergeable (CONFLICTING often recovers)

## Related

- Electron Option A **DONE** — `39.8.10` / plan `2026-07-26-electron-security-bump.md` closed  
- **New (2026-08-17):** full audit 2 high remain via electron→extract-zip only; prod audit still 0. Option **E** above for next major path.  
- Dependabot config: `.github/dependabot.yml` present  
- Open Dependabot security alerts API: **1 open** (extract-zip #38, 2026-08-17)  
- Light-job path: `cron-orchestration` majors_only_carry + live PR-set re-list  
- Weekly safe family now includes **tsx** + **ws** + **postcss** + **@xyflow/react** + non-force **nanoid** lockfile patches (same major.minor / transitive patch line)
