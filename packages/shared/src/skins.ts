/** ACL skin / aesthetic tokens — user-extensible */

export type SkinTokens = {
  void: string;
  panel: string;
  panel2: string;
  lattice: string;
  line: string;
  phosphor: string;
  phosphorDim: string;
  cyan: string;
  amber: string;
  rose: string;
  text: string;
  muted: string;
  mono: string;
  display: string;
  glow: string;
  edge: string;
  backgroundImage?: string;
  gridSize?: number;
  borderRadius?: string;
  asciiBrand?: string;
};

export type AclSkin = {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version: 1;
  /** builtin | user file under dataDir/skins */
  source?: "builtin" | "user";
  tokens: SkinTokens;
};

export const SKIN_CSS_VAR_MAP: Record<keyof SkinTokens, string> = {
  void: "--void",
  panel: "--panel",
  panel2: "--panel-2",
  lattice: "--lattice",
  line: "--line",
  phosphor: "--phosphor",
  phosphorDim: "--phosphor-dim",
  cyan: "--cyan",
  amber: "--amber",
  rose: "--rose",
  text: "--text",
  muted: "--muted",
  mono: "--mono",
  display: "--display",
  glow: "--glow",
  edge: "--edge",
  backgroundImage: "--skin-bg-image",
  gridSize: "--skin-grid-size",
  borderRadius: "--skin-radius",
  asciiBrand: "--skin-ascii-brand",
};

export const DEFAULT_SKIN_ID = "phosphor-lattice";

export const BUILTIN_SKINS: AclSkin[] = [
  {
    id: "phosphor-lattice",
    name: "Phosphor Lattice",
    description: "Default ACL identity — void + phosphor HUD",
    version: 1,
    source: "builtin",
    tokens: {
      void: "#05080a",
      panel: "#0a1014",
      panel2: "#0e161c",
      lattice: "#122028",
      line: "#1c333f",
      phosphor: "#5dffb0",
      phosphorDim: "#2a8f68",
      cyan: "#4cc9f0",
      amber: "#ffb020",
      rose: "#ff5d8f",
      text: "#d7ece4",
      muted: "#6f8f85",
      mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
      display: '"Syne", system-ui, sans-serif',
      glow: "0 0 24px rgba(93, 255, 176, 0.12)",
      edge: "#5dffb0",
      gridSize: 28,
      borderRadius: "0px",
      asciiBrand: "╔═ ACL ═╗\\n║LATTICE║\\n╚═══════╝",
    },
  },
  {
    id: "amber-terminal",
    name: "Amber Terminal",
    description: "Warm CRT phosphor — classic ops desk",
    version: 1,
    source: "builtin",
    tokens: {
      void: "#0c0804",
      panel: "#14100a",
      panel2: "#1a140c",
      lattice: "#2a2010",
      line: "#3d2e18",
      phosphor: "#ffb020",
      phosphorDim: "#a66a10",
      cyan: "#e8c36a",
      amber: "#ffd27a",
      rose: "#ff6b4a",
      text: "#f5e6c8",
      muted: "#9a7b4a",
      mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
      display: '"Syne", system-ui, sans-serif',
      glow: "0 0 24px rgba(255, 176, 32, 0.15)",
      edge: "#ffb020",
      gridSize: 24,
      borderRadius: "0px",
      asciiBrand: "╔═ ACL ═╗\\n║ AMBER ║\\n╚═══════╝",
    },
  },
  {
    id: "ice-ops",
    name: "Ice Ops",
    description: "Cold blue mission control",
    version: 1,
    source: "builtin",
    tokens: {
      void: "#04060c",
      panel: "#0a0e18",
      panel2: "#0e1420",
      lattice: "#152030",
      line: "#243448",
      phosphor: "#7dd3fc",
      phosphorDim: "#0284c7",
      cyan: "#38bdf8",
      amber: "#fbbf24",
      rose: "#fb7185",
      text: "#e2e8f0",
      muted: "#64748b",
      mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
      display: '"Syne", system-ui, sans-serif',
      glow: "0 0 24px rgba(125, 211, 252, 0.14)",
      edge: "#7dd3fc",
      gridSize: 32,
      borderRadius: "2px",
      asciiBrand: "╔═ ACL ═╗\\n║  ICE  ║\\n╚═══════╝",
    },
  },
  {
    id: "violet-swarm",
    name: "Violet Swarm",
    description: "Soft violet multi-agent hive",
    version: 1,
    source: "builtin",
    tokens: {
      void: "#08060e",
      panel: "#100e18",
      panel2: "#161222",
      lattice: "#221a32",
      line: "#352a4a",
      phosphor: "#c4b5fd",
      phosphorDim: "#7c3aed",
      cyan: "#a78bfa",
      amber: "#f0abfc",
      rose: "#f472b6",
      text: "#ede9fe",
      muted: "#8b7aa8",
      mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
      display: '"Syne", system-ui, sans-serif',
      glow: "0 0 28px rgba(196, 181, 253, 0.16)",
      edge: "#c4b5fd",
      gridSize: 28,
      borderRadius: "4px",
      asciiBrand: "╔═ ACL ═╗\\n║SWARM ║\\n╚═══════╝",
    },
  },
  {
    id: "paper-light",
    name: "Paper Light",
    description: "Light ops desk — high contrast daylight",
    version: 1,
    source: "builtin",
    tokens: {
      void: "#f4f1ea",
      panel: "#fffdf8",
      panel2: "#f0ebe3",
      lattice: "#e4ddd0",
      line: "#cfc6b6",
      phosphor: "#0f766e",
      phosphorDim: "#115e59",
      cyan: "#0369a1",
      amber: "#b45309",
      rose: "#be123c",
      text: "#1c1917",
      muted: "#78716c",
      mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
      display: '"Syne", system-ui, sans-serif',
      glow: "0 0 16px rgba(15, 118, 110, 0.1)",
      edge: "#0f766e",
      gridSize: 28,
      borderRadius: "6px",
      asciiBrand: "╔═ ACL ═╗\\n║ PAPER ║\\n╚═══════╝",
    },
  },
];

export function getBuiltinSkin(id: string): AclSkin | undefined {
  return BUILTIN_SKINS.find((s) => s.id === id);
}

/** Merge partial token overrides onto a base skin */
export function mergeSkin(base: AclSkin, partial: Partial<AclSkin> & { tokens?: Partial<SkinTokens> }): AclSkin {
  return {
    ...base,
    ...partial,
    id: partial.id || base.id,
    name: partial.name || base.name,
    version: 1,
    tokens: { ...base.tokens, ...(partial.tokens || {}) },
  };
}

export function validateSkin(raw: unknown): raw is AclSkin {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.name !== "string") return false;
  if (o.version !== 1) return false;
  if (!o.tokens || typeof o.tokens !== "object") return false;
  const t = o.tokens as Record<string, unknown>;
  for (const key of ["void", "panel", "phosphor", "text", "line"] as const) {
    if (typeof t[key] !== "string") return false;
  }
  return true;
}

/** Build CSS custom-property declarations for :root / documentElement */
export function skinToCssVars(skin: AclSkin): Record<string, string> {
  const out: Record<string, string> = {};
  const t = skin.tokens;
  (Object.keys(SKIN_CSS_VAR_MAP) as (keyof SkinTokens)[]).forEach((k) => {
    const v = t[k];
    if (v === undefined || v === null || v === "") return;
    const cssVar = SKIN_CSS_VAR_MAP[k];
    out[cssVar] = typeof v === "number" ? `${v}px` : String(v);
  });
  // convenience aliases used by some components
  out["--bg"] = t.void;
  out["--accent"] = t.phosphor;
  out["--danger"] = t.rose;
  out["--skin-id"] = skin.id;
  return out;
}
