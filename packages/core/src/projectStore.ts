import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import type { ProjectRecord } from "@acl/shared";

export class ProjectStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        cwd TEXT NOT NULL,
        settings_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        x REAL, y REAL, w REAL, h REAL,
        title TEXT,
        color TEXT,
        tags_json TEXT,
        config_json TEXT,
        status TEXT,
        updated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS kanban_cards (
        task_id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        status TEXT NOT NULL,
        assignee_agent_id TEXT,
        parents_json TEXT,
        labels_json TEXT,
        handoff_json TEXT,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL,
        archived_at TEXT
      );
    `);
  }

  createProject(name: string, cwd: string): ProjectRecord {
    const now = new Date().toISOString();
    const row: ProjectRecord = {
      id: randomUUID(),
      name,
      cwd,
      settings_json: "{}",
      created_at: now,
      updated_at: now,
    };
    this.db
      .prepare(
        `INSERT INTO projects (id, name, cwd, settings_json, created_at, updated_at)
         VALUES (@id, @name, @cwd, @settings_json, @created_at, @updated_at)`,
      )
      .run(row);
    return row;
  }

  listProjects(): ProjectRecord[] {
    return this.db
      .prepare(
        `SELECT id, name, cwd, settings_json, created_at, updated_at FROM projects ORDER BY updated_at DESC`,
      )
      .all() as ProjectRecord[];
  }

  close(): void {
    this.db.close();
  }
}
