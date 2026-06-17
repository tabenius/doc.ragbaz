---
sidebar_label: BAZ architecture & HFT dialect
description: The BAZ platform architecture — BAZ.CX (exchange connector), BAZ.Palantir (orchestration), BAZ.Luna (frontend) — and the glither.hft dialect syntax, semantics, codegen, and lifecycle model.
---

# BAZ platform architecture & `glither.hft` dialect specification

**Status:** all three services built and committed — BAZ.CX (Python exchange connector, 8/8 tests passing), BAZ.Palantir (Rust axum server, zero warnings), BAZ.Luna (Vite frontend with CodeMirror + marked + hljs, lazy-loaded). BAZ.HFT compiler complete (parse, check, Rust codegen, WIT codegen, 20 tests).
**Scope:** the BAZ real-time trading platform: exchange connectivity, strategy orchestration, rule compilation and audit, frontend visualization.
**Predecessor:** [Glither → WASM/WIT compiler spec](./glither-wasm-wit-compiler-spec) (the base Glither compiler upon which `glither.hft` is built).
**Author:** RAGBAZ · Tobias Abenius · 2026-06-16.

---

## 1. BAZ platform architecture

The BAZ platform is split into three subsystems that communicate over WebSocket and REST:

```
┌──────────────────────────────────────────────────────────┐
│  host: konsonans                                          │
│                                                           │
│  ┌─────────────────┐   WS stream    ┌─────────────────┐  │
│  │    BAZ.CX       │───────────────▶│  BAZ.Palantir   │  │
│  │  exchange conns │  ticks/candles │  orchestration  │  │
│  │  (Python)       │  positions/log │  (Rust server)   │  │
│  └─────────────────┘                └────────┬────────┘  │
│                                              │            │
│         WS/SSE  processed data +              │            │
│         annotation side-channel               │            │
│                                              ▼            │
│  ┌──────────────────────────────────────────────────┐     │
│  │                  BAZ.Luna                        │     │
│  │  Web frontend (Vite) · Tauri native (Win/Android)│     │
│  │  lightweight-charts · CodeMirror glith editor    │     │
│  │  backlog viewer · ledger · daemon panel          │     │
│  └──────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

### 1.1 BAZ.CX — exchange connector

- **Language:** Python (FastAPI + Strawberry GraphQL + WebSocket)
- **Role:** Connects to top-5 crypto exchanges (Kraken, Binance, Coinbase, Bitfinex, Bybit) via REST + WebSocket feeds. Normalises tick/candle/orderbook data into a common schema and streams it to BAZ.Palantir.
- **Stream schema:** typed WIT-derived records (tick, candle, position, receipt)
- **Authentication:** per-exchange API key management via environment variables
- **Deployment:** OCI container (Docker), runs on `konsonans`

### 1.2 BAZ.Palantir — orchestration server

- **Language:** Rust (standalone web server, extracted from the Tauri backend)
- **Role:** Rule lifecycle management — compilation, staging, audit, integration, deployment. Streams processed data to BAZ.Luna. Receives raw data from BAZ.CX.
- **Streaming:** WebSocket endpoint for real-time chart data + annotation side-channel (opt-in end-to-end)
- **Database:** SQLite (backlog, ticks, candles, rule versions, audit trail, deployment ledger)
- **Compiler:** Shells out to `baz-hft` CLI (the `glither.hft` roux compiler) for check + compile
- **API:** REST for CRUD (rules, config, audit), WebSocket for streaming

### 1.3 BAZ.Luna — frontend

- **Format:** Web app (Vite + vanilla JS/TS) OR native Tauri v2 package (Windows + Android)
- **Role:** Real-time candlestick charting (lightweight-charts), technical indicators (SMA, EMA, RSI, BB), `.glith` rule editor with CodeMirror syntax highlighting, backlog/log viewer, daemon panel, audit trail, deployment ledger
- **Backend communication:** WebSocket to BAZ.Palantir for streaming data, REST for CRUD
- **Tauri mode:** Wraps the web frontend in a Tauri shell with file system access for local rule editing, optional embedded BAZ.Palantir for standalone mode

### 1.4 Communication protocols

| Direction | Protocol | Payload | Notes |
|-----------|----------|---------|-------|
| BAZ.CX → BAZ.Palantir | WebSocket (JSON) | `tick`, `candle`, `position` | Typed per WIT schema |
| BAZ.Palantir → BAZ.Luna | WebSocket (JSON) | `candle`, `indicator`, `backlog`, `signal` | Aggregated + processed |
| BAZ.Luna → BAZ.Palantir | REST | Rule CRUD, config | Create/read/update/delete |
| BAZ.Luna ↔ BAZ.Palantir | WebSocket | `compile_result`, `audit_event`, `deploy` | Bidirectional events |
| BAZ.Luna ↔ BAZ.Palantir | WebSocket | Annotation side-channel | Opt-in E2E, arbitrary key-value metadata |

---

## 2. The `glither.hft` dialect

### 2.1 Dialect overview

`glither.hft` is a domain-specific language for expressing **deterministic, zero-allocation HFT trading strategies**. It extends the base Glither compiler with:

- **State definitions** — typed ring buffers with fixed capacity (no heap allocation)
- **Inline math macros** — single-pass RSI, Bollinger Bands, mean, stddev, volume
- **Transact dispositions** — market/limit orders with lifecycle management (fill handler + timeout)
- **Market-close-all** — emergency exit disposition
- **Fire-and-forget logging** — `then_log backlog` timestamps every signal to the SQLite backlog

### 2.2 Grammar (PEG, condensed)

The grammar is defined in `packages/roux/src/hft.pest` and extends the base Glither grammar with HFT-specific constructs.

```
// --- Pragma ---
pragma      = "#pragma" ~ (("dialect" ~ dialect_id ~ (";" ~ "fold" ~ fold_mode)?)
                          | ("version" ~ version_id))

// --- State definitions (HFT) ---
state_def   = "state" ~ ident ~ "=" ~ stream_source
              ~ ("|" ~ state_prop)*
state_prop  = ("window" ~ "=" ~ integer)
            | ("timeframe" ~ "=" ~ temporal_unit)
            | ("tracks" ~ "=" ~ "[" ~ ident ~ ("," ~ ident)* ~ "]")

// --- Predicates ---
predicate   = neg? ~ operand ~ (match_op ~ value)?
operand     = math_call | path
match_op    = "~" | "==" | "!=" | ">=" | "<=" | ">" | "<" | "in"
value       = regex | string | number | math_call | path

// --- Math macros (HFT) ---
math_call   = macro_name ~ "(" ~ path ~ ("," ~ macro_arg)* ~ ")"
macro_name  = "μ" | "σ" | ident
macro_arg   = ident ~ "=" ~ value

// --- Dispositions ---
disposition_block = action_type ~ transact_lifecycle?
action_type = transact | market_close_all | wrap | mv

transact    = "transact" ~ ident ~ args?
market_close_all = "market_close_all" ~ args?

// --- Transact lifecycle (HFT) ---
transact_lifecycle = "on" ~ ident ~ "into" ~ lifecycle_action
                     ~ "after" ~ temporal_unit ~ lifecycle_action
lifecycle_action = transact | market_close_all | wrap | mv | verb_app

// --- Logging (HFT) ---
log_directive = "then_log" ~ "backlog"

// --- Lexical ---
ident       = (ASCII_ALPHANUMERIC | "_")+
number      = "-"? ~ ASCII_DIGIT+ ~ ("." ~ ASCII_DIGIT+)?
string      = "\"" ~ (!"\"" ~ ANY)* ~ "\""
regex       = "/" ~ ("\\" ~ ANY | !"/" ~ ANY)* ~ "/"
temporal_unit = ASCII_DIGIT+ ~ ("ms" | "s" | "m" | "h")
```

### 2.3 Compiler pipeline

```
Source (.glith)
     │
     ▼
  ┌──────────┐
  │  Parser  │  pest PEG → parse tree
  └────┬─────┘
       │
       ▼
  ┌──────────┐
  │  Lower   │  parse tree → typed IR (Ruleset, StateDef, Rule, MathMacro, ...)
  └────┬─────┘
       │
       ▼
  ┌──────────┐
  │  Infer   │  phase inference (Select vs Crossing), math_call classification
  └────┬─────┘
       │
       ▼
  ┌──────────┐
  │  Check   │  structural validation: ZERO_WINDOW, NO_TRACKS, DEAD_RULE,
  └────┬─────┘  UNSAT_GUARD, MISSING_TRANSACT_ON/AFTER
       │
       ▼
  ┌──────────────────────┐
  │  Codegen             │
  │  ┌───────┐ ┌──────┐  │
  │  │ Rust  │ │ WIT  │  │
  │  └──┬────┘ └──┬───┘  │
  └─────┼─────────┼──────┘
        │         │
        ▼         ▼
   no_std WASM   hft-executor world
   component     contract
```

### 2.4 IR types (core)

The key IR types from `packages/roux/src/ir.rs`:

```rust
pub struct Ruleset {
    pub dialect: String,
    pub fold_mode: FoldMode,          // FirstMatch | Accumulate
    pub states: Vec<StateDef>,        // Ring buffer declarations
    pub enrichments: Vec<Enrichment>,
    pub groups: Vec<Group>,
    pub rules: Vec<Rule>,
}

pub struct StateDef {
    pub name: String,
    pub stream_source: String,        // e.g., "bars"
    pub window: usize,                // ring buffer capacity
    pub timeframe: String,            // e.g., "1m", "15m"
    pub tracks: Vec<String>,          // tracked fields: ["close"], ["close", "volume"]
}

pub struct Rule {
    pub name: String,
    pub collection: String,           // "tick" | "position" | "order"
    pub predicates: Vec<Predicate>,
    pub dispositions: Vec<Disposition>,
    pub log_directive: Option<LogDirective>,
}

pub enum Disposition {
    Transact { order_type, args, lifecycle: Option<TransactLifecycle> },
    MarketCloseAll { args },
    Terminal { box_name, args },
    VerbApp { verb, target, args },
    // ... Wrap, Graded
}

pub struct TransactLifecycle {
    pub on_event: String,             // e.g., "fill"
    pub on_action: Box<Disposition>,  // action on fill
    pub after_duration: String,       // e.g., "30s", "4h"
    pub after_action: Box<Disposition>, // action on timeout
}

pub enum MathMacro {
    name: String,                     // "rsi", "bbands_upper", "μ", "σ", "volume"
    args: Vec<MathMacroArg>,
}
```

### 2.5 Semantic rules

#### 2.5.1 First-match cascade

Rules are evaluated top-to-bottom within their collection group (`tick` rules form one group, `position` rules another). The first rule whose predicates all evaluate to true fires. Subsequent rules in the same group are **dead** (the checker emits `DEAD_RULE` if a rule with no predicates — an always-match rule — precedes others).

```
tick rule A  ──false──▶  tick rule B  ──true──▶  emit receipt (stop)
```

#### 2.5.2 Predicate evaluation

Each predicate is a triple `(operand, optional_op, optional_value)`:

- **Operand:** a field path (`tick.close`, `position.unrealized_pnl`) or a math macro call (`rsi(noise_rsi.close)`, `μ(wave_fast.close)`)
- **Match operator:** comparison (`>`, `>=`, `<`, `<=`, `==`, `!=`), pattern match (`~`), or set membership (`in`)
- **Value:** a literal, number, regex, math macro, or field reference

All math macros are **deterministic, single-pass, zero-allocation** — they operate on fixed-capacity ring buffers (`heapless::Vec<f32, N>`) and use only local stack variables.

#### 2.5.3 Transact lifecycle

The `transact` disposition embeds a two-stage lifecycle:

```
transact <order_type>
  on    <event> into <lifecycle_action>
  after <duration> <lifecycle_action>
```

**Semantics:**
1. **Immediate:** Place `<order_type>` order (market_buy, market_sell, limit_buy, limit_sell)
2. **On fill:** When `<event>` fires (e.g., `fill`), execute `<lifecycle_action>` (e.g., `position(target = μ(...))` — open position tracking with take-profit target)
3. **On timeout:** After `<duration>` (e.g., `30s`, `4h`), execute timeout `<lifecycle_action>` (e.g., `market_close_all(reason = ...)`, `cancel(reason = ...)`)

The host runtime (BAZ.Palantir + BAZ.CX) is responsible for interpreting the lifecycle actions. The compiled WASM component emits deterministic `Receipt` structs; the host manages clock time and position tracking.

#### 2.5.4 Logging and signal timestamping

The directive `then_log backlog` causes the host to record an entry in the SQLite `backlog` table whenever a rule fires:

| Column | Content |
|--------|---------|
| `id` | Auto-increment |
| `timestamp` | UTC datetime (set by host) |
| `event` | Action taken (e.g., `"market_buy"`, `"market_close_all"`) |
| `rule` | Rule name (e.g., `"rsi_oversold_reversal"`) |
| `payload` | JSON payload with price, indicators snapshot |

This is the **timestamped signal** that BAZ.Luna reads via the WebSocket stream.

#### 2.5.5 Collection semantics

Rules are grouped by **collection** — the type of record they evaluate:

| Collection | Fields | Generated WIT export |
|-----------|--------|---------------------|
| `tick` | `price`, `volume`, `timestamp`, `bid`, `ask` | `dispose-tick(t: tick) -> receipt` |
| `position` | `entry-price`, `current-price`, `quantity`, `unrealized-pnl` | `dispose-position(p: position) -> receipt` |
| `order` | (future) `id`, `side`, `status`, `filled_qty` | (future) `dispose-order(o: order) -> receipt` |

Each collection has its own dispose function in the generated WASM component. The host calls the appropriate function when new data arrives for that collection.

---

## 3. Available math macros

All macros operate on the ring buffers declared in `state` definitions.

| Macro | Signature | Description |
|-------|-----------|-------------|
| `rsi(path)` | `(ring: &[f32]) -> f32` | Relative Strength Index (14-period default) |
| `μ(path)` | `(ring: &[f32]) -> f32` | Arithmetic mean |
| `σ(path)` | `(ring: &[f32], m: f32) -> f32` | Standard deviation (takes pre-computed mean) |
| `volume(path)` | `(ring: &[f32]) -> f32` | Sum over window |
| `bbands_upper(path, dev)` | `(ring: &[f32], dev: f32) -> f32` | Upper Bollinger Band (mean + dev * stddev) |
| `bbands_lower(path, dev)` | `(ring: &[f32], dev: f32) -> f32` | Lower Bollinger Band (mean - dev * stddev) |
| `bbands_mid(path)` | `(ring: &[f32]) -> f32` | Middle Bollinger Band (= mean) |

---

## 4. Example strategies

### 4.1 Trading from noise (mean reversion)

File: `packages/strategies/trading_from_noise.glith`

```glith
#pragma dialect glither.hft ; fold first-match
#pragma version 2.0-beta

state noise_rsi  = bars | window = 14 | timeframe = 1m | tracks = [ close ]
state noise_bb   = bars | window = 20 | timeframe = 1m | tracks = [ close, volume ]

rule rsi_oversold_reversal =
  tick | rsi(noise_rsi.close) < 25.0
       | tick.close < bbands_lower(noise_bb.close, dev = 2.5)
       | volume(noise_bb.volume) > μ(noise_bb.volume)
  => transact market_buy
       on    fill  into position(target = bbands_mid(noise_bb.close))
       after 30s   market_close_all (reason = mean_reversion_timeout)
  then_log backlog
```

**Semantics:**
- On each tick, compute RSI(14) on 1m close prices
- If RSI < 25 AND price touches lower BB (2.5σ) AND volume is above average → place market buy
- On fill: record position with take-profit target at BB middle
- On timeout (30s): close all positions with reason
- Every signal is timestamped in the backlog

### 4.2 Riding the waves (trend following)

File: `packages/strategies/riding_the_waves.glith`

```glith
#pragma dialect glither.hft ; fold first-match
#pragma version 2.0-beta

state wave_fast = bars | window = 9  | timeframe = 15m | tracks = [ close ]
state wave_slow = bars | window = 21 | timeframe = 15m | tracks = [ close ]
state wave_rsi  = bars | window = 14 | timeframe = 15m | tracks = [ close ]

rule golden_cross_long =
  tick | μ(wave_fast.close) > μ(wave_slow.close)
       | rsi(wave_rsi.close) > 60.0
  => transact market_buy
       on    fill  into position(target = μ(wave_slow.close))
       after 4h   market_close_all (reason = trend_exit)
  then_log backlog
```

**Semantics:**
- On each tick, compute SMA(9) and SMA(21) on 15m close prices
- If SMA(9) > SMA(21) (golden cross) AND RSI(14) > 60 (momentum confirmation) → place market buy
- On fill: record position with take-profit target at slow SMA
- On timeout (4h): close position
- Every signal timestamped

---

## 5. WIT contract

The compiled strategy produces a WIT world that defines the host-guest contract:

```wit
// Generated by BAZ.HFT
package glither:hft;

interface hft-types {
    record tick {
        price: float32,
        volume: float32,
        timestamp: uint64,
        bid: float32,
        ask: float32,
    }
    record position {
        entry-price: float32,
        current-price: float32,
        quantity: float32,
        unrealized-pnl: float32,
    }
    variant action {
        market-buy(string),
        market-sell(string),
        limit-buy(string),
        limit-sell(string),
        market-close-all(string),
        cancel(string),
        modify-to-market,
        noop,
    }
    record receipt {
        action: action,
        reason: string,
        timestamp: uint64,
    }
}

world hft-executor {
    import hft-types;
    export dispose-tick: func(t: tick) -> receipt;
    export dispose-position: func(p: position) -> receipt;
}
```

The host (BAZ.Palantir/BAZ.CX) calls `dispose-tick` on each incoming tick and `dispose-position` on position updates. The guest returns a `receipt` with the action the runtime should execute.

---

## 6. Generated Rust code (no_std)

The Rust codegen emits a `#![no_std]` crate with:

- **State structs** — one per state definition, containing `heapless::Vec<f32, N>` ring buffers per tracked field
- **Math macro functions** — `rsi()`, `mean()`, `stddev()`, `volume()`, `bbands_upper/lower/mid()` — all single-pass, no heap
- **Dispose functions** — one per rule, named `dispose_{rule_name}(ctx: &TickCtx) -> Receipt`
- **Receipt type** — `enum Action { MarketBuy, MarketSell, ..., Noop }` + `struct Receipt { action, reason }`

The inline math expansion avoids function call overhead for simple operations and guarantees no floating-point environment dependencies.

---

## 7. Checks and diagnostics

The compiler emits diagnostics before codegen. HFT-specific checks:

| Code | Severity | Condition |
|------|----------|-----------|
| `ZERO_WINDOW` | Error | State definition has `window = 0` |
| `NO_TRACKS` | Error | State definition has empty `tracks` |
| `DEAD_RULE` | Error | First-match mode: rule preceded by an always-match rule |
| `MISSING_TRANSACT_ON` | Error | `transact` disposition missing lifecycle `on <event> into <action>` |
| `MISSING_TRANSACT_AFTER` | Error | `transact` disposition missing lifecycle `after <duration> <action>` |
| `UNSAT_GUARD` | Error | Crossing predicate references ligand that no enrichment produces |

---

## 8. Deployment flow: rule to running strategy

```
1. Author    Write .glith rule in BAZ.Luna CodeMirror editor
2. Compile   BAZ.Luna POSTs .glith to BAZ.Palantir /api/rules/compile
3. Stage     BAZ.Palantir runs baz-hft check, stores compiled WASM in staging
4. Audit     BAZ.Palantir records version diff, generates audit event
5. Integrate BAZ.Palantir deploys WASM component to BAZ.CX via WIT binding
6. Run       BAZ.CX instantiates WASM in wasmtime, connects exchange feed
7. Monitor   BAZ.CX streams receipts + backlog to BAZ.Palantir → BAZ.Luna
```

---

## 9. Repository layout

```
/data/src/experiments/
├── BAZ.Luna/          # Frontend (Vite + lightweight-charts + CodeMirror)
│   ├── src/           # HTML/JS/CSS
│   ├── Tauri/         # Optional Tauri v2 shell for native packaging
│   ├── package.json
│   └── vite.config.js
├── BAZ.Palantir/      # Orchestration server (Rust)
│   ├── src/           # Web server, SQLite, compiler bridge, WebSocket
│   ├── Cargo.toml
│   └── Dockerfile
├── BAZ.CX/            # Exchange connector (Python)
│   ├── src/
│   │   ├── main.py    # FastAPI + WS server
│   │   ├── exchanges/ # Kraken, Binance, Coinbase, Bitfinex, Bybit
│   │   └── wit/       # WIT bindings
│   ├── Dockerfile
│   └── pyproject.toml
└── baz.hft/           # HFT compiler (existing, unchanged)
    ├── packages/roux/ # Pest grammar, IR, codegen, tests
    ├── packages/host/ # WASM host runtime stub
    └── packages/strategies/ # .glith strategy files
```
