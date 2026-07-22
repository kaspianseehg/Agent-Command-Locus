# Adapters (T0–T4)

Agent-agnostic depth: `@acl/adapters`.

| id | target | notes |
|----|--------|-------|
| claude | T2 | transcript + handoff |
| codex | T2 | `exec` launch + handoff |
| hermes | T2 | prompt + ownership_next |
| grok-build | T2 | handoff + transcript |
| gemini / opencode / aider | T1 | soft detect |
| custom | T0 | always |

```ts
import { getAdapter, capabilityChip, validateHandoff } from '@acl/adapters'
capabilityChip('codex') // { label: 'T1→T2', ... }
```

Desktop right rail shows chips. Kanban **handoff** attaches validated JSON.
