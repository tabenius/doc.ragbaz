---
title: EU AI Act Readiness Plan (KAGP)
description: Deadline-anchored compliance state for the Konsonans AI Governance Platform / BAZ.AI-governance, targeting the 2 August 2026 EU AI Act high-risk applicability baseline.
---

# EU AI Act Readiness Plan — KAGP / BAZ.AI-governance

**Status:** compliance core complete and freeze-gated
**Updated:** 7 July 2026
**Working legal baseline:** 2 August 2026
**Project:** [BAZ.AI-governance](./glither-governance.md) · policy dialect
[glither.governance](./glither-governance.md)

This is an engineering readiness document, not legal advice or a conformity
assessment. KAGP's role, AI-system classification, and obligations still need a
deployment-specific legal and conformity review.

## 1. The deadline

| Date | Obligation | How KAGP treats it |
| --- | --- | --- |
| 2 Feb 2025 | Prohibited practices, definitions, AI literacy | Already in force |
| 2 Aug 2025 | Governance and GPAI-model obligations | Relevant only if KAGP ships a model |
| **2 Aug 2026** | **Current AI Act baseline for high-risk obligations** | **Binding engineering target** |
| 2 Dec 2027 | Stand-alone high-risk AI systems, if the Digital Omnibus amendment enters into force | Runway, not current legal relief |
| 2 Aug 2028 | High-risk AI systems embedded in regulated products, if the amendment enters into force | Runway, not current legal relief |

The legal posture remains conservative. The European Parliament approved the
Digital Omnibus AI amendment on **16 June 2026**, including delayed application
dates, but Parliament's press release says the text **still requires formal
Council adoption before it enters into force**. Until that happens, KAGP plans
to the current AI Act baseline of **2 August 2026**.

## 2. What "meeting the deadline" means

KAGP is aimed at the runtime articles that matter for governing AI agents:

- **Art 9** risk management through a typed policy gate
- **Art 10** data-governance controls through runtime PII scrubbing
- **Art 11** technical documentation through generated evidence exports
- **Art 12** traceability through an append-only audit chain and retention
- **Art 13** transparency through queryable audit entries
- **Art 14** human oversight through hold, review, and timeout-deny paths
- **Art 47** declaration support through a freeze-gated Annex V template
- **Art 72** post-market monitoring through replica divergence detection

The 2 August 2026 deliverable is therefore a **runtime-enforced compliance core
plus evidence pack**, not a claim that every deployment-specific conformity
assessment has been completed.

## 3. Completed path to the deadline

- [x] **Jun 30 - Jul 6 — Traceability core (Art 12, 9):** event store +
      SHA-256 hash chain + `verify-chain`; `glither.governance` gate wired to
      live events.
  - [x] PostgreSQL mutation-rejection triggers and canonical
        `kagp-audit-v1` hashing.
  - [x] Synchronous pre-evaluation: only allowed calls reach the upstream MCP
        process; hold, deny, missing audit evidence, and missing upstream
        configuration fail closed.
- [x] **Jul 7 - Jul 13 — Human oversight (Art 14, 14(4), 10):** authenticated
      review queue, SLA-timeout deny, and PII guard.
  - [x] Reviewer identity and rationale recorded before execution.
  - [x] Expired holds are atomically denied and audit-recorded.
  - [x] Email and payment-card data are scrubbed from durable audit copies.
- [x] **Jul 14 - Jul 20 — Documentation, retention, transparency
      (Art 11, 12(2), 13):** technical-documentation export, retention/WORM,
      and queryable audit entries.
  - [x] JSON and Markdown evidence exports map controls to real events and
        hashes.
  - [x] Daily deterministic event segments and manifests upload to Object Lock
        storage with verification.
  - [x] Bounded, filterable audit-entry pages reject invalid ranges, cursors,
        and page sizes.
- [x] **Jul 21 - Jul 27 — Monitoring and conformity scaffold (Art 72, 47):**
      divergence monitor and Declaration-of-Conformity scaffold.
  - [x] Replica manifests are compared for signature, validity, count, base,
        and head divergence.
  - [x] Annex V declaration template exports and enumerates required fields.
- [x] **Jul 28 - Aug 1 — Evidence pack and freeze:** final bundle assembly,
      gap sign-off, readiness statement, and manifest sealing.
  - [x] `compliance-reporter --freeze <dir>` assembles the JSON report,
        Markdown report, Declaration of Conformity, gap sign-off sheet,
        readiness statement, and SHA-256 manifest.
  - [x] The freeze gate refuses to claim readiness unless all controls are
        complete and required declaration fields are supplied.

## 4. Current compliance state (7 July 2026)

**Controls:** 17/17 complete
**Declaration of Conformity:** template complete; operator-supplied entity,
signatory, place-of-issue, and standards fields are required at freeze time
before a Ready verdict can be emitted.
**Evidence freeze:** produces a Ready verdict only when all controls are
complete and the declaration contains no placeholders.
**Verification:** crate test suites pass for `agent-proxy`,
`compliance-reporter`, and `replica-node`, including the SoftHSM2 PKCS#11
integration test.

## 5. Shipped hardening after the core freeze

- **PKCS#11 / HSM signing backend** in `replica-node`:
  `cryptoki`-backed Ed25519 signing validated end to end against SoftHSM2.
- **Email HITL channel** in `agent-proxy`:
  SMTP approval requests complement the existing Discord webhook path.
- **Per-request OIDC JWT verification** in `agent-proxy`:
  JWKS-backed bearer-token verification extracts subject and roles for every
  MCP HTTP request.
- **Observability and operations stack** in `agent-proxy`:
  Prometheus metrics, JSON logs, conditional OTLP export, NATS audit fan-out,
  and SLA/divergence alert webhooks are implemented.

The remaining post-freeze integrations are tracked separately in the
[KAGP Integration Backlog](./kagp-integration-plan.md).

## 6. Deferred to the post-deadline track

- full Pharo IDE polish
- WASM/OCI packaging and deployment ergonomics
- wider replica-fleet operations
- notified-body and harmonised-standards work
- EU AI Office integration details
- deployment-specific provider/deployer classification work

## 7. Open decisions

These items do not block the shipped compliance core, but they do matter for
the deeper conformity track:

1. Classification owner for each intended-purpose and value-chain role review.
2. Conformity route and declaration process per deployment.
3. Long-term HSM key-management model.
4. `wasi:sql` versus HTTP/PostgREST boundary for longer-term component hosting.

See the [AI Governance (KAGP) product page](../products/ai-governance.md) for the live component status table and technology overview.

## Sources

- [Regulation (EU) 2024/1689 - official text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj)
- [European Parliament - AI Act: EP approves simplification measures and "nudifier" app ban, 16 June 2026](https://www.europarl.europa.eu/news/en/press-room/20260611IPR45207/ai-act-ep-approves-simplification-measures-and-nudifier-app-ban)
- [Council of the EU - Council and Parliament agree to simplify and streamline rules, 7 May 2026](https://www.consilium.europa.eu/en/press/press-releases/2026/05/07/artificial-intelligence-council-and-parliament-agree-to-simplify-and-streamline-rules/)
- [European Commission FAQ - Navigating the AI Act](https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act)
