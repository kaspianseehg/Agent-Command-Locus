# Security

- No API keys in the repository.
- Server password only via env / local data dir.
- Default bind loopback.
- PTY = full user shell — treat server exposure accordingly.
- Agent CLIs use **user-provided** credentials outside this repo (ChatGPT/Codex OAuth, Anthropic, xAI, etc.).
- ACL does not embed or prefer any vendor’s auth path.
