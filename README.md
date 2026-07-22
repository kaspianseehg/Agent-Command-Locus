# Agent Command Locus (ACL)

**Spatial multi-agent command surface** — phosphor-lattice HUD, real PTYs, any agent CLI.

> **Phase 1.5 + Phase 2 foundation shipped** · motif **phosphor-lattice** (unique visual identity)  
> Public product: **fully agent-agnostic**

```
╔═ ACL ═╗
║LATTICE║
╚═══════╝
```

## Quickstart (desktop)

```bash
cd Agent-Command-Locus
npm install
cd apps/desktop && npx @electron/rebuild -f -w node-pty && cd ../..
npm test && npm run secret-scan
npm run dev:desktop
```

### Desktop features (1.5 + 2 core)

- Unique **phosphor-lattice** UI (not nodeterm chrome, not generic purple AI)
- ASCII brand chrome + lattice grid background
- Multi-project switcher · demo seed · rename/color/tags
- Groups · undo/redo (⌘Z / ⌘⇧Z) · focus mode (⌘.)
- Settings: enable/disable any agent (Claude, Codex, Hermes, Grok, …)
- Terminal PTY + tmux recovery banner when `acl-*` sessions live
- Kanban columns + NEEDS YOU inbox + mark needs-you
- Agent-agnostic registry

### Server foundation (Phase 3 start)

```bash
npm run dev:server
# http://127.0.0.1:8450/health
# optional: ACL_SERVER_PASSWORD=… ACL_PORT=8450
```

JSON APIs for projects/kanban; full browser PTY canvas next.

## Visual identity

| Token | Value |
|-------|--------|
| Motif | phosphor-lattice |
| Phosphor | `#5dffb0` |
| Void | `#05080a` |
| Type | IBM Plex Mono + Syne |
| Nodes | corner-bracket frames (not soft rounded cards) |

Deliberately distinct from nodeterm’s soft mac chrome and generic agent dashboards.

## Agents

Equals: hermes, claude, **codex**, grok-build, gemini, opencode, aider, custom.

## License

MIT
