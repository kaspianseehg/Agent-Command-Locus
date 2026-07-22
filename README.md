# Agent Command Locus (ACL)

**Spatial multi-agent command surface** — real terminals and heterogeneous agent CLIs on an infinite canvas, with equal adapter depth (T0–T4), Kanban (next), optional Hermes Fleet sync, server edition, and a light mobile companion.

> Status: **Phase 1 desktop** — canvas + PTY + agent T0 launch.

## Product rules

- **MIT** licensed original code
- **No API keys / secrets** in this repo (see `.env.example`)
- **No OpenAI Codex** — coding agents: Hermes, Grok Build/Coda, Claude, Gemini, opencode, custom
- **nodeterm** is UX reference only (BUSL) — we do not ship their source
- Tooling only — not coupled to any content money stack

## Quickstart

```bash
cd Agent-Command-Locus
npm install
# rebuild node-pty for Electron (macOS)
cd apps/desktop && npx @electron/rebuild -f -w node-pty && cd ../..

npm test
npm run secret-scan
npm run dev:desktop
```

### What works in Phase 1

- Electron window (contextIsolation + preload bridge)
- React Flow canvas: pan/zoom, drag, resize
- **+ Terminal** — interactive PTY (`node-pty`), tmux session when available
- **+ Note** — sticky notes, layout persisted
- **+ Agent** — T0 launch from registry (Hermes / Grok / Claude / Gemini / opencode / custom)
- Layout saved under app userData (`acl.json`)
- Missing agent binary → error in node, no crash
- No Codex in UI or registry

### Data location

macOS: `~/Library/Application Support/agent-command-locus/data/acl.json`  
(or `ACL_DATA_DIR`)

## Monorepo

| Path | Role |
|------|------|
| `apps/desktop` | Electron + Vite + React Flow + xterm |
| `apps/server` | Phase 3 placeholder (port 8450) |
| `packages/core` | ProjectStore, PtyService, AgentRegistry |
| `packages/shared` | Types, builtin agent registry |
| `packages/adapters` | Adapter stubs (Phase 2) |

## Specs

On the operator machine:

- `~/.hermes/plans/agent-command-locus/SPECIFICATION.md`
- `IMPLEMENTATION.md` / `TASKS.md` / `HANDOFF.md`

## License

MIT — see `LICENSE`.
