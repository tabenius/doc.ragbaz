---
title: EU AI Act Readiness Plan (KAGP)
description: Deadline-anchored compliance plan for the Konsonans AI Governance Platform / BAZ.AI-governance, targeting the 2 August 2026 EU AI Act high-risk applicability date.
---

# EU AI Act Readiness Plan — KAGP / BAZ.AI-governance

**Status:** active plan · **Authored:** 30 June 2026 · **Target date:** 2 August 2026
**Project:** [`experiments/BAZ.AI-governance`](./glither-governance.md) (Konsonans AI Governance Platform, "KAGP") · policy dialect [`glither.governance`](./glither-governance.md)

This is an engineering readiness plan, not legal advice or a conformity
assessment. KAGP's role, AI-system classification, and obligations must be
confirmed for each deployment with qualified legal and conformity specialists.

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

**The Digital Omnibus caveat (important, do not bet on it).** Council and
Parliament negotiators reached a provisional agreement on 7 May 2026. Parliament
approved the agreed text on 16 June 2026, including delayed application dates of
**2 December 2027** for stand-alone high-risk systems and **2 August 2028** for
high-risk systems embedded in products. Formal Council adoption and entry into
force remain pending as of 30 June 2026. Until the amendment enters into force,
the current AI Act timetable remains the legal baseline.

**Decision:** plan conservatively to **2 Aug 2026**. Treat any adopted deferral as *runway for the
deeper conformity track*, never as relief on the core. This is the only defensible posture 33 days
out with the amendment still un-adopted.

## 2. What "meeting the deadline" means for KAGP

KAGP has a **dual relationship** to the Act, and conflating them is the main risk to a clear plan:

1. **Working engineering hypothesis: KAGP's deterministic policy engine may sit
   outside high-risk Annex III classification when used only as governance
   middleware.** That conclusion does not follow from determinism alone. It
   depends on whether the deployed product meets the AI-system definition, its
   intended purpose, its value-chain role, and the use case it controls.

2. **KAGP's purpose is to be the control plane through which *its users* discharge *their* high-risk
   obligations** — Art 9 (risk management), Art 10 (data governance), Art 11 (technical
   documentation), Art 12 (logging/traceability), Art 13 (transparency), Art 14 (human oversight),
   Art 26 (deployer duties), Art 72 (post-market monitoring).

**Therefore the deadline target is:** by 2 Aug 2026, KAGP's compliance-enabling **core is
production-ready and demonstrable**, with an **evidence pack**, so that a customer running a
high-risk AI system *behind* KAGP can show conformity for the articles KAGP covers.

## 3. The honest scope truth

A high-risk **conformity assessment** (Art 43), any applicable third-party
assessment, and conformance strategy under **harmonised standards** (Art 40)
cannot be scoped until KAGP's role and each deployment use case are classified.
Delayed standards are one reason for the amended timetable, but they do not
remove the need for a deployment-specific assessment.

So the deliverable for 2 Aug 2026 is a **"compliance core + evidence pack"**: the runtime-enforced,
auditable governance pipeline for Art 9 / 12 / 14 plus Art 11 technical-documentation export —
positioning KAGP as *AI-Act-ready tooling* — with deployment-specific classification
and conformity work sequenced into the proposed Dec 2027 runway.

## 4. Gap analysis (article → capability → status → action by 2 Aug)

| Article | Required capability | KAGP component | Status (Jun 2026) | Action to deadline |
|---|---|---|---|---|
| Art 9 — risk management | risk-tiered policy enforcement | `glither.governance` dialect → WASM; `PolicyEngine` | dialect compiles (green in roux); engine prototype | wire engine to **live** events; confirm risk tiers (minimal/limited/high/unacceptable) |
| Art 10 — data governance | PII minimisation / scrubbing | `PIIMinimisationGuard` (POL-002) | rule exists in dialect | implement runtime argument scrubbing |
| Art 11 — technical documentation | exportable tech-doc / DoC | `ComplianceReport` (JSON+PDF) | spec only (MVP #11, P1) | **build `ComplianceReporter`**; map each control → evidence |
| Art 12 §1 — logging | append-only event store + hash chain | `schema.sql`, `governance-node` (356-line Rust prototype) | schema + node prototype | deploy; implement `verify-chain` |
| Art 26(6) — deployer log retention floor | deployer-controlled retention for at least six months when logs are under deployer control, unless other law provides otherwise | PostgreSQL + object-lock archive | not built | define role-aware retention and legal hold policy |
| Art 13 — transparency | queryable audit entries | WIT `query-entries` audit iface | iface defined | implement endpoint |
| Art 14 — human oversight | HITL approval w/ SLA | `HumanOversightGateway`; `hold … on approve … after SLA` rules | dialect rules done; Pharo UI spec only | **build approval path** (transport → queue → decision) |
| Art 14 §4 — safe default | timeout ⇒ deny | `after <SLA> into blocked` in every hold rule | encoded in policy | verify enforced at runtime, not just declared |
| Art 26 — deployer duties | oversight assignment, log keeping | KAGP deployment config | partial | document + ship default config |
| Art 47 / 43 — declaration and conformity route | role-appropriate declaration and assessment evidence | `ConformityReport` | unclassified | ship a draft evidence template; obtain deployment-specific legal/conformity review |
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
- [ ] **Jul 14 – Jul 20 — Documentation & transparency (Art 11, 13, 26(6)).** `ComplianceReporter`
      JSON+PDF; retention/WORM config; `query-entries` transparency endpoint. *Evidence: a generated
      technical-documentation pack.*
- [ ] **Jul 21 – Jul 27 — Monitoring & conformity scaffold (Art 72, 47).** Minimal post-market
      divergence/incident monitor; Declaration-of-Conformity template + placeholder conformity
      export. *Evidence: DoC draft + incident-log demo.*
- [ ] **Jul 28 – Aug 1 — Evidence pack & freeze.** Assemble the article-by-article evidence pack,
      gap sign-off, code freeze, publish the readiness statement.

**Deferred to the post-deadline track (the proposed Dec 2027 runway):** full
Pharo IDE polish, WASM/OCI packaging of governance-node, multi-node replica
fleet, role-specific conformity work, and harmonised-standards conformance.

## 6. Open decisions (owners needed — none block the Aug-2 core)

1. **Classification owner** — assign qualified legal/conformity ownership for
   each intended-purpose and value-chain role assessment.
2. **Conformity route** — determine provider/deployer role, applicable assessment
   route, declaration form, registration, and competent authority per use case.
3. **`wasi:sql` stability** — fallback to `wasi:http` → PostgREST shim if not stable by Q3 2026.
4. **Key management** — HSM for replica manifest signing (`wasi:crypto` not standardised).

## 7. Success criteria for 2 Aug 2026

1. Runtime-enforced Art 9 / 12 / 14 pipeline with a tamper-evident audit trail.
2. An Art 11 technical-documentation pack generated from real events.
3. A published readiness statement + DoC template.
4. A written, dated post-deadline conformity roadmap (this document's §5 deferred list).

## Sources

- [Regulation (EU) 2024/1689 — official text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj)
- [European Parliament — approval of Digital Omnibus AI amendments, 16 June 2026](https://www.europarl.europa.eu/news/en/press-room/20260611IPR45207/ai-act-ep-approves-simplification-measures-and-nudifier-app-ban)
- [Council of the EU — provisional agreement, 7 May 2026](https://www.consilium.europa.eu/en/press/press-releases/2026/05/07/artificial-intelligence-council-and-parliament-agree-to-simplify-and-streamline-rules/)
- [European Commission — navigating the AI Act](https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act)
