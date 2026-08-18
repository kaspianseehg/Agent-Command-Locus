import type { AgentAdapter } from "./types.js";
import { baseHandoff, detectLaunchTier } from "./types.js";

export const hermesAdapter: AgentAdapter = {
  id: "hermes",
  targetTier: 2,
  detectTier: () => detectLaunchTier("hermes", 2),
  transcriptPath: (ctx) =>
    `${ctx.dataDir}/transcripts/${ctx.projectId}/hermes-${ctx.nodeId}.md`,
  buildHandoff: (p) =>
    baseHandoff({
      ...p,
      // Hermes fleet-friendly defaults
      ownership_next: p.ownership_next || "integrator",
    }),
  enrichLaunch: (argv, prompt) => {
    if (!prompt) return argv;
    if (argv.includes(prompt)) {
      if (argv.includes("-z")) return argv;
      const i = argv.lastIndexOf(prompt);
      return [...argv.slice(0, i), "-z", prompt, ...argv.slice(i + 1)];
    }
    if (!argv.slice(1).length) return [...argv, "-z", prompt];
    return [...argv, prompt];
  },
};
