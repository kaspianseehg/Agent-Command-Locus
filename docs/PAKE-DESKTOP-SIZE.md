# Desktop size: Pake / Tauri (ACL-scoped)

Source: https://github.com/tw93/Pake  

## Scope
- **ACL desktop only** (Electron today) — optional future thin shell  
- **RR:** phone-first Capacitor — Pake does **not** replace mobile; optional Mac preview of web `dist` only  
- Other apps: optional wrappers for local web UIs (CCE, Neo4j Browser) — not product core  

## Decision
| Product | Action now |
|---------|------------|
| RR | No Pake in product path; keep Capacitor |
| ACL | Document only; Electron stays until main-process audit |
| Tooling UIs | Optional `pake-cli` experiment later |

## Pilot (when Kas asks)
```bash
pnpm add -g pake-cli
# RR web preview only
cd ~/Desktop/RR && npm run build -w @rr/web
pake ./apps/web/dist --name RR-Preview --json
```

Do not migrate ACL Electron in this pass.
