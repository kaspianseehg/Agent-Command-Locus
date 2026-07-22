# Skins & aesthetics

Users can change ACL’s look without forking. Skins are JSON files of design tokens mapped to CSS variables.

## Built-in skins

| id | Name |
|----|------|
| `phosphor-lattice` | Default green HUD |
| `amber-terminal` | Warm CRT amber |
| `ice-ops` | Cold blue ops |
| `violet-swarm` | Violet hive |
| `paper-light` | Light daylight desk |

## Desktop UI

**Settings → AESTHETICS // SKINS**

- Click a swatch to apply instantly
- **open skins folder** — `…/data/skins/` under your ACL data dir
- **reload skins** — pick up new/edited JSON
- **import skin JSON** — paste a full `AclSkin` document

On first launch ACL writes `example-custom.json` into the skins folder.

## User skin file

Path: `{ACL_DATA_DIR or Electron userData}/data/skins/<id>.json`

```json
{
  "id": "my-neon",
  "name": "My Neon",
  "description": "Personal aesthetic",
  "author": "you",
  "version": 1,
  "tokens": {
    "void": "#05080a",
    "panel": "#0a1014",
    "panel2": "#0e161c",
    "lattice": "#122028",
    "line": "#1c333f",
    "phosphor": "#39ff14",
    "phosphorDim": "#1a8f0a",
    "cyan": "#4cc9f0",
    "amber": "#ffb020",
    "rose": "#ff5d8f",
    "text": "#d7ece4",
    "muted": "#6f8f85",
    "mono": "\"IBM Plex Mono\", ui-monospace, Menlo, monospace",
    "display": "\"Syne\", system-ui, sans-serif",
    "glow": "0 0 24px rgba(57, 255, 20, 0.2)",
    "edge": "#39ff14",
    "gridSize": 28,
    "borderRadius": "0px",
    "asciiBrand": "╔═ ACL ═╗\\n║ NEON  ║\\n╚═══════╝"
  }
}
```

### Required token fields

`void`, `panel`, `phosphor`, `text`, `line` (others recommended).

### Optional

| Token | Effect |
|-------|--------|
| `backgroundImage` | Full CSS `background-image` override |
| `gridSize` | Lattice grid spacing (px) |
| `borderRadius` | Node/modal rounding |
| `asciiBrand` | Brand block text (future chrome) |
| `glow`, `edge`, fonts | Atmosphere |

## Sharing

Export your JSON (copy from skins folder) and share. Others **import skin JSON** or drop the file into their skins directory and hit reload.

Repo sample: [`samples/skins/retro-green.json`](../samples/skins/retro-green.json)

## Policy

Skins are aesthetic only — they must not change agent defaults or ban vendors.
