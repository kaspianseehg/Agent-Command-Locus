# Agent Command Locus (ACL)

**Spatial multi-agent command surface** — real terminals and heterogeneous agent CLIs on an infinite canvas. Any agent reaches the same capability floor via **adapters (T0–T4)**, not brand privilege.

> Status: **Phase 1 desktop** — canvas + PTY + agent T0 launch.  
> Product stance: **fully agent-agnostic** for public users.

## Who this is for

- Operators running **Claude Code, Codex, Grok Build, Hermes, Gemini, OpenCode, Aider**, or any custom CLI
- Teams that want a self-hostable canvas without SaaS lock-in
- Anyone who thinks in a **map of work** instead of a stack of tabs

ACL does **not** pick a default “winner” agent. First-party presets ship as equals. You enable what you install; missing binaries show a clear install hint, not a product ban.

## Product rules (public OSS)

- **MIT** licensed original code
- **No API keys / secrets** in this repo (see `.env.example`)
- **Agent-agnostic** — depth = adapters, not vendor name
- **nodeterm** is UX/architecture reference only (BUSL) — we do not ship their source
- Tooling product — not tied to any one operator’s money stack or internal bans

### Your machine, your prefs

Disable agents you don’t use in **local settings** (when settings UI lands; until then, ignore missing binaries). Fork-level hard bans of a vendor are out of scope for this public tree — keep personal policy in *your* environment, not in ACL’s defaults.

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

### Phase 1 features

- Electron window (contextIsolation + preload bridge)
- React Flow canvas: pan/zoom, drag, resize
- **+ Terminal** — interactive PTY (`node-pty`), tmux when available
- **+ Note** — sticky notes; layout persisted
- **+ Agent** — T0 launch for any registry preset (Claude, Codex, Hermes, Grok, Gemini, OpenCode, Aider, custom)
- Layout under app userData (`acl.json`)
- Missing agent binary → error in node + install hint, no crash

### Data location

macOS: `~/Library/Application Support/agent-command-locus/data/acl.json`  
(or `ACL_DATA_DIR`)

## Built-in agent presets

| id | Typical binary |
|----|----------------|
| hermes | `hermes` |
| claude | `claude` |
| codex | `codex` |
| grok-build | `grok` |
| gemini | `gemini` |
| opencode | `opencode` |
| aider | `aider` |
| custom | your shell / any command |

Custom entries and deeper adapters (T1–T4) are the path for new agents — same floor as builtins once adapters exist.

## Monorepo

| Path | Role |
|------|------|
| `apps/desktop` | Electron + Vite + React Flow + xterm |
| `apps/server` | Phase 3 placeholder (port **8450**) |
| `packages/core` | ProjectStore, PtyService, AgentRegistry |
| `packages/shared` | Types, builtin agent registry |
| `packages/adapters` | Per-agent adapters (expanding) |

## License

MIT — see `LICENSE`.
