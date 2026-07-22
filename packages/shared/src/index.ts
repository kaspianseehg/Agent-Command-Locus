/** Agent Command Locus shared types + constants. No secrets. No Codex. */

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
  /** argv | flag | stdin | hermes-api */
  promptInjection: "argv" | "flag" | "stdin" | "hermes-api";
  defaultEnabled: boolean;
  policyTags: string[];
  /** Highest tier this first-party adapter claims when fully wired */
  targetTier: AdapterTier;
}

/** First-party registry. Codex intentionally absent. */
export const BUILTIN_AGENTS: AgentDescriptor[] = [
  {
    id: "hermes",
    label: "Hermes",
    launchCmd: ["hermes"],
    promptInjection: "argv",
    defaultEnabled: true,
    policyTags: ["coordinator"],
    targetTier: 2,
  },
  {
    id: "grok-build",
    label: "Grok Build (Coda)",
    launchCmd: ["grok"],
    promptInjection: "argv",
    defaultEnabled: true,
    policyTags: ["coding"],
    targetTier: 2,
  },
  {
    id: "claude",
    label: "Claude Code",
    launchCmd: ["claude"],
    promptInjection: "argv",
    defaultEnabled: false,
    policyTags: ["coding"],
    targetTier: 1,
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    launchCmd: ["gemini"],
    promptInjection: "argv",
    defaultEnabled: false,
    policyTags: ["coding"],
    targetTier: 0,
  },
  {
    id: "opencode",
    label: "opencode",
    launchCmd: ["opencode"],
    promptInjection: "argv",
    defaultEnabled: false,
    policyTags: ["coding"],
    targetTier: 0,
  },
  {
    id: "custom",
    label: "Custom CLI",
    launchCmd: ["bash"],
    promptInjection: "stdin",
    defaultEnabled: true,
    policyTags: ["custom"],
    targetTier: 0,
  },
];

export function assertNoCodexInRegistry(
  agents: { id: string }[] = BUILTIN_AGENTS,
): void {
  for (const a of agents) {
    if (a.id.toLowerCase().includes("codex")) {
      throw new Error(`Codex agent forbidden in registry: ${a.id}`);
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
