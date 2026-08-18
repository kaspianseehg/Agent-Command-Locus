import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ProjectStore } from "../src/projectStore.ts";
import { AgentRegistry } from "../src/agentRegistry.ts";
import { AgentBus } from "../src/agentBus.ts";
import {
  assertAgentAgnosticRegistry,
  BUILTIN_AGENTS,
} from "@acl/shared";

describe("ProjectStore", () => {
  it("creates and lists projects", () => {
    const dir = mkdtempSync(join(tmpdir(), "acl-"));
    const store = new ProjectStore(join(dir, "test.db"));
    const p = store.createProject("demo", dir);
    assert.equal(p.name, "demo");
    assert.equal(store.listProjects().length, 1);
    store.close();
  });

  it("persists layout + multi-project + kanban + settings", () => {
    const dir = mkdtempSync(join(tmpdir(), "acl-"));
    const store = new ProjectStore(join(dir, "test.db"));
    const p = store.createProject("demo", dir);
    const now = new Date().toISOString();
    store.saveLayout(p.id, [
      {
        id: "n1",
        project_id: p.id,
        kind: "note",
        x: 10,
        y: 20,
        w: 200,
        h: 100,
        title: "Note",
        color: "#ffb020",
        tags: ["a"],
        config: { noteText: "hello" },
        status: "idle",
        updated_at: now,
      },
    ]);
    assert.equal(store.listNodes(p.id).length, 1);
    store.upsertCard({
      task_id: "t1",
      project_id: p.id,
      title: "card",
      body: "",
      status: "backlog",
      assignee_agent_id: null,
      parents: [],
      labels: [],
      handoff: null,
      updated_at: now,
      updated_by: "test",
      archived_at: null,
    });
    assert.equal(store.listCards(p.id).length, 1);
    store.saveSettings({ focusMode: true, disabledAgents: ["aider"] });
    assert.equal(store.getSettings().focusMode, true);
    const p2 = store.createProject("two", dir);
    assert.equal(store.listProjects().length, 2);
    assert.ok(store.deleteProject(p2.id));
    const demo = store.seedSampleProject(dir);
    assert.ok(demo.name.includes("Demo") || demo.name.length > 0);
    assert.ok(store.listNodes(demo.id).length >= 3);
    store.addComment({ project_id: demo.id, target_type: 'node', target_id: 'x', author: 't', body: 'hi' });
    assert.equal(store.listComments(demo.id).length, 1);
    store.close();
  });

  it("deleteProject also drops comments and edges", () => {
    const dir = mkdtempSync(join(tmpdir(), "acl-"));
    const store = new ProjectStore(join(dir, "test.db"));
    const keep = store.createProject("keep", dir);
    const gone = store.createProject("gone", dir);
    store.addComment({
      project_id: gone.id,
      target_type: "node",
      target_id: "n",
      author: "t",
      body: "bye",
    });
    store.saveEdges(gone.id, [
      {
        id: "e1",
        project_id: gone.id,
        source: "a",
        target: "b",
        kind: "context",
        created_at: new Date().toISOString(),
      },
    ]);
    assert.equal(store.listComments(gone.id).length, 1);
    assert.equal(store.listEdges(gone.id).length, 1);
    assert.ok(store.deleteProject(gone.id));
    assert.equal(store.listComments(gone.id).length, 0);
    assert.equal(store.listEdges(gone.id).length, 0);
    assert.ok(store.getProject(keep.id));
    store.close();
  });
});

describe("registry + bus", () => {
  it("is agent-agnostic", () => {
    assert.doesNotThrow(() => assertAgentAgnosticRegistry(BUILTIN_AGENTS));
    const reg = new AgentRegistry();
    assert.ok(reg.get("codex"));
    assert.ok(reg.get("claude"));
  });

  it("bus inbox on needs_you", () => {
    const bus = new AgentBus();
    bus.setStatus("n1", "needs_you", "auth");
    assert.equal(bus.listInbox().length, 1);
    assert.equal(bus.getStatus("n1")?.status, "needs_you");
  });
});
