---
sidebar_label: BAZ.HFT dialect and host
description: The glither.hft dialect, host runtime boundary, and signed monetary receipt chain.
---

# BAZ.HFT dialect and host

**Location:** `/data/src/experiments/baz.hft/`

**Dialect:** `glither.hft`

**Status:** compiler and audit primitives implemented; live execution not implemented

BAZ.HFT is a Glither dialect and host embryo for deterministic market-policy
evaluation. It owns HFT strategy fixtures, host integration, execution controls,
and monetary audit receipts. It does not own a separate compiler fork.

## Ownership split

| Boundary | Owner |
| --- | --- |
| Grammar, IR, structural checks, Rust/WIT/Gleam code generation | Glither `packages/roux` |
| CLI compilation and component scaffolding | Glither `packages/tangle` |
| HFT compatibility facade | BAZ.HFT `packages/roux` |
| Strategy fixtures and host runtime | BAZ.HFT |
| Rule storage, market-data subscriptions, enrichment, control API | BAZ.Palantir |
| Exchange feeds | BAZ.CX |

The local `baz-hft-roux` crate re-exports the shared Glither compiler API. Parser,
IR, check, or code-generation changes belong in Glither rather than BAZ.HFT.

## Dialect surface

`glither.hft` adds bounded market state, indicator macros, transaction lifecycle
arms, emergency close actions, and diagnostic backlog intent:

```glither
#pragma dialect glither.hft ; fold first-match

state micro_window =
  bars | window = 20
       | timeframe = 1m
       | tracks = [ close, volume ]

rule bb_upper_mean_reversion =
  tick | tick.close > bbands_upper(micro_window.close, dev = 3.0)
       | spread < 0.02%
  => transact limit_sell (price = tick.close - 0.05)
       on    fill  into position(target = bbands_mid(micro_window.close))
       after 500ms modify_to_market
       then_log backlog
```

The shared compiler currently parses and lowers HFT state, macros, lifecycle
arms, and backlog syntax; performs dialect-aware structural checks; and emits
initial Rust, WIT, and Gleam targets. Sub-millisecond, zero-allocation, and live
venue guarantees remain targets until measured on a complete component host.

## Signed monetary receipts

The host crate provides the first canonical audit primitive required before live
execution:

- typed actor, authority, policy/runtime, monetary, provenance, and decision data;
- content-addressed receipt IDs and SHA-256 receipt hashes;
- Ed25519 signatures with explicit key IDs;
- append-only previous-hash linkage and monotone sequence validation;
- same-trace parent validation;
- plan or approval evidence required before execution;
- finite, non-negative quantity and notional validation;
- human reviewer attribution for resolved review states;
- offline signature and chain verification with tamper tests.

Backlog records remain lossy diagnostics. They are not canonical monetary
evidence and cannot authorize execution.

## Audit lifecycle

```text
recommendation
  -> plan
  -> review requested
  -> approved | rejected | amended | bypassed
  -> execution submitted
  -> filled | cancelled | modified | blocked
  -> settlement observed
  -> closed
```

The canonical governance specification requires exact policy and artifact hashes,
input provenance, risk-budget authority, human oversight state, lifecycle parent
evidence, chain integrity, and signatures. BAZ.HFT now supplies the in-memory
schema/sealing/verification layer; durable fail-closed storage and runtime event
emission remain next.

## Verify

From the BAZ.HFT repository:

```bash
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
```

The current workspace covers compiler compatibility and monetary receipt chain
behavior. It does not constitute exchange certification or a live-trading test.

## Next host slices

1. Append and synchronize signed receipts before any venue side effect.
2. Emit policy compilation and activation receipts.
3. Connect plan, review, submit, fill, cancel, and settlement events.
4. Add durable append-only storage, key rotation, and retention policy.
5. Add replay tooling and redacted operator/regulator projections.
6. Measure component latency and allocation behavior under a paper feed.

See [BAZ.Palantir](./baz-palantir) for the orchestration consumer and
[`glither.governance`](./glither-governance) for general AI-action governance.
