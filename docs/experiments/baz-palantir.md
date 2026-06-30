---
sidebar_label: BAZ.Palantir orchestration
description: Authenticated Rust orchestration boundary for BAZ.HFT rules and BAZ.CX market data.
---

# BAZ.Palantir orchestration

**Location:** `/data/src/experiments/BAZ.Palantir/`

**Status:** working embryo; 38 tests; not a live-trading service

BAZ.Palantir stores and validates `glither.hft` rules, derives their market-data
requirements, maintains BAZ.CX subscriptions across reconnects, enriches incoming
ticks and candles, and exposes REST, WebSocket, and GraphQL interfaces.

```text
BAZ.CX -- ticks/candles --> BAZ.Palantir -- enriched events --> BAZ.Luna
                               |
                               +-- SQLite rules and operational audit
                               +-- in-process baz-hft-roux validation
                               +-- authenticated control APIs
```

## Security boundary

`PALANTIR_API_TOKEN` is required and must be non-empty. Every data-returning or
state-changing endpoint uses bearer authentication with constant-time token
comparison. `GET /api/health` is the only public endpoint.

Palantir binds to `127.0.0.1:8080` unless `PALANTIR_BIND` is set explicitly. It
does not enable permissive CORS. Binding to `0.0.0.0` is appropriate only behind
an authenticating proxy or private network boundary.

## Runtime responsibilities

### Rule lifecycle

- stores rule source transactionally in SQLite;
- accepts only bounded ASCII rule names, preventing path traversal;
- parses and checks rules in process through `baz-hft-roux`;
- returns a structured compilation summary rather than invoking a shell process;
- derives symbols, resolutions, windows, and indicators from validated source.

### BAZ.CX subscriptions

- maintains a desired-subscription registry outside individual socket sessions;
- replays subscriptions after reconnect;
- sends heartbeat pings and detects stale sessions;
- reconnects with bounded exponential backoff;
- emits connection, subscription, tick, and candle events to the host pipeline.

### Enrichment

The enricher uses bounded ring buffers and computes only subscribed signals. The
current implementation covers SMA, EMA, RSI, Bollinger-derived values, volume
ratios, candle range, price-to-SMA, and bid/ask spread percentage.

## HTTP surfaces

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Public liveness check |
| `GET` | `/api/rules` | List stored rules |
| `GET` | `/api/rules/{name}` | Read rule source |
| `PUT` | `/api/rules/{name}` | Validate and store a rule |
| `DELETE` | `/api/rules/{name}` | Remove a rule |
| `POST` | `/api/rules/{name}/compile` | Parse, check, and summarize a rule |
| `POST` | `/api/subscribe` | Resolve validated source requirements |
| `GET` | `/api/backlog` | Read operational backlog entries |
| `GET` | `/api/candles` | Read bounded candle history |
| `GET` | `/api/daemon/status` | Read daemon state |
| `POST` | `/api/daemon/{action}` | Start, stop, attach, or detach |
| `WS` | `/ws` | Stream enriched events |
| `GET`, `POST` | `/graphql` | GraphQL query and mutation surface |

Authenticated request example:

```bash
curl -H "Authorization: Bearer $PALANTIR_API_TOKEN" \
  http://127.0.0.1:8080/api/rules
```

## Storage and audit boundary

SQLite currently stores rules, candles, backlog entries, and an operational rule
audit. That table is not the canonical monetary audit store. Signed monetary
receipts, parent evidence, and tamper verification live in the BAZ.HFT host crate
and still need durable integration before order execution can be enabled.

## Run and verify

Palantir uses sibling path dependencies on `../baz.hft` and `../glither`.

```bash
cp .env.example .env
# Set PALANTIR_API_TOKEN, then load .env without printing it.
set -a
. ./.env
set +a
cargo run
```

```bash
cargo fmt --all -- --check
cargo clippy --all-targets -- -D warnings
cargo test --all-targets
```

The container build context is the parent `experiments/` directory so the image
can include both sibling compiler crates.

## Current limitations

- no venue order submission or settlement integration;
- no durable signed-receipt store;
- no key-management or key-rotation service;
- daemon controls are an orchestration boundary, not a production supervisor;
- deployment and latency guarantees remain unmeasured.

See [BAZ.HFT](./baz-hft) for dialect ownership and the monetary receipt model.
