---
title: HAProxy Configuration
sidebar_position: 4
description: HAProxy configuration patches for routing RAGBAZ domains and services.
---

# HAProxy Configuration

Path: `infra/haproxy/`

HAProxy configuration for routing `ragbaz.cc` and `ragbaz.cc` domains. Provides TLS termination, domain routing, and backend load balancing for services in the RAGBAZ infrastructure.

## Configuration

```
infra/haproxy/
└── ragbaz-xyz-patch.cfg    — HAProxy routing patch for ragbaz.cc domains
```

## Routes Managed

| Domain | Backend | Target |
|---|---|---|
| `ragbaz.cc` | `secure_wp_backend` | `127.0.0.1:8080` (gatekeeper) |
| `*.ragbaz.cc` | Various | Service-specific backends |
| `ragbaz.cc` | `secure_wp_backend` | `127.0.0.1:8080` |
| `*.ragbaz.cc` | Per-tenant | Gatekeeper / wp-sidecar |

## Features

- TLS 1.3 termination
- Domain-based virtual hosting
- Backend health checking
- Access logging
- Rate limiting configuration

## Relationship to Workspace

HAProxy operates alongside Traefik as the infrastructure routing layer:
- **`infra/traefik/`** — primary reverse proxy for most services
- **`products/articulate/gatekeeper/`** — the primary backend for `secure_wp_backend`
- **`products/articulate/universe/`** — storefront backend
