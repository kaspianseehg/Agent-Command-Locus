import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TranscriptStore } from "../src/transcriptStore.ts";

describe("TranscriptStore", () => {
  it("rings memory and appends file", () => {
    const dir = mkdtempSync(join(tmpdir(), "acl-tx-"));
    const file = join(dir, "t.log");
    const store = new TranscriptStore(100);
    store.append("p", "n", "hello ", file);
    store.append("p", "n", "world", file);
    const t = store.tail("p", "n", 50, file);
    assert.equal(t.source, "memory");
    assert.match(t.text, /hello world/);
    assert.match(readFileSync(file, "utf8"), /hello world/);
  });

  it("trims ring buffer", () => {
    const store = new TranscriptStore(20);
    store.append("p", "n", "abcdefghijklmnopqrstuvwxyz");
    const t = store.tail("p", "n", 100);
    assert.ok(t.text.length <= 20);
  });
});
