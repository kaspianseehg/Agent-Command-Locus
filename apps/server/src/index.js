/**
 * ACL Server Edition — Phase 3 foundation
 * Loopback HTTP: health + kanban/project JSON read API.
 * Full browser PTY/WS canvas lands next; no secrets in tree.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { ProjectStore } from "@acl/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIND = process.env.ACL_BIND || "127.0.0.1";
const PORT = Number(process.env.ACL_PORT || 8450);
const DATA =
  process.env.ACL_DATA_DIR ||
  path.join(os.homedir(), ".acl-server-data");

fs.mkdirSync(DATA, { recursive: true });
const store = new ProjectStore(path.join(DATA, "acl.json"));
if (store.listProjects().length === 0) {
  store.seedSampleProject(os.homedir());
}

const PASSWORD = process.env.ACL_SERVER_PASSWORD || "";

function unauthorized(res) {
  res.writeHead(401, {
    "Content-Type": "application/json",
    "WWW-Authenticate": 'Basic realm="acl"',
  });
  res.end(JSON.stringify({ error: "auth_required" }));
}

function checkAuth(req) {
  if (!PASSWORD) return true; // dev mode; production should set password
  const h = req.headers.authorization || "";
  if (!h.startsWith("Basic ")) return false;
  const decoded = Buffer.from(h.slice(6), "base64").toString("utf8");
  const pass = decoded.includes(":") ? decoded.split(":").slice(1).join(":") : decoded;
  return pass === PASSWORD;
}

const server = http.createServer((req, res) => {
  if (!checkAuth(req)) return unauthorized(res);

  const url = new URL(req.url || "/", `http://${BIND}:${PORT}`);

  if (url.pathname === "/health" || url.pathname === "/v1/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        service: "acl-server",
        motif: "phosphor-lattice",
        bind: `${BIND}:${PORT}`,
        pty_ws: false,
        note: "PTY WebSocket canvas next",
      }),
    );
    return;
  }

  if (url.pathname === "/v1/projects") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(store.listProjects()));
    return;
  }

  if (url.pathname.startsWith("/v1/projects/") && url.pathname.endsWith("/kanban")) {
    const id = url.pathname.split("/")[3];
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(store.listCards(id)));
    return;
  }

  if (url.pathname === "/" || url.pathname === "/index.html") {
    const html = `<!doctype html>
<html><head>
<meta charset="utf-8"/>
<title>ACL Server · LATTICE</title>
<style>
body{margin:0;background:#05080a;color:#5dffb0;font-family:ui-monospace,monospace;padding:24px}
pre{line-height:1.35}
a{color:#4cc9f0}
.muted{color:#6f8f85}
</style></head>
<body>
<pre>
╔══════════════════════════════════════╗
║   AGENT COMMAND LOCUS · SERVER       ║
║   motif: phosphor-lattice            ║
╚══════════════════════════════════════╝

  GET /v1/health
  GET /v1/projects
  GET /v1/projects/:id/kanban

  Browser PTY canvas: coming next (WS)
  Desktop remains primary UI for Phase 1.5–2

  bind: ${BIND}:${PORT}
  auth: ${PASSWORD ? "password set" : "open (set ACL_SERVER_PASSWORD)"}
</pre>
<p class="muted"><a href="/v1/health">/v1/health</a> · <a href="/v1/projects">/v1/projects</a></p>
</body></html>`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not_found" }));
});

server.listen(PORT, BIND, () => {
  console.log(`[acl-server] http://${BIND}:${PORT}  data=${DATA}`);
});
