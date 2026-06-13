---
title: Universe
sidebar_position: 3
description: Multi-repo workspace for the active Articulate storefront and related services.
---

# Universe

Path: `products/articulate/universe`

`universe` is a workspace, not a single app. Its root README describes it as the central codebase map for the Articulate ecosystem.

## Scope

The workspace ties together:

- an active **Next.js storefront and admin** in `storefront/`,
- Cloudflare Worker services,
- WordPress GraphQL content,
- Stripe payments,
- Cloudflare KV and object storage,
- and older compatibility or migration repos.

## Main contained codebases

- `storefront/`: current storefront and admin control plane.
- `wp-cf-front-oss/`: open-source mirror of the storefront stack.
- `ragbaz.xyz/`: Cloudflare Worker service for plugin handshake, previews, and telemetry.
- `multitenant-wp-mcp-docker-legacy/`: older Dockerized platform kept for compatibility work.
- `wp-proxy/`, `wp-from-backup/`, `wp-cf-front/`: support, migration, or reference repos.

## Current role

This is the strongest direct product asset in the repository because it already combines content, payments, storage, admin tooling, and deployment into one buyer-facing system.

## Signals from the codebase

- `storefront/package.json` shows Next.js 16, Cloudflare builds, Stripe, workspace packages, and tests.
- The workspace README documents typed image derivations, admin panels, and shared documentation protocol.
- `AGENTS.md` files in the workspace emphasize admin UX, translations, Cloudflare KV, GraphQL auth, and operational diagnostics.

## Documentation sources

- `products/articulate/universe/README.md`
- `products/articulate/universe/storefront/README.md`
- `products/articulate/universe/AGENTS.md`
- `products/articulate/universe/storefront/AGENTS.md`
