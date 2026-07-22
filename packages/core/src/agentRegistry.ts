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
  for (const p of [
    `/opt/homebrew/bin/${name}`,
    `/usr/local/bin/${name}`,
    `${process.env.HOME}/.local/bin/${name}`,
    `${process.env.HOME}/.hermes/node/bin/${name}`,
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

/**
 * Agent registry — brand-neutral.
 * Local user settings may disable agents; the product never hard-bans a vendor.
 */
export class AgentRegistry {
  private agents: AgentDescriptor[];

  constructor(agents: AgentDescriptor[] = BUILTIN_AGENTS) {
    this.agents = [...agents];
  }

  list(opts?: { enabledOnly?: boolean }): AgentDescriptor[] {
    const all = [...this.agents];
    if (opts?.enabledOnly) return all.filter((a) => a.defaultEnabled);
    return all;
  }

  get(id: string): AgentDescriptor | undefined {
    return this.agents.find((a) => a.id === id);
  }

  /** Register or replace a descriptor (user custom agents). */
  upsert(agent: AgentDescriptor): void {
    const i = this.agents.findIndex((a) => a.id === agent.id);
    if (i >= 0) this.agents[i] = agent;
    else this.agents.push(agent);
  }

  /** Build argv for T0 launch. Missing binary is a soft error, not a brand block. */
  planLaunch(agentId: string, prompt?: string): LaunchPlan {
    const agent = this.get(agentId);
    if (!agent) {
      throw new Error(`Unknown agent: ${agentId}`);
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
      const hint = agent.installHint ? ` — ${agent.installHint}` : "";
      return {
        agent,
        argv: [],
        missingBinary: true,
        resolvedPath: null,
        error: `Binary not found on PATH: ${binName}${hint}`,
      };
    }

    const rest = agent.launchCmd.slice(1);
    const argv = [resolved, ...rest];

    // Prompt injection strategies (T0)
    if (prompt?.trim()) {
      if (agent.promptInjection === "argv") {
        // Codex prefers `codex exec "…"` when not already using subcommands
        if (agent.id === "codex" && !rest.includes("exec")) {
          argv.push("exec", prompt);
        } else {
          argv.push(prompt);
        }
      } else if (agent.promptInjection === "flag") {
        argv.push("-p", prompt);
      }
      // stdin: caller may write after spawn in a later tier
    }

    return {
      agent,
      argv,
      missingBinary: false,
      resolvedPath: resolved,
    };
  }
}
