---
title: Experiments Overview
sidebar_position: 1
description: Exploratory apps and framework spikes under /data/src/experiments.
---

# Experiments Overview

The `experiments/` tree contains code that is useful for learning, design discovery, and architectural comparison, but is not yet the canonical product path.

## Main clusters

- **BAZ Platform**: three-tier algorithmic trading suite — [BAZ.HFT](baz-hft) (glither.hft compiler dialect and no_std WASM host, signed Ed25519 audit receipts), [BAZ.Palantir](baz-palantir) (Rust/Axum orchestration server, enrichment ring buffers, WebSocket streaming), [BAZ.Luna](baz-luna) (Vite browser notebook), [BAZ.CX](baz-cx) (Python exchange connector), and [BAZ architecture](baz-architecture) for the full platform overview.
- **Glither compiler**: [WASM/WIT compiler spec](glither-wasm-wit-compiler-spec) — the shared `roux`/`tangle` compiler substrate powering `glither.hft`, `glither.governance`, and `glither.mail` dialects. See also [glither governance](glither-governance) and the [mailguard example](glither-mailguard-example).
- `omniland/`: editor, UI, and content-oriented experiments.
- `tanstack-*`: framework starter and integration examples.
- `phpvm/`: PHP runtime exploration.
- `comet-trail/`: small visual interaction experiments.

## How to read this category

These pages are intentionally lighter than the product pages. The goal is to capture what each experiment seems to be for, so future work can either promote it into a product line or safely leave it as a spike.
