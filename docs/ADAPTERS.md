# Adapters (T0–T4)

Agent-agnostic depth: `@acl/adapters`.

| id | target | notes |
|----|--------|-------|
| hermes | T2 | prompt + ownership_next + transcript |
| claude | T2 | transcript + handoff |
| codex | T2 | `exec` launch + handoff |
| grok-build | T2 | handoff + transcript |
| openclaude | T1 | OpenClaude CLI equal preset |
| gemini | T1 | soft detect |
| opencode | T1 | soft detect |
| aider | T1 | `--message` enrich |
| custom | T0 | always |

```ts
import { getAdapter, capabilityChip, validateHandoff } from '@acl/adapters'
capabilityChip('codex') // { label: 'T1→T2', ... }
```

Desktop right rail shows chips. Kanban **handoff** attaches validated JSON.

See also [AGENTS_AND_DEFAULTS.md](./AGENTS_AND_DEFAULTS.md).
