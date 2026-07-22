import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
} from "electron";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import {
  ProjectStore,
  PtyService,
  AgentRegistry,
  type LayoutNode,
} from "@acl/core";
import type { NodeKind, NodeStatus } from "@acl/shared";

const isDev = process.env.ACL_DEV === "1";

function dataDir(): string {
  const override = process.env.ACL_DATA_DIR;
  if (override) {
    fs.mkdirSync(override, { recursive: true });
    return override;
  }
  const dir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

let mainWindow: BrowserWindow | null = null;
let store: ProjectStore;
let pty: PtyService;
let agents: AgentRegistry;
let activeProjectId: string;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "Agent Command Locus",
    backgroundColor: "#0b0f14",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // node-pty bridge needs full preload
    },
  });

  if (isDev) {
    void mainWindow.loadURL("http://127.0.0.1:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
}

function ensureDefaultProject(): string {
  const list = store.listProjects();
  if (list.length > 0) return list[0].id;
  const home = app.getPath("home");
  const p = store.createProject("Default", home);
  return p.id;
}

function registerIpc() {
  ipcMain.handle("acl:getBootstrap", () => {
    const project = store.getProject(activeProjectId)!;
    const nodes = store.listNodes(activeProjectId);
    return {
      project,
      nodes,
      agents: agents.list().map((a) => ({
        ...a,
        // never expose anything secret
      })),
      dataDir: dataDir(),
    };
  });

  ipcMain.handle("acl:listAgents", () => agents.list());

  ipcMain.handle(
    "acl:saveLayout",
    (_e, nodes: LayoutNode[]) => {
      store.saveLayout(activeProjectId, nodes);
      return { ok: true };
    },
  );

  ipcMain.handle(
    "acl:createNode",
    (
      _e,
      input: {
        kind: NodeKind;
        title?: string;
        x?: number;
        y?: number;
        agentId?: string;
        prompt?: string;
      },
    ) => {
      const id = randomUUID();
      const now = new Date().toISOString();
      const project = store.getProject(activeProjectId)!;
      const node: LayoutNode = {
        id,
        project_id: activeProjectId,
        kind: input.kind,
        x: input.x ?? 80 + Math.random() * 120,
        y: input.y ?? 80 + Math.random() * 80,
        w: input.kind === "note" ? 240 : 480,
        h: input.kind === "note" ? 160 : 320,
        title:
          input.title ||
          (input.kind === "agent"
            ? `agent:${input.agentId || "custom"}`
            : input.kind === "note"
              ? "Note"
              : "Terminal"),
        color:
          input.kind === "agent"
            ? "#a855f7"
            : input.kind === "note"
              ? "#eab308"
              : "#3b82f6",
        tags: [],
        config: {
          agentId: input.agentId,
          prompt: input.prompt,
          preferTmux: true,
          cwd: project.cwd,
        },
        status: "idle" as NodeStatus,
        updated_at: now,
      };
      store.upsertNode(node);
      return node;
    },
  );

  ipcMain.handle("acl:deleteNode", (_e, nodeId: string) => {
    pty.kill(nodeId);
    store.deleteNode(nodeId);
    return { ok: true };
  });

  ipcMain.handle(
    "acl:ptyStart",
    async (
      _e,
      opts: {
        nodeId: string;
        kind: NodeKind;
        agentId?: string;
        prompt?: string;
        cwd?: string;
        cols?: number;
        rows?: number;
      },
    ) => {
      const project = store.getProject(activeProjectId)!;
      const cwd = opts.cwd || project.cwd;
      let cmd: string[] | undefined;

      if (opts.kind === "agent") {
        const plan = agents.planLaunch(opts.agentId || "custom", opts.prompt);
        if (plan.missingBinary) {
          return {
            ok: false,
            error: plan.error || "Binary missing",
            agentId: plan.agent.id,
          };
        }
        cmd = plan.argv;
      }

      try {
        pty.spawn({
          id: opts.nodeId,
          cwd,
          cols: opts.cols,
          rows: opts.rows,
          preferTmux: opts.kind === "terminal",
          cmd,
        });
        // update status
        const nodes = store.listNodes(activeProjectId);
        const n = nodes.find((x) => x.id === opts.nodeId);
        if (n) {
          n.status = "running";
          n.updated_at = new Date().toISOString();
          store.upsertNode(n);
        }
        return { ok: true, backend: pty.get(opts.nodeId)?.backend };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  );

  ipcMain.handle("acl:ptyWrite", (_e, nodeId: string, data: string) => {
    pty.write(nodeId, data);
  });

  ipcMain.handle(
    "acl:ptyResize",
    (_e, nodeId: string, cols: number, rows: number) => {
      pty.resize(nodeId, cols, rows);
    },
  );

  ipcMain.handle("acl:ptyKill", (_e, nodeId: string) => {
    pty.kill(nodeId);
    const nodes = store.listNodes(activeProjectId);
    const n = nodes.find((x) => x.id === nodeId);
    if (n) {
      n.status = "idle";
      n.updated_at = new Date().toISOString();
      store.upsertNode(n);
    }
    return { ok: true };
  });
}

app.whenReady().then(async () => {
  store = new ProjectStore(path.join(dataDir(), "acl.db"));
  activeProjectId = ensureDefaultProject();
  agents = new AgentRegistry();
  pty = new PtyService();
  await pty.init();

  pty.on("data", (id: string, data: string) => {
    mainWindow?.webContents.send("acl:ptyData", { nodeId: id, data });
  });
  pty.on("exit", (id: string, code: number | null) => {
    mainWindow?.webContents.send("acl:ptyExit", { nodeId: id, code });
    const nodes = store.listNodes(activeProjectId);
    const n = nodes.find((x) => x.id === id);
    if (n) {
      n.status = code === 0 || code === null ? "idle" : "error";
      n.updated_at = new Date().toISOString();
      store.upsertNode(n);
    }
  });

  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  pty?.killAll();
  store?.close();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  pty?.killAll();
});
