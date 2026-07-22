import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * Exclusive data-dir lock so desktop + server don't thrash the same JSON store.
 */
export class DataDirLock {
  private lockPath: string;
  private fd: number | null = null;
  readonly ownerId: string;

  constructor(dataDir: string, ownerId?: string) {
    fs.mkdirSync(dataDir, { recursive: true });
    this.lockPath = path.join(dataDir, ".acl.lock");
    this.ownerId = ownerId || `${process.pid}@${os.hostname()}`;
  }

  tryAcquire(): { ok: boolean; holder?: string } {
    try {
      this.fd = fs.openSync(this.lockPath, "wx");
      fs.writeFileSync(
        this.fd,
        JSON.stringify({
          owner: this.ownerId,
          pid: process.pid,
          at: new Date().toISOString(),
        }),
        "utf8",
      );
      return { ok: true };
    } catch {
      let holder = "unknown";
      try {
        holder = JSON.parse(fs.readFileSync(this.lockPath, "utf8")).owner;
      } catch {
        /* ignore */
      }
      // stale lock: dead pid on same host
      try {
        const raw = JSON.parse(fs.readFileSync(this.lockPath, "utf8")) as {
          pid?: number;
          owner?: string;
        };
        if (raw.pid && raw.owner?.includes(os.hostname())) {
          try {
            process.kill(raw.pid, 0);
          } catch {
            fs.unlinkSync(this.lockPath);
            return this.tryAcquire();
          }
        }
        holder = raw.owner || holder;
      } catch {
        /* ignore */
      }
      return { ok: false, holder };
    }
  }

  release(): void {
    try {
      if (this.fd != null) fs.closeSync(this.fd);
    } catch {
      /* ignore */
    }
    this.fd = null;
    try {
      const raw = JSON.parse(fs.readFileSync(this.lockPath, "utf8")) as {
        owner?: string;
      };
      if (raw.owner === this.ownerId) fs.unlinkSync(this.lockPath);
    } catch {
      /* ignore */
    }
  }
}

export function resolveAclDataDir(kind: "desktop" | "server"): string {
  if (process.env.ACL_DATA_DIR) return process.env.ACL_DATA_DIR;
  if (kind === "server") {
    return path.join(os.homedir(), ".acl-server-data");
  }
  // desktop uses Electron userData — caller passes absolute when available
  return path.join(os.homedir(), ".acl-desktop-data");
}
