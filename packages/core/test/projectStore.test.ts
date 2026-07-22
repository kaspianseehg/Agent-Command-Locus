import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ProjectStore } from "../src/projectStore.ts";
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
});

describe("registry", () => {
  it("has no codex builtin", () => {
    assert.doesNotThrow(() => assertNoCodexInRegistry(BUILTIN_AGENTS));
    assert.ok(!BUILTIN_AGENTS.some((a) => a.id.includes("codex")));
  });
});
