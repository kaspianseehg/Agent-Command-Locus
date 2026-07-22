# Adapters

## Principle

**Agent-agnostic.** Capability depth is **T0–T4 adapters**, not which company shipped the CLI.

| Tier | Meaning |
|------|---------|
| T0 | Launch / kill / title / cwd |
| T1 | Resume, permissions, usage |
| T2 | Transcript, context-link, handoff |
| T3 | Kanban + bus |
| T4 | Rich panels |

First-party presets (equal): Hermes, Claude Code, OpenAI Codex, Grok Build, Gemini, OpenCode, Aider, Custom.

Missing binary ⇒ soft failure + `installHint`. Never a product-level vendor ban.

## Adding an agent

1. Add `AgentDescriptor` (builtin or user config)
2. Implement adapter modules under `packages/adapters/` as depth grows
3. Register in settings UI

See also `docs/AGENTS_AND_DEFAULTS.md`.
