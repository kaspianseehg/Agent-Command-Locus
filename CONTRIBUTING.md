# Contributing

## Product stance

Agent Command Locus is **agent-agnostic**:

- Do not add preferred-vendor defaults.
- Do not ban or hide Claude, Codex, Hermes, Grok, Gemini, OpenCode, Aider, or Custom.
- New agents: descriptor + adapter tiers (T0–T4). Custom CLI must stay first-class.
- No API keys or tokens in commits.

## Dev

```bash
npm install
npm test
npm run secret-scan
npm run dev:desktop
```

## PRs

- Keep changes scoped
- Update tests when registry/adapters change
- Run `npm test` and `npm run secret-scan`

## Package (macOS)

```bash
npm run package:mac
# dist-package/*.zip and *.dmg (gitignored)
```

## Templates

See `docs/TEMPLATES.md`. Keep exports secret-free.
