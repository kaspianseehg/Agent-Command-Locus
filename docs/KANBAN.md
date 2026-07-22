# Kanban

Board lives in `@acl/core` ProjectStore (`kanban` array).

## Columns

`backlog` → `doing` → `review` → `done` · plus `blocked`

## Card fields

| Field | Meaning |
|-------|---------|
| `task_id` | Stable id |
| `title` / `body` | Human text |
| `status` | Column |
| `assignee_agent_id` | Optional agent id |
| `labels` | Tags |
| `handoff` | Validated handoff JSON (files, summary, blockers, …) |
| `updated_by` | Last writer label |

## Desktop

Right rail board + **handoff** button attaches adapter-validated handoff to a card.

## Server

`GET/POST /v1/projects/:id/kanban`

## Model C (design)

Board is source of truth in ACL storage. Optional external sync (e.g. another agent home) is future work and must not require a preferred vendor.
