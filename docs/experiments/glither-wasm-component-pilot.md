---
sidebar_label: Glither WASM component pilot
description: Operator and reviewer handoff for a bounded Glither to WIT/WASI component pilot.
---

# Glither WASM component pilot

This page is the operator and reviewer handoff for the public
[Glither component surface](https://ragbaz.cc/glither-wasm). It turns the
compiler design into a bounded pilot: one ruleset, one generated WIT contract,
one component scaffold, and one evidence packet that says exactly what is ready.

The pilot is deliberately narrower than a production runtime rollout. The
current Glither compiler can lower `.glith` source through typed IR and emit WIT,
Rust, Gleam, manifests, snapshots, and WebAssembly component scaffolds. Host
admission, long-running conformance, registry promotion, and operational
retention remain hardening tracks.

## 1. Pilot scope

| Track | In scope | Out of scope |
|---|---|---|
| Ruleset | one `glither.mail`, `glither.governance`, or `glither.hft` source file | broad dialect redesign |
| Contract | generated `world.wit` plus reviewer notes | hand-authored WIT |
| Build output | generated Rust logic and component crate scaffold | unreviewed runtime admission |
| Evidence | command transcript, source, generated artifacts, status note | compliance certification |
| Runtime | local component build when toolchain is present | production host fleet rollout |

The best first candidate is a ruleset with a clear action boundary: hold an AI
tool call, route a mail message, or evaluate a deterministic market strategy.

## 2. Inputs

| Input | Owner | Acceptance check |
|---|---|---|
| `.glith` ruleset | builder | policy intent can be explained without reading host code |
| sample event | operator | event has realistic fields and expected disposition |
| host boundary | reviewer | imports and exports map to allowed capabilities |
| risk note | reviewer | states what the component is allowed to decide |
| status boundary | operator | names unfinished host, OCI, or conformance work |

Use repository fixtures when possible:

```text
/data/src/experiments/glither/packages/roux/tests/fixtures/mailguard.glith
/data/src/experiments/glither/packages/roux/tests/fixtures/governance.glith
/data/src/experiments/glither/packages/roux/tests/fixtures/hft.glith
```

## 3. Command path

Run from `/data/src/experiments/glither` with the local Rust workspace
available:

```bash
cargo run -p tangle -- check packages/roux/tests/fixtures/governance.glith
cargo run -p tangle -- snapshot packages/roux/tests/fixtures/governance.glith --json
cargo run -p tangle -- wit packages/roux/tests/fixtures/governance.glith
cargo run -p tangle -- rust packages/roux/tests/fixtures/governance.glith
cargo run -p tangle -- gleam packages/roux/tests/fixtures/governance.glith
cargo run -p tangle -- manifest packages/roux/tests/fixtures/governance.glith
cargo run -p tangle -- component packages/roux/tests/fixtures/governance.glith -o /tmp/glither-governance-component
```

For `glither.governance`, add the KAGP policy export:

```bash
cargo run -p tangle -- export-kagp-policies packages/roux/tests/fixtures/governance.glith
```

The generated component crate includes `wit/world.wit`, `src/logic.rs`,
`src/lib.rs`, `Cargo.toml`, `build.sh`, and a generated README. Building the
actual `.wasm` component requires the `wasm32-unknown-unknown` Rust target and
`wasm-tools`; OCI packaging additionally requires registry credentials and
`oras`.

## 4. Review packet

| Artifact | Why it matters |
|---|---|
| source `.glith` | human-readable policy or strategy source |
| `tangle check` output | structural validation and diagnostics |
| snapshot JSON | typed IR, inferred states, and audit-friendly diff material |
| `world.wit` | membrane contract for imports, exports, records, and outcomes |
| generated Rust | pure disposition logic reviewers can inspect |
| generated Gleam | reference oracle path for future differential checks |
| manifest JSON | activation metadata and ruleset description |
| component scaffold | buildable crate boundary for WASM component work |
| status note | explicit gap list for host, OCI, conformance, and retention |

The packet should avoid runtime overclaiming. A valid pilot can finish at a
reviewed WIT contract and generated component scaffold when the host or registry
path is not yet ready.

## 5. Acceptance checks

| Check | Pass condition |
|---|---|
| Source clarity | a reviewer can identify the protected action and expected outcome |
| Structural check | `tangle check` exits successfully or emits accepted diagnostics |
| WIT contract | imports and exports match the declared host boundary |
| Rust output | generated logic includes the expected rule names and outcomes |
| Oracle output | generated Gleam preserves the same decision shape |
| Component scaffold | output directory contains WIT, glue, logic, and build recipe |
| Status boundary | packet marks incomplete host, conformance, and OCI promotion work |

Optional build check when the component toolchain is present:

```bash
cd /tmp/glither-governance-component
bash build.sh
```

That optional step proves the scaffold can become a validated WebAssembly
component locally. It does not by itself prove production host admission,
registry promotion, or operational retention.

## 6. Buyer and operator handoff

The pilot output should read as a short review story:

1. This is the source rule and the action it governs.
2. This is the generated WIT contract; these are the only host capabilities.
3. This is the generated logic and oracle output.
4. This is the component scaffold and optional local build result.
5. These are the unfinished production controls.

Pair this page with the [compiler design spec](./glither-wasm-wit-compiler-spec),
the [`glither.governance` dialect](./glither-governance), and the
[BAZ platform architecture](./baz-architecture) when the pilot ruleset is a
trading strategy.
