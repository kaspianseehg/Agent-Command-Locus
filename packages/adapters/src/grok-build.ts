import type { AgentAdapter } from "./types.js";
import { baseHandoff, detectLaunchTier } from "./types.js";

export const grokAdapter: AgentAdapter = {
  id: "grok-build",
  targetTier: 2,
  detectTier: () => detectLaunchTier("grok", 1),
  transcriptPath: (ctx) =>
    `${ctx.dataDir}/transcripts/${ctx.projectId}/grok-${ctx.nodeId}.log`,
  buildHandoff: baseHandoff,
  enrichLaunch: (argv, prompt) => (prompt ? [...argv, prompt] : argv),
};
