---
title: "Scenario: Secure WordPress"
sidebar_position: 3
description: Premium hardened WordPress runtime (gatekeeper) for *.ragbaz.cc clients.
---

# Scenario B — Secure WordPress runtime

The premium tier: a client site on `*.ragbaz.cc` served through **gatekeeper**, a
hardened Rust ingress in front of a headless WordPress runtime. WordPress stays
the editorial CMS; the Rust gateway owns ingress, auth, GraphQL limits, and
client-cert admin gating.

## Stack (`products/articulate/gatekeeper/docker-compose.yml`)

| Service | Role | Port | Notes |
|---|---|---|---|
| `wordpress` | php-fpm WordPress (SQLite + `router.php`) | `:9000` | exposes GraphQL + `wp-json/ragbaz-auth` |
| `gateway` | `rust-gateway` ingress | `127.0.0.1:8080` | upstream `wordpress:9000`, enforces auth + GraphQL depth/complexity caps |
| `storefront` | Next.js storefront | `127.0.0.1:3000` | renders against WordPress GraphQL (see [Scenario C](./scenario-headless-commerce.md)) |
| `haproxy` (test) | local TLS reverse proxy | `127.0.0.1:8443` | dev only; prod uses the host HAProxy |
| `litestream` | SQLite replication (backup profile) | — | replicates `./database` to `REPLICA_IP` |

Data lives in `./database` (SQLite) and `./www`; litestream streams the DB to a
replica for durability.

## Routing

On konsonans, HAProxy already routes `ragbaz.cc` + `*.ragbaz.cc` →
`secure_wp_backend` → `127.0.0.1:8080`. Bringing the stack up on that port makes
the secure tier live.

## Deploy

```bash
cd products/articulate/gatekeeper
cp .env.compose.example .env          # then set GATEKEEPER_SHARED_SECRET
# the only required secret is GATEKEEPER_SHARED_SECRET; the rest have defaults
docker compose up -d --build          # wordpress + gateway + storefront

# verify
curl -s http://127.0.0.1:8080/healthz                 # gateway health
curl -s http://127.0.0.1:9000/graphql -X POST \
  -H 'content-type: application/json' \
  -d '{"query":"{ generalSettings { title } }"}'      # WP GraphQL via runtime
```

## Hardening levers (env)

- `RAGBAZ_GRAPHQL_MAX_DEPTH` (7), `RAGBAZ_GRAPHQL_MAX_COMPLEXITY` (200),
  `RAGBAZ_GRAPHQL_MAX_PAGE_SIZE` (50), `RAGBAZ_GRAPHQL_PUBLIC_INTROSPECTION` (0).
- `RAGBAZ_CLIENT_CERT_*` — mTLS-gated `/wp-admin` access.
- `RAGBAZ_ADMIN_ALLOWLIST`, `RAGBAZ_AUTH_AUDIT_RETENTION_DAYS` (90).
- `RAGBAZ_WPPROBE_ENABLED` — periodic vulnerability probing of the WP target.

## Outbound mail

`HEADLESS_WP_FROM_*` / `RETURN_PATH` route WordPress mail through the shared
[mail stack](../../infra/topology.md); outbound is DKIM-signed.
