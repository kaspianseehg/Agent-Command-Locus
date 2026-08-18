import type { AgentAdapter } from "./types.js";
import { baseHandoff, detectLaunchTier } from "./types.js";

export const claudeAdapter: AgentAdapter = {
  id: "claude",
  targetTier: 2,
  detectTier: () => detectLaunchTier("claude", 1),
  transcriptPath: (ctx) =>
    `${ctx.dataDir}/transcripts/${ctx.projectId}/claude-${ctx.nodeId}.jsonl`,
  buildHandoff: baseHandoff,
  enrichLaunch: (argv, prompt) => {
    // leave default argv; optional -p style not universal
    if (prompt && !argv.includes(prompt)) return [...argv, prompt];
    return argv;
  },
};
