---
title: EU AI Act Readiness Plan (KAGP)
description: Deadline-anchored compliance plan for the Konsonans AI Governance Platform / BAZ.AI-governance, targeting the 2 August 2026 EU AI Act high-risk applicability date.
---

# EU AI Act Readiness Plan — KAGP / BAZ.AI-governance

**Status:** active plan · **Authored:** 30 June 2026 · **Target date:** 2 August 2026
**Project:** [`experiments/BAZ.AI-governance`](./glither-governance.md) (Konsonans AI Governance Platform, "KAGP") · policy dialect [`glither.governance`](./glither-governance.md)

> This plan supersedes the relative-time "Pilot Implementation Plan" (§13 of the project SPEC),
> which is a 16-week build schedule that, started now, finishes ~mid-October — past the deadline.
> Here the work is re-anchored to the binding **2 August 2026** date and ruthlessly prioritised.

## 1. The deadline — what is actually binding

| Date | Obligation | Applies to us? |
|---|---|---|
| 2 Feb 2025 | Prohibited practices (Art 5); AI literacy (Art 4) | Yes — already in force |
| 2 Aug 2025 | GPAI model obligations; governance; penalties | Only if we ship a model (we do not) |
| **2 Aug 2026** | **High-risk systems: Art 9–17 (providers), Art 26 (deployers), Art 50 transparency** | **Working deadline** |
| 2 Aug 2027 | High-risk AI embedded in Annex I regulated products | Later |

**The Digital Omnibus caveat (important, do not bet on it).** The EU institutions reached a
*provisional political agreement* (7 May 2026) to **defer** high-risk obligations — standalone
Annex III systems to **2 December 2027**, Annex I-embedded systems to **2 August 2028**. Formal
adoption and publication in the Official Journal are expected **July 2026**. Until that is
published, **2 August 2026 remains the legally binding date.**

**Decision:** plan conservatively to **2 Aug 2026**. Treat any adopted deferral as *runway for the
deeper conformity track*, never as relief on the core. This is the only defensible posture 33 days
out with the amendment still un-adopted.

## 2. What "meeting the deadline" means for KAGP

KAGP has a **dual relationship** to the Act, and conflating them is the main risk to a clear plan:

1. **KAGP as a product is most likely *not* itself a high-risk Annex III AI system.** The
   `glither.governance` engine is deterministic, audited rule evaluation (`fold first-match`), not
   an autonomous ML model making high-risk decisions. KAGP's *own* direct duties are limited:
   Art 50 transparency (if it interacts with people), Art 4 AI literacy, and GPAI duties *only if it
   embedded a model* — which it does not. **Low own-obligation surface.**

2. **KAGP's purpose is to be the control plane through which *its users* discharge *their* high-risk
   obligations** — Art 9 (risk management), Art 10 (data governance), Art 11 (technical
   documentation), Art 12 (logging/traceability), Art 13 (transparency), Art 14 (human oversight),
   Art 26 (deployer duties), Art 72 (post-market monitoring).

**Therefore the deadline target is:** by 2 Aug 2026, KAGP's compliance-enabling **core is
production-ready and demonstrable**, with an **evidence pack**, so that a customer running a
high-risk AI system *behind* KAGP can show conformity for the articles KAGP covers.

## 3. The honest scope truth

Full high-risk **conformity assessment** (Art 43), notified-body engagement for Annex III, and
conformance to **harmonised standards** (Art 40) **cannot** be completed by 2 Aug 2026 — the
CEN-CENELEC harmonised standards are themselves delayed, which is a principal reason the Omnibus
defers the date. This is an industry-wide reality, not a KAGP shortfall.

So the deliverable for 2 Aug 2026 is a **"compliance core + evidence pack"**: the runtime-enforced,
auditable governance pipeline for Art 9 / 12 / 14 plus Art 11 technical-documentation export —
positioning KAGP as *AI-Act-ready tooling* — with the conformity-declaration / notified-body track
sequenced into the (likely Dec 2027) runway.

## 4. Gap analysis (article → capability → status → action by 2 Aug)

| Article | Required capability | KAGP component | Status (Jun 2026) | Action to deadline |
|---|---|---|---|---|
| Art 9 — risk management | risk-tiered policy enforcement | `glither.governance` dialect → WASM; `PolicyEngine` | dialect compiles (green in roux); engine prototype | wire engine to **live** events; confirm risk tiers (minimal/limited/high/unacceptable) |
| Art 10 — data governance | PII minimisation / scrubbing | `PIIMinimisationGuard` (POL-002) | rule exists in dialect | implement runtime argument scrubbing |
| Art 11 — technical documentation | exportable tech-doc / DoC | `ComplianceReport` (JSON+PDF) | spec only (MVP #11, P1) | **build `ComplianceReporter`**; map each control → evidence |
| Art 12 §1 — logging | append-only event store + hash chain | `schema.sql`, `governance-node` (356-line Rust prototype) | schema + node prototype | deploy; implement `verify-chain` |
| Art 12 §2 — retention ≥6 mo | durable WORM archive | PostgreSQL + S3 WORM | not built | configure WORM retention |
| Art 13 — transparency | queryable audit entries | WIT `query-entries` audit iface | iface defined | implement endpoint |
| Art 14 — human oversight | HITL approval w/ SLA | `HumanOversightGateway`; `hold … on approve … after SLA` rules | dialect rules done; Pharo UI spec only | **build approval path** (transport → queue → decision) |
| Art 14 §4 — safe default | timeout ⇒ deny | `after <SLA> into blocked` in every hold rule | encoded in policy | verify enforced at runtime, not just declared |
| Art 26 — deployer duties | oversight assignment, log keeping | KAGP deployment config | partial | document + ship default config |
| Art 47 / 43 — conformity declaration | DoC + submission | `ConformityReport` | blocked: EU AI Office API unpublished | ship **DoC template** + placeholder JSON export; track API |
| Art 72 — post-market monitoring | divergence / incident monitor | replica divergence monitor | spec only | minimal monitor + incident log |

**One-line status:** specified and partially prototyped (dialect green, governance-node + schema
exist), **not yet production-deployed end-to-end**. The gap is integration + the Art 11 evidence
exporter, not net-new architecture.

## 5. Date-anchored schedule (33 days)

Re-anchoring SPEC §13 to the deadline by taking only the **P0 compliance-critical slice** and
deferring the rest. Each sprint ends with a runtime-demonstrable capability + its evidence artefact.

- [ ] **Jun 30 – Jul 6 — Traceability core (Art 12, Art 9).** Deploy event store + SHA-256 hash
      chain + `verify-chain`; wire `glither.governance` policy gate to live agent events (pre-eval
      synchronous block). *Evidence: tamper-evident log + a replayable blocked decision.*
- [ ] **Jul 7 – Jul 13 — Human oversight (Art 14, 14§4, 10).** `HumanOversightGateway` + HITL
      approval path over one transport; SLA-timeout-⇒-deny enforced at runtime; PII guard runtime.
      *Evidence: a held action approved by a human and one auto-denied on SLA.*
- [ ] **Jul 14 – Jul 20 — Documentation & transparency (Art 11, 12§2, 13).** `ComplianceReporter`
      JSON+PDF; retention/WORM config; `query-entries` transparency endpoint. *Evidence: a generated
      technical-documentation pack.*
- [ ] **Jul 21 – Jul 27 — Monitoring & conformity scaffold (Art 72, 47).** Minimal post-market
      divergence/incident monitor; Declaration-of-Conformity template + placeholder conformity
      export. *Evidence: DoC draft + incident-log demo.*
- [ ] **Jul 28 – Aug 1 — Evidence pack & freeze.** Assemble the article-by-article evidence pack,
      gap sign-off, code freeze, publish the readiness statement.

**Deferred to the post-deadline track (the likely Dec 2027 runway):** full Pharo IDE polish,
WASM/OCI packaging of governance-node, multi-node replica fleet, notified-body engagement,
harmonised-standards conformance, EU AI Office API integration when published.

## 6. Open decisions (owners needed — none block the Aug-2 core)

1. **Notified body** — which EU notified body to engage for Annex III conformity (post-deadline).
2. **EU AI Office API** — conformity-submission format unpublished; placeholder export until then.
3. **`wasi:sql` stability** — fallback to `wasi:http` → PostgREST shim if not stable by Q3 2026.
4. **Key management** — HSM for replica manifest signing (`wasi:crypto` not standardised).

## 7. Success criteria for 2 Aug 2026

1. Runtime-enforced Art 9 / 12 / 14 pipeline with a tamper-evident audit trail.
2. An Art 11 technical-documentation pack generated from real events.
3. A published readiness statement + DoC template.
4. A written, dated post-deadline conformity roadmap (this document's §5 deferred list).

## Sources

- [EU AI Act — Implementation Timeline](https://artificialintelligenceact.eu/implementation-timeline/)
- [Latham & Watkins — AI Act Update: EU Resolves to Change Rules and Extend Deadlines](https://www.lw.com/en/insights/ai-act-update-eu-resolves-to-change-rules-and-extend-deadlines)
- [Gibson Dunn — EU AI Act Omnibus Agreement: Postponed High-Risk Deadlines](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/)
- [DLA Piper — The Digital AI Omnibus: Proposed deferral of high-risk obligations](https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act)
- [AI Act Service Desk (EC) — Implementation Timeline](https://ai-act-service-desk.ec.europa.eu/en/ai-act/timeline/timeline-implementation-eu-ai-act)
