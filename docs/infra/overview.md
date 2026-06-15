---
title: Infrastructure Overview
sidebar_position: 1
description: Operational tooling and deployment helpers under /data/src/infra.
---

# Infrastructure Overview

The `infra/` tree contains support tooling rather than end-user products.

## Components

| Directory | Purpose | Technologies |
|---|---|---|
| **Traefik** | Primary reverse proxy for ragbaz.cc and ragbaz.cc domains | Traefik, Docker, Let's Encrypt |
| **HAProxy** | Routing patch for secure WordPress backend and domain routing | HAProxy |
| **Infisical** | Self-hosted secrets management at secrets.ragbaz.cc | Infisical, PostgreSQL, Redis, Docker Compose |
| **Traefik + Strapi** | Traefik + Strapi CMS setup | Docker, Traefik, Strapi |
| **pub-pipe** | Quarto-based publishing pipeline with containerized rendering | Quarto, Docker, LaTeX |
| **debian-updater** | Debian system update automation | Shell, systemd |
| **dev-tooling** | Workstation bootstrap (Rust CLI tools: eza, bat, ripgrep, zoxide, bottom, yazi) | Makefile, cargo-binstall |
| **migrate** | Server migration tooling (Python migration script, ISO, setup) | Python, ISO |

## Main themes

- **Routing and serving** — Traefik and HAProxy handle TLS termination, domain routing, and load balancing for all public services
- **Secrets and configuration** — Infisical provides centralized encrypted secrets management
- **Publishing** — pub-pipe renders Quarto documents to HTML/PDF via Docker
- **Host operations** — debian-updater, dev-tooling, and migrate handle OS maintenance, developer setup, and server migration
- **CMS hosting** — Traefik + Strapi for content management infrastructure

These directories are important because they reveal how the rest of the workspace is expected to be installed, moved, or published.
