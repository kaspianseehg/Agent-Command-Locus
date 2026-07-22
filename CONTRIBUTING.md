# Contributing

Thanks for helping with Agent Command Locus.

## Product stance

ACL is **agent-agnostic**:

- Do not add preferred-vendor defaults
- Do not ban or hide Claude, Codex, Hermes, Grok, Gemini, OpenCode, Aider, or Custom
- New agents: descriptor + adapter (T0–T4). Custom CLI stays first-class
- No API keys or tokens in commits

## Dev setup

```bash
npm install
cd apps/desktop && npx @electron/rebuild -f -w node-pty && cd ../..
npm test
npm run secret-scan
npm run dev:desktop
npm run dev:server   # optional
```

## Before a PR

- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run secret-scan`
- [ ] Docs updated if behavior changed
- [ ] No secrets or machine-local absolute paths in docs

## Package (macOS)

```bash
npm run package:mac
# artifacts under dist-package/ (gitignored)
```

## Templates

See [docs/TEMPLATES.md](docs/TEMPLATES.md). Keep exports secret-free.

## Code of conduct

Be respectful. No harassment. Assume good faith in technical disagreement.

## Skins

User aesthetics: [docs/SKINS.md](docs/SKINS.md). Sample: `samples/skins/`.
Do not hard-code a single brand look as the only option.
