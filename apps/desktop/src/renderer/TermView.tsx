import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

export function TermView(props: {
  nodeId: string;
  kind: "terminal" | "agent";
  agentId?: string;
  prompt?: string;
  autoStart?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const start = useCallback(async () => {
    setError(null);
    const cols = termRef.current?.cols ?? 100;
    const rows = termRef.current?.rows ?? 28;
    const res = (await window.acl.ptyStart({
      nodeId: props.nodeId,
      kind: props.kind,
      agentId: props.agentId,
      prompt: props.prompt,
      cols,
      rows,
    })) as { ok: boolean; error?: string; backend?: string };

    if (!res.ok) {
      setError(res.error || "Failed to start PTY");
      termRef.current?.writeln(`\r\n\x1b[31m${res.error}\x1b[0m`);
      return;
    }
    if (res.backend) {
      termRef.current?.writeln(`\r\n\x1b[90mbackend: ${res.backend}\x1b[0m`);
    }
  }, [props.nodeId, props.kind, props.agentId, props.prompt]);

  useEffect(() => {
    if (!hostRef.current) return;
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      theme: {
        background: "#000000",
        foreground: "#e2e8f0",
        cursor: "#38bdf8",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(hostRef.current);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    const unsubData = window.acl.onPtyData((msg) => {
      if (msg.nodeId === props.nodeId) term.write(msg.data);
    });
    const unsubExit = window.acl.onPtyExit((msg) => {
      if (msg.nodeId === props.nodeId) {
        term.writeln(`\r\n\x1b[33m[exit ${msg.code}]\x1b[0m`);
      }
    });

    term.onData((data) => {
      void window.acl.ptyWrite(props.nodeId, data);
    });

    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
        void window.acl.ptyResize(props.nodeId, term.cols, term.rows);
      } catch {
        /* ignore */
      }
    });
    ro.observe(hostRef.current);

    if (props.autoStart !== false && !started.current) {
      started.current = true;
      void start();
    }

    return () => {
      unsubData();
      unsubExit();
      ro.disconnect();
      void window.acl.ptyKill(props.nodeId);
      term.dispose();
      termRef.current = null;
    };
  }, [props.nodeId, props.autoStart, start]);

  if (error && props.kind === "agent") {
    return (
      <div className="agent-error">
        <div>{error}</div>
        <button type="button" style={{ marginTop: 8 }} onClick={() => void start()}>
          Retry
        </button>
      </div>
    );
  }

  return <div className="term-host" ref={hostRef} />;
}
