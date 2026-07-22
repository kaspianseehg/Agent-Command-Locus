# Changelog

All notable changes to Agent Command Locus are documented here.

## 0.3.1 — 2026-07-22

### Added
- **User-extensible skins** — token schema, 5 builtins, `dataDir/skins/*.json`
- Settings UI: skin swatches, open folder, reload, import JSON
- `docs/SKINS.md` + `samples/skins/retro-green.json`
- **OpenClaude** as first-party equal agent/adapter preset
- README hero PNG, demo GIF, live Electron screencap (Hermes · Grok · OpenClaude)
- GitHub Discussions welcome thread

### Fixed
- Electron main bundles `@acl/*` packages (CJS exports load error)
- Bootstrap `await` in async handler for template list

## 0.3.0 — 2026-07-22

### Added
- Live **transcript tail** in desktop inspector (ring buffer + file)
- **Context-link**: drag handle → handle injects source transcript packet into target PTY
- **Usage meter** stub (~tokens / KB out) per node
- Layout **templates** (solo-ops, pair-review, fleet-3) + export/import JSON
- Peer **presence cursors** via server WS bridge
- macOS **package:mac** (zip + dmg)
- Server `/canvas` WS PTY, `/m` mobile, presence, comments
- T2 **adapters** (Claude, Codex, Hermes, Grok, …) + handoff attach
- Data-dir lock, Kanban, NEEDS YOU inbox, focus mode pulse
- `npm run health`

### Identity
- Phosphor-lattice visual system (ASCII chrome, corner brackets)
- Fully **agent-agnostic** public product

### Notes
- Usage meter is best-effort, not billing-grade
- Set `ACL_SERVER_PASSWORD` before non-loopback bind

## 0.2.0 — 2026-07-22

Phase 1.5–2 desktop + server foundation.

## 0.1.0 — 2026-07-22

Initial monorepo scaffold + Phase 1 Electron canvas/PTY.
