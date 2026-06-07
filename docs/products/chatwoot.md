---
title: Chatwoot — Customer Support Platform
sidebar_position: 7
description: Self-hosted Chatwoot deployment for customer engagement and support at ragbaz.xyz.
---

# Chatwoot

Path: `chatwoot/`

A self-hosted deployment of [Chatwoot](https://www.chatwoot.com/), an open-source customer engagement and support platform (comparable to Intercom or Zendesk). Configured for the ragbaz.xyz domain.

## Stack

| Service | Role | Technology |
|---|---|---|
| `rails` | Chatwoot application server | Ruby on Rails |
| `sidekiq` | Background job processing | Ruby / Redis |
| `postgres` | Primary database | PostgreSQL 15 (with pgvector) |
| `redis` | Cache, queues, pub/sub | Redis 7 |

## Architecture

```
User (browser)
    │
    ▼
Chatwoot Rails App (ports 3000)
    │
    ├──► PostgreSQL (port 5432)
    ├──► Redis (port 6379)
    └──► Sidekiq (background workers)
```

## Configuration

The `.env` file contains comprehensive configuration for:

- **Secret management:** SECRET_KEY_BASE, encryption keys
- **Mail:** SMTP via local mailhog
- **Database:** PostgreSQL connection
- **Redis:** Connection and pool settings
- **Social channels:** Twitter, Facebook, WhatsApp (optional)
- **Integrations:** Stripe, OpenAI
- **Domain:** ragbaz.xyz hostname
- **Storage:** Active Storage with local disk

## Deployment

```bash
cd chatwoot
docker compose up -d
```

The stack is defined in `docker-compose.yaml` with health checks, volume mounts, and internal networking.

## Current Role

Operational deployment for customer communication and support. Likely used by the broader RAGBAZ studio and Articulate commerce platform for handling customer inquiries.

## Relationship to Workspace

Chatwoot is one of several operational infrastructure components alongside:
- `infra/traefik` — reverse proxy
- `infra/haproxy` — load balancing
- `products/articulate/mailstack` — transactional mail relay
- `products/articulate/universe` — storefront (which Chatwoot may support)
