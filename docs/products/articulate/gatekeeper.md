---
title: Gatekeeper
sidebar_position: 4
description: Rust ingress and hardening layer for WordPress.
---

# Gatekeeper

Path: `products/articulate/gatekeeper`

`gatekeeper` is a specialized WordPress runtime wrapper: a small Rust edge service in front of a private WordPress installation.

## Scope

The repository includes:

- a Rust Axum gateway,
- WordPress bootstrap and SQLite integration helpers,
- hardened PHP runtime settings,
- GraphQL safety limits,
- observability and metrics,
- reverse proxy samples,
- incident-response and audit tooling,
- and deployment units for systemd and Docker Compose.

## Why it matters

This is not generic infrastructure. It is a productizable security and runtime layer for teams that want WordPress features without exposing a stock WordPress deployment directly to the public internet.

## Key directories

- `src-rust/`: gateway service.
- `www/wp-content/mu-plugins/`: WordPress policy and runtime helpers.
- `deploy/`: reverse proxy, systemd, and observability examples.
- `scripts/`: hardening, incident, and certificate automation.
- `docker/`: hardened runtime config.

## Current interpretation

`gatekeeper` is one half of the strongest Articulate infrastructure wedge. The other half is `wp-sidecar`, which explores a related but even more Rust-owned architecture.
