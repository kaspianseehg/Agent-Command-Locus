import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type {
  KanbanStatus,
  NodeKind,
  NodeStatus,
  ProjectRecord,
} from "@acl/shared";

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
  parent_group_id?: string | null;
}

export interface KanbanCardRecord {
  task_id: string;
  project_id: string;
  title: string;
  body: string;
  status: KanbanStatus;
  assignee_agent_id: string | null;
  parents: string[];
  labels: string[];
  handoff: Record<string, unknown> | null;
  updated_at: string;
  updated_by: string;
  archived_at: string | null;
}

export interface AppSettings {
  disabledAgents: string[];
  focusMode: boolean;
  customAgents: Array<{
    id: string;
    label: string;
    launchCmd: string[];
    defaultEnabled: boolean;
  }>;
  lastProjectId: string | null;
}

export interface CommentRecord {
  id: string;
  project_id: string;
  target_type: "node" | "card";
  target_id: string;
  author: string;
  body: string;
  created_at: string;
}

interface DbShape {
  version: 2;
  projects: ProjectRecord[];
  nodes: LayoutNode[];
  kanban: KanbanCardRecord[];
  settings: AppSettings;
  comments: CommentRecord[];
}

const DEFAULT_SETTINGS: AppSettings = {
  disabledAgents: [],
  focusMode: false,
  customAgents: [],
  lastProjectId: null,
};

export class ProjectStore {
  private filePath: string;
  private data: DbShape;

  constructor(dbPath: string) {
    this.filePath = dbPath.endsWith(".json")
      ? dbPath
      : dbPath.replace(/\.db$/i, "") + ".json";
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (fs.existsSync(this.filePath)) {
      const raw = JSON.parse(fs.readFileSync(this.filePath, "utf8")) as Partial<DbShape>;
      this.data = {
        version: 2,
        projects: raw.projects || [],
        nodes: raw.nodes || [],
        kanban: raw.kanban || [],
        settings: { ...DEFAULT_SETTINGS, ...(raw.settings || {}) },
        comments: (raw as { comments?: CommentRecord[] }).comments || [],
      };
    } else {
      this.data = {
        version: 2,
        projects: [],
        nodes: [],
        kanban: [],
        settings: { ...DEFAULT_SETTINGS },
        comments: [],
      };
      this.flush();
    }
  }

  private flush(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf8");
  }

  getSettings(): AppSettings {
    return { ...this.data.settings, customAgents: [...this.data.settings.customAgents] };
  }

  saveSettings(s: Partial<AppSettings>): AppSettings {
    this.data.settings = {
      ...this.data.settings,
      ...s,
      customAgents: s.customAgents ?? this.data.settings.customAgents,
      disabledAgents: s.disabledAgents ?? this.data.settings.disabledAgents,
    };
    this.flush();
    return this.getSettings();
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
    this.data.settings.lastProjectId = row.id;
    this.flush();
    return row;
  }

  renameProject(id: string, name: string): ProjectRecord | undefined {
    const p = this.getProject(id);
    if (!p) return undefined;
    p.name = name;
    p.updated_at = new Date().toISOString();
    this.flush();
    return p;
  }

  deleteProject(id: string): boolean {
    if (this.data.projects.length <= 1) return false;
    this.data.projects = this.data.projects.filter((p) => p.id !== id);
    this.data.nodes = this.data.nodes.filter((n) => n.project_id !== id);
    this.data.kanban = this.data.kanban.filter((c) => c.project_id !== id);
    if (this.data.settings.lastProjectId === id) {
      this.data.settings.lastProjectId = this.data.projects[0]?.id ?? null;
    }
    this.flush();
    return true;
  }

  setLastProject(id: string): void {
    if (this.getProject(id)) {
      this.data.settings.lastProjectId = id;
      this.flush();
    }
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
    // delete children of group
    const childIds = this.data.nodes
      .filter((n) => n.parent_group_id === id)
      .map((n) => n.id);
    this.data.nodes = this.data.nodes.filter(
      (n) => n.id !== id && n.parent_group_id !== id,
    );
    for (const cid of childIds) {
      /* already removed */
    }
    if (node) this.touchProject(node.project_id);
    else this.flush();
  }

  // --- Kanban ---
  listCards(projectId: string): KanbanCardRecord[] {
    return this.data.kanban.filter(
      (c) => c.project_id === projectId && !c.archived_at,
    );
  }

  upsertCard(card: KanbanCardRecord): void {
    const i = this.data.kanban.findIndex((c) => c.task_id === card.task_id);
    if (i >= 0) this.data.kanban[i] = card;
    else this.data.kanban.push(card);
    this.touchProject(card.project_id);
  }

  deleteCard(taskId: string): void {
    const c = this.data.kanban.find((x) => x.task_id === taskId);
    this.data.kanban = this.data.kanban.filter((x) => x.task_id !== taskId);
    if (c) this.touchProject(c.project_id);
    else this.flush();
  }

  seedSampleProject(home: string): ProjectRecord {
    const existing = this.data.projects.find((p) => p.name === "Lattice Demo");
    if (existing) {
      this.setLastProject(existing.id);
      return existing;
    }
    const p = this.createProject("Lattice Demo", home);
    const now = new Date().toISOString();
    const mk = (
      partial: Partial<LayoutNode> & Pick<LayoutNode, "kind" | "title" | "x" | "y">,
    ): LayoutNode => ({
      id: randomUUID(),
      project_id: p.id,
      w: partial.kind === "note" ? 260 : partial.kind === "group" ? 520 : 440,
      h: partial.kind === "note" ? 150 : partial.kind === "group" ? 360 : 280,
      color:
        partial.color ||
        (partial.kind === "agent"
          ? "#5dffb0"
          : partial.kind === "note"
            ? "#ffb020"
            : partial.kind === "group"
              ? "#3d5a6c"
              : "#4cc9f0"),
      tags: partial.tags || [],
      config: partial.config || {},
      status: "idle",
      updated_at: now,
      parent_group_id: null,
      ...partial,
    });
    const group = mk({
      kind: "group",
      title: "◈ OPS CELL",
      x: 40,
      y: 40,
      config: { label: "ops" },
    });
    const term = mk({
      kind: "terminal",
      title: "⬡ shell-α",
      x: 60,
      y: 90,
      parent_group_id: group.id,
    });
    const note = mk({
      kind: "note",
      title: "▤ BRIEF",
      x: 520,
      y: 60,
      config: {
        noteText:
          "ACL Lattice Demo\n\n• Spatial map > tabs\n• Agents are equals\n• NEEDS YOU will pulse here\n\n[ focus mode: ⌘. ]",
      },
    });
    const agent = mk({
      kind: "agent",
      title: "◆ agent/custom",
      x: 520,
      y: 280,
      config: { agentId: "custom", prompt: "echo ACL ready && exec $SHELL -l" },
      color: "#5dffb0",
    });
    this.saveLayout(p.id, [group, term, note, agent]);
    this.upsertCard({
      task_id: randomUUID(),
      project_id: p.id,
      title: "Wire first handoff",
      body: "Demo card — claim when agents coordinate.",
      status: "backlog",
      assignee_agent_id: null,
      parents: [],
      labels: ["demo"],
      handoff: null,
      updated_at: now,
      updated_by: "seed",
      archived_at: null,
    });
    this.upsertCard({
      task_id: randomUUID(),
      project_id: p.id,
      title: "Keep layout spatial",
      body: "Don't bury work in tabs.",
      status: "doing",
      assignee_agent_id: "custom",
      parents: [],
      labels: ["demo"],
      handoff: null,
      updated_at: now,
      updated_by: "seed",
      archived_at: null,
    });
    return p;
  }

  listComments(projectId: string): CommentRecord[] {
    return (this.data.comments || []).filter((c) => c.project_id === projectId);
  }

  addComment(input: {
    project_id: string;
    target_type: "node" | "card";
    target_id: string;
    author: string;
    body: string;
  }): CommentRecord {
    const c: CommentRecord = {
      id: randomUUID(),
      project_id: input.project_id,
      target_type: input.target_type,
      target_id: input.target_id,
      author: input.author || "anon",
      body: input.body,
      created_at: new Date().toISOString(),
    };
    if (!this.data.comments) this.data.comments = [];
    this.data.comments.push(c);
    this.touchProject(input.project_id);
    return c;
  }

  close(): void {
    this.flush();
  }
}
