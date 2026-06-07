---
title: Dev Tooling
sidebar_position: 3
description: Cargo-based developer tooling bootstrap list.
---

# Dev Tooling

Path: `infra/dev-tooling`

`dev-tooling` is a small bootstrap utility centered on a `Makefile`.

## Scope

The Makefile installs or updates a curated list of Rust-based CLI tools such as:

- `eza`
- `bat`
- `ripgrep`
- `zoxide`
- `bottom`
- `yazi`
- and several others

It prefers `cargo-binstall`, with fallback to `cargo install`.

## Current role

This is workstation bootstrap infrastructure for developers working across the broader repo tree.
