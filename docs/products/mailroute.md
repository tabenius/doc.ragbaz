---
title: MailRoute / MailGuard — Email Security and Management
sidebar_position: 9
description: Email security policy engine powered by the Glither compiler. Rules authored in glither.mail DSL are compiled to Gleam, Rust, or WIT by the `tangle` compiler.
---

# MailRoute / MailGuard

Path: `products/mailroute/`

Email security and management tooling. The MailRoute project spans mail relay infrastructure and **MailGuard** — a policy engine whose rules are authored in the **Glither** DSL (`glither.mail` dialect) and compiled by the [`tangle` compiler](/experiments/glither-wasm-wit-compiler-spec).

## Glither-Powered MailGuard

MailGuard rulesets are written in the `glither.mail` dialect (flat-verdict, `fold first-match`) and compiled to three targets:

| Target | Output | Use Case |
|--------|--------|----------|
| **Gleam** | Typed, readable oracle | Audit, differential conformance verification |
| **Rust** | Struct + `dispose()` function | Production deployment; verified with `cargo check` |
| **WIT** | Component-model interface | Membrane contract / capability sandbox boundary |

The [`mailguard.glith`](/experiments/glither-mailguard-example) ruleset (6 rules — DMARC reject, spoof quarantine, executable quarantine, external tagging, newsletter routing, allowlisted delivery) compiles through the entire pipeline: parse, lower, infer crossing phases, check, and codegen. Rust output is verified via `cargo check` in the test suite.

### Compiler Pipeline

```
mailguard.glith
    │  tangle: pest parse → lower to typed IR
    ▼
Typed Core IR   ──►  IR snapshot (CBOR + JSON)
    │  derive
    ├──► WIT world  (package glither:mail)
    ├──► Gleam code (auditable oracle)
    └──► Rust code  (production, cargo check verified)
```

The compiler (51 tests, zero clippy warnings) supports 4 dialects: `glither.mail`, `glither.decision`, `glither.segment`, and `glither.articles`. Each dialect registers its artifact field roots for crossing-phase inference. Validation catches unsatisfiable guards, missing liveness deadlines, unlawful lowers, and dead rules in first-match cascades.

## Sub-Projects

### MailGuard — Email Security Gateway

Security-focused email processing with:
- **Attack surface review** — audited auth sessions, webhooks, realtime channels, subprocess surfaces, PII-in-logs, rate limiting, dependency exposure, attachment archive
- **Hardening** — SQLite scope, login throttle, HTTP headers, TLS verification, Cloudflare Worker replay protection
- **Glither compilation** — policy rules migrated from ad-hoc Python to the `glither.mail` DSL; compiled to Rust/Gleam/WIT with 51-pass test suite
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
| **Glither Compiler** | PEG grammar, typed core IR, crossing-phase inference, dead rule detection, 3 codegen targets (Gleam/Rust/WIT), CLI with check/snapshot/gleam/wit/rust commands, Rust compilation verification, 4 fixtures across 4 dialects, 51 tests, zero clippy warnings |
| **Security Review** | Attack surface analysis across auth, webhooks, realtime, subprocess, PII logging, rate limiting, dependency exposure, attachment archive |
| **Security Hardening** | SQLite bounds, login throttle, HTTP security headers, TLS verification, Cloudflare Worker replay protection |
| **Monetization Readiness** | Pricing tiers designed, Stripe checkout integration, onboarding wizard, landing page, analytics integration, MCP demonstration docs |
| **Repository Structure** | Five-phase repository restructure completed |
| **Self-Host Support** | Environment template, install script, Makefile, README, Docker Compose cleanup, Docker Hub publishing |

## Technology Stack

| Component | Technology |
|---|---|
| Policy DSL | Glither (`glither.mail` dialect) |
| Compiler | Rust (pest parser, typed IR, dual codegen) |
| Codegen Targets | Gleam (oracle), Rust (production), WIT (contract) |
| Email Bridge | Proton Bridge protocol |
| Payments | Stripe |
| Deployment | Docker Compose |
| Analytics | Self-hosted |

## Current Status

The Glither compiler spine is complete and production-ready for the `glither.mail` dialect. Most core MailRoute/MailGuard work is done (51+ completed tasks across compiler, security, hardening, monetization, restructuring, and self-host support). The main blocker is `mailguard-monetize-proton-community` (community monetization path for the Proton integration).

## Relationship to Workspace

MailRoute/MailGuard is the email security pillar of the RAGBAZ portfolio, complementing:
- **`products/articulate/mailstack/`** — transaction mail relay for the Articulate platform
- **`experiments/glither/`** — the Glither compiler that powers MailGuard's policy engine
- **`infra/infisical/`** — secrets management shared with MailGuard
- **`products/discord-bot/`** — alerting surface for security events
