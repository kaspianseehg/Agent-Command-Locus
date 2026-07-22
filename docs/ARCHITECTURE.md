# Architecture

See `~/.hermes/plans/agent-command-locus/IMPLEMENTATION.md` for the full write-up.

```
Desktop / Server / Mobile-PWA
        │
   Board Core (@acl/core)
        ├── SQLite projects + kanban
        ├── PtyService (node-pty / tmux)
        ├── AgentRegistry + adapters
        └── Bus + Presence
```

Kanban model C: Board SQLite SoT + optional Hermes sync.
