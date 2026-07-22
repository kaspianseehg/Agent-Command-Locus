import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";

export type PresenceUser = {
  id: string;
  name: string;
  color: string;
  projectId: string;
  x: number;
  y: number;
  lastSeen: number;
};

const COLORS = ["#5dffb0", "#4cc9f0", "#ffb020", "#ff5d8f", "#a78bfa", "#f472b6"];

/**
 * Ephemeral presence (in-memory). Broadcast via bus/WS.
 */
export class PresenceHub extends EventEmitter {
  private users = new Map<string, PresenceUser>();
  private ttlMs = 30_000;

  join(projectId: string, name?: string): PresenceUser {
    this.gc();
    const u: PresenceUser = {
      id: randomUUID(),
      name: name || `ops-${Math.floor(Math.random() * 900 + 100)}`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      projectId,
      x: 0,
      y: 0,
      lastSeen: Date.now(),
    };
    this.users.set(u.id, u);
    this.emit("join", u);
    this.emit("change", this.list(projectId));
    return u;
  }

  move(id: string, x: number, y: number): PresenceUser | undefined {
    const u = this.users.get(id);
    if (!u) return undefined;
    u.x = x;
    u.y = y;
    u.lastSeen = Date.now();
    this.emit("move", u);
    this.emit("change", this.list(u.projectId));
    return u;
  }

  leave(id: string): void {
    const u = this.users.get(id);
    if (!u) return;
    this.users.delete(id);
    this.emit("leave", u);
    this.emit("change", this.list(u.projectId));
  }

  heartbeat(id: string): void {
    const u = this.users.get(id);
    if (u) u.lastSeen = Date.now();
  }

  list(projectId: string): PresenceUser[] {
    this.gc();
    return [...this.users.values()].filter((u) => u.projectId === projectId);
  }

  private gc(): void {
    const now = Date.now();
    for (const [id, u] of this.users) {
      if (now - u.lastSeen > this.ttlMs) {
        this.users.delete(id);
        this.emit("leave", u);
      }
    }
  }
}
