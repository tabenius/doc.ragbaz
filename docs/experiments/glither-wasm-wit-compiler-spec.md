---
sidebar_label: Glither WASM/WIT compiler spec
description: Design spec for the Glither → WASI/WIT/Rust/Gleam compiler and OCI registry deployment (glither.mail first slice).
---

# Glither → WASI/WIT compiler & registry deployment — design spec

**Status:** implementation in progress — C0 (IR spine) complete, C1 (WIT derivation) and C2 (Rust codegen) partially complete. See [§12 Phased implementation plan](#12-phased-implementation-plan) for current progress.
**Scope:** the `Next` roadmap item — *Glither → WASM/OCI/WIT compiler* (`/data/src/ROADMAP.md`).
**Companions:** `docs/glither-spec.md` (architecture, normative semantics), `docs/syntax-sketch.md`
(surface grammar, per-dialect state catalog). Section refs `§N` point at `glither-spec.md`
unless prefixed `sketch §N`.
**Author:** RAGBAZ · Tobias Abenius · 2026-06-13.

---

## 0. What this spec is, in one paragraph

This is the buildable design for the **compiler and deployment pipeline** that turns a
`glither.*` policy source into a running, capability-sandboxed **WASM Component** published as
an **OCI artifact**. The novel semantics (ligand typing, membranes, disposition logic) are
specified in `glither-spec.md`; this document specifies the **machinery**: the Rust crate
workspace, the typed-core-IR data model and its serializable snapshot, the **WIT-world
derivation** (imports = capabilities, exports = verdicts), the **dual codegen** (Rust →
production wasm32 component; Gleam → auditable differential oracle), the **Wasmtime/WASI host**
and per-subsystem import bindings, **OCI packaging + push to `registry.ragbaz.cc`**, and the
**conformance suite**. The first concrete vertical slice is **`glither.mail`** (the shipped
mailguard pattern, [`docs/examples/mailguard.glith`](./glither-mailguard-example.md)).

---

## 1. Goals & non-goals

### Goals

1. Compile a `.glith` ruleset to a **WASM Component** (`wasm32-wasip2`) whose **WIT world is the
   membrane contract** — imports are the only authority the ruleset has (§1, §3).
2. Emit, from one typed IR, **two** artifacts: the production **Rust** component and an
   **auditable Gleam** reference that serves as the **differential conformance oracle**.
3. **Derive** the WIT world, the minimum-clearance, and the satisfiability facts from the IR
   (not hand-written) — so the published contract is provably the compiled one (§5, §14).
4. Package the component as an **OCI artifact** and publish to the existing RAGBAZ registry at
   `registry.ragbaz.cc` (konsonans:5000), signed and digest-pinned.
5. Run the component under **Wasmtime/WASI** with **per-subsystem host bindings** implementing
   the WIT imports (`glither.mail` → mailroute, etc.).
6. Ship a **conformance suite**: `ruleset → expected verdicts/actions` fixtures, pinned per
   dialect; Rust component and Gleam oracle must agree, byte-for-byte on verdict + reason_class.

### Non-goals (this spec)

- Designing new surface syntax or new dialects — frozen by `glither-spec.md` / `syntax-sketch.md`.
- The full **static** ligand checker via WIT linking refinements (`glither-spec.md` Phase 3) —
  this spec lands the *runtime-checked* ligand path and the *structural* link-failure checks;
  lattice-refinement static checking is a forward seam (§13).
- The probabilistic/diagnostics substrate (§10) and the Decision/Council runtime (§9) — separate
  workstreams; this spec only ensures the WIT world can *express* their action imports.
- BAZ.Weave rendering — but the IR snapshot this spec defines is the input BAZ.Weave consumes,
  so the snapshot schema must be introspection-complete (§4.3).

---

## 2. Pipeline overview

```
 .glith source
     │  tangle: pest parse → lower
     ▼
 Typed Core IR  ──serialize──▶  IR snapshot (CBOR + JSON)   ──▶  BAZ.Weave / conformance
     │  derive
     ├───────────────▶ WIT world  (imports = capabilities, exports = verdicts)
     │
     ├── codegen-rust  ──▶ generated Rust crate ──cargo-component──▶ component.wasm (wasm32-wasip2)
     │                                                                   │
     └── codegen-gleam ──▶ generated Gleam pkg  ──gleam (JS/BEAM)──▶  oracle (run in CI only)
                                                                         │
 component.wasm  ──wkg/oras OCI push (signed)──▶  registry.ragbaz.cc
     │  pull + instantiate
     ▼
 Wasmtime / WASI host  +  per-subsystem import bindings  =  ruleset's only authority
```

Stage boundaries are explicit so each is independently testable. The **IR snapshot** is the
interchange artifact: it is what the conformance harness diffs, what BAZ.Weave introspects, and
(later, `glither-spec.md` Phase 3+) what an out-of-process codegen could consume — Approach A
that is *built to evolve into* the data-oriented Approach C without a rewrite.

---

## 3. Crate workspace

A single Cargo workspace. Eventual home `products/glither` (per the `ROADMAP.md` "Glither
relocation" item); built in `experiments/glither` until that move lands.

| Crate | Responsibility | Key deps | Status |
|---|---|---|---|
| `roux` | shared core: pest grammar, typed core IR types, lowering, ligand/Denning checker, IR snapshot (serde), **codegen** (gleam/rust/wit) | `pest`, `serde`, `ciborium` | **Complete** — codegen targets integrated directly into roux |
| `tangle` | compiler CLI: `check`, `snapshot`, `gleam`, `wit`, `rust` subcommands | `roux`, `clap` | **Complete** — all five subcommands implemented |
| `glither-wit` | *planned*: derive WIT world + interfaces from IR; emit `.wit` text; compute attestation hash | `roux`, `wit-parser` | **Merged into roux** — WIT codegen is `roux::codegen::wit` |
| `codegen-rust` | *planned*: IR → generated Rust component crate | `roux` | **Merged into roux** — Rust codegen is `roux::codegen::rust_` |
| `codegen-gleam` | *planned*: IR → generated Gleam package | `roux` | **Merged into roux** — Gleam codegen is `roux::codegen::gleam` |
| `glither-host` | *planned*: Wasmtime embedder + per-subsystem WIT-import bindings | `wasmtime` | **Not started** |
| `glither-conformance` | *planned*: fixture runner + differential oracle comparison | `roux` | **Not started** (unit tests cover codegen correctness) |

**Roux is the only crate the dialects share** (§3 lexicon: "shared grammar engine + base grammar
+ shared WIT type vocabulary"). Adding a dialect = a vocabulary module + host bindings, never a
new compiler. This cheapness is the architectural bet (§6).

**Generated code is build output, not source.** `codegen-rust`/`codegen-gleam` write to
`target/glither-gen/<ruleset>/`; the generated crate is built but not committed. The committed
artifacts are the `.glith` source, the IR snapshot golden files, and the conformance fixtures.

---

## 4. The typed core IR & snapshot

### 4.1 Shape

The IR is the small message-passing / actor calculus of §2 and §8.3, realized as Rust types.
Per ruleset:

```
Ruleset { dialect, fold_mode, enrichments[], groups[], rules[], literate_blocks[], spans }
Rule    { name, title?, selector_predicates[], crossing_predicates[], dispositions[], arms[] }
Predicate { phase: Select | Crossing(LigandRef), operand, op, value, negated, span }
Disposition { Wrap(audience) | Move(Terminal box | Graded ladder→rung [for audience]) | VerbApp }
Arm     { trigger: When(pred) | On(event) | After(duration), move, span }
Ligand  { name, type: SecurityClass | ScopeExpr | Record{..} | Ordered(lattice), freshness? }
State   { Terminal(box) | Pending(resolution_set, deadline_obligation) }  // inferred (sketch §4)
```

Phase (`Select` vs `Crossing`) is **inferred** by free-variable partitioning (sketch §1), not
authored. States are **inferred** from the transition graph: no out-edges ⇒ terminal box;
out-edges ⇒ `Pending<L>` (sketch §4). The IR carries retained source spans so diagnostics and
BAZ.Weave point back at the surface.

### 4.2 Checks performed at IR level (this spec)

From the §5 catalog, the ones that are **structural** (don't need lattice refinements) land here
and surface as `tangle check` diagnostics:

1. **Unsatisfiable guard** — a crossing predicate binds a ligand no enrichment produces →
   *error* ✅ (implemented, tested with `UNSAT_GUARD` diagnostic).
2. **Dead rule** — in first-match mode, a rule with no predicates makes all subsequent rules
   unreachable → *error* ✅ (implemented, tested with `DEAD_RULE` diagnostic; §(4) in source).
3. **Missing liveness deadline** — an awaiting arm (`on`/`when` over an unproduced ligand) with no
   `after` → *error* ✅ (implemented, tested with `MISSING_DEADLINE` diagnostic).
4. **`into` misuse** — `into` naming a non-terminal, or a graded move naming an unknown ladder/rung
   → *error* ⏳ (not yet implemented — deferred until ladder-bearing dialects need it).
5. **Unlawful `lower`** — a down-move not paired with a narrowed `for` audience → *error*
   ✅ (implemented, tested with `UNLAWFUL_LOWER` diagnostic).

Information-flow downgrade and freshness (the lattice-refinement checks, §5.2/§5.6) are **runtime-
checked** in this phase and **flagged as forward-static** seams (§13).

### 4.3 Snapshot

`tangle snapshot <file.glith>` emits a **versioned** IR snapshot: canonical **CBOR** (the machine
interchange, used by conformance + attestation hashing) plus a **pretty JSON** sibling (diff-
friendly golden file). The schema carries a `snapshot_version` and is **introspection-complete**:
everything BAZ.Weave derives (PlantUML topology, WIT contract, constraint tables, cross-refs, §14)
must be reconstructable from the snapshot alone. Golden snapshots for the example rulesets are
committed; a snapshot diff in CI is the first tripwire on any frontend/IR change.

---

## 5. WIT-world derivation — the contract model

The WIT world **is** the membrane contract (§1). It is *derived* from the IR, never hand-written,
so the published `.wit` is provably the one the component compiles against (§14.6 "the same WIT").

### 5.1 The derivation rule

| IR fact | WIT element | Membrane reading |
|---|---|---|
| ligand required by a crossing predicate | `import` (capability) | Pier face / influx — the authority the ruleset needs |
| enrichment that *produces* a ligand | `import` func (effectful fetch) | the sole effectful phase (§5) |
| disposition verb (`route`, `tag`, `hold`, `wrap`, `convene`…) | `import` func (host action) | the ruleset *executes its action toward a subsystem* (roadmap) |
| the `dispose`/verdict entrypoint | `export` func | Pour face / efflux — the receipt the ruleset emits |
| Dana (uniport, no retrograde) | a world with **imports only** | one-way gift, attested (§4) |

**Unsatisfiable guard ⇒ link failure.** A required ligand with no producing enrichment becomes a
WIT `import` with no host provider; the component fails to **link** at instantiation — the §1
keystone ("unsatisfiable guard = compile/link error"), realized for free by the component model.

### 5.2 Shared vocabulary vs dialect world

`roux` owns a **shared WIT type vocabulary** (`glither:roux/types` — `clearance`, `detail`,
`lineage-proof`, `receipt`, `reason-class`, `verdict`, …; §3 lexicon). Each dialect derives a
world that imports `glither:roux/types` and declares its own action/enrichment interfaces:

```wit
// derived for glither.mail (see §14 worked example for the full text)
package glither:mail@0.1.0;

interface enrich {                 // imports: the effectful enrichment phase (§5)
  use glither:roux/types.{domain, verdict, receipt};
  dkim-domain: func(msg: message) -> option<domain>;
  is-allowlisted: func(sender: address) -> bool;
  dmarc-policy: func(msg: message) -> dmarc;
}
interface actions {                // imports: host actions toward the mailroute subsystem
  route: func(msg: message, mailbox: string);
  tag: func(msg: message, label: string);
  hold: func(msg: message) -> token;     // → quarantine (suspended)
}
world mailguard {
  import enrich;
  import actions;
  export dispose: func(msg: message) -> receipt;   // the only export = the verdict
}
```

### 5.3 Attestation

The **membrane attestation** is the signed WIT world plus the component content hash (§1, §5
"derived as compiler outputs"). `glither-wit` computes a stable hash over the canonicalized world
text; `tangle oci` attaches it as an OCI artifact annotation and the cosign signature covers it
(§8). The concrete [`no_retrograde` (Dana vow) attestation document](./dana-no-retrograde-sketch.md)
is detailed in its own design sketch (and remains a §13 seam to ratify; cf. "membrane attestation
format" in `glither-spec.md`).

---

## 6. Codegen

One IR, two emitters (Approach A). Both are pure IR→source functions; neither reads the surface.

### 6.1 Rust — the production component

`codegen-rust` emits a small Rust crate: a `dispose` export implementing the disposition logic as
a total function over typed ligands, with import shims generated from the derived WIT via
`wit-bindgen`. Built with **`cargo component build --target wasm32-wasip2`** → `component.wasm`.

- The `case`/guard fusion of §8.1 maps to a Rust `match` over `(selector, ligand)` tuples; `and`
  = sequential guards, `or` = `match` arms with rolled-back context (immutable context value,
  §7). The monad is engine-internal; generated code is plain total Rust.
- Suspended dispositions (`hold`, `seed`) call the host `hold`-style import returning a token and
  emit an **interim receipt**; the deadline arm is registered as a `Deadline` ligand obligation
  (sketch §5). Settlement receipts are emitted per rung/box reached.
- No ambient authority: the crate has **no** `std::net`/`std::fs`/clock access — everything is a
  WIT import. This is the WASI capability sandbox (§1, §12 Phase 4 thesis).

### 6.2 Gleam — the auditable oracle

`codegen-gleam` emits a Gleam package modelling the *same* IR as typed messages between isolated
processes — the §8.1 rendering, which the spec calls "nearly the IR." Built with the **Gleam JS
backend** and run in CI (Node or `deno`) — **oracle only, never deployed**. Its job: be small
enough to read in a review and serve as the **differential reference** (§9). Because both emitters
consume the same IR, divergence between them is a compiler bug, caught by conformance (§9).

> Why Gleam is the *oracle* and Rust is the *wasm path*: Gleam has no native wasm-component
> backend (it targets Erlang/JS), so it cannot be the deployed artifact today; but its typed,
> total, message-passing style makes it the most faithful *readable* rendering of the IR. Rust
> via `cargo-component` is the lean, JS-engine-free production component. This is the roadmap's
> "IR → Gleam (auditable reference) … Rust (production wasm32)" sequencing.

---

## 7. Host & runtime

`glither-host` is a **Rust Wasmtime embedder**. Per crossing it: pulls/loads the component,
instantiates a fresh store (per-crossing ephemerality = §1 occlusion / Dana isolation), wires the
WIT **imports** to a **per-subsystem binding set**, calls `dispose`, collects the receipt, and
drops the instance.

- **Per-subsystem bindings** are the ruleset's *only* authority (roadmap). `glither.mail` binds
  `enrich`/`actions` to the **mailroute** subsystem; `glither.segment` → fillmeup/Pier; `glither.api`
  → StepMother; etc. (§6 dialect table). A binding set is an ordinary Rust impl of the WIT import
  interfaces.
- **WASI**: components get only `wasi:cli` stdio + explicitly granted capabilities; no preopened
  dirs, no sockets unless a binding grants one. Default-deny.
- **Targets:** native Wasmtime (services, CI) and CF Workers (the §12 Phase-2 dogfood). The host
  abstracts the embedder so the same component runs in both.

---

## 8. OCI packaging & registry deployment

### 8.1 Package

`tangle oci push <component.wasm>` wraps the component as an **OCI artifact** (the wasm-component
artifact type / `application/wasm` layer, per the `wkg`/`oras` convention) with annotations:
`org.glither.dialect`, `org.glither.snapshot-version`, `org.glither.wit-attestation` (§5.3),
source digest, and `compatibility` pins (§8.4). Tooling: prefer **`wkg oci push`** (component-
aware); fall back to **`oras push`** for raw artifact control.

### 8.2 Registry

Target: the existing RAGBAZ registry — **`registry.ragbaz.cc`** (host konsonans, container port
`5000`). Confirmed flavor: **CNCF `distribution` (Docker registry v2)**, Cloudflare-fronted, with
**Basic auth** (`realm="ragbaz-registry"`). distribution stores OCI artifacts; no registry change
needed.

- **Naming:** `registry.ragbaz.cc/glither/<dialect>/<ruleset>:<semver>` plus an immutable
  `@sha256:` digest; deployments **always pin the digest**, tags are conveniences.
- **Auth (AGENTS.md credentials policy):** Basic-auth creds are a **secret** — provided via env
  (`RAGBAZ_REGISTRY_USER` / `RAGBAZ_REGISTRY_TOKEN`) or CI secret, **never committed**; a
  `.env.example` lists the key names. Control-plane reach to konsonans prefers the **tailscale**
  alias (AGENTS.md control-plane policy); CI pushes go through `registry.ragbaz.cc` over HTTPS.
- **Signing:** `cosign sign` over the artifact digest; the signature covers the WIT attestation
  annotation (§5.3). Pulls verify signature before instantiation.

### 8.3 Deploy path

A `tangle build && tangle oci push` flow, driven by the repo's `frog repo build` target (AGENTS.md
`frog` coordination), not ad-hoc scripts. The host pulls a **digest-pinned** component at run time.

### 8.4 Compatibility pins

The artifact records the `wasm32-wasip2` target, the WASI/preview version, the `snapshot_version`,
and the `roux` compiler version, so a host can refuse a component built against an incompatible
world/runtime — analogous to the AGENTS.md "pin a current `compatibility_date`" discipline.

---

## 9. Conformance & testing

The contract that makes the dual-codegen honest.

- **Fixtures:** per dialect, a set of `case → expected { verdict, reason_class, actions[] }`
  files alongside the `.glith` ruleset. `glither.mail` ships the first golden set, derived from the
  `mailguard.glith` rules (drop/quarantine/tag/route/deliver paths).
- **Differential:** `glither-conformance` runs each case through **both** the Rust component (in
  `glither-host`) **and** the Gleam oracle, and asserts they agree on verdict + reason_class +
  ordered action list. Disagreement = compiler bug.
- **Snapshot goldens:** committed IR-snapshot JSON per ruleset; a diff in CI flags any
  frontend/IR change for review (§4.3).
- **WIT goldens:** committed derived `.wit` per ruleset; a diff flags any contract change — the
  contract cannot drift silently (§5, §14).
- **Link-failure tests:** a ruleset with an unsatisfiable guard must **fail to instantiate** with
  the expected unmet-import error (§5.1) — proving the keystone works.
- **Sandbox tests:** assert the component has no ambient authority (instantiate with an empty
  binding set; any action attempt traps).
- **Layers:** `roux` unit tests (parse/lower/check), codegen snapshot tests, conformance
  differential tests, host integration tests, one end-to-end `build→push(dry-run)→pull→run`.

Verification per AGENTS.md: `cargo test`, `cargo clippy`, `cargo component build`, `gleam test`
(oracle), and a dry-run `oci push` against a local registry before touching `registry.ragbaz.cc`.

---

## 10. CLI surface (`tangle`)

```
tangle check   <file.glith>                 # parse + lower + IR checks (§4.2); diagnostics only
tangle snapshot <file.glith> [--json]       # emit IR snapshot (§4.3) – CBOR (default) or JSON
tangle gleam   <file.glith> [-o <file>]     # compile to Gleam source (§6.2)
tangle wit     <file.glith> [-o <file>]     # derive + print the WIT world (§5)
tangle rust    <file.glith> [-o <file>]     # compile to Rust source (§6.1)
```

Implemented subcommands: `check`, `snapshot`, `gleam`, `wit`, `rust`. The `gleam`/`wit`/`rust`
subcommands run `check()` before emitting — errors print to stderr and exit with code 1.
All support `--output` / `-o` to write to a file instead of stdout.

Planned but not yet implemented: `build` (cargo-component), `oci push`, `conform`.

`--json` everywhere for machine consumption (AGENTS.md `frog`/MCP-friendliness). Exit codes
distinguish lint vs error vs link-failure so CI can gate precisely.

---

## 11. Security considerations

- **Capability sandbox is the product** (§12 Phase-4 thesis). The compiled component has authority
  *only* via WIT imports; the host binding set is the policy boundary. Default-deny WASI.
- **No secrets in the artifact.** Components are pure logic; credentials (registry Basic auth,
  cosign keys) live in env/CI secrets per AGENTS.md, never in source, the IR, or annotations.
- **Signed + digest-pinned deploys.** Hosts verify the cosign signature and pin `@sha256:` before
  instantiation; the signature covers the WIT attestation so the contract is tamper-evident.
- **Fail-closed.** Missing host binding ⇒ link failure (no silent degraded mode); missing required
  ligand ⇒ typed, audited `ligand: absent` guard-fail (§5), never an exception that leaks.
- **`registry.ragbaz.cc` reach** for management prefers the tailscale alias; CI publish over HTTPS
  through Cloudflare with Basic auth (AGENTS.md control-plane + credentials policy).

---

## 12. Phased implementation plan

Each phase ships a runnable artifact; later phases reuse earlier ones. Maps onto `glither-spec.md`
Phase 0–3 but scoped to *this* pipeline.

| Phase | Build | Deliverable | Status |
|---|---|---|---|
| **C0 — IR spine** | `roux`: pest grammar wired, lower to typed IR, phase inference, check diagnostics, IR snapshot + goldens | `tangle check` + `tangle snapshot` green on the example | ✅ **Complete** — 4 dialect fixtures, 51 tests, 3 codegen targets |
| **C1 — WIT derivation** | WIT codegen integrated into `roux::codegen::wit`; emit `.wit` for any ruleset; `tangle wit` subcommand | `tangle wit` produces the worked-example world (§14) | ✅ **Complete** — WIT output verified for all 4 dialects |
| **C2 — Rust codegen** | `roux::codegen::rust_` emits Rust source; `tangle rust` subcommand; `cargo check` compilation tests | Generated Rust compiles via `cargo check` | ✅ **Complete** — all 5 fixtures verified via `cargo check` |
| **C2b — WASM component** | `cargo-component` build pipeline; `glither-host` Wasmtime embedder; per-subsystem bindings | Component instantiated, `dispose` called, receipt collected | ⏳ **Not started** |
| **C3 — Gleam oracle + conformance** | `roux::codegen::gleam` emits Gleam source; differential comparison with Rust output | Gleam output verified for all 4 dialects | ✅ **Codegen complete** — conformance harness not yet built |
| **C4 — OCI + registry** | `tangle oci push`, cosign signing, digest-pinned pull-and-run | Signed component published to `registry.ragbaz.cc` | ⏳ **Not started** |

**Ordering principle:** prove the keystone (IR → WIT → link-checked component) on the *degenerate*
dialect (`glither.mail`, flat verdict, no ladders — sketch §11.3) before generalizing to the
ladder-bearing dialects (`segment`, `decision`). Defer static lattice refinements (§13) until the
runtime-checked spine ships.

---

## 13. Open seams (captured, not blocking)

- **Static ligand checking via WIT linking** (`glither-spec.md` Phase 3) — moving the §5.2/§5.6
  information-flow and freshness checks from runtime to link-time lattice refinements. This spec
  lands them as runtime checks + lints; the snapshot already carries the lattice data they need.
- **Dana attestation format** — the concrete signed [`no_retrograde` document](./dana-no-retrograde-sketch.md)
  and third-party diode verification (§5.3, `glither-spec.md` §13).
- **Gleam→wasm, if it ever lands** — were a native Gleam component backend to exist, the oracle
  could become a *second* production target; the IR/codegen split makes that a swap, not a rewrite.
- **Enrichment as a typed effect system** — produced-ligand ordering/freshness in the WIT import
  signatures (`glither-spec.md` §13).
- **Multi-ruleset / membrane-graph composition** ([`glither.world`](./glither-world-sketch.md)) — linking
  several components; out of scope until single-component publish is solid.
- **Registry GC / retention** — tag/digest lifecycle on `registry.ragbaz.cc`; an ops concern.

---

## 14. Worked example — `glither.mail`, end to end

The [`tangle gleam/wit/rust` commands](./glither-mailguard-example.md) are **implemented** (not just
planned). The [`mailguard.glith`](./glither-mailguard-example.md) ruleset (`#pragma dialect glither.mail ; fold first-match`)
drives every implemented phase:

1. **`tangle check`** ✅ — six rules lower to IR; all predicates infer **`⟨select⟩`** (no crossing
   phase — mail's degenerate case, sketch §11.3); `quarantine_*` rules infer
   `quarantine : Pending<{delivered, dropped}>` with the `after` deadline as the liveness witness;
   the others infer terminal boxes `delivered`/`dropped`. All structural checks pass: no
   unsatisfiable guards, no missing deadlines, no dead rules.
2. **`tangle gleam`** ✅ — emits a total-function oracle: `pub fn dispose(msg: Msg) -> Receipt`
   with nested `case`/`True ->`/`False ->` cascade. Regex predicates use `gleam/regexp`.
3. **`tangle rust`** ✅ — emits a production-ready Rust crate: `pub fn dispose(msg: Msg) -> Receipt`
   with `if/else` cascade and `regex::Regex::new`. Verified to compile via `cargo check`.
4. **`tangle wit`** ✅ — derives the `glither:mail` world: `world msg { export dispose: func(msg: msg) -> receipt; }`.
   Kebab-case field names, record types, and enum outcomes.
5. **`tangle snapshot`** ✅ — emits the typed IR as CBOR or JSON, suitable for introspection,
   golden-file comparison, and BAZ.Weave consumption.

Planned but not yet implemented: `build` (cargo-component → wasm component), `conform`
(differential comparison harness), `oci push` (registry publishing).

### Current output verification

- **Rust**: all 5 fixtures verified via `cargo check` in the test suite (compile-time assertion)
- **Gleam**: verified via string-assertion tests (structural correctness)
- **WIT**: verified via string-assertion tests (contract structure)
- **51 tests total, zero clippy warnings**

See the [worked example page](./glither-mailguard-example.md) for the full generated code.

This is the smallest end-to-end proof that the keystone (§1) holds: a domain DSL compiled to a
capability-sandboxed, attested, registry-published WASM component, with a readable oracle proving
the production component faithful.

---

*Design spec v1 — 2026-06-13. Updated 2026-06-16. C0–C2 codegen implemented: PEG grammar, typed IR,
crossing-phase inference, structural checks, dead rule detection, and dual codegen (Gleam oracle +
Rust production + WIT contract) are complete and verified. Next: WASM component build pipeline
(C2b), conformance harness (C3), and registry publishing (C4). `glither.mail` remains the
buildable first slice; `glither.decision`, `glither.segment`, and `glither.articles` are also
proven across all three codegen targets.*

The `glither.hft` dialect extends this compiler substrate for systematic trading strategies.
See [BAZ platform architecture](./baz-architecture) for the HFT-specific grammar, IR adaptations,
and host integration, and [BAZ.HFT](../products/baz-hft) for the product-level documentation.
