---
sidebar_label: AI Governance (EU AI Act)
description: Konsonans AI Governance Platform (KAGP) — a policy-as-code control plane that governs AI agents for EU AI Act compliance. Full breakdown with what, why, how, technologies, implementation choices, and per-component status.
---

# AI Governance Platform (KAGP)

**Konsonans AI Governance Platform** is a policy-as-code control plane that
governs AI agents for **EU AI Act** compliance. Every agent action passes a
typed policy gate, lands in a tamper-evident audit chain, and can be held for
human approval.

Repo: [`tabenius/BAZ.AI-Governance`](https://github.com/tabenius/BAZ.AI-Governance)
· policy dialect:
[`glither.governance`](../experiments/glither-governance.md) · readiness plan:
[EU AI Act Readiness Plan](../experiments/eu-ai-act-compliance-plan.md) ·
post-freeze backlog:
[KAGP Integration Backlog](../experiments/kagp-integration-plan.md)

## Status legend

Each component below is tagged with its current state:

| Symbol | Meaning |
|---|---|
| 🟢 | **complete** — implemented, tested, on `main` |
| ⚪ | **planned** — designed, not yet started |

---

## What

KAGP sits between AI agents and the tools/actions they invoke, and enforces governance on every
call. It turns a high-level **policy** (the `glither.governance` dialect) into a runtime gate, records
an immutable audit trail, and brings a human into the loop when the policy says so. The deliverable
for the EU AI Act deadline is a runtime-enforced **"compliance core + evidence pack"** — not a
checklist, but a working control plane a deployer can point at to demonstrate conformity.

The decision flow:

```
agent → mcp-ingress → policy-gate → audit-chain → human-oversight → replica-signer
```

## Current core state (7 July 2026)

- **17/17 deadline controls complete.**
- **Evidence freeze is shipped** and assembles the JSON report, Markdown
  report, Declaration of Conformity, gap sign-off sheet, readiness statement,
  and SHA-256 manifest into one bundle.
- **Declaration export is complete but operator-supplied.** Provider,
  signatory, place-of-issue, and standards fields are supplied at freeze time;
  the gate refuses to issue a Ready verdict with placeholders.
- **Legal posture remains conservative.** Parliament approved the AI Act
  simplification amendment on 16 June 2026, but Parliament's own press release
  says formal Council adoption is still pending, so KAGP continues to plan to
  the current 2 August 2026 baseline.

## Why

The **EU AI Act** makes high-risk AI obligations binding from **2 August 2026** (Art 9–17 providers,
Art 26 deployers) — unless the *Digital Omnibus* deferral (proposed: Annex III → 2 Dec 2027) enters
into force first. KAGP plans conservatively to **2 Aug 2026** and treats any deferral as runway. Its
job is to be the control plane through which deployers discharge the articles that matter at runtime:

- **[Art 9](https://artificialintelligenceact.eu/article/9/)** — risk management (risk-tiered policy enforcement)
- **[Art 10](https://artificialintelligenceact.eu/article/10/)** — data governance (PII minimisation)
- **[Art 11](https://artificialintelligenceact.eu/article/11/)** — technical documentation (exportable evidence)
- **[Art 12](https://artificialintelligenceact.eu/article/12/)** — logging & traceability (tamper-evident audit chain, ≥6-month retention)
- **[Art 13](https://artificialintelligenceact.eu/article/13/)** — transparency (queryable audit)
- **[Art 14](https://artificialintelligenceact.eu/article/14/)** — human oversight (hold-for-approval, safe-default timeouts)
- **[Art 47](https://artificialintelligenceact.eu/article/47/)** — declaration of conformity (Annex V template, freeze-gated until signed)
- **[Art 72](https://artificialintelligenceact.eu/article/72/)** — post-market monitoring

See the [EU AI Act Readiness Plan](../experiments/eu-ai-act-compliance-plan.md) for the deadline
analysis and gap table.

## How — components & status

| Component | Status | What it does | Article |
|---|---|---|---|
| `glither.governance` dialect | 🟢 complete | Risk-tiered policy (`fold first-match`), HITL lifecycle (hold/approve/after), compiled to a WASM component. | [Art 9](https://artificialintelligenceact.eu/article/9/) / [Art 14](https://artificialintelligenceact.eu/article/14/) |
| Live policy gate | 🟢 complete | Synchronous pre-evaluation: allow / hold / deny on every tool-call; fail closed on missing evidence. | [Art 9](https://artificialintelligenceact.eu/article/9/) |
| Append-only audit chain | 🟢 complete | PostgreSQL event store + SHA-256 hash chain + `verify-chain`; mutation-rejection triggers. | [Art 12](https://artificialintelligenceact.eu/article/12/) |
| MCP agent ingress | 🟢 complete | Streamable HTTP and stdio ingress route every call through the policy gate before any upstream tool is touched. | [Art 9](https://artificialintelligenceact.eu/article/9/) |
| Identity + RBAC | 🟢 complete | Role-to-permission authz plus per-request OIDC JWT verification; static bearer-token auth remains available for bounded local deployments. | — |
| Audit egress and observability | 🟢 complete | RFC 5424 syslog, Prometheus metrics, JSON logs, OTLP export, NATS fan-out, and alert webhooks. | [Art 12](https://artificialintelligenceact.eu/article/12/) / [Art 72](https://artificialintelligenceact.eu/article/72/) |
| Human oversight gateway + SLA-deny | 🟢 complete | Authenticated review endpoint: hold to approve/deny; expired holds are denied by monotonic deadline. | [Art 14](https://artificialintelligenceact.eu/article/14/) §4 |
| PII runtime guard | 🟢 complete | Email and card scrubbing on the capture path; redactions are preserved in the audit record while the upstream request stays intact. | [Art 10](https://artificialintelligenceact.eu/article/10/) |
| Transparency queries | 🟢 complete | Paginated, bounded, queryable audit-entry surface over the event store. | [Art 13](https://artificialintelligenceact.eu/article/13/) |
| Retention WORM (MinIO / S3) | 🟢 complete | Immutable >=184-day archive via S3 Object Lock (COMPLIANCE mode), with verification after upload. | [Art 12](https://artificialintelligenceact.eu/article/12/) §2 |
| Post-market monitoring | 🟢 complete | Replica-divergence monitor with replayable persisted incidents. | [Art 72](https://artificialintelligenceact.eu/article/72/) |
| HITL approvals (Discord / email) | 🟢 complete | Discord webhook and SMTP approval notifications for held actions. | [Art 14](https://artificialintelligenceact.eu/article/14/) |
| Manifest signing (Ed25519 / PKCS#11) | 🟢 complete | Software signer plus PKCS#11/SoftHSM2-backed signing for tamper-evident replica manifests. | [Art 12](https://artificialintelligenceact.eu/article/12/) |
| ComplianceReporter + DoC + freeze | 🟢 complete | JSON and Markdown reports, Annex V declaration export, readiness statement, and a `sha256sum`-verifiable freeze bundle. | [Art 11](https://artificialintelligenceact.eu/article/11/) / [Art 47](https://artificialintelligenceact.eu/article/47/) |
| Unix-socket agent ingress | ⚪ planned | Local co-resident agent transport without a TCP hop. | — |
| TLS termination / SSE proxy reference | ⚪ planned | Documented production edge pattern for HTTPS and browser-facing streams. | — |
| Pharo-WASM bridge | ⚪ planned | Direct bridge from the Pharo orchestration layer to the Rust governance component. | — |

## Technologies used

- **Rust + WebAssembly Component Model** — the governance core (`governance-node`, `agent-proxy`, `replica-node`) and WIT-typed contracts (`audit`, `policy`, `oversight`, `replication`).
- **Glither / `roux`** — the typed policy-DSL family; `glither.governance` compiles to a WASM component and to platform policy.
- **PostgreSQL** — append-only event store with hash chain and synchronous replication.
- **MCP (Model Context Protocol)** — the agent-ingress surface.
- **Ed25519 / PKCS#11 (SoftHSM2)** — manifest integrity signing.
- **OIDC / SAML, syslog (RFC 5424), OpenTelemetry, Discord/SMTP, Cloudflare R2 / MinIO (S3)** — the integration surfaces.
- **Pharo/Smalltalk** — a research/oversight console (optional; not on the customer-facing path — see implementation choices).

## What continues after the deadline core

The next slices are operational rather than architectural: Unix-socket ingress
for co-located agents, a documented TLS edge pattern, and the longer-term
Pharo-WASM bridge. Those are tracked on the
[KAGP Integration Backlog](../experiments/kagp-integration-plan.md).

## Implementation choices

- **Policy-as-code, not config.** Governance rules are a typed dialect compiled to a verifiable WASM
  component, so the policy that runs is the policy that was reviewed — and it is portable across hosts
  via WIT contracts.
- **Fail closed.** The gate denies on missing audit evidence or unconfigured upstreams; HSM/signing
  errors yield no signature rather than a wrong one. Safety defaults to "no".
- **The WASM/WIT core is the moat; orchestration is a replaceable adapter.** Because transports and
  policy are WIT contracts, the customer-facing surface can be a mainstream web stack while Pharo
  stays an optional research/teaching console — Pharo is *not* load-bearing.
- **Compliance core + evidence pack over full conformity by the deadline.** Notified-body assessment
  and harmonised standards cannot complete in the window (industry-wide); the runtime-enforced
  Art 9/12/14 core + Art 11 export is the defensible, demonstrable target.
- **Build heavy crates in tmpfs (`/tmp`), feature-gate HSM code.** The default build stays light and
  green; cryptoki/SoftHSM is gated and validated separately.

---

*This page tracks the public product status. See the
[readiness plan](../experiments/eu-ai-act-compliance-plan.md), the
[integration backlog](../experiments/kagp-integration-plan.md), and the project
repo for the current implementation detail.*
