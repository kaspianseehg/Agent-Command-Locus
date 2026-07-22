/**
 * Apply an ACL skin to the document (renderer).
 */
import { skinToCssVars, type AclSkin } from "@acl/shared";

export function applySkinToDocument(skin: AclSkin, root: HTMLElement = document.documentElement): void {
  const vars = skinToCssVars(skin);
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
  root.dataset.skin = skin.id;
  root.style.colorScheme = isLight(skin.tokens.void) ? "light" : "dark";

  // grid background uses phosphor at low alpha — rebuild image if no custom
  if (!skin.tokens.backgroundImage) {
    const g = skin.tokens.gridSize || 28;
    const line = hexToRgba(skin.tokens.phosphor, 0.05);
    root.style.setProperty(
      "--skin-grid-bg",
      `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
    );
    root.style.setProperty("--skin-grid-size", `${g}px`);
  } else {
    root.style.setProperty("--skin-grid-bg", skin.tokens.backgroundImage);
  }
}

function isLight(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

function hexToRgba(hex: string, a: number): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return `rgba(93,255,176,${a})`;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
