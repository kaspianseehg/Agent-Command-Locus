# Agent Command Locus (ACL)

Spatial multi-agent command surface — **phosphor-lattice** HUD, real PTYs, agent-agnostic.

```
╔═ ACL ═╗
║LATTICE║
╚═══════╝
```

## Quickstart

```bash
npm install
cd apps/desktop && npx @electron/rebuild -f -w node-pty && cd ../..
npm run dev:desktop
npm run dev:server    # http://127.0.0.1:8450/canvas  and  /m
```

### Package macOS
```bash
npm run package:mac
# → dist-package/Agent-Command-Locus-darwin-arm64.zip
# → dist-package/Agent-Command-Locus-darwin-arm64.dmg
```

## Demo path (2 minutes)
1. `npm run dev:desktop`
2. **load demo** → open a terminal node
3. Inspector → live transcript tail
4. Optional: `npm run dev:server` + Settings server URL for presence
5. Left rail → templates **Pair review**

## Surfaces
| | |
|--|--|
| Desktop | Electron canvas, Kanban, inbox, adapters T0–T2 |
| Server | `/canvas` WS PTY, `/m` mobile, presence |
| Settings | `serverUrl` bridges desktop presence to server |

## Presence bridge
1. `npm run dev:server`
2. Desktop → Settings → server URL `http://127.0.0.1:8450` → save  
3. Rail shows `presence live` + peers

## License
MIT
