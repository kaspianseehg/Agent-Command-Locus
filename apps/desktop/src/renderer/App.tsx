import { PresenceBridge, type RemotePeer } from "./presenceBridge";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  BackgroundVariant,
  ViewportPortal,
  MarkerType,
} from "@xyflow/react";
import { AclFlowNode, type AclNodeData } from "./AclNode";

type LayoutNode = {
  id: string;
  project_id: string;
  kind: "terminal" | "agent" | "note" | "group";
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  color: string;
  tags: string[];
  config: Record<string, unknown>;
  status: string;
  updated_at: string;
  parent_group_id?: string | null;
};

type Card = {
  task_id: string;
  title: string;
  body: string;
  status: string;
  assignee_agent_id: string | null;
  labels: string[];
};

type Agent = { id: string; label: string; defaultEnabled: boolean; installHint?: string };
type Project = { id: string; name: string; cwd: string };
type Settings = {
  disabledAgents: string[];
  focusMode: boolean;
  customAgents: unknown[];
  lastProjectId: string | null;
  serverUrl?: string;
  displayName?: string;
};
type InboxItem = { id: string; nodeId: string; message: string; ts: string };

type Cap = { id: string; tier: number; targetTier: number; label: string };
type Comment = { id: string; author: string; body: string; target_id: string; created_at: string };
type EdgeRec = {
  id: string;
  project_id?: string;
  source: string;
  target: string;
  kind?: string;
  label?: string;
};
type UsageSnap = { nodeId: string; bytesIn: number; bytesOut: number; tokensEst: number };

type Bootstrap = {
  project: Project;
  projects: Project[];
  nodes: LayoutNode[];
  cards: Card[];
  comments?: Comment[];
  edges?: EdgeRec[];
  usage?: UsageSnap[];
  agents: Agent[];
  capabilities?: Cap[];
  settings: Settings;
  dataDir: string;
  inbox: InboxItem[];
  tmuxSessions: string[];
  lockWarning?: string | null;
  brand: { name: string; codename: string };
};

const nodeTypes: NodeTypes = { acl: AclFlowNode };

function toFlowEdges(list: EdgeRec[]): Edge[] {
  return list.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label || e.kind || "context",
    animated: e.kind === "context",
    style: { stroke: "#5dffb0", strokeWidth: 1.5 },
    labelStyle: { fill: "#5dffb0", fontSize: 10 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#5dffb0" },
  }));
}

const COLS = ["backlog", "doing", "review", "done", "blocked"] as const;
const COLORS = ["#5dffb0", "#4cc9f0", "#ffb020", "#ff5d8f", "#a78bfa", "#f472b6"];

const BRAND_ASCII = `╔═ ACL ═╗
║LATTICE║
╚═══════╝`;

function toFlow(
  layout: LayoutNode[],
  handlers: {
    onClose: (id: string) => void;
    onNoteChange: (id: string, text: string) => void;
    onRename: (id: string, title: string) => void;
  },
): Node[] {
  return layout.map((n) => ({
    id: n.id,
    type: "acl",
    position: { x: n.x, y: n.y },
    style: { width: n.w, height: n.h },
    zIndex: n.kind === "group" ? 0 : 1,
    className: n.status === "needs_you" ? "needs-you" : "",
    data: {
      kind: n.kind,
      title: n.title,
      color: n.color,
      status: n.status,
      agentId: (n.config.agentId as string) || undefined,
      prompt: (n.config.prompt as string) || undefined,
      noteText: (n.config.noteText as string) || "",
      tags: n.tags,
      onClose: () => handlers.onClose(n.id),
      onNoteChange: (text: string) => handlers.onNoteChange(n.id, text),
      onRename: (title: string) => handlers.onRename(n.id, title),
    } satisfies AclNodeData,
  }));
}

export default function App() {
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [layout, setLayout] = useState<LayoutNode[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [tmuxSessions, setTmux] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [capabilities, setCapabilities] = useState<Cap[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [lockWarning, setLockWarning] = useState<string | null>(null);
  const [peers, setPeers] = useState<RemotePeer[]>([]);
  const [presenceStatus, setPresenceStatus] = useState('presence off');
  const presenceRef = useRef<PresenceBridge | null>(null);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const flowApi = useRef<{ screenToFlowPosition?: (p: { x: number; y: number }) => { x: number; y: number } } | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptSource, setTranscriptSource] = useState("");
  const [agentId, setAgentId] = useState("custom");
  const [err, setErr] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inspectorId, setInspectorId] = useState<string | null>(null);
  const [history, setHistory] = useState<LayoutNode[][]>([]);
  const [future, setFuture] = useState<LayoutNode[][]>([]);
  const [cardTitle, setCardTitle] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [usageMap, setUsageMap] = useState<Record<string, UsageSnap>>({});
  const [linkSource, setLinkSource] = useState<string | null>(null);

  const pushHistory = useCallback((prev: LayoutNode[]) => {
    setHistory((h) => [...h.slice(-19), prev.map((n) => ({ ...n, config: { ...n.config } }))]);
    setFuture([]);
  }, []);

  const persist = useCallback((next: LayoutNode[], recordHistory = false, prev?: LayoutNode[]) => {
    if (recordHistory && prev) pushHistory(prev);
    setLayout(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void window.acl.saveLayout(next);
    }, 280);
  }, [pushHistory]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [layout, ...f].slice(0, 20));
      setLayout(prev);
      void window.acl.saveLayout(prev);
      return h.slice(0, -1);
    });
  }, [layout]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const [next, ...rest] = f;
      setHistory((h) => [...h, layout].slice(-20));
      setLayout(next);
      void window.acl.saveLayout(next);
      return rest;
    });
  }, [layout]);

  const onClose = useCallback(
    (id: string) => {
      void window.acl.deleteNode(id).then(() => {
        setLayout((prev) => {
          const next = prev.filter((n) => n.id !== id && n.parent_group_id !== id);
          pushHistory(prev);
          void window.acl.saveLayout(next);
          return next;
        });
      });
    },
    [pushHistory],
  );

  const onNoteChange = useCallback((id: string, text: string) => {
    setLayout((prev) => {
      const next = prev.map((n) =>
        n.id === id
          ? { ...n, config: { ...n.config, noteText: text }, updated_at: new Date().toISOString() }
          : n,
      );
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void window.acl.saveLayout(next), 400);
      return next;
    });
  }, []);

  const onRename = useCallback((id: string, title: string) => {
    void window.acl.updateNodeMeta(id, { title }).then(() => {
      setLayout((prev) => prev.map((n) => (n.id === id ? { ...n, title } : n)));
    });
  }, []);

  useEffect(() => {
    if (!window.acl) {
      setErr("Preload bridge missing — run via Electron (npm run dev:desktop).");
      return;
    }
    void window.acl.getBootstrap().then(async (raw) => {
      const b = raw as Bootstrap;
      setBoot(b);
      setLayout(b.nodes);
      setCards(b.cards || []);
      setProjects(b.projects);
      setProject(b.project);
      setAgents(b.agents.filter((a) => a.defaultEnabled !== false));
      setSettings(b.settings);
      setInbox(b.inbox || []);
      setTmux(b.tmuxSessions || []);
      setComments(b.comments || []);
      setEdges(toFlowEdges(b.edges || []));
      const um: Record<string, UsageSnap> = {};
      for (const u of b.usage || []) um[u.nodeId] = u;
      setUsageMap(um);
      setCapabilities(b.capabilities || []);
      setLockWarning(b.lockWarning || null);
      try {
        const tpls = (await window.acl.listTemplates()) as Array<{ id: string; name: string; description: string }>;
        setTemplates(tpls || []);
      } catch { /* ignore */ }
      // presence bridge
      try {
        presenceRef.current?.close();
        const url = b.settings.serverUrl || '';
        if (url) {
          const br = new PresenceBridge(url, b.project.id, b.settings.displayName || 'desktop', {
            onPeers: setPeers,
            onStatus: setPresenceStatus,
            onComment: (c) => {
              setComments((prev) => [
                ...prev,
                {
                  id: Math.random().toString(36).slice(2),
                  author: c.author,
                  body: c.body,
                  target_id: c.target_id || '',
                  created_at: new Date().toISOString(),
                },
              ]);
            },
          });
          presenceRef.current = br;
          br.connect();
        } else {
          setPresenceStatus('presence off');
          setPeers([]);
        }
      } catch {
        setPresenceStatus('presence error');
      }
      const enabled = b.agents.find((a) => a.id === "custom") || b.agents[0];
      if (enabled) setAgentId(enabled.id);
    });
    const offS = window.acl.onStatus((msg) => {
      const m = msg as { nodeId: string; status: string };
      setLayout((prev) =>
        prev.map((n) => (n.id === m.nodeId ? { ...n, status: m.status } : n)),
      );
    });
    const offI = window.acl.onInbox((msg) => {
      setInbox((prev) => [msg as InboxItem, ...prev].slice(0, 50));
    });
    return () => {
      offS();
      offI();
    };
  }, []);

  useEffect(() => {
    setNodes(toFlow(layout, { onClose, onNoteChange, onRename }));
  }, [layout, onClose, onNoteChange, onRename, setNodes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (meta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (meta && e.key === ".") {
        e.preventDefault();
        void toggleFocus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, settings]);

  useEffect(() => {
    if (!inspectorId) {
      setTranscriptText("");
      setTranscriptSource("");
      return;
    }
    let alive = true;
    const tick = async () => {
      try {
        const res = (await window.acl.tailTranscript(inspectorId, 12000)) as {
          text: string;
          source: string;
        };
        if (!alive) return;
        setTranscriptText(res.text || "");
        setTranscriptSource(res.source || "");
      } catch {
        /* ignore */
      }
    };
    void tick();
    const id = window.setInterval(tick, 900);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [inspectorId]);

  useEffect(() => {
    const off = window.acl.onUsage?.((snap: UsageSnap) => {
      if (!snap?.nodeId) return;
      setUsageMap((m) => ({ ...m, [snap.nodeId]: snap }));
    });
    return () => {
      if (typeof off === "function") off();
    };
  }, []);



  const onNodesChangeWrapped = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      const endDrag = changes.some(
        (c) => c.type === "position" && "dragging" in c && c.dragging === false,
      );
      const dim = changes.some((c) => c.type === "dimensions" && "dimensions" in c);
      if (!endDrag && !dim) return;
      setLayout((prev) => {
        let next = [...prev];
        let changed = false;
        for (const c of changes) {
          if (c.type === "position" && c.position && c.dragging === false) {
            next = next.map((n) =>
              n.id === c.id
                ? { ...n, x: c.position!.x, y: c.position!.y, updated_at: new Date().toISOString() }
                : n,
            );
            changed = true;
          }
          if (c.type === "dimensions" && c.dimensions) {
            next = next.map((n) =>
              n.id === c.id
                ? {
                    ...n,
                    w: c.dimensions!.width,
                    h: c.dimensions!.height,
                    updated_at: new Date().toISOString(),
                  }
                : n,
            );
            changed = true;
          }
        }
        if (changed) {
          pushHistory(prev);
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => void window.acl.saveLayout(next), 250);
        }
        return changed ? next : prev;
      });
    },
    [onNodesChange, pushHistory],
  );

  const add = async (kind: LayoutNode["kind"]) => {
    const created = (await window.acl.createNode({
      kind,
      agentId: kind === "agent" ? agentId : undefined,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    })) as LayoutNode;
    persist([...layout, created], true, layout);
  };

  const switchProject = async (id: string) => {
    const res = (await window.acl.switchProject(id)) as {
      ok: boolean;
      project: Project;
      nodes: LayoutNode[];
      cards: Card[];
    };
    if (!res.ok) return;
    setProject(res.project);
    setLayout(res.nodes);
    setCards(res.cards || []);
    setHistory([]);
    setFuture([]);
  };

  const toggleFocus = async () => {
    if (!settings) return;
    const next = { ...settings, focusMode: !settings.focusMode };
    const saved = (await window.acl.saveSettings({ focusMode: next.focusMode })) as Settings;
    setSettings(saved);
  };

  const toggleAgent = async (id: string) => {
    if (!settings) return;
    const disabled = new Set(settings.disabledAgents);
    if (disabled.has(id)) disabled.delete(id);
    else disabled.add(id);
    const saved = (await window.acl.saveSettings({
      disabledAgents: [...disabled],
    })) as Settings;
    setSettings(saved);
    const list = (await window.acl.listAgents()) as Agent[];
    setAgents(list.filter((a) => a.defaultEnabled !== false));
  };

  const onConnect = useCallback(
    async (c: Connection) => {
      if (!c.source || !c.target) return;
      const res = (await window.acl.contextLink(c.source, c.target, true)) as {
        ok: boolean;
        edge?: EdgeRec;
        error?: string;
      };
      if (!res.ok) {
        alert(res.error || "link failed");
        return;
      }
      if (res.edge) {
        setEdges((eds) =>
          addEdge(
            {
              id: res.edge!.id,
              source: res.edge!.source,
              target: res.edge!.target,
              label: "context",
              animated: true,
              style: { stroke: "#5dffb0" },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#5dffb0" },
            },
            eds,
          ),
        );
      }
    },
    [setEdges],
  );

  const inspector = useMemo(
    () => layout.find((n) => n.id === inspectorId) || null,
    [layout, inspectorId],
  );

  if (err) {
    return (
      <div className="app" style={{ padding: 24 }}>
        <pre className="brand ascii">{BRAND_ASCII}</pre>
        <p style={{ color: "#ff5d8f" }}>{err}</p>
      </div>
    );
  }

  if (!boot || !project || !settings) {
    return (
      <div className="app" style={{ placeItems: "center", display: "grid" }}>
        <pre style={{ color: "#5dffb0" }}>{`[ LATTICE booting… ]`}</pre>
      </div>
    );
  }

  const focus = settings.focusMode;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="ascii">{BRAND_ASCII}</div>
          <div className="sub">command locus</div>
        </div>
        <div style={{ color: "#6f8f85", fontSize: 11 }}>
          {project.name} · <span style={{ color: "#4cc9f0" }}>{project.cwd}</span>
        </div>
        <div className="top-actions">
          <button type="button" onClick={() => void add("terminal")}>
            + term
          </button>
          <button type="button" onClick={() => void add("note")}>
            + note
          </button>
          <button type="button" onClick={() => void add("group")}>
            + group
          </button>
          <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => void add("agent")}>
            + agent
          </button>
          <button type="button" onClick={() => undo()} title="⌘Z">
            undo
          </button>
          <button type="button" onClick={() => redo()} title="⌘⇧Z">
            redo
          </button>
          <button
            type="button"
            className={focus ? "active" : ""}
            onClick={() => void toggleFocus()}
            title="⌘."
          >
            focus
          </button>
          <button type="button" onClick={() => setSettingsOpen(true)}>
            settings
          </button>
        </div>
      </header>

      <div className="rail">
        <span className="seg">//</span>
        <span>
          motif <strong>phosphor-lattice</strong>
        </span>
        <span className="seg">|</span>
        <span>
          agents <strong>agnostic</strong>
        </span>
        <span className="seg">|</span>
        <span>
          inbox <strong className={inbox.length ? "warn" : "ok"}>{inbox.length}</strong>
        </span>
        {tmuxSessions.length > 0 ? (
          <>
            <span className="seg">|</span>
            <span className="warn">
              tmux live <strong>{tmuxSessions.length}</strong> ·{" "}
              {tmuxSessions.slice(0, 3).join(", ")}
            </span>
          </>
        ) : null}
        {lockWarning ? (
          <>
            <span className="seg">|</span>
            <span className="warn">LOCK {lockWarning}</span>
          </>
        ) : null}
        <span className="seg">|</span>
        <span className={presenceStatus.includes('live') ? 'ok' : ''}>{presenceStatus}</span>
        {peers.length > 0 ? (
          <span>
            peers <strong>{peers.map((p) => p.name).join(', ')}</strong>
          </span>
        ) : null}
      </div>

      <div className={`main ${focus ? "focus-wide" : ""}`}>
        <aside className="side">
          <div className="panel-title">{`┌ PROJECTS ──`}</div>
          {projects.map((p) => (
            <div
              key={p.id}
              className={`project-item ${p.id === project.id ? "active" : ""}`}
              onClick={() => void switchProject(p.id)}
            >
              <div className="name">{p.name}</div>
              <div className="meta">{p.cwd}</div>
            </div>
          ))}
          <button
            type="button"
            className="primary"
            style={{ width: "100%", marginTop: 6 }}
            onClick={async () => {
              const name = prompt("Project name", "New locus");
              if (!name) return;
              const p = (await window.acl.createProject(name)) as Project;
              setProjects((await window.acl.listProjects()) as Project[]);
              await switchProject(p.id);
            }}
          >
            + project
          </button>
          <button
            type="button"
            style={{ width: "100%", marginTop: 6 }}
            onClick={async () => {
              const res = (await window.acl.seedDemo()) as {
                project: Project;
                nodes: LayoutNode[];
                cards: Card[];
                projects: Project[];
              };
              setProjects(res.projects);
              setProject(res.project);
              setLayout(res.nodes);
              setCards(res.cards);
            }}
          >
            load demo
          </button>
          <div className="panel-title" style={{ marginTop: 10 }}>{`┌ TEMPLATES ────`}</div>
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              title={tpl.description}
              style={{ display: "block", width: "100%", marginBottom: 4, textAlign: "left" }}
              onClick={async () => {
                const res = (await window.acl.applyTemplate(tpl.id)) as {
                  ok: boolean;
                  nodes?: LayoutNode[];
                };
                if (res.ok && res.nodes) setLayout(res.nodes);
              }}
            >
              + {tpl.name}
            </button>
          ))}
          <button
            type="button"
            style={{ width: "100%", marginTop: 4 }}
            onClick={async () => {
              const exp = await window.acl.exportLayout(project?.name || "layout");
              await navigator.clipboard.writeText(JSON.stringify(exp, null, 2));
              alert("Layout JSON copied to clipboard");
            }}
          >
            export layout JSON
          </button>
          <button
            type="button"
            style={{ width: "100%", marginTop: 4 }}
            onClick={async () => {
              const text = prompt("Paste ACL layout template JSON");
              if (!text) return;
              try {
                const raw = JSON.parse(text);
                const res = (await window.acl.importTemplate(raw)) as {
                  ok: boolean;
                  nodes?: LayoutNode[];
                  error?: string;
                };
                if (!res.ok) alert(res.error || "import failed");
                else if (res.nodes) setLayout(res.nodes);
              } catch (e) {
                alert(String(e));
              }
            }}
          >
            import layout JSON
          </button>
          <div className="help-ascii">{`┌ KEYS ──────────
│ ⌘Z  undo
│ ⌘⇧Z redo
│ ⌘.  focus
│ 2×click rename
│ drag ◦→◦ link
└────────────────`}</div>
        </aside>

        <div className={`canvas-wrap ${focus ? "focus-mode" : ""}`}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeWrapped}
            onEdgesChange={onEdgesChange}
            onConnect={(c) => void onConnect(c)}
            nodeTypes={nodeTypes}
            fitView
            connectionLineStyle={{ stroke: "#5dffb0" }}
            minZoom={0.15}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            onNodeClick={(_, n) => setInspectorId(n.id)}
            onPaneClick={() => setInspectorId(null)}
            onInit={(inst) => {
              flowApi.current = inst;
            }}
            onPaneMouseMove={(e) => {
              const inst = flowApi.current;
              if (!inst?.screenToFlowPosition) return;
              const pos = inst.screenToFlowPosition({ x: e.clientX, y: e.clientY });
              presenceRef.current?.move(pos.x, pos.y);
            }}
          >
            <Background
              variant={BackgroundVariant.Lines}
              gap={28}
              color="rgba(93,255,176,0.06)"
            />
            <MiniMap
              style={{ background: "#070b0e" }}
              nodeColor={(n) => ((n.data as AclNodeData)?.color as string) || "#5dffb0"}
              maskColor="rgba(0,0,0,0.55)"
            />
            <Controls />
            <ViewportPortal>
              {peers.map((peer) => (
                <div
                  key={peer.id}
                  className="peer-cursor"
                  style={{
                    position: "absolute",
                    transform: `translate(${peer.x}px, ${peer.y}px)`,
                    borderColor: peer.color,
                  }}
                >
                  <span style={{ color: peer.color }}>{peer.name}</span>
                </div>
              ))}
            </ViewportPortal>
          </ReactFlow>
        </div>

        {!focus ? (
          <aside className="right">
            <div className="panel-title">{`┌ INBOX / NEEDS YOU ─`}</div>
            {inbox.length === 0 ? (
              <div style={{ color: "#6f8f85", marginBottom: 10 }}>∅ clear</div>
            ) : (
              inbox.map((item) => (
                <div key={item.id} className="inbox-item">
                  <div style={{ color: "#ffb020" }}>{item.message}</div>
                  <div className="meta" style={{ fontSize: 10, color: "#6f8f85" }}>
                    {item.nodeId.slice(0, 8)}…
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={async () => {
                        const t = prompt("Reply to agent", "yes");
                        if (t == null) return;
                        await window.acl.inboxReply(item.nodeId, t);
                        setInbox(
                          (await window.acl.clearInbox(item.id)) as InboxItem[],
                        );
                      }}
                    >
                      reply
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setInbox(
                          (await window.acl.clearInbox(item.id)) as InboxItem[],
                        );
                      }}
                    >
                      dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void window.acl.setStatus(item.nodeId, "needs_you", "ping")
                      }
                    >
                      ping
                    </button>
                  </div>
                </div>
              ))
            )}

            <div className="panel-title">{`┌ KANBAN ────────`}</div>
            {COLS.map((col) => (
              <div key={col} className="kanban-col">
                <h3>
                  {col} ({cards.filter((c) => c.status === col).length})
                </h3>
                {cards
                  .filter((c) => c.status === col)
                  .map((c) => (
                    <div key={c.task_id} className="card-item">
                      <div className="title">{c.title}</div>
                      {c.assignee_agent_id ? (
                        <div className="assignee">@{c.assignee_agent_id}</div>
                      ) : null}
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                        {COLS.filter((x) => x !== col).map((s) => (
                          <button
                            key={s}
                            type="button"
                            style={{ fontSize: 9, padding: "2px 5px" }}
                            onClick={async () => {
                              await window.acl.upsertCard({
                                task_id: c.task_id,
                                title: c.title,
                                status: s,
                              });
                              setCards((await window.acl.listCards()) as Card[]);
                            }}
                          >
                            →{s}
                          </button>
                        ))}
                        <button
                          type="button"
                          style={{ fontSize: 9, padding: "2px 5px" }}
                          onClick={async () => {
                            const summary = prompt("Handoff summary", "done");
                            if (summary == null) return;
                            const files = prompt("files_touched (comma)", "") || "";
                            await window.acl.attachHandoff({
                              task_id: c.task_id,
                              agentId: c.assignee_agent_id || agentId,
                              summary,
                              files_touched: files
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            });
                            setCards((await window.acl.listCards()) as Card[]);
                          }}
                        >
                          handoff
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
            <div style={{ display: "flex", gap: 4 }}>
              <input
                type="text"
                placeholder="new card"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={async () => {
                  if (!cardTitle.trim()) return;
                  await window.acl.upsertCard({ title: cardTitle.trim() });
                  setCardTitle("");
                  setCards((await window.acl.listCards()) as Card[]);
                }}
              >
                add
              </button>
            </div>

            
            <div className="panel-title">{`┌ CAPABILITIES ───`}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
              {capabilities.map((c) => (
                <span key={c.id} className="badge" style={{ border: "1px solid #1c333f", padding: "2px 6px", fontSize: 10 }}>
                  {c.id}:{c.label}
                </span>
              ))}
            </div>

            <div className="panel-title">{`┌ COMMENTS ────────`}</div>
            {comments.length === 0 ? (
              <div style={{ color: "#6f8f85", marginBottom: 8 }}>∅</div>
            ) : (
              comments
                .slice(-12)
                .reverse()
                .map((c) => (
                  <div key={c.id} className="card-item">
                    <div className="title">{c.author}</div>
                    <div style={{ fontSize: 11 }}>{c.body}</div>
                  </div>
                ))
            )}
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              <input
                type="text"
                placeholder="comment…"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={async () => {
                  if (!commentBody.trim()) return;
                  await window.acl.addComment({
                    body: commentBody.trim(),
                    target_type: inspectorId ? "node" : "card",
                    target_id: inspectorId || "",
                    author: "desktop",
                  });
                  setCommentBody("");
                  setComments((await window.acl.listComments()) as Comment[]);
                }}
              >
                post
              </button>
            </div>

            {inspector ? (
              <>
                <div className="panel-title" style={{ marginTop: 14 }}>{`┌ INSPECT ──────`}</div>
                <div className="card-item">
                  <div className="title">{inspector.title}</div>
                  <label style={{ fontSize: 10, color: "#6f8f85" }}>color</label>
                  <input
                    type="color"
                    value={inspector.color}
                    onChange={async (e) => {
                      const color = e.target.value;
                      await window.acl.updateNodeMeta(inspector.id, { color });
                      setLayout((prev) =>
                        prev.map((n) => (n.id === inspector.id ? { ...n, color } : n)),
                      );
                    }}
                  />
                  <label style={{ fontSize: 10, color: "#6f8f85" }}>tags (comma)</label>
                  <input
                    type="text"
                    defaultValue={inspector.tags?.join(",") || ""}
                    onBlur={async (e) => {
                      const tags = e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean);
                      await window.acl.updateNodeMeta(inspector.id, { tags });
                      setLayout((prev) =>
                        prev.map((n) => (n.id === inspector.id ? { ...n, tags } : n)),
                      );
                    }}
                  />
                  <button
                    type="button"
                    style={{ marginTop: 8 }}
                    onClick={() =>
                      void window.acl.setStatus(
                        inspector.id,
                        "needs_you",
                        "manual NEEDS YOU",
                      )
                    }
                  >
                    mark NEEDS YOU
                  </button>
                  <>
                  {usageMap[inspector.id] ? (
                    <div className="usage-meter">
                      ~{usageMap[inspector.id].tokensEst} tok ·{" "}
                      {Math.round(usageMap[inspector.id].bytesOut / 1024)}KB out
                    </div>
                  ) : (
                    <div className="usage-meter muted">usage — run node to meter</div>
                  )}
                  <div className="transcript-panel">
                    <div className="meta" style={{ fontSize: 10, color: "#6f8f85" }}>
                      transcript live {transcriptSource ? `(${transcriptSource})` : ""}
                    </div>
                    {inspector.config?.transcriptPath ? (
                      <div style={{ fontSize: 10, wordBreak: "break-all", color: "#4cc9f0", marginBottom: 4 }}>
                        {String(inspector.config.transcriptPath)}
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: "#6f8f85" }}>spawn node to allocate log path</div>
                    )}
                    <pre className="transcript-tail">{transcriptText || "∅ waiting for output…"}</pre>
                    <button
                      type="button"
                      style={{ marginTop: 4 }}
                      disabled={!inspector.config?.transcriptPath}
                      onClick={() =>
                        void window.acl.openPath(String(inspector.config?.transcriptPath || ""))
                      }
                    >
                      reveal folder
                    </button>
                  </div>
                  </>
                </div>
              </>
            ) : null}
          </aside>
        ) : null}
      </div>

      <footer className="statusline">
        <span className="ok">LATTICE</span>
        <span>nodes {layout.length}</span>
        <span>cards {cards.length}</span>
        <span>{focus ? "FOCUS ON" : "FOCUS OFF"}</span>
        <span style={{ marginLeft: "auto" }}>{boot.dataDir}</span>
      </footer>

      {settingsOpen ? (
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>SETTINGS // AGENTS</h2>
            <p style={{ color: "#6f8f85", marginTop: 0 }}>
              Agent-agnostic: enable what you install. No vendor is banned.
            </p>
            {(boot.agents || agents).map((a) => {
              const full = (boot.agents as Agent[]).find((x) => x.id === a.id) || a;
              const disabled = settings.disabledAgents.includes(full.id);
              return (
                <div key={full.id} className="agent-row">
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={!disabled}
                      onChange={() => void toggleAgent(full.id)}
                    />
                    <span>
                      {full.label} <span style={{ color: "#6f8f85" }}>({full.id})</span>
                    </span>
                  </label>
                  {full.installHint ? (
                    <div style={{ fontSize: 10, color: "#6f8f85", marginTop: 4 }}>
                      {full.installHint}
                    </div>
                  ) : null}
                </div>
              );
            })}
            <label>server URL (presence)</label>
            <input
              type="text"
              defaultValue={settings.serverUrl || ''}
              placeholder="http://127.0.0.1:8450"
              id="serverUrlInput"
            />
            <label>display name</label>
            <input
              type="text"
              defaultValue={settings.displayName || 'desktop'}
              id="displayNameInput"
            />
            <div className="row">
              <button
                type="button"
                className="primary"
                onClick={async () => {
                  const serverUrl = (document.getElementById('serverUrlInput') as HTMLInputElement)?.value || '';
                  const displayName = (document.getElementById('displayNameInput') as HTMLInputElement)?.value || 'desktop';
                  const saved = (await window.acl.saveSettings({ serverUrl, displayName })) as Settings;
                  setSettings(saved);
                  // reconnect presence
                  presenceRef.current?.close();
                  if (serverUrl && project) {
                    const br = new PresenceBridge(serverUrl, project.id, displayName, {
                      onPeers: setPeers,
                      onStatus: setPresenceStatus,
                    });
                    presenceRef.current = br;
                    br.connect();
                  } else {
                    setPeers([]);
                    setPresenceStatus('presence off');
                  }
                  setSettingsOpen(false);
                }}
              >
                save
              </button>
              <button type="button" onClick={() => setSettingsOpen(false)}>
                close
              </button>
            </div>
            <pre className="help-ascii">{`
╔ identity ══════════════════╗
║ phosphor-lattice · unique  ║
║ not nodeterm · not generic ║
╚════════════════════════════╝`}</pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
