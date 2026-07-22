import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, { stdio: "inherit", shell: process.platform === "win32", ...opts });
}

// build main first
await new Promise((resolve, reject) => {
  const p = run(process.execPath, [path.join(__dirname, "build-main.mjs")], { cwd: root });
  p.on("exit", (c) => (c === 0 ? resolve() : reject(new Error("build-main failed"))));
});

const electronPath = require("electron");
const vite = run("npx", ["vite", "--config", "vite.config.ts"], { cwd: root });

// wait then electron
const wait = run("npx", ["wait-on", "http://127.0.0.1:5173"], { cwd: root });
await new Promise((resolve, reject) => {
  wait.on("exit", (c) => (c === 0 ? resolve() : reject(new Error("wait-on failed"))));
});

const elec = run(electronPath, ["."], {
  cwd: root,
  env: { ...process.env, ACL_DEV: "1", ELECTRON_DISABLE_SECURITY_WARNINGS: "1" },
});

const shutdown = () => {
  vite.kill("SIGTERM");
  elec.kill("SIGTERM");
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

elec.on("exit", () => {
  vite.kill("SIGTERM");
  process.exit(0);
});
