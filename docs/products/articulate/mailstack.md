---
title: Mailstack
sidebar_position: 5
description: Mail relay and host automation lane for the Articulate family.
---

# Mailstack

Path: `products/articulate/mailstack`

`mailstack` is a mixed Rust, TypeScript, Python, and shell project for mail relay and host setup.

## Scope

Based on the plan and file layout, it covers:

- a Rust CLI mail relay binary,
- a Cloudflare Worker mail relay surface,
- Python configuration and operations helpers,
- Postfix, Dovecot, and OpenDKIM setup logic,
- syslog-ng forwarding and service units,
- and deployment scripts for the `fillmeup` host.

## Key directories

- `cli/`: Rust mail relay executable.
- `cfworker/`: Cloudflare Worker relay package.
- `scripts/`: operational install and maintenance scripts.
- `systemd/` and `syslog-ng/`: host runtime integration.
- `tests/`: Python tests for config and operations helpers.

## Current role

This looks most valuable as the default mail path for the broader Articulate platform rather than as a standalone mail product competing with mature providers.

## Documentation sources

- `PLAN.md`
- `ROOTLESS.md`
- `cli/Cargo.toml`
- `cfworker/package.json`
