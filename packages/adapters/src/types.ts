import type { AdapterTier, AgentDescriptor, Handoff } from "@acl/shared";

export type AdapterContext = {
  projectId: string;
  nodeId: string;
  cwd: string;
  dataDir: string;
};

export interface AgentAdapter {
  id: string;
  /** Claimed max tier when fully wired */
  targetTier: AdapterTier;
  detectTier(ctx?: Partial<AdapterContext>): AdapterTier;
  /** Where transcripts/logs may land for context-link */
  transcriptPath?(ctx: AdapterContext): string | null;
  /** Build a handoff skeleton after a run */
  buildHandoff?(
    partial: Partial<Handoff> & Pick<Handoff, "task_id" | "summary">,
  ): Handoff;
  /** Optional extra launch argv hints (T1+) */
  enrichLaunch?(baseArgv: string[], prompt?: string): string[];
}

export function baseHandoff(
  partial: Partial<Handoff> & Pick<Handoff, "task_id" | "summary">,
): Handoff {
  return {
    task_id: partial.task_id,
    files_touched: partial.files_touched ?? [],
    ownership_next: partial.ownership_next ?? "",
    blockers: partial.blockers ?? [],
    test_results: partial.test_results ?? "",
    summary: partial.summary,
  };
}

export function validateHandoff(h: unknown): h is Handoff {
  if (!h || typeof h !== "object") return false;
  const o = h as Record<string, unknown>;
  return (
    typeof o.task_id === "string" &&
    typeof o.summary === "string" &&
    Array.isArray(o.files_touched) &&
    Array.isArray(o.blockers) &&
    typeof o.ownership_next === "string" &&
    typeof o.test_results === "string"
  );
}

/** Generic T0 for any descriptor without a dedicated adapter */
export function genericAdapter(desc: AgentDescriptor): AgentAdapter {
  return {
    id: desc.id,
    targetTier: desc.targetTier,
    detectTier: () => 0,
    transcriptPath: (ctx) =>
      `${ctx.dataDir}/transcripts/${ctx.projectId}/${ctx.nodeId}.log`,
    buildHandoff: baseHandoff,
  };
}
