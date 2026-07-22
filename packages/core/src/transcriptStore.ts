import fs from "node:fs";
import path from "node:path";

/**
 * Append-only transcript log with in-memory ring buffer for live tail UI.
 */
export class TranscriptStore {
  private buffers = new Map<string, string>();
  private maxChars: number;

  constructor(maxChars = 120_000) {
    this.maxChars = maxChars;
  }

  private key(projectId: string, nodeId: string) {
    return `${projectId}::${nodeId}`;
  }

  ensureFile(filePath: string): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(
        filePath,
        `# ACL transcript\n# started ${new Date().toISOString()}\n`,
        "utf8",
      );
    }
  }

  append(projectId: string, nodeId: string, chunk: string, filePath?: string | null): void {
    if (!chunk) return;
    const k = this.key(projectId, nodeId);
    const prev = this.buffers.get(k) || "";
    let next = prev + chunk;
    if (next.length > this.maxChars) {
      next = next.slice(next.length - this.maxChars);
    }
    this.buffers.set(k, next);
    if (filePath) {
      try {
        this.ensureFile(filePath);
        fs.appendFileSync(filePath, chunk, "utf8");
      } catch {
        /* ignore disk errors */
      }
    }
  }

  /** Tail last N chars from memory, falling back to file */
  tail(
    projectId: string,
    nodeId: string,
    max = 8000,
    filePath?: string | null,
  ): { text: string; source: "memory" | "file" | "empty" } {
    const k = this.key(projectId, nodeId);
    const mem = this.buffers.get(k);
    if (mem && mem.length) {
      return { text: mem.slice(-max), source: "memory" };
    }
    if (filePath && fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        return { text: raw.slice(-max), source: "file" };
      } catch {
        /* ignore */
      }
    }
    return { text: "", source: "empty" };
  }

  clear(projectId: string, nodeId: string): void {
    this.buffers.delete(this.key(projectId, nodeId));
  }
}
