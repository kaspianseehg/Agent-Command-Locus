import type { AgentAdapter } from "./types.js";
import { baseHandoff } from "./types.js";

export const codexAdapter: AgentAdapter = {
  id: "codex",
  targetTier: 2,
  detectTier: () => 1,
  transcriptPath: (ctx) =>
    `${ctx.dataDir}/transcripts/${ctx.projectId}/codex-${ctx.nodeId}.jsonl`,
  buildHandoff: baseHandoff,
  enrichLaunch: (argv, prompt) => {
    // ensure `codex exec "prompt"` shape when prompt provided
    if (!prompt) return argv;
    if (argv.includes("exec")) return argv;
    const [bin, ...rest] = argv;
    return [bin, "exec", ...rest, prompt];
  },
};
