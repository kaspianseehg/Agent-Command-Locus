import { memo, useEffect, useState } from "react";
import { Handle, Position, type NodeProps, NodeResizer } from "@xyflow/react";
import { TermView } from "./TermView";

export type AclNodeData = {
  kind: "terminal" | "agent" | "note";
  title: string;
  color: string;
  status: string;
  agentId?: string;
  prompt?: string;
  noteText?: string;
  onNoteChange?: (text: string) => void;
  onClose?: () => void;
};

function statusColor(s: string): string {
  switch (s) {
    case "running":
      return "#22c55e";
    case "error":
      return "#f87171";
    case "needs_you":
      return "#fbbf24";
    default:
      return "#64748b";
  }
}

function AclNodeFixed(props: NodeProps) {
  const data = props.data as AclNodeData;
  const [note, setNote] = useState(data.noteText || "");

  useEffect(() => {
    setNote(data.noteText || "");
  }, [data.noteText]);

  return (
    <div
      className="acl-node"
      style={{
        borderColor: props.selected ? data.color : undefined,
        width: "100%",
        height: "100%",
      }}
    >
      <NodeResizer minWidth={200} minHeight={120} isVisible={!!props.selected} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0.25 }} />
      <div className="acl-node-header">
        <span className="dot" style={{ background: statusColor(data.status) }} />
        <span className="title">{data.title}</span>
        <span className="badge">{data.kind}</span>
        {data.onClose ? (
          <button
            type="button"
            className="danger"
            style={{ padding: "2px 6px", fontSize: 11 }}
            onClick={(e) => {
              e.stopPropagation();
              data.onClose?.();
            }}
          >
            ×
          </button>
        ) : null}
      </div>
      <div className="acl-node-body">
        {data.kind === "note" ? (
          <textarea
            className="note-body"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              data.onNoteChange?.(e.target.value);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Sticky note…"
          />
        ) : (
          <TermView
            nodeId={props.id}
            kind={data.kind}
            agentId={data.agentId}
            prompt={data.prompt}
          />
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0.25 }} />
    </div>
  );
}

export const AclFlowNode = memo(AclNodeFixed);
