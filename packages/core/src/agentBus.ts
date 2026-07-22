import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";

export type NodeStatusEvent = {
  nodeId: string;
  status: string;
  detail?: string;
  ts: string;
};

/**
 * In-process agent bus (Phase 2 foundation).
 * Later: UDS/HTTP. Desktop uses this for badges + inbox.
 */
export class AgentBus extends EventEmitter {
  private statuses = new Map<string, NodeStatusEvent>();
  private inbox: Array<{ id: string; nodeId: string; message: string; ts: string }> =
    [];

  setStatus(nodeId: string, status: string, detail?: string): NodeStatusEvent {
    const ev: NodeStatusEvent = {
      nodeId,
      status,
      detail,
      ts: new Date().toISOString(),
    };
    this.statuses.set(nodeId, ev);
    this.emit("status", ev);
    if (status === "needs_you") {
      this.pushInbox(nodeId, detail || "Agent needs you");
    }
    return ev;
  }

  getStatus(nodeId: string): NodeStatusEvent | undefined {
    return this.statuses.get(nodeId);
  }

  listStatuses(): NodeStatusEvent[] {
    return [...this.statuses.values()];
  }

  pushInbox(nodeId: string, message: string) {
    const item = {
      id: randomUUID(),
      nodeId,
      message,
      ts: new Date().toISOString(),
    };
    this.inbox.unshift(item);
    this.inbox = this.inbox.slice(0, 50);
    this.emit("inbox", item);
    return item;
  }

  listInbox() {
    return [...this.inbox];
  }

  clearInboxItem(id: string) {
    this.inbox = this.inbox.filter((i) => i.id !== id);
  }

  reply(nodeId: string, text: string) {
    this.emit("reply", { nodeId, text, ts: new Date().toISOString() });
    this.setStatus(nodeId, "running", "reply sent");
  }
}
