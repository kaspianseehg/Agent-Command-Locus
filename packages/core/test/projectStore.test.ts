import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ProjectStore } from "../src/projectStore.ts";
import { AgentRegistry } from "../src/agentRegistry.ts";
import { assertNoCodexInRegistry, BUILTIN_AGENTS } from "@acl/shared";

describe("ProjectStore", () => {
  it("creates and lists projects", () => {
    const dir = mkdtempSync(join(tmpdir(), "acl-"));
    const store = new ProjectStore(join(dir, "test.db"));
    const p = store.createProject("demo", dir);
    assert.equal(p.name, "demo");
    const list = store.listProjects();
    assert.equal(list.length, 1);
    assert.equal(list[0].id, p.id);
    store.close();
  });

  it("persists layout nodes", () => {
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
        color: "#eab308",
        tags: [],
        config: { noteText: "hello" },
        status: "idle",
        updated_at: now,
      },
    ]);
    const nodes = store.listNodes(p.id);
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].x, 10);
    assert.equal((nodes[0].config as { noteText: string }).noteText, "hello");
    store.close();
  });
});

describe("registry", () => {
  it("has no codex builtin", () => {
    assert.doesNotThrow(() => assertNoCodexInRegistry(BUILTIN_AGENTS));
    assert.ok(!BUILTIN_AGENTS.some((a) => a.id.includes("codex")));
  });

  it("plans custom launch and rejects missing hermes gracefully", () => {
    const reg = new AgentRegistry();
    const custom = reg.planLaunch("custom", "hi");
    assert.equal(custom.missingBinary, false);
    assert.ok(custom.argv.length >= 1);

    const hermes = reg.planLaunch("hermes");
    // may or may not be installed — must not throw
    assert.ok(hermes.agent.id === "hermes");
    if (hermes.missingBinary) assert.ok(hermes.error);
  });
});
