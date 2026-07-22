import type { AgentAdapter } from "./types.js";
import { baseHandoff } from "./types.js";

export const geminiAdapter: AgentAdapter = {
  id: "gemini",
  targetTier: 1,
  detectTier: () => 0,
  transcriptPath: (ctx) =>
    `${ctx.dataDir}/transcripts/${ctx.projectId}/gemini-${ctx.nodeId}.log`,
  buildHandoff: baseHandoff,
};

export const opencodeAdapter: AgentAdapter = {
  id: "opencode",
  targetTier: 1,
  detectTier: () => 0,
  transcriptPath: (ctx) =>
    `${ctx.dataDir}/transcripts/${ctx.projectId}/opencode-${ctx.nodeId}.log`,
  buildHandoff: baseHandoff,
};

export const aiderAdapter: AgentAdapter = {
  id: "aider",
  targetTier: 1,
  detectTier: () => 0,
  transcriptPath: (ctx) =>
    `${ctx.dataDir}/transcripts/${ctx.projectId}/aider-${ctx.nodeId}.log`,
  buildHandoff: baseHandoff,
  enrichLaunch: (argv, prompt) => {
    if (!prompt) return argv;
    return [...argv, "--message", prompt];
  },
};

export const openclaudeAdapter: AgentAdapter = {
  id: "openclaude",
  targetTier: 1,
  detectTier: () => 0,
  transcriptPath: (ctx) =>
    `${ctx.dataDir}/transcripts/${ctx.projectId}/openclaude-${ctx.nodeId}.log`,
  buildHandoff: baseHandoff,
  enrichLaunch: (argv, prompt) => (prompt ? [...argv, prompt] : argv),
};

export const customAdapter: AgentAdapter = {
  id: "custom",
  targetTier: 0,
  detectTier: () => 0,
  transcriptPath: (ctx) =>
    `${ctx.dataDir}/transcripts/${ctx.projectId}/custom-${ctx.nodeId}.log`,
  buildHandoff: baseHandoff,
};
