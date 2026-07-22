import type { AgentDescriptor } from "@acl/shared";
import type { AgentAdapter } from "./types.js";
import { genericAdapter, validateHandoff, baseHandoff } from "./types.js";
import { claudeAdapter } from "./claude.js";
import { codexAdapter } from "./codex.js";
import { hermesAdapter } from "./hermes.js";
import { grokAdapter } from "./grok-build.js";
import {
  geminiAdapter,
  opencodeAdapter,
  aiderAdapter,
  openclaudeAdapter,
  customAdapter,
} from "./others.js";

const builtins: AgentAdapter[] = [
  claudeAdapter,
  codexAdapter,
  hermesAdapter,
  grokAdapter,
  geminiAdapter,
  opencodeAdapter,
  aiderAdapter,
  openclaudeAdapter,
  customAdapter,
];

const byId = new Map(builtins.map((a) => [a.id, a]));

export function getAdapter(id: string, desc?: AgentDescriptor): AgentAdapter {
  return byId.get(id) || (desc ? genericAdapter(desc) : genericAdapter({
    id,
    label: id,
    launchCmd: [id],
    promptInjection: "argv",
    defaultEnabled: true,
    policyTags: [],
    targetTier: 0,
  }));
}

export function listAdapters(): AgentAdapter[] {
  return [...builtins];
}

export function capabilityChip(id: string): {
  id: string;
  tier: number;
  targetTier: number;
  label: string;
} {
  const a = getAdapter(id);
  const tier = a.detectTier();
  return {
    id,
    tier,
    targetTier: a.targetTier,
    label: `T${tier}${tier < a.targetTier ? `→T${a.targetTier}` : ""}`,
  };
}

export {
  validateHandoff,
  baseHandoff,
  genericAdapter,
  claudeAdapter,
  codexAdapter,
  hermesAdapter,
  grokAdapter,
};
export type { AgentAdapter, AdapterContext } from "./types.js";
