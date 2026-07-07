---
title: KAGP Integration Backlog
description: Post-freeze integration backlog for the Konsonans AI Governance Platform after the 2 August 2026 compliance core.
---

# KAGP Integration Backlog

**Status:** compliance-core follow-on work
**Updated:** 7 July 2026
**Planning horizon:** Dec 2027 conformity track

This page tracks the integrations that sit outside the shipped **2 August 2026
compliance core** for KAGP / BAZ.AI-governance.

## Complete on 7 July 2026

| Priority | Integration | Status | Outcome |
| --- | --- | --- | --- |
| P0 | OIDC identity-provider handshake | Complete | MCP HTTP bearer tokens are verified per request against JWKS-discovered signing keys. |
| P0 | Prometheus metrics | Complete | `agent-proxy` exposes metrics for policy decisions, queue depth, expiries, syslog attempts, and upstream latency. |
| P1 | OpenTelemetry collector export | Complete | OTLP trace and metric export is available alongside structured JSON logs. |
| P1 | Message-queue bridge (NATS) | Complete | Audit events publish to a NATS subject without blocking the governance path. |
| P1 | Alertmanager / PagerDuty webhook | Complete | SLA expiry and replica-divergence alerts can POST JSON payloads to external routing systems. |

## Next planned slices

| Priority | Integration | Why it still matters |
| --- | --- | --- |
| P2 | Unix-socket agent ingress | Supports co-located agent runtimes without forcing a TCP hop. |
| P2 | TLS termination and SSE proxy reference | Documents the production edge pattern for remote agents and browser-facing surfaces. |
| P2 | Pharo-WASM bridge | Connects the Pharo orchestration environment directly to the Rust governance component boundary. |

## Recommended order

1. **Unix-socket ingress** to cover the local-host agent case cleanly.
2. **TLS termination reference** so production deployments have a reproducible
   edge pattern.
3. **Pharo-WASM bridge** as the exploratory integration once the transport and
   deployment boundaries are settled.

## Relationship to the readiness plan

The readiness plan at
[EU AI Act Readiness Plan](./eu-ai-act-compliance-plan.md) tracks what had to
ship for the conservative **2 August 2026** baseline. This page tracks the
post-freeze operational and platform integrations that continue after that core
is in place.
