# Agents and defaults (public product)

## Goal

Ship a deliverable that works for **the masses**: Claude, Codex, Hermes, Grok, Gemini, OpenCode, **OpenClaude**, Aider, and arbitrary custom CLIs — without baking in one operator’s preferences.

## Invariants

1. **No preferred coding agent** in product defaults.
2. **No banned vendors** in the OSS tree.
3. **Equal registry floor** — builtins are presets; custom is first-class T0.
4. **Secrets never in git** — each user brings their own API keys / OAuth for the CLIs they run.
5. **Local policy is local** — disable agents you don’t use on your machine; don’t fork ACL to encode personal bans.
6. **Aesthetics are user-owned** — skins never change agent policy ([SKINS.md](./SKINS.md)).

## First-party presets

`packages/shared` → `BUILTIN_AGENTS`

hermes · claude · codex · grok-build · gemini · opencode · **openclaude** · aider · custom

## Operator note

If you run ACL *and* a personal agent stack with private rules, keep that policy in **your** profile/config — not in ACL’s published defaults. Treat ACL like any other user would: enable the agents you authenticate.

## Registry source

`packages/shared/src/index.ts` → `BUILTIN_AGENTS`  
Adapters: `packages/adapters`
