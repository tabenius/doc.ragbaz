---
title: WP Sidecar
sidebar_position: 10
description: Rust-owned ingress with WordPress bounded behind a private php-fpm sidecar.
---

# WP Sidecar

Path: `products/articulate/wp-sidecar`

`wp-sidecar` is an architecture-forward project that keeps WordPress private behind `php-fpm` while Rust owns ingress and policy.

## Scope

The README and decisions document describe:

- a Rust gateway on Axum and Tokio,
- direct FastCGI handling,
- private `php-fpm` over Unix sockets,
- SQLite-backed WordPress,
- Rust-managed uploads outside the WordPress tree,
- and a future Unikraft or other hardened-edge path.

## Why it is interesting

It presents a cleaner "WordPress as bounded sidecar" model than many traditional WordPress hosting stacks. That makes it strategically important even though it appears earlier-stage than `gatekeeper`.

## Key docs

- `README.md`
- `docs/DECISIONS.md`
- `Cargo.toml`
