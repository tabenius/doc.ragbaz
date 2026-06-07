---
title: DetCordon
sidebar_position: 11
description: Containment-first malware observation environment.
---

# DetCordon

Path: `products/detcordon`

`DetCordon` is a security product track focused on observing hostile web malware in a contained environment rather than blocking it inline.

## Scope

The project is a Rust workspace with crates for:

- detection-only HTTP tapping,
- sample extraction from the sandbox,
- sink-side event and sample reception,
- integrity guarding on the sink host,
- and a TUI that generates the deployment artifacts and hardening config.

## Security model

The project documentation is explicit that:

- the victim host is isolated,
- the sink host is separate,
- events and samples have distinct transport paths,
- and containment rules are non-negotiable.

## Current interpretation

This is the strongest standalone non-Articulate product candidate in `/data/src` because it has a differentiated technical position and a clear operator workflow target.

## Documentation sources

- `AGENTS.md`
- workspace `Cargo.toml`
