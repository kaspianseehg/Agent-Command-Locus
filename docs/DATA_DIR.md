# Data directory & locking

## Defaults

| Surface | Default path |
|---------|----------------|
| Desktop | Electron `userData/data` |
| Server | `~/.acl-server-data` |
| Override | `ACL_DATA_DIR=/absolute/path` |

## Single-writer lock

`DataDirLock` writes `.acl.lock` in the data directory.

- First process acquires exclusive intent
- Second process gets a warning (`lockWarning` in desktop UI rail)
- Stale locks from dead PIDs on the same host are cleared

Prefer one writer (desktop *or* server) per data dir.

## Skins directory

`{dataDir}/skins/*.json` — user aesthetics. See [SKINS.md](./SKINS.md).
Auto-created on desktop launch with `example-custom.json`.

