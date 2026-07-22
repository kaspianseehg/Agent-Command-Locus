/**
 * ACL Server — Phase 3/4
 * HTTP JSON + static phosphor pages + WebSocket PTY + presence.
 * Default bind 127.0.0.1:8450. No secrets in repo.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import {
  ProjectStore,
  PtyService,
  AgentRegistry,
  PresenceHub,
  AgentBus,
  DataDirLock,
} from "@acl/core";
import { BUILTIN_AGENTS } from "@acl/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "../public");
const BIND = process.env.ACL_BIND || "127.0.0.1";
const PORT = Number(process.env.ACL_PORT || 8450);
const DATA =
  process.env.ACL_DATA_DIR || path.join(os.homedir(), ".acl-server-data");
const PASSWORD = process.env.ACL_SERVER_PASSWORD || "";

fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(PUBLIC, { recursive: true });

const store = new ProjectStore(path.join(DATA, "acl.json"));
if (store.listProjects().length === 0) {
  store.seedSampleProject(os.homedir());
}

const pty = new PtyService();
await pty.init();
const presence = new PresenceHub();
const bus = new AgentBus();
const agents = new AgentRegistry(BUILTIN_AGENTS);

function unauthorized(res) {
  res.writeHead(401, {
    "Content-Type": "application/json",
    "WWW-Authenticate": 'Basic realm="acl"',
  });
  res.end(JSON.stringify({ error: "auth_required" }));
}

function checkAuth(req) {
  if (!PASSWORD) return true;
  const h = req.headers.authorization || "";
  if (!h.startsWith("Basic ")) return false;
  const decoded = Buffer.from(h.slice(6), "base64").toString("utf8");
  const pass = decoded.includes(":")
    ? decoded.split(":").slice(1).join(":")
    : decoded;
  return pass === PASSWORD;
}

function json(res, code, body) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(res, filePath) {
  if (!fs.existsSync(filePath)) {
    json(res, 404, { error: "not_found" });
    return;
  }
  const ext = path.extname(filePath);
  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".json": "application/json",
  };
  res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  if (!checkAuth(req)) return unauthorized(res);

  const url = new URL(req.url || "/", `http://${BIND}:${PORT}`);
  const p = url.pathname;

  try {
    if (p === "/health" || p === "/v1/health") {
      return json(res, 200, {
        ok: true,
        service: "acl-server",
        motif: "phosphor-lattice",
        version: "0.3.1",
        bind: `${BIND}:${PORT}`,
        pty_ws: true,
        presence: true,
        mobile: true,
      });
    }

    if (p === "/v1/projects" && req.method === "GET") {
      return json(res, 200, store.listProjects());
    }

    if (p === "/v1/agents" && req.method === "GET") {
      return json(res, 200, agents.list());
    }

    const projMatch = p.match(/^\/v1\/projects\/([^/]+)$/);
    if (projMatch && req.method === "GET") {
      const proj = store.getProject(projMatch[1]);
      if (!proj) return json(res, 404, { error: "project_not_found" });
      return json(res, 200, {
        project: proj,
        nodes: store.listNodes(proj.id),
        cards: store.listCards(proj.id),
        comments: store.listComments(proj.id),
        presence: presence.list(proj.id),
      });
    }

    const layoutMatch = p.match(/^\/v1\/projects\/([^/]+)\/layout$/);
    if (layoutMatch && req.method === "GET") {
      return json(res, 200, store.listNodes(layoutMatch[1]));
    }
    if (layoutMatch && req.method === "PUT") {
      const body = await readBody(req);
      store.saveLayout(layoutMatch[1], body.nodes || body || []);
      return json(res, 200, { ok: true });
    }

    const kanbanMatch = p.match(/^\/v1\/projects\/([^/]+)\/kanban$/);
    if (kanbanMatch && req.method === "GET") {
      return json(res, 200, store.listCards(kanbanMatch[1]));
    }
    if (kanbanMatch && req.method === "POST") {
      const body = await readBody(req);
      const now = new Date().toISOString();
      const card = {
        task_id: body.task_id || crypto.randomUUID(),
        project_id: kanbanMatch[1],
        title: body.title || "untitled",
        body: body.body || "",
        status: body.status || "backlog",
        assignee_agent_id: body.assignee_agent_id ?? null,
        parents: [],
        labels: body.labels || [],
        handoff: null,
        updated_at: now,
        updated_by: body.author || "web",
        archived_at: null,
      };
      store.upsertCard(card);
      return json(res, 200, card);
    }

    const commentsMatch = p.match(/^\/v1\/projects\/([^/]+)\/comments$/);
    if (commentsMatch && req.method === "GET") {
      return json(res, 200, store.listComments(commentsMatch[1]));
    }
    if (commentsMatch && req.method === "POST") {
      const body = await readBody(req);
      const c = store.addComment({
        project_id: commentsMatch[1],
        target_type: body.target_type || "node",
        target_id: body.target_id || "",
        author: body.author || "web",
        body: body.body || "",
      });
      broadcast(commentsMatch[1], { type: "comment", comment: c });
      return json(res, 200, c);
    }

    const presenceMatch = p.match(/^\/v1\/projects\/([^/]+)\/presence$/);
    if (presenceMatch && req.method === "GET") {
      return json(res, 200, presence.list(presenceMatch[1]));
    }

    if (p === "/" || p === "/index.html") {
      return serveStatic(res, path.join(PUBLIC, "index.html"));
    }
    if (p === "/canvas" || p === "/canvas.html") {
      return serveStatic(res, path.join(PUBLIC, "canvas.html"));
    }
    if (p === "/m" || p === "/m/" || p === "/m/index.html") {
      return serveStatic(res, path.join(PUBLIC, "m.html"));
    }
    if (p.startsWith("/static/")) {
      return serveStatic(res, path.join(PUBLIC, p.slice("/static/".length)));
    }

    json(res, 404, { error: "not_found", path: p });
  } catch (e) {
    json(res, 500, { error: String(e?.message || e) });
  }
});

/** projectId -> Set<ws> for events (not pty) */
const rooms = new Map();

function roomAdd(projectId, ws) {
  if (!rooms.has(projectId)) rooms.set(projectId, new Set());
  rooms.get(projectId).add(ws);
}
function roomDel(projectId, ws) {
  rooms.get(projectId)?.delete(ws);
}
function broadcast(projectId, msg, except) {
  const set = rooms.get(projectId);
  if (!set) return;
  const data = JSON.stringify(msg);
  for (const ws of set) {
    if (ws !== except && ws.readyState === 1) ws.send(data);
  }
}

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  if (PASSWORD) {
    // Basic auth on upgrade via query token alternative: ?token=
    const url = new URL(req.url || "/", `http://${BIND}`);
    const token = url.searchParams.get("token");
    if (token !== PASSWORD) {
      const h = req.headers.authorization || "";
      if (!h.startsWith("Basic ")) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
      const decoded = Buffer.from(h.slice(6), "base64").toString("utf8");
      const pass = decoded.includes(":")
        ? decoded.split(":").slice(1).join(":")
        : decoded;
      if (pass !== PASSWORD) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
    }
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "/", `http://${BIND}`);
  const kind = url.searchParams.get("kind") || "events";
  const projectId =
    url.searchParams.get("projectId") || store.listProjects()[0]?.id;
  const nodeId = url.searchParams.get("nodeId");

  if (kind === "pty" && nodeId) {
    // PTY session over WS: binary/text frames
    try {
      const session = pty.spawn({
        id: `web-${nodeId}`,
        cwd: store.getProject(projectId)?.cwd || os.homedir(),
        cols: Number(url.searchParams.get("cols") || 100),
        rows: Number(url.searchParams.get("rows") || 30),
        preferTmux: true,
      });
      const onData = (id, data) => {
        if (id === `web-${nodeId}` && ws.readyState === 1) {
          ws.send(JSON.stringify({ type: "data", data }));
        }
      };
      const onExit = (id, code) => {
        if (id === `web-${nodeId}` && ws.readyState === 1) {
          ws.send(JSON.stringify({ type: "exit", code }));
        }
      };
      pty.on("data", onData);
      pty.on("exit", onExit);
      ws.send(
        JSON.stringify({
          type: "ready",
          backend: session.backend,
          nodeId,
        }),
      );
      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(String(raw));
          if (msg.type === "input") pty.write(`web-${nodeId}`, msg.data || "");
          if (msg.type === "resize")
            pty.resize(`web-${nodeId}`, msg.cols || 80, msg.rows || 24);
        } catch {
          pty.write(`web-${nodeId}`, String(raw));
        }
      });
      ws.on("close", () => {
        pty.off?.("data", onData);
        pty.kill(`web-${nodeId}`);
      });
    } catch (e) {
      ws.send(JSON.stringify({ type: "error", error: String(e) }));
      ws.close();
    }
    return;
  }

  // events / presence channel
  roomAdd(projectId, ws);
  let user = null;
  ws.send(
    JSON.stringify({
      type: "hello",
      projectId,
      presence: presence.list(projectId),
      motif: "phosphor-lattice",
    }),
  );

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (msg.type === "join") {
      user = presence.join(projectId, msg.name);
      ws.send(JSON.stringify({ type: "joined", user }));
      broadcast(projectId, { type: "presence", users: presence.list(projectId) });
    }
    if (msg.type === "move" && user) {
      presence.move(user.id, msg.x || 0, msg.y || 0);
      broadcast(
        projectId,
        { type: "presence", users: presence.list(projectId) },
        ws,
      );
    }
    if (msg.type === "heartbeat" && user) {
      presence.heartbeat(user.id);
    }
    if (msg.type === "comment") {
      const c = store.addComment({
        project_id: projectId,
        target_type: msg.target_type || "node",
        target_id: msg.target_id || "",
        author: msg.author || user?.name || "web",
        body: msg.body || "",
      });
      broadcast(projectId, { type: "comment", comment: c });
    }
  });

  ws.on("close", () => {
    roomDel(projectId, ws);
    if (user) {
      presence.leave(user.id);
      broadcast(projectId, {
        type: "presence",
        users: presence.list(projectId),
      });
    }
  });
});

// PtyService may not have .off — polyfill removeListener
if (typeof pty.off !== "function") {
  pty.off = function (ev, fn) {
    return this.removeListener(ev, fn);
  };
}

server.listen(PORT, BIND, () => {
  console.log(`[acl-server] http://${BIND}:${PORT}`);
  console.log(`[acl-server] canvas=/canvas  mobile=/m  ws=pty|events`);
  console.log(`[acl-server] data=${DATA}`);
});
const release = () => { try { dataLock.release(); } catch {} };
process.on("exit", release);
process.on("SIGINT", () => { release(); process.exit(0); });
process.on("SIGTERM", () => { release(); process.exit(0); });
