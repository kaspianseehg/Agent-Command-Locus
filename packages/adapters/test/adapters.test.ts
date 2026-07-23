import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getAdapter,
  capabilityChip,
  validateHandoff,
  listAdapters,
} from "../src/index.ts";

describe("adapters T2 surface", () => {
  it("registers major vendors equally", () => {
    const ids = listAdapters().map((a) => a.id);
    for (const id of ["claude", "codex", "hermes", "grok-build", "openclaude", "custom"]) {
      assert.ok(ids.includes(id), id);
    }
  });

  it("capability chips and handoff validation", () => {
    const chip = capabilityChip("codex");
    assert.equal(chip.id, "codex");
    assert.ok(chip.label.startsWith("T"));
    const h = getAdapter("hermes").buildHandoff!({
      task_id: "t1",
      summary: "done",
      files_touched: ["a.ts"],
    });
    assert.ok(validateHandoff(h));
    assert.equal(h.ownership_next, "integrator");
    assert.ok(!validateHandoff({ task_id: 1 }));
  });

  it("transcript paths are namespaced", () => {
    const p = getAdapter("claude").transcriptPath!({
      projectId: "p",
      nodeId: "n",
      cwd: "/tmp",
      dataDir: "/data",
    });
    assert.ok(p?.includes("/data/transcripts/p/"));
  });
});
