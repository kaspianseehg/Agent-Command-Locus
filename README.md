# Agent Command Locus (ACL)

**Spatial multi-agent command surface** — real terminals and heterogeneous agent CLIs on an infinite canvas, with equal adapter depth (T0–T4), Kanban, optional Hermes Fleet sync, server edition, and a light mobile companion.

> Status: **Phase 0 scaffold**. Desktop PTY canvas is next (Phase 1).

## Product rules

- **MIT** licensed original code
- **No API keys / secrets** in this repo (see `.env.example`)
- **No OpenAI Codex** — coding agents: Hermes, Grok Build/Coda, Claude, Gemini, opencode, custom
- **nodeterm** is UX reference only (BUSL) — we do not ship their source
- Tooling only — not coupled to any content money stack

## Monorepo

| Path | Role |
|------|------|
| `apps/desktop` | Electron shell (Phase 1) |
| `apps/server` | Headless + browser (Phase 3), default port **8450** |
| `packages/core` | Board core (SQLite, PTY later, bus) |
| `packages/shared` | Types, builtin agent registry |
| `packages/adapters` | Per-agent adapters |

## Quickstart (dev)

```bash
cd Agent-Command-Locus
npm install
npm run secret-scan
npm run typecheck
npm test
```

Phase 1 desktop:

```bash
npm run dev:desktop   # placeholder until T1.1
```

## Specs (authoritative on this machine)

- `~/.hermes/plans/agent-command-locus/SPECIFICATION.md`
- `~/.hermes/plans/agent-command-locus/IMPLEMENTATION.md`
- `~/.hermes/plans/agent-command-locus/TASKS.md`
- `~/.hermes/plans/agent-command-locus/HANDOFF.md`

## License

MIT — see `LICENSE`.
