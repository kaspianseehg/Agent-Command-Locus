import fs from "node:fs";
import path from "node:path";
import {
  BUILTIN_SKINS,
  DEFAULT_SKIN_ID,
  getBuiltinSkin,
  validateSkin,
  type AclSkin,
} from "@acl/shared";

/**
 * Resolve skins: builtins + optional user JSON files in dataDir/skins/*.json
 */
export class SkinCatalog {
  private userDir: string;

  constructor(dataDir: string) {
    this.userDir = path.join(dataDir, "skins");
    fs.mkdirSync(this.userDir, { recursive: true });
  }

  getUserDir(): string {
    return this.userDir;
  }

  list(): AclSkin[] {
    const map = new Map<string, AclSkin>();
    for (const s of BUILTIN_SKINS) map.set(s.id, { ...s, source: "builtin" });
    for (const s of this.loadUserSkins()) map.set(s.id, s);
    return [...map.values()];
  }

  get(id: string): AclSkin | undefined {
    const user = this.loadUserSkins().find((s) => s.id === id);
    if (user) return user;
    return getBuiltinSkin(id);
  }

  resolve(id?: string | null): AclSkin {
    const skin = this.get(id || DEFAULT_SKIN_ID) || getBuiltinSkin(DEFAULT_SKIN_ID)!;
    return skin;
  }

  /** Write a user skin JSON (overwrites same id) */
  saveUserSkin(skin: AclSkin): { ok: true; path: string } | { ok: false; error: string } {
    if (!validateSkin(skin)) return { ok: false, error: "invalid skin schema" };
    if (BUILTIN_SKINS.some((b) => b.id === skin.id)) {
      // allow override file that shadows builtin id
    }
    const file = path.join(this.userDir, `${sanitize(skin.id)}.json`);
    const out: AclSkin = { ...skin, version: 1, source: "user" };
    fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n", "utf8");
    return { ok: true, path: file };
  }

  /** Ensure example custom skin exists for discovery */
  ensureExampleSkin(): string {
    const file = path.join(this.userDir, "example-custom.json");
    if (!fs.existsSync(file)) {
      const example: AclSkin = {
        id: "example-custom",
        name: "Example Custom",
        description: "Copy & edit this file — drop more JSON skins in this folder",
        author: "you",
        version: 1,
        source: "user",
        tokens: {
          ...getBuiltinSkin(DEFAULT_SKIN_ID)!.tokens,
          phosphor: "#39ff14",
          phosphorDim: "#1a8f0a",
          edge: "#39ff14",
          asciiBrand: "╔═ ACL ═╗\\n║CUSTOM║\\n╚═══════╝",
        },
      };
      fs.writeFileSync(file, JSON.stringify(example, null, 2) + "\n", "utf8");
    }
    return file;
  }

  private loadUserSkins(): AclSkin[] {
    if (!fs.existsSync(this.userDir)) return [];
    const out: AclSkin[] = [];
    for (const name of fs.readdirSync(this.userDir)) {
      if (!name.endsWith(".json")) continue;
      try {
        const raw = JSON.parse(
          fs.readFileSync(path.join(this.userDir, name), "utf8"),
        );
        if (validateSkin(raw)) {
          out.push({ ...raw, source: "user" });
        }
      } catch {
        /* skip bad files */
      }
    }
    return out;
  }
}

function sanitize(id: string): string {
  return id.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 64);
}
