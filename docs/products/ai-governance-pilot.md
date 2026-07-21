---
sidebar_label: Buyer pilot
description: "A practical buyer-pilot path for Konsonans AI Governance: one governed workload, one risky tool call, one reviewer, and one verifiable evidence packet."
---

# Konsonans buyer pilot

The fastest useful pilot is narrow: choose one agent workflow, one risky tool
call, and one accountable reviewer. Konsonans then proves whether the runtime
can gate the action, hold it for review, record the decision, and freeze the
evidence into a packet another party can verify.

This page is an implementation handoff, not legal advice or a conformity
assessment. The buyer's actual AI Act role, risk classification, jurisdiction,
and conformity route still need counsel and deployment-specific review.

## Pilot promise

By the end of a pilot, the buyer should have:

- a governed agent path where actions pass through allow, hold, or deny;
- a named reviewer workflow with rationale and timeout behaviour;
- a tamper-evident runtime evidence record;
- a frozen packet with manifests, checksums, logs, and verifier output;
- a short residual-risk list instead of a vague compliance claim.

## What the operator brings

| Input | Minimum useful shape |
| --- | --- |
| Agent workflow | One MCP-compatible tool path or a scripted representative workload |
| Risky action | A tool call that should be held, denied, or escalated |
| Reviewer | A named person or service identity allowed to approve or deny |
| Evidence boundary | The environment where logs, manifests, and packets must be produced |
| Acceptance rule | A short pass/fail statement the buyer will actually trust |

## What Konsonans runs

1. **Release gate.** Build, syntax-check, unit-test, and verify the release
   surface before the buyer run.
2. **Real workload.** Drive an allow, hold, human-approve, and timeout-deny
   path through the governance stack.
3. **Freeze evidence.** Produce the report, declaration scaffold, readiness
   statement, runtime evidence, manifest, and signature artifacts.
4. **Verify evidence.** Recompute the manifest and runtime chain independently.
5. **Assemble packet.** Copy logs, evidence, validation events, templates, and
   checksums into one handoff directory.

The operator-facing wrapper is:

```bash
scripts/run-buyer-evidence-validation.sh --out dist/validation/buyer-demo
```

Declaration-of-conformity fields can be passed after `--` when the buyer wants
the generated declaration to use real entity data rather than placeholders.

## Buyer-facing artifacts

| Artifact | Why it matters |
| --- | --- |
| `checks/release-gate.log` | Shows whether the release path was verified before the buyer run |
| `checks/freeze-evidence.log` | Records how the evidence pack was generated |
| `checks/verify-evidence.log` | Shows independent verifier output |
| `artifacts/evidence-pack/MANIFEST.sha256` | Lists packet file hashes |
| `artifacts/evidence-pack/MANIFEST.sig` | Carries the manifest signature when signing is enabled |
| `artifacts/evidence-pack/runtime-evidence.json` | Carries the governed runtime trace |
| `VALIDATION-EVENTS.jsonl` | Records the buyer-environment validation event |

## Acceptance checklist

- The held action cannot reach the upstream tool before review.
- The reviewer identity and rationale are recorded before execution.
- An expired hold denies safely.
- The evidence pack verifies without trusting the console.
- The packet identifies remaining risks by owner, date, and next action.
- Legal/conformity language remains scoped to the buyer's reviewed deployment.

## Regulatory posture

Konsonans is built to produce runtime evidence and human-oversight records that
can support an AI governance programme. It is not a substitute for a legal
classification decision or a notified-body process where one is required.

The European Commission's current AI Act implementation pages describe a staged
timeline: the AI Act entered into force on 1 August 2024, broad applicability
starts on 2 August 2026 with exceptions, and the high-risk timeline now depends
on the category and support measures. The Commission page currently lists
2 December 2027 for systems in certain high-risk areas and 2 August 2028 for
systems embedded in regulated products.

Source: [European Commission AI Act implementation timeline](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai).

## Related pages

- [AI Governance Platform](./ai-governance.md)
- [glither.governance policy dialect](../experiments/glither-governance.md)
- [EU AI Act Readiness Plan](../experiments/eu-ai-act-compliance-plan.md)
- [KAGP Integration Backlog](../experiments/kagp-integration-plan.md)
