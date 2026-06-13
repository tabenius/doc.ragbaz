---
title: Traefik Reverse Proxy
sidebar_position: 3
description: Traefik reverse proxy configuration for routing ragbaz.xyz and ragbaz.cc domains.
---

# Traefik Reverse Proxy

Path: `infra/traefik/`

Traefik reverse proxy configuration for routing RAGBAZ domains. Handles TLS termination, service routing, and middleware for all public-facing services.

## Configuration

```
infra/traefik/
├── .env                  — Environment variables
├── docker-compose.yml    — Traefik service definition
└── ...                   — Dynamic config, middleware, TLS
```

## Routes

Traefik routes traffic for:
- `ragbaz.xyz` — primary domain
- `*.ragbaz.xyz` — subdomain wildcard
- `ragbaz.cc` — secondary domain
- `*.ragbaz.cc` — subdomain wildcard (tenant sites)
- `secrets.ragbaz.cc` — Infisical secrets manager

## Services Behind Traefik

| Service | Domain | Backend |
|---|---|---|
| Primary site | `ragbaz.xyz` | Next.js storefront |
| Documentation | `doc.ragbaz.cc` | Docusaurus (via offer.ragbaz.xyz) |
| Offer | `offer.ragbaz.xyz` | Nginx redirect |
| Secrets | `secrets.ragbaz.cc` | Infisical |
| Tenant sites | `*.ragbaz.cc` | Gatekeeper / wp-sidecar |
| Registry | `registry.ragbaz.xyz` | Docker Registry 2 |

## Relationship to Workspace

Traefik is the primary reverse proxy for the RAGBAZ infrastructure, working alongside:
- **`infra/haproxy/`** — additional routing patches for specific services
- **`products/articulate/gatekeeper/`** — tenant WordPress ingress
- **`infra/infisical/`** — secrets manager hosted behind Traefik
- **`products/articulate/registry/`** — Docker registry
