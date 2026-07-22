import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: true, cwd: root });
    p.on("exit", (c) => (c === 0 ? resolve() : reject(new Error(String(c)))));
  });
}

await run(process.execPath, [path.join(__dirname, "build-main.mjs")]);
await run("npx", ["vite", "build", "--config", "vite.config.ts"]);
console.log("desktop build complete");
