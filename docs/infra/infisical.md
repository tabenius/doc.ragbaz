---
title: Infisical — Self-Hosted Secrets Manager
sidebar_position: 5
description: Self-hosted Infisical secrets management platform at secrets.ragbaz.cc.
---

# Infisical — Secrets Manager

Path: `infra/infisical/`

A self-hosted [Infisical](https://infisical.com/) secrets management platform deployed at `secrets.ragbaz.cc`. Provides centralized secrets storage, access control, and audit logging for all RAGBAZ infrastructure and products.

## Architecture

```
infra/infisical/
├── docker-compose.yml    — Infisical service stack
├── .env                  — Configuration
├── nginx/                — Frontend proxy config
└── data/                 — Persistent data (gitignored)
```

Behind Traefik at `secrets.ragbaz.cc` with:
- PostgreSQL for persistent storage
- Redis for caching/sessions
- Traefik for TLS termination

## Features

- **Secrets storage** — encrypted key-value storage for API keys, tokens, credentials
- **Access control** — role-based access for teams and services
- **Audit logging** — all secret access and modification logged
- **API access** — programmatic access for CI/CD and services
- **Integration** — CLI tool, REST API, SDK support

## Integration with Workspace

Infisical is a shared secrets backend used by:
- **`products/articulate/gatekeeper/`** — WordPress secrets and shared secrets
- **`products/articulate/ragbaz-provision/`** — tenant secrets (optional: file-based by default, Infisical integration available)
- **`products/mailroute/`** — MailGuard secrets
- **`products/discord-bot/`** — bot tokens and API keys
- **`products/articulate/universe/`** — storefront secrets (Cloudflare API keys, Stripe keys)
- **`products/articulate/mailstack/`** — mail relay credentials

## Deployment

```bash
cd infra/infisical
docker compose up -d
```

Accessible at `https://secrets.ragbaz.cc` behind Traefik.

## Current Status

Operational. Self-hosted instance of Infisical providing centralized secrets management for the workspace.
