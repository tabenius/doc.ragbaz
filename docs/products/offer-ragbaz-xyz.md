---
title: offer.ragbaz.xyz — Landing Page Deployment
sidebar_position: 10
description: Deployment bundle for the RAGBAZ offer landing page and documentation atlas at offer.ragbaz.xyz.
---

# offer.ragbaz.xyz

Path: `offer.ragbaz.xyz/`

A deployment bundle that builds the Docusaurus atlas from `doc.ragbaz.xyz` and serves it as a static site behind HAProxy at `offer.ragbaz.xyz`. Currently redirects all traffic to `https://doc.ragbaz.xyz`.

## Architecture

```
doc.ragbaz.xyz (Docusaurus source)
    │
    ▼
make build    — builds Docusaurus → static HTML
    │
    ▼
Docker image  — nginx:1.29-alpine with static site
    │
    ▼
make deploy   — replaces running container
    │
    ▼
HAProxy       — routes offer.ragbaz.xyz → 127.0.0.1:8889
```

## Components

### Build (`Makefile`)
```bash
make build    # exports Docusaurus site, builds Docker image
make deploy   # replaces running container, restarts systemd unit
```

### Docker (`Dockerfile`)
- Base: `nginx:1.29-alpine`
- Static site served from `/usr/share/nginx/html`
- Health check at `/healthz`
- All other traffic 301-redirects to `https://doc.ragbaz.xyz`

### Nginx (`nginx.conf`)
- `/healthz` — returns 200 OK
- catch-all — 301 redirect to `https://doc.ragbaz.xyz`

### HAProxy (`haproxy/offer-ragbaz-xyz.cfg`)
- Routes `offer.ragbaz.xyz` to the nginx container on `127.0.0.1:8889`
- Part of the broader `infra/haproxy` configuration

### Systemd (`systemd/offer-ragbaz-xyz.service`)
- User-systemd unit for boot-time startup
- Ensures the container restarts with the host

## Deployment

```bash
# On the host (konsonans):
cd /data/src/offer.ragbaz.xyz
make build
make deploy

# Verify
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8889/healthz
```

## Current Status

Operational. Currently serves as a redirect facade to `doc.ragbaz.xyz`. The infrastructure is ready for the actual offer/pitch content when needed.

## Relationship to Workspace

The deployment pipeline for the public RAGBAZ documentation surface:
- **`doc.ragbaz.xyz/`** — content source (Docusaurus)
- **`infra/haproxy/`** — upstream routing
- **`ragbaz-design-system/`** — visual styling for all surfaces
