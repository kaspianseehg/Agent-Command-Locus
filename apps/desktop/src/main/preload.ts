import { contextBridge, ipcRenderer } from "electron";

export type AclApi = {
  getBootstrap: () => Promise<unknown>;
  listAgents: () => Promise<unknown>;
  saveLayout: (nodes: unknown[]) => Promise<unknown>;
  createNode: (input: unknown) => Promise<unknown>;
  deleteNode: (nodeId: string) => Promise<unknown>;
  ptyStart: (opts: unknown) => Promise<unknown>;
  ptyWrite: (nodeId: string, data: string) => Promise<unknown>;
  ptyResize: (nodeId: string, cols: number, rows: number) => Promise<unknown>;
  ptyKill: (nodeId: string) => Promise<unknown>;
  onPtyData: (cb: (msg: { nodeId: string; data: string }) => void) => () => void;
  onPtyExit: (cb: (msg: { nodeId: string; code: number | null }) => void) => () => void;
};

const api: AclApi = {
  getBootstrap: () => ipcRenderer.invoke("acl:getBootstrap"),
  listAgents: () => ipcRenderer.invoke("acl:listAgents"),
  saveLayout: (nodes) => ipcRenderer.invoke("acl:saveLayout", nodes),
  createNode: (input) => ipcRenderer.invoke("acl:createNode", input),
  deleteNode: (nodeId) => ipcRenderer.invoke("acl:deleteNode", nodeId),
  ptyStart: (opts) => ipcRenderer.invoke("acl:ptyStart", opts),
  ptyWrite: (nodeId, data) => ipcRenderer.invoke("acl:ptyWrite", nodeId, data),
  ptyResize: (nodeId, cols, rows) =>
    ipcRenderer.invoke("acl:ptyResize", nodeId, cols, rows),
  ptyKill: (nodeId) => ipcRenderer.invoke("acl:ptyKill", nodeId),
  onPtyData: (cb) => {
    const listener = (_: Electron.IpcRendererEvent, msg: { nodeId: string; data: string }) =>
      cb(msg);
    ipcRenderer.on("acl:ptyData", listener);
    return () => ipcRenderer.removeListener("acl:ptyData", listener);
  },
  onPtyExit: (cb) => {
    const listener = (
      _: Electron.IpcRendererEvent,
      msg: { nodeId: string; code: number | null },
    ) => cb(msg);
    ipcRenderer.on("acl:ptyExit", listener);
    return () => ipcRenderer.removeListener("acl:ptyExit", listener);
  },
};

contextBridge.exposeInMainWorld("acl", api);
