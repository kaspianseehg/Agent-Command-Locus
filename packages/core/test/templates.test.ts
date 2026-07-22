import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BUILTIN_TEMPLATES,
  applyTemplate,
  exportLayoutTemplate,
} from "../src/templates.ts";

describe("templates", () => {
  it("has shareable builtins", () => {
    assert.ok(BUILTIN_TEMPLATES.length >= 3);
    for (const t of BUILTIN_TEMPLATES) {
      assert.ok(t.nodes.length > 0);
      const nodes = applyTemplate("p1", t);
      assert.equal(nodes.length, t.nodes.length);
      assert.ok(nodes.every((n) => n.project_id === "p1" && n.id));
    }
  });

  it("exports layout without project ids", () => {
    const nodes = applyTemplate("p1", BUILTIN_TEMPLATES[0]);
    const exp = exportLayoutTemplate("mine", nodes, "test");
    assert.equal(exp.name, "mine");
    assert.ok(!("project_id" in (exp.nodes[0] as object)));
  });
});
