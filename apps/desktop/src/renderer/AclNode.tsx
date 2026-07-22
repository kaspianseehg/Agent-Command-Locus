import { memo, useEffect, useState } from "react";
import { Handle, Position, type NodeProps, NodeResizer } from "@xyflow/react";
import { TermView } from "./TermView";

export type AclNodeData = {
  kind: "terminal" | "agent" | "note" | "group";
  title: string;
  color: string;
  status: string;
  agentId?: string;
  prompt?: string;
  noteText?: string;
  tags?: string[];
  onNoteChange?: (text: string) => void;
  onClose?: () => void;
  onRename?: (title: string) => void;
};

function statusColor(s: string): string {
  switch (s) {
    case "running":
      return "#5dffb0";
    case "error":
      return "#ff5d8f";
    case "needs_you":
      return "#ffb020";
    case "blocked":
      return "#ffb020";
    case "done":
      return "#4cc9f0";
    default:
      return "#3d5a6c";
  }
}

function AclNodeFixed(props: NodeProps) {
  const data = props.data as AclNodeData;
  const [note, setNote] = useState(data.noteText || "");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(data.title);

  useEffect(() => setNote(data.noteText || ""), [data.noteText]);
  useEffect(() => setTitle(data.title), [data.title]);

  const needs = data.status === "needs_you";
  const running = data.status === "running";
  const cls = [
    "acl-node",
    `${data.kind}-kind`,
    needs ? "needs-you" : "",
    running ? "is-running" : "",
    props.selected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cls}
      style={{
        width: "100%",
        height: "100%",
        borderColor: props.selected ? data.color : undefined,
      }}
    >
      <NodeResizer
        minWidth={data.kind === "group" ? 280 : 200}
        minHeight={data.kind === "group" ? 180 : 120}
        isVisible={!!props.selected}
        lineClassName="nodrag"
        handleClassName="nodrag"
        color="#5dffb0"
      />
      <Handle type="target" position={Position.Left} style={{ opacity: 0.2 }} />
      <div className="acl-node-header">
        <span className="dot" style={{ background: statusColor(data.status) }} />
        {editing ? (
          <input
            className="nodrag"
            value={title}
            style={{ flex: 1, minWidth: 0 }}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              setEditing(false);
              data.onRename?.(title);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setEditing(false);
                data.onRename?.(title);
              }
            }}
            autoFocus
          />
        ) : (
          <span
            className="title"
            onDoubleClick={() => setEditing(true)}
            title="Double-click to rename"
          >
            {data.title}
          </span>
        )}
        <span className="badge">{data.kind}</span>
        {data.tags?.length ? (
          <span className="badge">{data.tags[0]}</span>
        ) : null}
        {data.onClose ? (
          <button
            type="button"
            className="danger nodrag"
            style={{ padding: "1px 6px", fontSize: 10 }}
            onClick={(e) => {
              e.stopPropagation();
              data.onClose?.();
            }}
          >
            x
          </button>
        ) : null}
      </div>
      <div className="acl-node-body">
        {data.kind === "note" ? (
          <textarea
            className="note-body nodrag nowheel"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              data.onNoteChange?.(e.target.value);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="// locus note"
          />
        ) : data.kind === "group" ? (
          <div className="group-body">{`┌─ GROUP FRAME ─────────
│ drop spatial context
│ move children as a unit
└────────────────────────`}</div>
        ) : (
          <TermView
            nodeId={props.id}
            kind={data.kind === "agent" ? "agent" : "terminal"}
            agentId={data.agentId}
            prompt={data.prompt}
          />
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0.2 }} />
    </div>
  );
}

export const AclFlowNode = memo(AclNodeFixed);
