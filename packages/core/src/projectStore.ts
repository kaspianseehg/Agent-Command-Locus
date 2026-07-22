import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { NodeKind, NodeStatus, ProjectRecord } from "@acl/shared";

export interface LayoutNode {
  id: string;
  project_id: string;
  kind: NodeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  color: string;
  tags: string[];
  config: Record<string, unknown>;
  status: NodeStatus;
  updated_at: string;
}

interface DbShape {
  projects: ProjectRecord[];
  nodes: LayoutNode[];
}

/**
 * Phase-1 durable store (JSON). Swappable later for SQLite without changing call sites.
 * Avoids Electron/Node native ABI mismatches.
 */
export class ProjectStore {
  private filePath: string;
  private data: DbShape;

  constructor(dbPath: string) {
    // accept *.db path from callers; write sibling .json
    this.filePath = dbPath.endsWith(".json")
      ? dbPath
      : dbPath.replace(/\.db$/i, "") + ".json";
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (fs.existsSync(this.filePath)) {
      this.data = JSON.parse(fs.readFileSync(this.filePath, "utf8")) as DbShape;
      this.data.projects ||= [];
      this.data.nodes ||= [];
    } else {
      this.data = { projects: [], nodes: [] };
      this.flush();
    }
  }

  private flush(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf8");
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
    this.data.projects.push(row);
    this.flush();
    return row;
  }

  listProjects(): ProjectRecord[] {
    return [...this.data.projects].sort((a, b) =>
      b.updated_at.localeCompare(a.updated_at),
    );
  }

  getProject(id: string): ProjectRecord | undefined {
    return this.data.projects.find((p) => p.id === id);
  }

  touchProject(id: string): void {
    const p = this.getProject(id);
    if (p) {
      p.updated_at = new Date().toISOString();
      this.flush();
    }
  }

  listNodes(projectId: string): LayoutNode[] {
    return this.data.nodes.filter((n) => n.project_id === projectId);
  }

  upsertNode(node: LayoutNode): void {
    const i = this.data.nodes.findIndex((n) => n.id === node.id);
    if (i >= 0) this.data.nodes[i] = node;
    else this.data.nodes.push(node);
    this.touchProject(node.project_id);
  }

  saveLayout(projectId: string, nodes: LayoutNode[]): void {
    this.data.nodes = [
      ...this.data.nodes.filter((n) => n.project_id !== projectId),
      ...nodes.map((n) => ({ ...n, project_id: projectId })),
    ];
    this.touchProject(projectId);
  }

  deleteNode(id: string): void {
    const node = this.data.nodes.find((n) => n.id === id);
    this.data.nodes = this.data.nodes.filter((n) => n.id !== id);
    if (node) this.touchProject(node.project_id);
    else this.flush();
  }

  close(): void {
    this.flush();
  }
}
