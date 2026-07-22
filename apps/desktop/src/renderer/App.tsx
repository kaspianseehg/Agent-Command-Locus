import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  type Node,
  type NodeTypes,
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
};

type Agent = {
  id: string;
  label: string;
  defaultEnabled: boolean;
};

type Bootstrap = {
  project: { id: string; name: string; cwd: string };
  nodes: LayoutNode[];
  agents: Agent[];
  dataDir: string;
};

const nodeTypes: NodeTypes = {
  acl: AclFlowNode,
};

function toFlowNodes(
  layout: LayoutNode[],
  handlers: {
    onClose: (id: string) => void;
    onNoteChange: (id: string, text: string) => void;
  },
): Node[] {
  return layout
    .filter((n) => n.kind !== "group")
    .map((n) => ({
      id: n.id,
      type: "acl",
      position: { x: n.x, y: n.y },
      style: { width: n.w, height: n.h },
      data: {
        kind: n.kind as AclNodeData["kind"],
        title: n.title,
        color: n.color,
        status: n.status,
        agentId: (n.config.agentId as string) || undefined,
        prompt: (n.config.prompt as string) || undefined,
        noteText: (n.config.noteText as string) || "",
        onClose: () => handlers.onClose(n.id),
        onNoteChange: (text: string) => handlers.onNoteChange(n.id, text),
      } satisfies AclNodeData,
    }));
}

export default function App() {
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [layout, setLayout] = useState<LayoutNode[]>([]);
  const [agentId, setAgentId] = useState("custom");
  const [err, setErr] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((next: LayoutNode[]) => {
    setLayout(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void window.acl.saveLayout(next);
    }, 350);
  }, []);

  const onClose = useCallback(
    (id: string) => {
      void window.acl.deleteNode(id).then(() => {
        setLayout((prev) => {
          const next = prev.filter((n) => n.id !== id);
          void window.acl.saveLayout(next);
          return next;
        });
      });
    },
    [],
  );

  const onNoteChange = useCallback(
    (id: string, text: string) => {
      setLayout((prev) => {
        const next = prev.map((n) =>
          n.id === id
            ? {
                ...n,
                config: { ...n.config, noteText: text },
                updated_at: new Date().toISOString(),
              }
            : n,
        );
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          void window.acl.saveLayout(next);
        }, 400);
        return next;
      });
    },
    [],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);

  useEffect(() => {
    if (!window.acl) {
      setErr("Preload bridge missing (window.acl). Open via Electron dev script.");
      return;
    }
    void window.acl.getBootstrap().then((raw) => {
      const b = raw as Bootstrap;
      setBoot(b);
      setLayout(b.nodes);
      const enabled = b.agents.find((a) => a.id === "custom") || b.agents[0];
      if (enabled) setAgentId(enabled.id);
    });
  }, []);

  useEffect(() => {
    setNodes(
      toFlowNodes(layout, {
        onClose,
        onNoteChange,
      }),
    );
  }, [layout, onClose, onNoteChange, setNodes]);

  const onNodesChangeWrapped = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      // after React Flow applies, sync positions/sizes back on drag/resize end
      const meaningful = changes.some(
        (c) =>
          c.type === "position" && "dragging" in c && c.dragging === false,
      );
      const dim = changes.some((c) => c.type === "dimensions" && "dimensions" in c);
      if (!meaningful && !dim) return;
      // read from changes for positions
      setLayout((prev) => {
        let next = [...prev];
        for (const c of changes) {
          if (c.type === "position" && c.position && c.dragging === false) {
            next = next.map((n) =>
              n.id === c.id
                ? { ...n, x: c.position!.x, y: c.position!.y, updated_at: new Date().toISOString() }
                : n,
            );
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
          }
        }
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          void window.acl.saveLayout(next);
        }, 300);
        return next;
      });
    },
    [onNodesChange],
  );

  const add = async (kind: "terminal" | "agent" | "note") => {
    const created = (await window.acl.createNode({
      kind,
      agentId: kind === "agent" ? agentId : undefined,
      title:
        kind === "agent"
          ? `agent:${agentId}`
          : kind === "note"
            ? "Note"
            : "Terminal",
    })) as LayoutNode;
    persist([...layout, created]);
  };

  const agents = useMemo(() => boot?.agents ?? [], [boot]);

  if (err) {
    return (
      <div className="app" style={{ padding: 24 }}>
        <h1>Agent Command Locus</h1>
        <p style={{ color: "#f87171" }}>{err}</p>
      </div>
    );
  }

  if (!boot) {
    return (
      <div className="app" style={{ placeItems: "center", display: "grid" }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>ACL</h1>
        <span className="meta">
          {boot.project.name} · {boot.project.cwd}
        </span>
        <div className="spacer" />
        <button type="button" onClick={() => void add("terminal")}>
          + Terminal
        </button>
        <button type="button" onClick={() => void add("note")}>
          + Note
        </button>
        <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void add("agent")}>
          + Agent
        </button>
        <span className="meta" title={boot.dataDir}>
          agent-agnostic
        </span>
      </header>
      <div className="canvas-wrap">
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChangeWrapped}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} color="#1e293b" />
          <MiniMap
            style={{ background: "#0f1520" }}
            maskColor="rgba(0,0,0,0.5)"
          />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
