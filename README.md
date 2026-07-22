# Agent Command Locus (ACL)

**Spatial multi-agent command surface** — phosphor-lattice HUD, real PTYs, any agent CLI.

```
╔═ ACL ═╗
║LATTICE║
╚═══════╝
```

## Quickstart

### Desktop
```bash
cd Agent-Command-Locus
npm install
cd apps/desktop && npx @electron/rebuild -f -w node-pty && cd ../..
npm run dev:desktop
```

### Server (browser canvas + mobile + WS PTY)
```bash
npm run dev:server
# http://127.0.0.1:8450/           home
# http://127.0.0.1:8450/canvas    browser map + live PTY
# http://127.0.0.1:8450/m         mobile companion
# optional: ACL_SERVER_PASSWORD=…  ACL_PORT=8450  ACL_BIND=127.0.0.1
```

## What's in
- **Desktop 1.5+2:** multi-project, groups, undo/focus/settings, Kanban, NEEDS YOU inbox
- **Server 3/4:** JSON APIs, **WebSocket PTY**, presence cursors, comments, `/canvas` + `/m`
- **Agent-agnostic** presets (Claude, Codex, Hermes, Grok, Gemini, OpenCode, Aider, custom)
- Unique **phosphor-lattice** visual identity + ASCII chrome

## License
MIT
