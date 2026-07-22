---
sidebar_label: glither.governance (AI governance)
description: The glither.governance dialect — AI governance policy definition with HITL lifecycle, compiled to WASM components and KAGP platform policies.
---

# `glither.governance` — AI governance policy dialect

**Status:** implemented. Dialect `glither.governance` (`fold first-match`, flat verdict) — HITL lifecycle
(hold/approve/after), risk-level conditions, WASM component output, and KAGP (konsonans AI governance
platform) policy export.

Source: `packages/roux/tests/fixtures/governance.glith` in the Glither repo.

## 1. Dialect overview

`glither.governance` is a flat-verdict dialect for AI action governance. Its artifact is an
`Event` record representing an auditable AI action, and each rule disposes the event into one
of three verdicts:

| Verdict | Meaning |
|---|---|
| `Allowed` | Action proceeds (auto-approved for low-risk) |
| `Blocked` | Action prohibited (policy violation or unacceptable risk) |
| `Flagged` | Held for human-in-the-loop (HITL) review |

Rules use **risk levels** (`minimal`, `limited`, `high`, `unacceptable`) and **threshold
conditions** (amount, rate, PII detection) to classify events.

### Source ruleset

```glith
#pragma dialect glither.governance ; fold first-match

/// # Governance policy — glither.governance
/// Flat-verdict dialect for AI action governance.
/// An event settles into `allowed`, `blocked`, or `flagged` (HITL).

rule high_value_hitl =
  event | arguments[1] > 25000        // amount threshold
        | risk_level == high
  => hold reason "flagged for review"
     on   approve into flagged
     after 24h   into flagged

rule pii_guard =
  event | pii_detected == true
  => into blocked (reason = pii_detected_in_arguments)

rule rate_limit =
  event | rate_count > 1000
  => into blocked (reason = rate_limit_exceeded)

rule low_risk_allow =
  event | risk_level == minimal
  => into allowed (reason = allowed triggered)

rule moderate_risk_allow =
  event | risk_level == limited
        | arguments[1] <= 10000
  => into allowed (reason = allowed triggered)

rule high_risk_hitl =
  event | risk_level == high
  => hold reason "flagged for review"
     on   approve into flagged
     after 4h    into flagged

rule unacceptable_risk =
  event | risk_level == unacceptable
  => into blocked (reason = unacceptable_risk_prohibited)

rule default_allow =
  event | event.action != ""
  => into allowed (reason = allowed triggered)
```

## 2. HITL lifecycle

The distinctive feature of `glither.governance` is the **human-in-the-loop lifecycle** using
Glither's `hold` / `on` / `after` disposition verbs:

```glith
rule high_value_hitl =
  event | arguments[1] > 25000 | risk_level == high
  => hold reason "flagged for review"
     on   approve into flagged       # human approves → Flagged (recorded)
     after 24h   into flagged        # timeout → Flagged (auto-escalated)
```

Two rules use HITL holds:

| Rule | Conditions | Hold lifecycle |
|---|---|---|
| `high_value_hitl` | amount > 25000 + risk == high | `approve \| after 24h` → Flagged |
| `high_risk_hitl` | risk == high | `approve \| after 4h` → Flagged |

The lifecycle arms are preserved in the generated code as structured comments:

```rust
// lifecycle: on approve, after 24h
if (msg.event_amount > 25000.0)
    && (msg.event_risk_level.as_str() == "high") {
    return Receipt::flagged("high_value_hitl", "flagged for review");
}
```

And exported to KAGP in the `remediation` field:

```json
{
  "remediation": "hold (on approve, after 24h)",
  "requires_approval": true,
  "severity": 9
}
```

## 3. Compiler pipeline

The full compilation pipeline for a `glither.governance` ruleset is:

```text
governance.glith
    │
    ├── tangle check       → dialect & structural validation
    ├── tangle rust        → standalone Rust logic (src/logic.rs)
    ├── tangle wit         → WIT world contract (wit/world.wit)
    ├── tangle component   → buildable WASM component crate
    ├── tangle manifest    → activation JSON metadata
    └── tangle export-kagp-policies → KAGP platform JSON
```

### WASM component

`tangle component` generates a crate that builds to a `.wasm` component exporting:

```wit
package glither:governance;

interface types {
  record event {
    event-action: string,
    event-amount: f64,
    event-pii-detected: string,
    event-rate-count: f64,
    event-risk-level: string,
  }

  enum outcome { allowed, blocked, flagged }

  record receipt {
    outcome: outcome,
    rule: string,
    reason: string,
  }
}

world event {
  use types.{event, receipt};
  export dispose: func(msg: event) -> receipt;
}
```

### KAGP export

The `export-kagp-policies` subcommand translates glither rules into konsonans AI governance
platform (KAGP) policy objects, mapping:

| Glither concept | KAGP field |
|---|---|
| rule name | `name` / `rule_id` |
| predicates | `conditions[]` (field, op, value) |
| amount threshold | `max_amount`, condition `arguments[1]` |
| risk level | `risk_levels[]`, condition on `risk_level` |
| hold disposition | `requires_approval: true` |
| approved/after lifecycle | `remediation` string, e.g. `"hold (on approve, after 24h)"` |
| blocked terminal | `remediation: "Action blocked by policy"` |
| severity | 9 (HITL), 7 (high/unacceptable), 5 (standard) |

## 4. Integration with BAZ.AI-governance

The BAZ.AI-governance project at `experiments/BAZ.AI-governance` consumes glither output
through three integration paths:

### Path A — Policy export (P1)

`tangle export-kagp-policies governance.glith` produces a JSON array consumed by the
governance node's `policies.json` endpoint. The governance node evaluates rules at
runtime, caching compiled conditions for O(n) evaluation.

### Path B — WASM component (P3)

`tangle component` produces a crate that compiles to a standalone `.wasm` component
runnable under wasmtime. This enables sandboxed policy enforcement: the governance
node can delegate the `dispose` call to a Wasm sandbox instead of interpreting JSON.

### Path C — HITL lifecycle (P2)

The hold lifecycle is exposed as structured metadata in comments, manifest, and KAGP
export, enabling the governance node's lifecycle manager to schedule approval deadlines
and escalation.

## 5. Tests

The dialect has full coverage:

- **Codegen unit tests** — `generates_governance_rust`, `generates_governance_wit`,
  `governance_glue_without_dropped` validate rust, wit, and component output.
- **Compile test** — `governance_rust_compiles` confirms the generated Rust passes `rustc`.
- **Component integration** — `governance_component_has_correct_glue_without_dropped`
  validates the WASM component crate structure.
- **CLI test** — `tangle export-kagp-policies` is verified against the fixture ruleset.
- **KAGP export** — all 8 rules map correctly, lifecycle is preserved, conditions are
  structurally valid.

---

See the [AI Governance (KAGP) product page](../products/ai-governance.md) for the full component status table, EU AI Act article crosswalk, and implementation choices.
