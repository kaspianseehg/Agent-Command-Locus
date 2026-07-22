# Architecture

Agent Command Locus is an npm workspaces monorepo.

```
┌─────────────────────────────────────────────────────────┐
│  apps/desktop (Electron)     apps/server (HTTP + WS)    │
│  phosphor-lattice UI         /canvas  /m  /v1/*         │
└─────────────────┬───────────────────────┬───────────────┘
                  │                       │
                  ▼                       ▼
         packages/core  ◄──────── packages/adapters
              │                      (T0–T2 per CLI)
              ▼
         packages/shared
         (types, BUILTIN_AGENTS)
```

## Packages

| Package | Role |
|---------|------|
| `@acl/shared` | Types, agent descriptors, schema constants |
| `@acl/core` | ProjectStore, PtyService, AgentBus, templates, transcripts, context-link, usage, locks |
| `@acl/adapters` | Per-agent launch enrich, handoff, transcript paths |
| `@acl/desktop` | Electron main + React Flow renderer |
| `@acl/server` | Loopback HTTP API, static lattice pages, WebSocket PTY + presence |

## Data

- JSON document store (ProjectStore) — projects, nodes, edges, kanban, comments, settings
- Optional `ACL_DATA_DIR`; desktop defaults under Electron `userData`
- `DataDirLock` (`.acl.lock`) discourages dual writers on one dir

## Runtime flows

1. **Terminal/agent node** → PtyService (`node-pty`, tmux when available)
2. **PTY output** → TranscriptStore (memory ring + file) + UsageMeter
3. **Context-link** → edge persisted + packet injected into target PTY
4. **Presence** → server WS `kind=events`; desktop optional bridge via `settings.serverUrl`
5. **Kanban** → cards in ProjectStore; NEEDS YOU via AgentBus inbox

## Ports

Default server: `127.0.0.1:8450` — see [PORTS.md](./PORTS.md).

## Non-goals (v0.3)

- Multi-tenant SaaS
- Vendor-locked chat SDK as the only deep path
- Billing-grade cost accounting (usage meter is best-effort)
