import { randomUUID } from "node:crypto";
import type { LayoutNode } from "./projectStore.js";

export type ContextLink = {
  id: string;
  project_id: string;
  source_id: string;
  target_id: string;
  kind: "context";
  created_at: string;
};

/** Build pasteable context packet from source → target */
export function buildContextPacket(opts: {
  source: LayoutNode;
  target: LayoutNode;
  transcriptTail?: string;
  handoffSummary?: string;
}): string {
  const srcTitle = opts.source.title;
  const tgtTitle = opts.target.title;
  const lines = [
    "╔═ ACL CONTEXT LINK ══════════════════╗",
    `from: ${srcTitle} (${opts.source.kind})`,
    `to:   ${tgtTitle} (${opts.target.kind})`,
    `at:   ${new Date().toISOString()}`,
    "──────────────────────────────────────",
  ];
  if (opts.handoffSummary) {
    lines.push("handoff:", opts.handoffSummary, "──────────────────────────────────────");
  }
  if (opts.transcriptTail?.trim()) {
    const tail = opts.transcriptTail.trim().slice(-3500);
    lines.push("source transcript (tail):", tail);
  } else {
    lines.push("(no transcript yet — link established for follow-up)");
  }
  lines.push("╚══════════════════════════════════════╝", "");
  return lines.join("\n");
}

export function newContextLink(
  projectId: string,
  sourceId: string,
  targetId: string,
): ContextLink {
  return {
    id: randomUUID(),
    project_id: projectId,
    source_id: sourceId,
    target_id: targetId,
    kind: "context",
    created_at: new Date().toISOString(),
  };
}
