---
title: Frog — Workspace Coordination CLI
sidebar_position: 2
description: Workspace coordination CLI for /data/src — task tracking, lock management, repo registration, and MCP integration.
---

# ragbaz-frog

Path: `ragbaz-frog/`

Frog is the workspace coordination CLI for `/data/src`. It manages task slices, locks, repos, units, files, and event logs through a SQLite database (`AGENTS.db`), providing both a human-oriented terminal interface and an MCP server for agent consumption.

## Architecture

```
                ┌─────────────┐
                │  CLI (argparse)│
                │  frog <cmd>  │
                │  <subcmd>    │
                └──────┬──────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ Service  │ │ Service  │ │ Service  │
   │  Layer   │ │  Layer   │ │  Layer   │
   └────┬─────┘ └────┬─────┘ └────┬─────┘
        │            │            │
        └────────────┼────────────┘
                     ▼
              ┌──────────┐
              │  Store   │
              │ (SQLite) │
              │AGENTS.db │
              └──────────┘
```

Three layers:

### 1. Store Layer (`ragbazfrog/store/`)

SQLite database layer using aiosqlite. Manages:
- **Schema migrations** — version-tracked SQL migration files
- **Tables:** tasks, repos, locks, event_log, units, files, peers, box_identity, task_dependencies, task_assignments, task_tags, task_status_history, event_hooks, event_mirror, repo_aliases, repo_deps, repo_artifacts, repo_targets, target_runs, schema_migrations

### 2. Service Layer (`ragbazfrog/services/`)

Domain logic organized by concern:
- **repo** — repo registration, aliases, dependencies, units, targets, artifacts
- **task** — task CRUD, dependencies, assignments, tags, status history
- **lock** — lock acquire/release, audit, reap (stale recovery), list
- **sync** — pull workspace state from external sources
- **box** — box identity management for cross-box federation
- **peer** — peer join and communication for multi-box setups
- **mcp** — MCP tool definitions surfaced by the MCP server
- **status** — workspace summary (repos, files, tasks, locks)
- **log** — event log queries, follow/tail, why/blame
- **unit** — unit discovery and listing

### 3. CLI Layer (`ragbazfrog/cli/`)

Argparse-based command tree. Strict grammar: `frog <command> <subcommand> [args]`.

```
frog db migrate
frog new NAME                    # scaffold a repo/draft
frog completion bash|fish
frog log [--follow]
frog repo list
frog repo info REPO
frog repo build [REPO]           # + test/lint/clean/check/verify/diff/
                                 #   status/scan/targets/doctor/artifacts/
                                 #   artifact-stale
frog repo task list --repo REPO
frog repo dep add DEPENDENT DEPENDENCY
frog repo dep list
frog repo affected [--since REF]
frog repo build --affected
frog lock acquire ...
frog lock audit
frog lock reap
frog lock list --status ...
frog task create ...
frog task next [--agent N]
frog unit discover [--repo REPO]
frog unit list
frog mcp tools
frog mcp serve
frog status
frog sync pull WS
frog sync list
frog log why SLUG
frog log blame FILE
```

## MCP Integration

Frog also runs as an MCP server:

```
/data/src/ragbaz-frog/bin/frog-mcp
```

Exposes MCP tools for repo, unit, task, lock, log, status, and workspace operations. Agents should prefer frog MCP over guessing repo structure from raw directories.

## Database Schema (AGENTS.db)

The SQLite database at `/data/src/AGENTS.db` contains 20+ tables:

| Table | Purpose |
|---|---|
| `tasks` | Task slices with metadata (slug, description, status, priority, effort, impact) |
| `task_dependencies` | Directed dependency graph between tasks |
| `task_assignments` | Agent-to-task mapping |
| `task_tags` | Tag-based categorization |
| `task_status_history` | Immutable status change log |
| `repos` | Registered repo boundaries |
| `repo_aliases` | Alternative names for repos |
| `repo_deps` | Inter-repo dependency declarations |
| `repo_artifacts` | Build artifact tracking |
| `repo_targets` | Build target definitions |
| `target_runs` | Target execution history |
| `units` | Nested buildable/runnable subprojects |
| `files` | File classifications |
| `locks` | Coordination locks (agent, pid, repo, host, lease) |
| `peers` | Known peer boxes for federation |
| `box_identity` | Local box identity |
| `event_log` | Immutable coordination event log |
| `event_hooks` | Event-triggered hook definitions |
| `event_mirror` | Event mirroring to peers |
| `schema_migrations` | Migration version tracking |

## Key Concepts

### Workspace
The source root (`/data/src`). Treated as a structured workspace, not an undifferentiated directory tree.

### Repo
A tracked project boundary. Not every nested directory is a repo — prefer frog metadata over path name inference.

### Unit
A nested buildable or runnable subproject inside a repo. Used for suites with multiple levels.

### Lock
Coordination locks stored in AGENTS.db (not pid files). Support lease renewal and stale-lock recovery. Lock records include agent, pid, repo, host, start time, lease info.

### Task
Descriptive task slugs stable enough for commit messages and cross-references. Tracked with metadata: why, what, ROI/impact/effort, dependencies, conflicts, status history.

### Federation
Frog supports cross-box federation through box identity, peer joining, and event mirroring. Locks, tasks, and events can span multiple machines.

## Implementation

- **Language:** Python
- **Database:** SQLite (aiosqlite)
- **CLI:** argparse
- **MCP:** MCP protocol server
- **Service pattern:** Store (data access) → Service (business logic) → CLI/MCP (presentation)
- **Config:** Box identity, peer list, event hooks configured through the store

## Current Status

Active and well-tested (62+ tests). The CLI has gone through a major redesign (Phase I: strict grammar, Phase II: TUI/board parity, federation, MCP standards). 85+ completed tasks. Used as the coordination backbone for all multi-agent work under `/data/src`.
