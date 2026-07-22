# Repo maintenance (Coda + Hermes)

Agent Command Locus is maintained by scheduled Hermes jobs that delegate coding to **Coda/Grok**.

## Policy summary

| Item | Rule |
|------|------|
| Public replies | **Draft-only** until maintainer unlocks live mode |
| Code PRs | Coda may open + **merge when CI green** (bugs/docs/CI/deps) |
| Features | Plan in `meta/cron/plans/` → **user approval required** |
| Reports | SimpleX delivery + `meta/cron/reports/` |
| Cadence | Default **light** (see `meta/cron/POLICY.md`) |

## Human unlock phrases

- Unlock live community replies: tell Hermes **"ACL community live mode"**
- Return to drafts only: **"ACL community draft mode"**
- Allow a specific feature plan: **"approve ACL plan \<slug\>"**

## Releases

Automated via **acl-release-hygiene** and `scripts/release.sh`. See [RELEASES.md](./RELEASES.md).

## Status

See `meta/cron/STATUS.json` and latest file under `meta/cron/reports/`.

## Invariants

Agent-agnostic product · no secrets in git · skins aesthetic-only · MIT
