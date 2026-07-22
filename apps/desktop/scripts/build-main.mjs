import * as esbuild from "esbuild";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

mkdirSync(path.join(root, "out/main"), { recursive: true });

await esbuild.build({
  entryPoints: [
    path.join(root, "src/main/index.ts"),
    path.join(root, "src/main/preload.ts"),
  ],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outdir: path.join(root, "out/main"),
  // Bundle workspace packages into main so Electron CJS resolve works.
  external: ["electron", "node-pty"],
  sourcemap: true,
});

console.log("main+preload built");
