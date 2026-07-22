/**
 * One-shot: seed a "Triple CLI" project layout for screencap demos.
 * Run: node scripts/seed-screencap-project.mjs
 */
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { ProjectStore } from "../packages/core/dist/projectStore.js";
import { randomUUID } from "node:crypto";

const home = os.homedir();
// Prefer Electron userData path on macOS
const candidates = [
  process.env.ACL_DATA_DIR,
  path.join(home, "Library/Application Support/agent-command-locus/data"),
  path.join(home, ".acl-desktop-data"),
].filter(Boolean);

let dataDir = candidates.find((d) => fs.existsSync(d)) || candidates[1];
fs.mkdirSync(dataDir, { recursive: true });
const storePath = path.join(dataDir, "acl.json");
// also try acl.db.json naming from ProjectStore
const store = new ProjectStore(path.join(dataDir, "acl.db"));

const now = new Date().toISOString();
const p = store.createProject("Screencap · Hermes+Grok+OpenClaude", home);
store.setLastProject(p.id);

const mk = (partial) => ({
  id: randomUUID(),
  project_id: p.id,
  tags: [],
  status: "idle",
  updated_at: now,
  parent_group_id: null,
  config: {},
  ...partial,
});

const nodes = [
  mk({
    kind: "group",
    x: 40,
    y: 40,
    w: 1280,
    h: 560,
    title: "◈ multi-agent cell",
    color: "#2a8f68",
    tags: ["demo"],
  }),
  mk({
    kind: "agent",
    x: 80,
    y: 100,
    w: 380,
    h: 300,
    title: "◆ hermes",
    color: "#5dffb0",
    tags: ["hermes"],
    config: { agentId: "hermes", prompt: "echo HERMES_OK && hermes --version | head -1" },
  }),
  mk({
    kind: "agent",
    x: 500,
    y: 100,
    w: 380,
    h: 300,
    title: "◆ grok",
    color: "#4cc9f0",
    tags: ["grok"],
    config: { agentId: "grok-build", prompt: "echo GROK_OK && grok --version | head -1" },
  }),
  mk({
    kind: "agent",
    x: 920,
    y: 100,
    w: 380,
    h: 300,
    title: "◆ openclaude",
    color: "#ffb020",
    tags: ["openclaude"],
    // custom launch via custom agent - store as custom with note
    config: {
      agentId: "openclaude",
      prompt: "echo OPENCLAUDE_OK",
    },
  }),
  mk({
    kind: "note",
    x: 80,
    y: 440,
    w: 520,
    h: 120,
    title: "◈ brief",
    color: "#ffb020",
    config: {
      noteText:
        "Screencap demo — Hermes · Grok · OpenClaude\nContext-link handles on the right of each node.\nAgent-agnostic · phosphor-lattice",
    },
  }),
  mk({
    kind: "terminal",
    x: 640,
    y: 440,
    w: 660,
    h: 140,
    title: "⬡ shell",
    color: "#4cc9f0",
  }),
];

store.saveLayout(p.id, nodes);

// edges hermes -> openclaude, grok -> openclaude (visual only until opened)
const edges = [
  {
    id: randomUUID(),
    project_id: p.id,
    source: nodes[1].id,
    target: nodes[3].id,
    kind: "context",
    label: "context",
    created_at: now,
  },
  {
    id: randomUUID(),
    project_id: p.id,
    source: nodes[2].id,
    target: nodes[3].id,
    kind: "context",
    label: "context",
    created_at: now,
  },
];
store.saveEdges(p.id, edges);

store.upsertCard({
  task_id: randomUUID(),
  project_id: p.id,
  title: "Ship README screencap",
  body: "Hermes + Grok + OpenClaude on one lattice",
  status: "doing",
  assignee_agent_id: "hermes",
  parents: [],
  labels: ["demo"],
  handoff: null,
  updated_at: now,
  updated_by: "seed",
  archived_at: null,
});

console.log(JSON.stringify({ ok: true, dataDir, projectId: p.id, storePath: path.join(dataDir, "acl.json"), nodes: nodes.length }, null, 2));
