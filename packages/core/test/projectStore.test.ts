import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ProjectStore } from "../src/projectStore.ts";
import { AgentRegistry } from "../src/agentRegistry.ts";
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

describe("registry (agent-agnostic)", () => {
  it("ships claude, codex, and custom as equal presets", () => {
    assert.doesNotThrow(() => assertAgentAgnosticRegistry(BUILTIN_AGENTS));
    const ids = BUILTIN_AGENTS.map((a) => a.id);
    assert.ok(ids.includes("claude"));
    assert.ok(ids.includes("codex"));
    assert.ok(ids.includes("custom"));
    assert.ok(ids.includes("hermes"));
    assert.ok(ids.includes("grok-build"));
  });

  it("does not filter codex out of the registry", () => {
    const reg = new AgentRegistry();
    assert.ok(reg.get("codex"));
    assert.ok(reg.get("claude"));
  });

  it("plans custom launch; missing binaries are soft errors", () => {
    const reg = new AgentRegistry();
    const custom = reg.planLaunch("custom", "hi");
    assert.equal(custom.missingBinary, false);
    assert.ok(custom.argv.length >= 1);

    const codex = reg.planLaunch("codex", "fix typo");
    assert.equal(codex.agent.id, "codex");
    // installed or not — never throws brand ban
    if (codex.missingBinary) assert.ok(codex.error?.includes("Binary not found"));
    else assert.ok(codex.argv.includes("exec") || codex.argv.length >= 1);
  });
});
