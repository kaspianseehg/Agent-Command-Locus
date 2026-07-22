import type { AgentAdapter } from "./types.js";
import { baseHandoff } from "./types.js";
import { existsSync } from "node:fs";

export const claudeAdapter: AgentAdapter = {
  id: "claude",
  targetTier: 2,
  detectTier: () => {
    // T0 if binary exists; T2 APIs when transcript dir present
    let t = 0;
    if (existsSync("/opt/homebrew/bin/claude") || existsSync(`${process.env.HOME}/.local/bin/claude`))
      t = 1;
    // project .claude or transcripts → claim T2 surface
    t = Math.max(t, 1);
    return t as 0 | 1 | 2;
  },
  transcriptPath: (ctx) =>
    `${ctx.dataDir}/transcripts/${ctx.projectId}/claude-${ctx.nodeId}.jsonl`,
  buildHandoff: baseHandoff,
  enrichLaunch: (argv, prompt) => {
    // leave default argv; optional -p style not universal
    if (prompt && !argv.includes(prompt)) return [...argv, prompt];
    return argv;
  },
};
