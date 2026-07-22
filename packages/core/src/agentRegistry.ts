import { BUILTIN_AGENTS, type AgentDescriptor } from "@acl/shared";
import { existsSync } from "node:fs";
import { delimiter } from "node:path";

function pathDirs(): string[] {
  return (process.env.PATH || "").split(delimiter).filter(Boolean);
}

export function resolveBinary(name: string): string | null {
  if (name.includes("/") || name.includes("\\")) {
    return existsSync(name) ? name : null;
  }
  for (const dir of pathDirs()) {
    const p = `${dir}/${name}`;
    if (existsSync(p)) return p;
  }
  // common mac paths
  for (const p of [
    `/opt/homebrew/bin/${name}`,
    `/usr/local/bin/${name}`,
    `${process.env.HOME}/.local/bin/${name}`,
  ]) {
    if (p && existsSync(p)) return p;
  }
  return null;
}

export interface LaunchPlan {
  agent: AgentDescriptor;
  argv: string[];
  missingBinary: boolean;
  resolvedPath: string | null;
  error?: string;
}

export class AgentRegistry {
  private agents: AgentDescriptor[];

  constructor(agents: AgentDescriptor[] = BUILTIN_AGENTS) {
    this.agents = agents.filter((a) => !a.id.toLowerCase().includes("codex"));
  }

  list(): AgentDescriptor[] {
    return [...this.agents];
  }

  get(id: string): AgentDescriptor | undefined {
    return this.agents.find((a) => a.id === id);
  }

  /** Build argv for T0 launch. */
  planLaunch(agentId: string, prompt?: string): LaunchPlan {
    const agent = this.get(agentId);
    if (!agent) {
      throw new Error(`Unknown agent: ${agentId}`);
    }
    if (agent.id.toLowerCase().includes("codex")) {
      throw new Error("Codex is not supported in Agent Command Locus");
    }

    if (agent.id === "custom") {
      const shell = process.env.SHELL || "/bin/zsh";
      const script = prompt?.trim()
        ? `echo ${JSON.stringify(prompt)}; exec ${shell} -l`
        : `exec ${shell} -l`;
      return {
        agent,
        argv: [shell, "-lc", script],
        missingBinary: false,
        resolvedPath: shell,
      };
    }

    const binName = agent.launchCmd[0];
    const resolved = resolveBinary(binName);
    if (!resolved) {
      return {
        agent,
        argv: [],
        missingBinary: true,
        resolvedPath: null,
        error: `Binary not found on PATH: ${binName}`,
      };
    }

    const rest = agent.launchCmd.slice(1);
    const argv = [resolved, ...rest];
    if (prompt && agent.promptInjection === "argv") {
      argv.push(prompt);
    }
    return {
      agent,
      argv,
      missingBinary: false,
      resolvedPath: resolved,
    };
  }
}
