---
sidebar_label: BAZ.Palantir orchestration
description: BAZ.Palantir — Rust axum server for rule lifecycle, CX integration, enrichment, and WebSocket broadcast.
---

# BAZ.Palantir — orchestration server

**Location:** `/data/src/experiments/BAZ.Palantir/`

## Overview

BAZ.Palantir is the central orchestration server for the BAZ platform. It receives raw exchange data from BAZ.CX over WebSocket, enriches it with technical indicators, manages strategy rule lifecycle, and broadcasts processed data + signals to BAZ.Luna.

```
BAZ.CX ── WS (ticks/candles) ──▶ BAZ.Palantir ── WS/SSE ──▶ BAZ.Luna
                                      │
                                      ├── SQLite (backlog, rules, audit)
                                      ├── baz-hft CLI (compile)
                                      └── REST API (CRUD)
```

## Stack

| Layer | Library | Purpose |
|-------|---------|---------|
| HTTP | axum 0.8 | Routing, middleware, WebSocket upgrade |
| GraphQL | async-graphql 8.0.0-rc.5 | Subscription/mutation schema |
| Database | rusqlite + SQLite | Backlog, candles, rules, audit trail |
| WebSocket | tokio-tungstenite 0.24 | Outbound CX client, inbound Luna broadcast |
| Async | tokio | Broadcast channel, background tasks |
| CORS | tower-http | Cross-origin for Luna dev server |
| Compiler | `baz-hft` CLI (shell) | Compile `.glith` → WASM |

## REST endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/rules/:name` | Fetch a compiled rule |
| `PUT` | `/api/rules/:name` | Create or update a rule |
| `DELETE` | `/api/rules/:name` | Delete a rule |
| `POST` | `/api/rules/:name/compile` | Compile Glith source |
| `GET` | `/api/backlog` | Event log entries |
| `GET` | `/api/candles` | Historical candle data |
| `GET` | `/api/daemon/status` | Strategy daemon status |
| `POST` | `/api/daemon/:action` | Start/stop/restart daemon |
| `WS` | `/ws` | Real-time streaming |
| `POST` | `/graphql` | GraphQL endpoint |

## WebSocket protocol

The `/ws` endpoint broadcasts JSON messages to all connected clients (BAZ.Luna instances):

```json
{"type": "tick",      "symbol": "BTC/USDT", "price": 69420.0, "volume": 1.5,  "timestamp": 1719000000}
{"type": "candle",    "symbol": "BTC/USDT", "open": 69000, "high": 69500, "low": 68800, "close": 69420, "volume": 1200, "timestamp": 1719000000}
{"type": "indicator", "symbol": "BTC/USDT", "rsi": 58.2, "sma9": 69100, "sma21": 68500, "bb_upper": 71000, "bb_lower": 67000}
{"type": "signal",    "rule": "rsi_oversold", "action": "market_buy", "reason": "RSI<25 + touch BB lower", "price": 67200}
{"type": "annotation","rule": "rsi_oversold", "note": "take-profit target hit", "severity": "info"}
{"type": "backlog",   "entries": [{"timestamp": "...", "event": "market_buy", "rule": "rsi_oversold", "payload": {}}]}
```

## Integration modules

### `cx_client.rs` — WS client to BAZ.CX

- Connects to BAZ.CX WebSocket at `ws://baz-cx:8000/ws`
- Auto-reconnect with exponential backoff (1s, 2s, 4s, … 60s cap)
- Command channel (tx/rx) for subscribing/unsubscribing streams
- Event channel for receiving ticks, candles, positions
- Heartbeat ping/pong every 30s

### `enricher.rs` — ring-buffer indicator engine

Computes technical indicators over sliding windows:

| Indicator | Window | Method |
|-----------|--------|--------|
| SMA(9) | 9 ticks/prices | Arithmetic mean |
| SMA(21) | 21 ticks/prices | Arithmetic mean |
| EMA(12) | 12 ticks/prices | Exponential weighted |
| RSI(14) | 14 ticks/prices | Wilder's smoothed RSI |
| BB(20,2) | 20 ticks/prices | Mean ± 2σ with linear stddev |

All indicators use fixed-capacity ring buffers (`VecDeque<f64>`) — no dynamic allocation per tick.

### `requirements.rs` — .glith dependency parser

Parses a `.glith` strategy file line-by-line to extract the data dependencies (state definitions, collections referenced, predicates) that BAZ.Palantir must subscribe to on BAZ.CX. Two unit tests verify round-trip parsing.

### `graphql.rs` — async-graphql schema

| Mutation | Purpose |
|----------|---------|
| `subscribe(symbol, kinds)` | Subscribe to exchange streams |
| `unsubscribe(symbol, kinds)` | Unsubscribe from exchange streams |
| `deploy_rule(name, glith_source)` | Compile & deploy a rule |
| `resolve_and_subscribe(name)` | Resolve deps & subscribe to required streams |

## Database schema (`palantir.db`)

```sql
CREATE TABLE backlog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  event TEXT NOT NULL,
  rule TEXT,
  payload TEXT
);

CREATE TABLE ticks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  price REAL NOT NULL,
  volume REAL,
  timestamp INTEGER NOT NULL
);

CREATE TABLE candles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  open REAL, high REAL, low REAL, close REAL, volume REAL,
  timestamp INTEGER NOT NULL
);

CREATE TABLE rules (
  name TEXT PRIMARY KEY,
  glith_source TEXT NOT NULL,
  compiled_wasm BLOB,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT,
  action TEXT NOT NULL,
  payload TEXT,
  timestamp TEXT DEFAULT (datetime('now'))
);
```

## Build & run

```bash
cargo check                              # Verify compilation (zero warnings)
cargo build --release                    # Production binary
./target/release/baz-palantir            # Starts on :8080
```

Optional: `RUST_LOG=info` for structured logging (uses `env_logger`).
