/** Agent Command Locus shared types + constants. No secrets. Agent-agnostic. */

export const ACL_SCHEMA_VERSION = 1 as const;

export type NodeKind = "terminal" | "agent" | "note" | "group";
export type NodeStatus =
  | "idle"
  | "running"
  | "needs_you"
  | "blocked"
  | "done"
  | "error";
export type KanbanStatus =
  | "backlog"
  | "doing"
  | "review"
  | "done"
  | "blocked";
export type AdapterTier = 0 | 1 | 2 | 3 | 4;
export type FleetRole =
  | "operator"
  | "planner"
  | "builder"
  | "reviewer"
  | "integrator";

export interface Handoff {
  task_id: string;
  files_touched: string[];
  ownership_next: string;
  blockers: string[];
  test_results: string;
  summary: string;
}

export interface AgentDescriptor {
  id: string;
  label: string;
  launchCmd: string[];
  /** How to inject the task prompt into the CLI */
  promptInjection: "argv" | "flag" | "stdin" | "hermes-api";
  /**
   * Shown in the default picker. Product ships all first-party agents enabled;
   * users disable what they don't use in local settings (not baked into OSS).
   */
  defaultEnabled: boolean;
  policyTags: string[];
  /** Highest tier this first-party adapter claims when fully wired */
  targetTier: AdapterTier;
  /** Optional docs / install hint for missing binary */
  installHint?: string;
}

/**
 * First-party presets — equal citizens. No brand is preferred or banned.
 * Depth comes from adapters (T0–T4), not from which company made the CLI.
 * Users add arbitrary CLIs via `custom` or local registry overrides.
 */
export const BUILTIN_AGENTS: AgentDescriptor[] = [
  {
    id: "hermes",
    label: "Hermes",
    launchCmd: ["hermes"],
    promptInjection: "argv",
    defaultEnabled: true,
    policyTags: ["agent"],
    targetTier: 2,
    installHint: "https://hermes-agent.nousresearch.com",
  },
  {
    id: "claude",
    label: "Claude Code",
    launchCmd: ["claude"],
    promptInjection: "argv",
    defaultEnabled: true,
    policyTags: ["agent", "coding"],
    targetTier: 2,
    installHint: "Claude Code CLI on PATH as `claude`",
  },
  {
    id: "codex",
    label: "OpenAI Codex",
    launchCmd: ["codex"],
    promptInjection: "argv",
    defaultEnabled: true,
    policyTags: ["agent", "coding"],
    targetTier: 2,
    installHint: "npm i -g @openai/codex — requires your OpenAI/Codex auth",
  },
  {
    id: "grok-build",
    label: "Grok Build",
    launchCmd: ["grok"],
    promptInjection: "argv",
    defaultEnabled: true,
    policyTags: ["agent", "coding"],
    targetTier: 2,
    installHint: "xAI Grok Build CLI on PATH as `grok`",
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    launchCmd: ["gemini"],
    promptInjection: "argv",
    defaultEnabled: true,
    policyTags: ["agent", "coding"],
    targetTier: 1,
    installHint: "Gemini CLI on PATH as `gemini`",
  },
  {
    id: "opencode",
    label: "OpenCode",
    launchCmd: ["opencode"],
    promptInjection: "argv",
    defaultEnabled: true,
    policyTags: ["agent", "coding"],
    targetTier: 1,
    installHint: "opencode CLI on PATH",
  },
  {
    id: "aider",
    label: "Aider",
    launchCmd: ["aider"],
    promptInjection: "argv",
    defaultEnabled: true,
    policyTags: ["agent", "coding"],
    targetTier: 1,
    installHint: "pipx install aider-chat (or equivalent)",
  },
  {
    id: "openclaude",
    label: "OpenClaude",
    launchCmd: ["openclaude"],
    promptInjection: "argv",
    defaultEnabled: true,
    policyTags: ["agent", "coding"],
    targetTier: 1,
    installHint: "OpenClaude CLI on PATH as `openclaude`",
  },
  {
    id: "custom",
    label: "Custom CLI",
    launchCmd: ["bash"],
    promptInjection: "stdin",
    defaultEnabled: true,
    policyTags: ["custom"],
    targetTier: 0,
    installHint: "Any executable — configure command in settings",
  },
];

/** Ensure registry has no hidden ban-list by brand (product invariant). */
export function assertAgentAgnosticRegistry(
  agents: { id: string }[] = BUILTIN_AGENTS,
): void {
  const ids = new Set(agents.map((a) => a.id.toLowerCase()));
  // Must ship major ecosystem presets so no single vendor is second-class by omission
  for (const required of ["claude", "codex", "custom"]) {
    if (!ids.has(required)) {
      throw new Error(
        `Agent-agnostic registry missing required preset: ${required}`,
      );
    }
  }
}

export interface KanbanCard {
  task_id: string;
  project_id: string;
  title: string;
  body: string;
  status: KanbanStatus;
  assignee_agent_id: string | null;
  parents: string[];
  labels: string[];
  handoff: Handoff | null;
  updated_at: string;
  updated_by: string;
  archived_at: string | null;
}

export interface ProjectRecord {
  id: string;
  name: string;
  cwd: string;
  settings_json: string;
  created_at: string;
  updated_at: string;
}

export type BusMessageType =
  | "register"
  | "ping"
  | "pong"
  | "status"
  | "handoff"
  | "kanban.mutate";

export interface BusMessage {
  v: typeof ACL_SCHEMA_VERSION;
  type: BusMessageType;
  id: string;
  ts: string;
  payload: Record<string, unknown>;
}
