# Templates

Shareable layout JSON for Agent Command Locus.

## Built-ins
| id | name |
|----|------|
| solo-ops | One term + note + agent |
| pair-review | Two agents + tests + checklist |
| fleet-3 | Three parallel agent lanes |

## Desktop
Left rail → **TEMPLATES** → apply / export / import.

Export copies JSON to clipboard. Import pastes JSON into the active project (appended below existing nodes).

## Schema (v1)
```json
{
  "id": "user-…",
  "name": "My layout",
  "description": "",
  "version": 1,
  "nodes": [
    {
      "kind": "terminal|agent|note|group",
      "x": 0, "y": 0, "w": 400, "h": 280,
      "title": "…",
      "color": "#5dffb0",
      "tags": [],
      "config": {},
      "status": "idle"
    }
  ]
}
```

No secrets in templates.
