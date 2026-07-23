# ACL maintenance cron — operator policy (v1.1)

**Repo:** https://github.com/kaspianseehg/Agent-Command-Locus  
**Local path:** `~/Desktop/Agent-Command-Locus`  
**Owner coding agent:** Coda / Grok Build (not Codex)  
**Coordinator:** Hermes (default profile)  
**Updated:** 2026-07-22 (releases)

## User policy (locked)

| # | Policy |
|---|--------|
| 1 | Cadence **default light**; may temporarily go aggressive when backlog spikes (Hermes adjusts). |
| 2 | Coda **may merge its own PRs** when CI is green. |
| 3 | **Draft-only** public replies until user says trust is unlocked. Then full auto replies. |
| 4 | Deliver **SimpleX** + durable report under `meta/cron/reports/`. |
| 5 | **Small features:** Coda may draft plans from discussions; **await user approval** via Hermes; include why-ship rationale. No silent feature ship. |

## Modes

### `COMMUNITY_REPLY_MODE`
- `draft` (current): write draft replies in `meta/cron/drafts/`; do **not** post to GitHub issues/discussions unless user/Hermes unlocks.
- `live`: post replies via `gh`.

### `IMPL_SCOPE`
- Always allowed without prior approval: bugs, docs drift, CI fixes, safe dependency bumps, secret-scan/hygiene.
- Needs user approval (via Hermes report): product features, UX changes, new adapters, anything breaking.

## Dual-signal (every job)

1. Start: append line to `meta/cron/heartbeat.log`
2. Success only: write/update `meta/cron/STATUS.json` with `status: ok` and run report path
3. Failure: `status: error` + `ASK_HERMES` block

## Paths

```
meta/cron/
  STATUS.json           # latest aggregate status
  heartbeat.log
  POLICY.md             # this file (copy or symlink intent)
  drafts/               # draft issue/discussion replies (draft mode)
  plans/                # feature plans awaiting approval
  reports/YYYY-MM-DD-*.md
```

## Jobs

| Name | Schedule (PT) | Role |
|------|----------------|------|
| acl-community-triage | 10:00 and 22:00 | Scan issues/discussions/CI; draft replies; label plan |
| acl-ci-health | 16:00 | Actions failures → fix PR or escalate |
| acl-maintenance-impl | 01:00 daily | Implement top allowed items → PR → merge if CI green |
| acl-deps-weekly | Mon 05:00 | npm audit / dependabot review |
| acl-release-hygiene | Wed 06:00 (+ after version bumps) | GitHub Release + optional mac zip/dmg |

### Releases & packages
- Source of truth: `package.json` version → tag `vX.Y.Z` → GitHub Release
- Notes from `CHANGELOG.md` section for that version
- macOS artifacts: `scripts/release.sh --publish --with-packages`
- Cron may create/update Releases without community live mode
- Only when version has no release yet, or assets missing for that tag
- Impl job that bumps version should call release check/publish at end

Cap: **≤1 implementation PR per day** unless Hermes raises for incidents.

## ASK format (end of every report)

```
ASK_HERMES:
- ...

ASK_USER:   # only product/approval
- ...
```

## Product invariants (never violate)

- Agent-agnostic (no preferred/banned vendor in product defaults)
- No secrets in git
- Skins are aesthetic-only
- MIT, no keys in repo
