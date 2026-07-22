/**
 * Optional bridge from desktop → ACL server presence/events WS.
 * Enable with settings.serverUrl (e.g. http://127.0.0.1:8450).
 */
export type RemotePeer = {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
};

export type PresenceBridgeHandlers = {
  onPeers?: (peers: RemotePeer[]) => void;
  onComment?: (c: { author: string; body: string; target_id?: string }) => void;
  onStatus?: (s: string) => void;
};

export class PresenceBridge {
  private ws: WebSocket | null = null;
  private url: string;
  private projectId: string;
  private name: string;
  private handlers: PresenceBridgeHandlers;
  private closed = false;

  constructor(
    serverHttpUrl: string,
    projectId: string,
    name: string,
    handlers: PresenceBridgeHandlers = {},
  ) {
    this.projectId = projectId;
    this.name = name || "desktop";
    this.handlers = handlers;
    const u = new URL(serverHttpUrl);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    u.pathname = "/";
    u.search = `?kind=events&projectId=${encodeURIComponent(projectId)}`;
    this.url = u.toString();
  }

  connect(): void {
    this.closed = false;
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      this.handlers.onStatus?.(`presence error: ${e}`);
      return;
    }
    this.ws.onopen = () => {
      this.handlers.onStatus?.("presence live");
      this.ws?.send(JSON.stringify({ type: "join", name: this.name }));
    };
    this.ws.onclose = () => {
      this.handlers.onStatus?.("presence off");
      if (!this.closed) {
        setTimeout(() => this.connect(), 2500);
      }
    };
    this.ws.onerror = () => {
      this.handlers.onStatus?.("presence error");
    };
    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data));
        if (msg.type === "presence" || msg.type === "hello") {
          this.handlers.onPeers?.(msg.users || msg.presence || []);
        }
        if (msg.type === "comment" && msg.comment) {
          this.handlers.onComment?.(msg.comment);
        }
      } catch {
        /* ignore */
      }
    };
  }

  move(x: number, y: number): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "move", x, y }));
    }
  }

  comment(body: string, targetId?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "comment",
          target_type: "node",
          target_id: targetId || "",
          author: this.name,
          body,
        }),
      );
    }
  }

  close(): void {
    this.closed = true;
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
  }
}
