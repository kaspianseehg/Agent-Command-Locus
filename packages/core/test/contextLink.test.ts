import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildContextPacket, newContextLink } from "../src/contextLink.ts";
import { UsageMeter } from "../src/usageMeter.ts";
import type { LayoutNode } from "../src/projectStore.ts";

const node = (id: string, title: string, kind: LayoutNode["kind"]): LayoutNode => ({
  id,
  project_id: "p",
  kind,
  x: 0,
  y: 0,
  w: 100,
  h: 100,
  title,
  color: "#5dffb0",
  tags: [],
  config: {},
  status: "idle",
  updated_at: new Date().toISOString(),
});

describe("contextLink", () => {
  it("builds packet with transcript tail", () => {
    const packet = buildContextPacket({
      source: node("a", "src", "agent"),
      target: node("b", "dst", "agent"),
      transcriptTail: "hello from source",
    });
    assert.match(packet, /ACL CONTEXT LINK/);
    assert.match(packet, /hello from source/);
    assert.match(packet, /src/);
  });

  it("creates link ids", () => {
    const l = newContextLink("p", "a", "b");
    assert.equal(l.kind, "context");
    assert.ok(l.id);
  });
});

describe("UsageMeter", () => {
  it("estimates tokens from bytes", () => {
    const m = new UsageMeter();
    m.recordOut("n1", "abcd"); // 4 bytes
    m.recordIn("n1", "efgh"); // 4
    const s = m.get("n1");
    assert.equal(s.bytesOut, 4);
    assert.equal(s.bytesIn, 4);
    assert.equal(s.tokensEst, 2);
  });
});
