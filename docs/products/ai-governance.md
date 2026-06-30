---
sidebar_label: AI Governance (EU AI Act)
description: Konsonans AI Governance Platform (KAGP) — a policy-as-code control plane that governs AI agents for EU AI Act compliance. Full breakdown with what, why, how, technologies, implementation choices, and per-component status.
---

# AI Governance Platform (KAGP)

**Konsonans AI Governance Platform** — a policy-as-code control plane that governs AI agents for
**EU AI Act** compliance. Every agent action passes a typed policy gate, lands in a tamper-evident
audit chain, and can be held for human approval.

Repo: [`tabenius/BAZ.AI-Governance`](https://github.com/tabenius/BAZ.AI-Governance) ·
policy dialect: [`glither.governance`](../experiments/glither-governance.md) ·
readiness plan: [EU AI Act Readiness Plan](../experiments/eu-ai-act-compliance-plan.md)

## Status legend

Each component below is tagged with its current state:

| Symbol | Meaning |
|---|---|
| 🟢 | **complete** — implemented, tested, on `main` |
| 🔵 | **near finish** — core landed; a follow-up remains |
| 🟡 | **in progress** — actively being built |
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
- **[Art 72](https://artificialintelligenceact.eu/article/72/)** — post-market monitoring

See the [EU AI Act Readiness Plan](../experiments/eu-ai-act-compliance-plan.md) for the deadline
analysis and gap table.

## How — components & status

| Component | Status | What it does | Article |
|---|---|---|---|
| `glither.governance` dialect | 🟢 complete | Risk-tiered policy (`fold first-match`), HITL lifecycle (hold/approve/after), compiled to a WASM component. | [Art 9](https://artificialintelligenceact.eu/article/9/) / [Art 14](https://artificialintelligenceact.eu/article/14/) |
| Live policy gate | 🟢 complete | Synchronous pre-evaluation: allow / hold / deny on every tool-call; fail-closed on missing evidence. | [Art 9](https://artificialintelligenceact.eu/article/9/) |
| Append-only audit chain | 🟢 complete | PostgreSQL event store + SHA-256 hash chain + `verify-chain`; mutation-rejection triggers. | [Art 12](https://artificialintelligenceact.eu/article/12/) |
| MCP agent ingress | 🔵 near finish | Model-Context-Protocol gateway intercepting `tools/call`; routes through the gate before the upstream tool. *(hold→approve callback pending)* | [Art 9](https://artificialintelligenceact.eu/article/9/) |
| Identity + RBAC | 🔵 near finish | Role→permission authz (agent/reviewer/approver/admin) enforced at ingress. *(OIDC/SAML signature verification pending)* | — |
| Audit egress (syslog) | 🔵 near finish | RFC 5424 export of every decision over UDP. *(event-store subscription + TCP/TLS pending)* | [Art 12](https://artificialintelligenceact.eu/article/12/) |
| HITL approvals (Discord / email) | 🟡 in progress | Discord approval notifications on hold. *(email channel + approve/deny callback pending)* | [Art 14](https://artificialintelligenceact.eu/article/14/) |
| Manifest signing (Ed25519 / PKCS#11) | 🟡 in progress | Tamper-evident replica-manifest signing; software signer landed. *(cryptoki + SoftHSM2 [planned](https://github.com/tabenius/BAZ.AI-Governance/blob/main/docs/superpowers/plans/2026-06-30-pkcs11-cryptoki-softhsm.md))* | [Art 12](https://artificialintelligenceact.eu/article/12/) |
| Human oversight gateway + SLA-deny | 🟡 in progress | Hold → human decision, with safe-default timeout-to-deny at runtime. | [Art 14](https://artificialintelligenceact.eu/article/14/) §4 |
| PII runtime guard | ⚪ planned | Runtime argument scrubbing for detected PII. | [Art 10](https://artificialintelligenceact.eu/article/10/) |
| OpenTelemetry | ⚪ planned | OTLP traces + metrics (decision latency, hold/deny counts). | — |
| Retention WORM (Cloudflare R2 / MinIO) | ⚪ planned | Immutable ≥6-month archive of event-store segments via S3 object-lock. | [Art 12](https://artificialintelligenceact.eu/article/12/) §2 |
| ComplianceReporter | ⚪ planned | JSON + PDF technical-documentation / evidence export. | [Art 11](https://artificialintelligenceact.eu/article/11/) |
| Post-market monitoring | ⚪ planned | Replica-divergence / incident monitor. | [Art 72](https://artificialintelligenceact.eu/article/72/) |

## Technologies used

- **Rust + WebAssembly Component Model** — the governance core (`governance-node`, `agent-proxy`, `replica-node`) and WIT-typed contracts (`audit`, `policy`, `oversight`, `replication`).
- **Glither / `roux`** — the typed policy-DSL family; `glither.governance` compiles to a WASM component and to platform policy.
- **PostgreSQL** — append-only event store with hash chain and synchronous replication.
- **MCP (Model Context Protocol)** — the agent-ingress surface.
- **Ed25519 / PKCS#11 (SoftHSM2)** — manifest integrity signing.
- **OIDC / SAML, syslog (RFC 5424), OpenTelemetry, Discord/SMTP, Cloudflare R2 / MinIO (S3)** — the integration surfaces.
- **Pharo/Smalltalk** — a research/oversight console (optional; not on the customer-facing path — see implementation choices).

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

*This page tracks live status; see the [readiness plan](../experiments/eu-ai-act-compliance-plan.md)
and the project repo for the authoritative task board.*
