import { contextBridge, ipcRenderer } from "electron";

const api = {
  getBootstrap: () => ipcRenderer.invoke("acl:getBootstrap"),
  listProjects: () => ipcRenderer.invoke("acl:listProjects"),
  switchProject: (id: string) => ipcRenderer.invoke("acl:switchProject", id),
  createProject: (name: string, cwd?: string) =>
    ipcRenderer.invoke("acl:createProject", name, cwd),
  renameProject: (id: string, name: string) =>
    ipcRenderer.invoke("acl:renameProject", id, name),
  deleteProject: (id: string) => ipcRenderer.invoke("acl:deleteProject", id),
  seedDemo: () => ipcRenderer.invoke("acl:seedDemo"),
  getSettings: () => ipcRenderer.invoke("acl:getSettings"),
  saveSettings: (partial: unknown) => ipcRenderer.invoke("acl:saveSettings", partial),
  listAgents: () => ipcRenderer.invoke("acl:listAgents"),
  saveLayout: (nodes: unknown[]) => ipcRenderer.invoke("acl:saveLayout", nodes),
  createNode: (input: unknown) => ipcRenderer.invoke("acl:createNode", input),
  updateNodeMeta: (id: string, patch: unknown) =>
    ipcRenderer.invoke("acl:updateNodeMeta", id, patch),
  deleteNode: (nodeId: string) => ipcRenderer.invoke("acl:deleteNode", nodeId),
  ptyStart: (opts: unknown) => ipcRenderer.invoke("acl:ptyStart", opts),
  ptyWrite: (nodeId: string, data: string) =>
    ipcRenderer.invoke("acl:ptyWrite", nodeId, data),
  ptyResize: (nodeId: string, cols: number, rows: number) =>
    ipcRenderer.invoke("acl:ptyResize", nodeId, cols, rows),
  ptyKill: (nodeId: string) => ipcRenderer.invoke("acl:ptyKill", nodeId),
  listCards: () => ipcRenderer.invoke("acl:listCards"),
  upsertCard: (input: unknown) => ipcRenderer.invoke("acl:upsertCard", input),
  deleteCard: (taskId: string) => ipcRenderer.invoke("acl:deleteCard", taskId),
  listInbox: () => ipcRenderer.invoke("acl:listInbox"),
  clearInbox: (id: string) => ipcRenderer.invoke("acl:clearInbox", id),
  inboxReply: (nodeId: string, text: string) =>
    ipcRenderer.invoke("acl:inboxReply", nodeId, text),
  setStatus: (nodeId: string, status: string, detail?: string) =>
    ipcRenderer.invoke("acl:setStatus", nodeId, status, detail),
  listComments: () => ipcRenderer.invoke("acl:listComments"),
  addComment: (input: unknown) => ipcRenderer.invoke("acl:addComment", input),
  attachHandoff: (input: unknown) => ipcRenderer.invoke("acl:attachHandoff", input),
  listCapabilities: () => ipcRenderer.invoke("acl:listCapabilities"),
  openPath: (filePath: string) => ipcRenderer.invoke("acl:openPath", filePath),
  getServerUrlDefault: () => ipcRenderer.invoke("acl:getServerUrlDefault"),
  listTemplates: () => ipcRenderer.invoke("acl:listTemplates"),
  applyTemplate: (id: string) => ipcRenderer.invoke("acl:applyTemplate", id),
  importTemplate: (raw: unknown) => ipcRenderer.invoke("acl:importTemplate", raw),
  exportLayout: (name?: string) => ipcRenderer.invoke("acl:exportLayout", name),
  tailTranscript: (nodeId: string, max?: number) =>
    ipcRenderer.invoke("acl:tailTranscript", nodeId, max),
  listEdges: () => ipcRenderer.invoke("acl:listEdges"),
  saveEdges: (edges: unknown) => ipcRenderer.invoke("acl:saveEdges", edges),
  contextLink: (sourceId: string, targetId: string, inject?: boolean) =>
    ipcRenderer.invoke("acl:contextLink", sourceId, targetId, inject),
  getUsage: (nodeId?: string) => ipcRenderer.invoke("acl:getUsage", nodeId),
  onUsage: (cb: (snap: unknown) => void) => {
    const handler = (_: unknown, snap: unknown) => cb(snap);
    ipcRenderer.on("acl:usage", handler);
    return () => ipcRenderer.removeListener("acl:usage", handler);
  },
  listSkins: () => ipcRenderer.invoke("acl:listSkins"),
  getActiveSkin: () => ipcRenderer.invoke("acl:getActiveSkin"),
  setSkin: (skinId: string) => ipcRenderer.invoke("acl:setSkin", skinId),
  saveUserSkin: (raw: unknown) => ipcRenderer.invoke("acl:saveUserSkin", raw),
  openSkinsDir: () => ipcRenderer.invoke("acl:openSkinsDir"),
  reloadSkins: () => ipcRenderer.invoke("acl:reloadSkins"),
  onPtyData: (cb: (msg: { nodeId: string; data: string }) => void) => {
    const l = (_: Electron.IpcRendererEvent, msg: { nodeId: string; data: string }) =>
      cb(msg);
    ipcRenderer.on("acl:ptyData", l);
    return () => ipcRenderer.removeListener("acl:ptyData", l);
  },
  onPtyExit: (cb: (msg: { nodeId: string; code: number | null }) => void) => {
    const l = (
      _: Electron.IpcRendererEvent,
      msg: { nodeId: string; code: number | null },
    ) => cb(msg);
    ipcRenderer.on("acl:ptyExit", l);
    return () => ipcRenderer.removeListener("acl:ptyExit", l);
  },
  onStatus: (cb: (msg: unknown) => void) => {
    const l = (_: Electron.IpcRendererEvent, msg: unknown) => cb(msg);
    ipcRenderer.on("acl:status", l);
    return () => ipcRenderer.removeListener("acl:status", l);
  },
  onInbox: (cb: (msg: unknown) => void) => {
    const l = (_: Electron.IpcRendererEvent, msg: unknown) => cb(msg);
    ipcRenderer.on("acl:inbox", l);
    return () => ipcRenderer.removeListener("acl:inbox", l);
  },
};

contextBridge.exposeInMainWorld("acl", api);

export type AclApi = typeof api;
