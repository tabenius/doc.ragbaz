---
title: MailRoute / MailGuard — Email Security and Management
sidebar_position: 9
description: Email security and management tooling with Proton Bridge integration, mail relay, and threat detection infrastructure.
---

# MailRoute / MailGuard

Path: `products/mailroute/`

Email security and management tooling. The MailRoute project spans mail relay infrastructure, Proton Bridge integration for secure email access, and MailGuard threat detection. It has undergone extensive security review, hardening, and monetization planning.

## Sub-Projects

### MailGuard — Email Security Gateway
Security-focused email processing with:
- **Attack surface review** — audited auth sessions, webhooks, realtime channels, subprocess surfaces, PII-in-logs, rate limiting, dependency exposure, attachment archive
- **Hardening** — SQLite scope, login throttle, HTTP headers, TLS verification, Cloudflare Worker replay protection
- **Monetization** — pricing tiers, Stripe checkout, onboarding wizard, landing page, analytics, MCP demo documentation

### Proton Bridge Integration
Integration with Proton Mail's bridge protocol for secure email access. Currently **blocked** on community-level monetization path.

### Infrastructure Components
- **Mail relay** — sending and receiving mail processing
- **Threat detection** — scanning and filtering pipelines
- **Archive** — encrypted attachment storage

## Key Completed Work

| Area | Completed Items |
|---|---|
| **Security Review** | Attack surface analysis across auth, webhooks, realtime, subprocess, PII logging, rate limiting, dependency exposure, attachment archive |
| **Security Hardening** | SQLite bounds, login throttle, HTTP security headers, TLS verification, Cloudflare Worker replay protection |
| **Monetization Readiness** | Pricing tiers designed, Stripe checkout integration, onboarding wizard, landing page, analytics integration, MCP demonstration docs |
| **Repository Structure** | Five-phase repository restructure completed |
| **Self-Host Support** | Environment template, install script, Makefile, README, Docker Compose cleanup, Docker Hub publishing |
| **Proton Community** | Documentation and demo infrastructure for community monetization path (currently blocked) |

## Technology Stack

| Component | Technology |
|---|---|
| Core | Python / TypeScript |
| Email Bridge | Proton Bridge protocol |
| Payments | Stripe |
| Deployment | Docker Compose |
| Analytics | Self-hosted |
| Documentation | MCP-based docs |

## Current Status

Most core work is complete (45+ completed tasks across security, hardening, monetization, restructuring, and self-host support). The main blocker is `mailguard-monetize-proton-community` (community monetization path for the Proton integration).

## Relationship to Workspace

MailRoute/MailGuard is the email security pillar of the RAGBAZ portfolio, complementing:
- **`products/articulate/mailstack/`** — transaction mail relay for the Articulate platform
- **`infra/infisical/`** — secrets management shared with MailGuard
- **`products/discord-bot/`** — alerting surface for security events
