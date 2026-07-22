import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BUILTIN_SKINS,
  validateSkin,
  skinToCssVars,
  mergeSkin,
  DEFAULT_SKIN_ID,
} from "@acl/shared";
import { SkinCatalog } from "../src/skinCatalog.ts";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("skins", () => {
  it("builtins validate and map to css vars", () => {
    assert.ok(BUILTIN_SKINS.length >= 4);
    for (const s of BUILTIN_SKINS) {
      assert.ok(validateSkin(s), s.id);
      const vars = skinToCssVars(s);
      assert.ok(vars["--phosphor"]);
      assert.ok(vars["--void"]);
    }
  });

  it("mergeSkin overrides tokens", () => {
    const base = BUILTIN_SKINS[0];
    const m = mergeSkin(base, { id: "x", name: "X", tokens: { phosphor: "#ffffff" } });
    assert.equal(m.tokens.phosphor, "#ffffff");
    assert.equal(m.tokens.void, base.tokens.void);
  });

  it("SkinCatalog loads user json", () => {
    const dir = mkdtempSync(join(tmpdir(), "acl-skin-"));
    const cat = new SkinCatalog(dir);
    cat.ensureExampleSkin();
    const list = cat.list();
    assert.ok(list.some((s) => s.id === DEFAULT_SKIN_ID));
    assert.ok(list.some((s) => s.id === "example-custom"));
    const saved = cat.saveUserSkin({
      id: "my-skin",
      name: "Mine",
      version: 1,
      tokens: { ...cat.resolve().tokens, phosphor: "#00ffaa" },
    });
    assert.equal(saved.ok, true);
    assert.ok(cat.get("my-skin"));
  });
});
