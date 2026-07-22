# Kanban (model C)

- **Operational SoT:** ACL SQLite (`kanban_cards`)
- **Optional:** Hermes kanban sync when `HERMES_HOME` set locally
- **Conflicts:** last-writer-wins per field using `updated_at` + `updated_by`
