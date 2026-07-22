import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { EventEmitter } from "node:events";

export type PtyBackend = "tmux" | "plain";

export interface PtySpawnOpts {
  id: string;
  cwd: string;
  cols?: number;
  rows?: number;
  /** If set, try tmux session name acl-<id> */
  preferTmux?: boolean;
  /** Shell command argv; default user shell */
  cmd?: string[];
  env?: NodeJS.ProcessEnv;
}

export interface PtySession {
  id: string;
  backend: PtyBackend;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(): void;
}

type PtyHandle = {
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  kill: () => void;
  onData: (cb: (d: string) => void) => void;
  onExit: (cb: (code: number | null) => void) => void;
};

function whichTmux(): string | null {
  const paths = ["/opt/homebrew/bin/tmux", "/usr/bin/tmux", "/usr/local/bin/tmux"];
  for (const p of paths) if (existsSync(p)) return p;
  return null;
}

function defaultShell(): string {
  return process.env.SHELL || "/bin/zsh";
}

/**
 * PTY manager. Uses node-pty when available; falls back to pipe spawn (degraded).
 */
export class PtyService extends EventEmitter {
  private sessions = new Map<string, PtySession & { _raw: PtyHandle }>();
  private nodePty: typeof import("node-pty") | null = null;

  async init(): Promise<void> {
    try {
      this.nodePty = await import("node-pty");
    } catch {
      this.nodePty = null;
      this.emit("warn", "node-pty unavailable; using pipe fallback");
    }
  }

  list(): string[] {
    return [...this.sessions.keys()];
  }

  get(id: string): PtySession | undefined {
    return this.sessions.get(id);
  }

  spawn(opts: PtySpawnOpts): PtySession {
    if (this.sessions.has(opts.id)) {
      this.kill(opts.id);
    }
    const cols = opts.cols ?? 100;
    const rows = opts.rows ?? 28;
    const cwd = opts.cwd || homedir();
    const preferTmux = opts.preferTmux !== false;
    const tmux = preferTmux ? whichTmux() : null;

    let backend: PtyBackend = "plain";
    let file: string;
    let args: string[];

    if (opts.cmd && opts.cmd.length > 0) {
      file = opts.cmd[0];
      args = opts.cmd.slice(1);
      backend = "plain";
    } else if (tmux) {
      backend = "tmux";
      const session = `acl-${opts.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40)}`;
      file = tmux;
      // new-session -A attaches if exists
      args = ["new-session", "-A", "-s", session, "-x", String(cols), "-y", String(rows)];
    } else {
      file = defaultShell();
      args = ["-l"];
      backend = "plain";
    }

    const env = {
      ...process.env,
      ...(opts.env || {}),
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
    };

    const handle = this.nodePty
      ? this.spawnNodePty(file, args, cwd, cols, rows, env)
      : this.spawnPipe(file, args, cwd, env);

    const session: PtySession & { _raw: PtyHandle } = {
      id: opts.id,
      backend,
      _raw: handle,
      write: (d) => handle.write(d),
      resize: (c, r) => handle.resize(c, r),
      kill: () => {
        handle.kill();
        this.sessions.delete(opts.id);
        this.emit("exit", opts.id, null);
      },
    };

    handle.onData((data) => this.emit("data", opts.id, data));
    handle.onExit((code) => {
      this.sessions.delete(opts.id);
      this.emit("exit", opts.id, code);
    });

    // Banner when plain without tmux
    if (backend === "plain" && !opts.cmd) {
      const msg = `\r\n\x1b[33m[ACL]\x1b[0m tmux not used — session will not survive app restart.\r\n`;
      setTimeout(() => this.emit("data", opts.id, msg), 50);
    } else if (backend === "tmux") {
      const msg = `\r\n\x1b[32m[ACL]\x1b[0m tmux session (survives restart if you reopen this node).\r\n`;
      setTimeout(() => this.emit("data", opts.id, msg), 50);
    }

    this.sessions.set(opts.id, session);
    this.emit("spawn", opts.id, backend);
    return session;
  }

  write(id: string, data: string): void {
    this.sessions.get(id)?.write(data);
  }

  resize(id: string, cols: number, rows: number): void {
    this.sessions.get(id)?.resize(cols, rows);
  }

  kill(id: string): void {
    this.sessions.get(id)?.kill();
  }

  killAll(): void {
    for (const id of [...this.sessions.keys()]) this.kill(id);
  }

  private spawnNodePty(
    file: string,
    args: string[],
    cwd: string,
    cols: number,
    rows: number,
    env: NodeJS.ProcessEnv,
  ): PtyHandle {
    const pty = this.nodePty!;
    const term = pty.spawn(file, args, {
      name: "xterm-256color",
      cols,
      rows,
      cwd,
      env: env as Record<string, string>,
    });
    return {
      write: (d) => term.write(d),
      resize: (c, r) => term.resize(c, r),
      kill: () => {
        try {
          term.kill();
        } catch {
          /* ignore */
        }
      },
      onData: (cb) => {
        term.onData(cb);
      },
      onExit: (cb) => {
        term.onExit(({ exitCode }) => cb(exitCode ?? null));
      },
    };
  }

  private spawnPipe(
    file: string,
    args: string[],
    cwd: string,
    env: NodeJS.ProcessEnv,
  ): PtyHandle {
    const child: ChildProcessWithoutNullStreams = spawn(file, args, {
      cwd,
      env,
      stdio: "pipe",
    });
    const dataCbs: Array<(d: string) => void> = [];
    const exitCbs: Array<(c: number | null) => void> = [];
    child.stdout.on("data", (b: Buffer) => dataCbs.forEach((cb) => cb(b.toString("utf8"))));
    child.stderr.on("data", (b: Buffer) => dataCbs.forEach((cb) => cb(b.toString("utf8"))));
    child.on("exit", (code) => exitCbs.forEach((cb) => cb(code)));
    return {
      write: (d) => child.stdin.write(d),
      resize: () => {
        /* no-op */
      },
      kill: () => {
        child.kill("SIGTERM");
      },
      onData: (cb) => dataCbs.push(cb),
      onExit: (cb) => exitCbs.push(cb),
    };
  }
}
