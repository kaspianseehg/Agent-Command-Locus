import type { LayoutNode } from "./projectStore.js";
import { randomUUID } from "node:crypto";

export type LayoutTemplate = {
  id: string;
  name: string;
  description: string;
  version: 1;
  nodes: Array<
    Omit<LayoutNode, "id" | "project_id" | "updated_at"> & {
      id?: string;
    }
  >;
};

export const BUILTIN_TEMPLATES: LayoutTemplate[] = [
  {
    id: "solo-ops",
    name: "Solo ops",
    description: "One terminal + note + agent slot",
    version: 1,
    nodes: [
      {
        kind: "terminal",
        x: 80,
        y: 100,
        w: 520,
        h: 320,
        title: "⬡ shell",
        color: "#4cc9f0",
        tags: ["ops"],
        config: {},
        status: "idle",
      },
      {
        kind: "note",
        x: 640,
        y: 100,
        w: 280,
        h: 180,
        title: "◈ brief",
        color: "#ffb020",
        tags: [],
        config: { noteText: "Mission notes…" },
        status: "idle",
      },
      {
        kind: "agent",
        x: 640,
        y: 320,
        w: 420,
        h: 280,
        title: "◆ agent",
        color: "#5dffb0",
        tags: [],
        config: { agentId: "custom" },
        status: "idle",
      },
    ],
  },
  {
    id: "pair-review",
    name: "Pair review",
    description: "Two agents + terminal + review note",
    version: 1,
    nodes: [
      {
        kind: "group",
        x: 40,
        y: 40,
        w: 980,
        h: 520,
        title: "◈ review cell",
        color: "#2a8f68",
        tags: ["template"],
        config: {},
        status: "idle",
      },
      {
        kind: "agent",
        x: 80,
        y: 100,
        w: 420,
        h: 260,
        title: "◆ implementer",
        color: "#5dffb0",
        tags: ["impl"],
        config: { agentId: "claude" },
        status: "idle",
      },
      {
        kind: "agent",
        x: 540,
        y: 100,
        w: 420,
        h: 260,
        title: "◆ reviewer",
        color: "#a78bfa",
        tags: ["review"],
        config: { agentId: "codex" },
        status: "idle",
      },
      {
        kind: "terminal",
        x: 80,
        y: 400,
        w: 520,
        h: 140,
        title: "⬡ tests",
        color: "#4cc9f0",
        tags: [],
        config: {},
        status: "idle",
      },
      {
        kind: "note",
        x: 640,
        y: 400,
        w: 320,
        h: 140,
        title: "◈ checklist",
        color: "#ffb020",
        tags: [],
        config: { noteText: "- [ ] tests\n- [ ] handoff\n- [ ] merge" },
        status: "idle",
      },
    ],
  },
  {
    id: "fleet-3",
    name: "Fleet three",
    description: "Three parallel agent lanes",
    version: 1,
    nodes: [
      {
        kind: "agent",
        x: 40,
        y: 80,
        w: 360,
        h: 300,
        title: "◆ lane-a",
        color: "#5dffb0",
        tags: ["a"],
        config: { agentId: "hermes" },
        status: "idle",
      },
      {
        kind: "agent",
        x: 440,
        y: 80,
        w: 360,
        h: 300,
        title: "◆ lane-b",
        color: "#4cc9f0",
        tags: ["b"],
        config: { agentId: "grok-build" },
        status: "idle",
      },
      {
        kind: "agent",
        x: 840,
        y: 80,
        w: 360,
        h: 300,
        title: "◆ lane-c",
        color: "#ffb020",
        tags: ["c"],
        config: { agentId: "gemini" },
        status: "idle",
      },
    ],
  },
];

/** Materialize template into project-owned layout nodes */
export function applyTemplate(
  projectId: string,
  template: LayoutTemplate,
  offset = { x: 0, y: 0 },
): LayoutNode[] {
  const now = new Date().toISOString();
  return template.nodes.map((n) => ({
    id: randomUUID(),
    project_id: projectId,
    kind: n.kind,
    x: n.x + offset.x,
    y: n.y + offset.y,
    w: n.w,
    h: n.h,
    title: n.title,
    color: n.color,
    tags: [...(n.tags || [])],
    config: { ...(n.config || {}) },
    status: n.status || "idle",
    updated_at: now,
    parent_group_id: null,
  }));
}

export function exportLayoutTemplate(
  name: string,
  nodes: LayoutNode[],
  description = "",
): LayoutTemplate {
  return {
    id: `user-${randomUUID().slice(0, 8)}`,
    name,
    description,
    version: 1,
    nodes: nodes.map(({ id: _id, project_id: _p, updated_at: _u, ...rest }) => rest),
  };
}
