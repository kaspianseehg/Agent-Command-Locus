/**
 * Best-effort usage meter — not billing-grade.
 * Counts UTF-8 bytes + rough token estimate (chars/4).
 */
export type UsageSnapshot = {
  nodeId: string;
  bytesIn: number;
  bytesOut: number;
  tokensEst: number;
  updated_at: string;
};

export class UsageMeter {
  private map = new Map<string, UsageSnapshot>();

  private empty(nodeId: string): UsageSnapshot {
    return {
      nodeId,
      bytesIn: 0,
      bytesOut: 0,
      tokensEst: 0,
      updated_at: new Date().toISOString(),
    };
  }

  recordOut(nodeId: string, chunk: string): UsageSnapshot {
    const cur = this.map.get(nodeId) || this.empty(nodeId);
    const n = Buffer.byteLength(chunk, "utf8");
    cur.bytesOut += n;
    cur.tokensEst = Math.ceil((cur.bytesIn + cur.bytesOut) / 4);
    cur.updated_at = new Date().toISOString();
    this.map.set(nodeId, cur);
    return { ...cur };
  }

  recordIn(nodeId: string, chunk: string): UsageSnapshot {
    const cur = this.map.get(nodeId) || this.empty(nodeId);
    const n = Buffer.byteLength(chunk, "utf8");
    cur.bytesIn += n;
    cur.tokensEst = Math.ceil((cur.bytesIn + cur.bytesOut) / 4);
    cur.updated_at = new Date().toISOString();
    this.map.set(nodeId, cur);
    return { ...cur };
  }

  get(nodeId: string): UsageSnapshot {
    return this.map.get(nodeId) || this.empty(nodeId);
  }

  list(): UsageSnapshot[] {
    return [...this.map.values()];
  }

  reset(nodeId?: string): void {
    if (nodeId) this.map.delete(nodeId);
    else this.map.clear();
  }
}
