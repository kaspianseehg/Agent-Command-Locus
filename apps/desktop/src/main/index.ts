import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import {
  ProjectStore,
  PtyService,
  AgentRegistry,
  AgentBus,
  DataDirLock,
  BUILTIN_TEMPLATES,
  applyTemplate,
  exportLayoutTemplate,
  TranscriptStore,
  UsageMeter,
  SkinCatalog,
  buildContextPacket,
  newContextLink,
  type LayoutNode,
  type LayoutEdge,
  type KanbanCardRecord,
  type AppSettings,
  type LayoutTemplate,
} from "@acl/core";
import { BUILTIN_AGENTS, type NodeKind, type NodeStatus, type KanbanStatus } from "@acl/shared";
import { capabilityChip, getAdapter, validateHandoff, listAdapters } from "@acl/adapters";

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
let bus: AgentBus;
let activeProjectId: string;
let dataLock: DataDirLock | null = null;
let lockWarning: string | null = null;
let transcripts: TranscriptStore;
let usage: UsageMeter;
let skins: SkinCatalog;


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    title: "Agent Command Locus",
    backgroundColor: "#05080a",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: { x: 14, y: 14 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    void mainWindow.loadURL("http://127.0.0.1:5173");
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
}

function ensureProject(): string {
  const settings = store.getSettings();
  if (settings.lastProjectId && store.getProject(settings.lastProjectId)) {
    return settings.lastProjectId;
  }
  const list = store.listProjects();
  if (list.length > 0) {
    store.setLastProject(list[0].id);
    return list[0].id;
  }
  const home = app.getPath("home");
  return store.seedSampleProject(home).id;
}

function rebuildRegistry() {
  const settings = store.getSettings();
  const builtins = BUILTIN_AGENTS.map((a) => ({
    ...a,
    defaultEnabled: !settings.disabledAgents.includes(a.id),
  }));
  const custom = settings.customAgents.map((c) => ({
    id: c.id,
    label: c.label,
    launchCmd: c.launchCmd,
    promptInjection: "argv" as const,
    defaultEnabled: c.defaultEnabled,
    policyTags: ["custom"],
    targetTier: 0 as const,
  }));
  agents = new AgentRegistry([...builtins, ...custom]);
}

function registerIpc() {
  ipcMain.handle("acl:getBootstrap", async () => {
    const project = store.getProject(activeProjectId)!;
    rebuildRegistry();
    const tmuxSessions: string[] = [];
    try {
      const { execSync } = await import("node:child_process");
      const out = execSync("tmux list-sessions -F '#{session_name}' 2>/dev/null || true", {
        encoding: "utf8",
      });
      for (const line of out.split("\n")) {
        if (line.startsWith("acl-")) tmuxSessions.push(line.trim());
      }
    } catch {
      /* ignore */
    }
    const caps = agents.list().map((a) => capabilityChip(a.id));
    return {
      project,
      projects: store.listProjects(),
      nodes: store.listNodes(activeProjectId),
      cards: store.listCards(activeProjectId),
      comments: store.listComments(activeProjectId),
      edges: store.listEdges(activeProjectId),
      usage: usage.list(),
      agents: agents.list(),
      capabilities: caps,
      settings: store.getSettings(),
      dataDir: dataDir(),
      inbox: bus.listInbox(),
      statuses: bus.listStatuses(),
      tmuxSessions,
      lockWarning,
      skins: skins.list(),
      activeSkin: skins.resolve(store.getSettings().skinId),
      skinsDir: skins.getUserDir(),
      brand: {
        name: "Agent Command Locus",
        codename: "LATTICE",
        motif: "phosphor-lattice",
      },
    };
  });

  ipcMain.handle("acl:listProjects", () => store.listProjects());

  ipcMain.handle("acl:switchProject", (_e, id: string) => {
    if (!store.getProject(id)) return { ok: false };
    activeProjectId = id;
    store.setLastProject(id);
    return { ok: true, project: store.getProject(id), nodes: store.listNodes(id), cards: store.listCards(id) };
  });

  ipcMain.handle("acl:createProject", (_e, name: string, cwd?: string) => {
    const p = store.createProject(name || "Untitled", cwd || app.getPath("home"));
    activeProjectId = p.id;
    return p;
  });

  ipcMain.handle("acl:renameProject", (_e, id: string, name: string) =>
    store.renameProject(id, name),
  );

  ipcMain.handle("acl:deleteProject", (_e, id: string) => {
    const ok = store.deleteProject(id);
    if (ok && activeProjectId === id) {
      activeProjectId = store.listProjects()[0].id;
      store.setLastProject(activeProjectId);
    }
    return { ok, activeProjectId };
  });

  ipcMain.handle("acl:seedDemo", () => {
    const p = store.seedSampleProject(app.getPath("home"));
    activeProjectId = p.id;
    return {
      project: p,
      nodes: store.listNodes(p.id),
      cards: store.listCards(p.id),
      projects: store.listProjects(),
    };
  });

  ipcMain.handle("acl:getSettings", () => store.getSettings());
  ipcMain.handle("acl:saveSettings", (_e, partial: Partial<AppSettings>) => {
    const s = store.saveSettings(partial);
    rebuildRegistry();
    return s;
  });

  ipcMain.handle("acl:listAgents", () => {
    rebuildRegistry();
    return agents.list();
  });

  ipcMain.handle("acl:saveLayout", (_e, nodes: LayoutNode[]) => {
    store.saveLayout(activeProjectId, nodes);
    return { ok: true };
  });

  ipcMain.handle(
    "acl:createNode",
    (
      _e,
      input: {
        kind: NodeKind;
        title?: string;
        x?: number;
        y?: number;
        w?: number;
        h?: number;
        color?: string;
        tags?: string[];
        agentId?: string;
        prompt?: string;
        parent_group_id?: string | null;
        noteText?: string;
      },
    ) => {
      const id = randomUUID();
      const now = new Date().toISOString();
      const project = store.getProject(activeProjectId)!;
      const kind = input.kind;
      const node: LayoutNode = {
        id,
        project_id: activeProjectId,
        kind,
        x: input.x ?? 80 + Math.random() * 100,
        y: input.y ?? 80 + Math.random() * 80,
        w:
          input.w ??
          (kind === "note" ? 260 : kind === "group" ? 480 : 440),
        h:
          input.h ??
          (kind === "note" ? 150 : kind === "group" ? 320 : 280),
        title:
          input.title ||
          (kind === "agent"
            ? `◆ ${input.agentId || "custom"}`
            : kind === "note"
              ? "▤ note"
              : kind === "group"
                ? "◈ group"
                : "⬡ term"),
        color:
          input.color ||
          (kind === "agent"
            ? "#5dffb0"
            : kind === "note"
              ? "#ffb020"
              : kind === "group"
                ? "#3d5a6c"
                : "#4cc9f0"),
        tags: input.tags || [],
        config: {
          agentId: input.agentId,
          prompt: input.prompt,
          preferTmux: kind === "terminal",
          cwd: project.cwd,
          noteText: input.noteText || "",
        },
        status: "idle" as NodeStatus,
        updated_at: now,
        parent_group_id: input.parent_group_id ?? null,
      };
      store.upsertNode(node);
      return node;
    },
  );

  ipcMain.handle("acl:updateNodeMeta", (_e, id: string, patch: Partial<LayoutNode>) => {
    const nodes = store.listNodes(activeProjectId);
    const n = nodes.find((x) => x.id === id);
    if (!n) return null;
    const next = {
      ...n,
      ...patch,
      config: { ...n.config, ...(patch.config || {}) },
      updated_at: new Date().toISOString(),
    };
    store.upsertNode(next);
    return next;
  });

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
        rebuildRegistry();
        const plan = agents.planLaunch(opts.agentId || "custom", opts.prompt);
        if (plan.missingBinary) {
          bus.setStatus(opts.nodeId, "error", plan.error);
          return { ok: false, error: plan.error || "Binary missing", agentId: plan.agent.id };
        }
        const adapter = getAdapter(plan.agent.id, plan.agent);
        cmd = adapter.enrichLaunch
          ? adapter.enrichLaunch(plan.argv, opts.prompt)
          : plan.argv;
        // attach transcript hint on node config
        const nodes0 = store.listNodes(activeProjectId);
        const n0 = nodes0.find((x) => x.id === opts.nodeId);
        if (n0) {
          const tp = adapter.transcriptPath?.({
            projectId: activeProjectId,
            nodeId: opts.nodeId,
            cwd,
            dataDir: dataDir(),
          });
          n0.config = {
            ...n0.config,
            transcriptPath: tp,
            capability: capabilityChip(plan.agent.id),
          };
          store.upsertNode(n0);
        }
      }

      // ensure transcript path on node
      {
        const nodesTx = store.listNodes(activeProjectId);
        const nx = nodesTx.find((x) => x.id === opts.nodeId);
        if (nx && !nx.config?.transcriptPath) {
          const agentKey = (opts.agentId || nx.config?.agentId || nx.kind) as string;
          const adapter = getAdapter(String(agentKey), agents.get(String(agentKey)));
          const tp = adapter.transcriptPath?.({
            projectId: activeProjectId,
            nodeId: opts.nodeId,
            cwd,
            dataDir: dataDir(),
          });
          if (tp) {
            nx.config = { ...nx.config, transcriptPath: tp };
            store.upsertNode(nx);
            transcripts.ensureFile(tp);
          }
        } else if (nx?.config?.transcriptPath) {
          transcripts.ensureFile(String(nx.config.transcriptPath));
        }
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
        const nodes = store.listNodes(activeProjectId);
        const n = nodes.find((x) => x.id === opts.nodeId);
        if (n) {
          n.status = "running";
          n.updated_at = new Date().toISOString();
          store.upsertNode(n);
        }
        bus.setStatus(opts.nodeId, "running");
        return { ok: true, backend: pty.get(opts.nodeId)?.backend };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        bus.setStatus(opts.nodeId, "error", msg);
        return { ok: false, error: msg };
      }
    },
  );

  ipcMain.handle("acl:ptyWrite", (_e, nodeId: string, data: string) => {
    usage.recordIn(nodeId, data);
    pty.write(nodeId, data);
    mainWindow?.webContents.send("acl:usage", usage.get(nodeId));
  });
  ipcMain.handle("acl:ptyResize", (_e, nodeId: string, cols: number, rows: number) => {
    pty.resize(nodeId, cols, rows);
  });
  ipcMain.handle("acl:ptyKill", (_e, nodeId: string) => {
    pty.kill(nodeId);
    bus.setStatus(nodeId, "idle");
    return { ok: true };
  });

  // Kanban
  ipcMain.handle("acl:listCards", () => store.listCards(activeProjectId));
  ipcMain.handle(
    "acl:upsertCard",
    (
      _e,
      input: {
        task_id?: string;
        title: string;
        body?: string;
        status?: KanbanStatus;
        assignee_agent_id?: string | null;
        labels?: string[];
      },
    ) => {
      const now = new Date().toISOString();
      const card: KanbanCardRecord = {
        task_id: input.task_id || randomUUID(),
        project_id: activeProjectId,
        title: input.title,
        body: input.body || "",
        status: input.status || "backlog",
        assignee_agent_id: input.assignee_agent_id ?? null,
        parents: [],
        labels: input.labels || [],
        handoff: null,
        updated_at: now,
        updated_by: "user",
        archived_at: null,
      };
      // merge if exists
      const prev = store.listCards(activeProjectId).find((c) => c.task_id === card.task_id);
      if (prev) {
        Object.assign(card, {
          ...prev,
          ...card,
          body: input.body ?? prev.body,
          status: input.status ?? prev.status,
          assignee_agent_id:
            input.assignee_agent_id !== undefined
              ? input.assignee_agent_id
              : prev.assignee_agent_id,
          labels: input.labels ?? prev.labels,
          updated_at: now,
        });
      }
      store.upsertCard(card);
      return card;
    },
  );
  ipcMain.handle("acl:deleteCard", (_e, taskId: string) => {
    store.deleteCard(taskId);
    return { ok: true };
  });

  // Bus / inbox
  ipcMain.handle("acl:listInbox", () => bus.listInbox());
  ipcMain.handle("acl:clearInbox", (_e, id: string) => {
    bus.clearInboxItem(id);
    return bus.listInbox();
  });
  ipcMain.handle("acl:inboxReply", (_e, nodeId: string, text: string) => {
    bus.reply(nodeId, text);
    pty.write(nodeId, text.endsWith("\n") ? text : text + "\n");
    return { ok: true };
  });
  ipcMain.handle(
    "acl:setStatus",
    (_e, nodeId: string, status: string, detail?: string) =>
      bus.setStatus(nodeId, status, detail),
  );

  ipcMain.handle("acl:listComments", () => store.listComments(activeProjectId));
  ipcMain.handle(
    "acl:addComment",
    (
      _e,
      input: {
        target_type?: "node" | "card";
        target_id?: string;
        author?: string;
        body: string;
      },
    ) => {
      return store.addComment({
        project_id: activeProjectId,
        target_type: input.target_type || "node",
        target_id: input.target_id || "",
        author: input.author || "desktop",
        body: input.body,
      });
    },
  );

  ipcMain.handle(
    "acl:attachHandoff",
    (
      _e,
      input: {
        task_id: string;
        agentId?: string;
        summary: string;
        files_touched?: string[];
        blockers?: string[];
        test_results?: string;
        ownership_next?: string;
      },
    ) => {
      const cards = store.listCards(activeProjectId);
      const card = cards.find((c) => c.task_id === input.task_id);
      if (!card) return { ok: false, error: "card not found" };
      const adapter = getAdapter(input.agentId || card.assignee_agent_id || "custom");
      const handoff = adapter.buildHandoff
        ? adapter.buildHandoff({
            task_id: input.task_id,
            summary: input.summary,
            files_touched: input.files_touched || [],
            blockers: input.blockers || [],
            test_results: input.test_results || "",
            ownership_next: input.ownership_next || "",
          })
        : {
            task_id: input.task_id,
            summary: input.summary,
            files_touched: input.files_touched || [],
            blockers: input.blockers || [],
            test_results: input.test_results || "",
            ownership_next: input.ownership_next || "",
          };
      if (!validateHandoff(handoff)) return { ok: false, error: "invalid handoff" };
      card.handoff = handoff as unknown as Record<string, unknown>;
      card.updated_at = new Date().toISOString();
      card.updated_by = "handoff";
      store.upsertCard(card);
      return { ok: true, card };
    },
  );

  ipcMain.handle("acl:listCapabilities", () =>
    listAdapters().map((a) => capabilityChip(a.id)),
  );

  ipcMain.handle("acl:openPath", async (_e, filePath: string) => {
    if (!filePath) return { ok: false };
    // show item in folder if exists, else open path parent
    const fs = await import("node:fs");
    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return { ok: true };
    }
    const path = await import("node:path");
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    shell.openPath(dir);
    return { ok: true, createdDir: true };
  });

  ipcMain.handle("acl:getServerUrlDefault", () => process.env.ACL_SERVER_URL || "http://127.0.0.1:8450");

  ipcMain.handle("acl:listTemplates", () => BUILTIN_TEMPLATES);

  ipcMain.handle("acl:applyTemplate", (_e, templateId: string) => {
    const tpl = BUILTIN_TEMPLATES.find((x) => x.id === templateId);
    if (!tpl) return { ok: false, error: "unknown template" };
    const existing = store.listNodes(activeProjectId);
    const offsetY = existing.length
      ? Math.max(...existing.map((n) => n.y + n.h)) + 40
      : 0;
    const nodes = applyTemplate(activeProjectId, tpl, { x: 0, y: offsetY });
    const merged = [...existing, ...nodes];
    store.saveLayout(activeProjectId, merged);
    return { ok: true, nodes: merged };
  });

  ipcMain.handle("acl:importTemplate", (_e, raw: LayoutTemplate) => {
    if (!raw || !Array.isArray(raw.nodes)) return { ok: false, error: "bad template" };
    const existing = store.listNodes(activeProjectId);
    const offsetY = existing.length
      ? Math.max(...existing.map((n) => n.y + n.h)) + 40
      : 0;
    const nodes = applyTemplate(activeProjectId, raw, { x: 0, y: offsetY });
    const merged = [...existing, ...nodes];
    store.saveLayout(activeProjectId, merged);
    return { ok: true, nodes: merged };
  });

  ipcMain.handle("acl:exportLayout", (_e, name?: string) => {
    const nodes = store.listNodes(activeProjectId);
    return exportLayoutTemplate(name || "export", nodes, "ACL layout export");
  });

  ipcMain.handle("acl:tailTranscript", (_e, nodeId: string, max?: number) => {
    const n = store.listNodes(activeProjectId).find((x) => x.id === nodeId);
    const tp = (n?.config?.transcriptPath as string) || null;
    return transcripts.tail(activeProjectId, nodeId, max || 10000, tp);
  });

  ipcMain.handle("acl:listEdges", () => store.listEdges(activeProjectId));
  ipcMain.handle("acl:saveEdges", (_e, edges: LayoutEdge[]) => {
    store.saveEdges(activeProjectId, edges);
    return { ok: true };
  });

  ipcMain.handle(
    "acl:contextLink",
    async (_e, sourceId: string, targetId: string, inject = true) => {
      const nodes = store.listNodes(activeProjectId);
      const source = nodes.find((n) => n.id === sourceId);
      const target = nodes.find((n) => n.id === targetId);
      if (!source || !target) return { ok: false, error: "nodes not found" };
      const edge: LayoutEdge = {
        id: newContextLink(activeProjectId, sourceId, targetId).id,
        project_id: activeProjectId,
        source: sourceId,
        target: targetId,
        kind: "context",
        label: "context",
        created_at: new Date().toISOString(),
      };
      store.upsertEdge(edge);
      const tp = (source.config?.transcriptPath as string) || null;
      const tail = transcripts.tail(activeProjectId, sourceId, 8000, tp).text;
      const packet = buildContextPacket({
        source,
        target,
        transcriptTail: tail,
      });
      if (inject) {
        // write into target PTY if alive
        try {
          pty.write(targetId, packet);
        } catch {
          /* target may not be running */
        }
      }
      bus.setStatus(targetId, "running", "context linked");
      return { ok: true, edge, packet };
    },
  );

  ipcMain.handle("acl:getUsage", (_e, nodeId?: string) => {
    if (nodeId) return usage.get(nodeId);
    return usage.list();
  });

  ipcMain.handle("acl:listSkins", () => skins.list());
  ipcMain.handle("acl:getActiveSkin", () =>
    skins.resolve(store.getSettings().skinId),
  );
  ipcMain.handle("acl:setSkin", (_e, skinId: string) => {
    const skin = skins.get(skinId);
    if (!skin) return { ok: false, error: "unknown skin" };
    store.saveSettings({ skinId });
    return { ok: true, skin, settings: store.getSettings() };
  });
  ipcMain.handle("acl:saveUserSkin", (_e, raw: unknown) => {
    const res = skins.saveUserSkin(raw as import("@acl/shared").AclSkin);
    return res;
  });
  ipcMain.handle("acl:openSkinsDir", async () => {
    const { shell } = await import("electron");
    skins.ensureExampleSkin();
    await shell.openPath(skins.getUserDir());
    return { ok: true, path: skins.getUserDir() };
  });
  ipcMain.handle("acl:reloadSkins", () => ({
    skins: skins.list(),
    activeSkin: skins.resolve(store.getSettings().skinId),
  }));
}






app.whenReady().then(async () => {
  const dir = dataDir();
  dataLock = new DataDirLock(dir, `desktop:${process.pid}`);
  const lock = dataLock.tryAcquire();
  if (!lock.ok) {
    lockWarning = `data dir lock held by ${lock.holder} — open read-mostly or set ACL_DATA_DIR`;
    console.warn("[acl]", lockWarning);
  }
  store = new ProjectStore(path.join(dir, "acl.db"));
  transcripts = new TranscriptStore();
  usage = new UsageMeter();
  skins = new SkinCatalog(dir);
  skins.ensureExampleSkin();
  activeProjectId = ensureProject();
  bus = new AgentBus();
  rebuildRegistry();
  pty = new PtyService();
  await pty.init();

  pty.on("data", (id: string, data: string) => {
    const n = store.listNodes(activeProjectId).find((x) => x.id === id);
    const tp = (n?.config?.transcriptPath as string) || null;
    transcripts.append(activeProjectId, id, data, tp);
    const snap = usage.recordOut(id, data);
    mainWindow?.webContents.send("acl:ptyData", { nodeId: id, data });
    mainWindow?.webContents.send("acl:usage", snap);
  });
  pty.on("exit", (id: string, code: number | null) => {
    mainWindow?.webContents.send("acl:ptyExit", { nodeId: id, code });
    bus.setStatus(id, code === 0 || code === null ? "idle" : "error");
  });
  bus.on("status", (ev) => {
    mainWindow?.webContents.send("acl:status", ev);
  });
  bus.on("inbox", (item) => {
    mainWindow?.webContents.send("acl:inbox", item);
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
  dataLock?.release();
});
