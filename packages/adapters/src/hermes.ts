import type { AgentAdapter } from "./types.js";
import { baseHandoff } from "./types.js";

export const hermesAdapter: AgentAdapter = {
  id: "hermes",
  targetTier: 2,
  detectTier: () => 2,
  transcriptPath: (ctx) =>
    `${ctx.dataDir}/transcripts/${ctx.projectId}/hermes-${ctx.nodeId}.md`,
  buildHandoff: (p) =>
    baseHandoff({
      ...p,
      // Hermes fleet-friendly defaults
      ownership_next: p.ownership_next || "integrator",
    }),
  enrichLaunch: (argv, prompt) => {
    if (prompt && !argv.slice(1).length) return [...argv, "-z", prompt];
    if (prompt) return [...argv, prompt];
    return argv;
  },
};
