---
sidebar_label: glither.world (composition)
description: The glither.world meta-dialect — membrane-graph composition of compiled glither components.
---

# `glither.world` — membrane-graph composition (meta-dialect sketch)

**Status:** design sketch, non-normative. Companion to `glither-spec.md` (the architecture) and
`docs/superpowers/specs/2026-06-13-glither-wasm-wit-compiler-design.md` (the compiler). Section
refs `§N` point at `glither-spec.md` unless noted. Fleshes out the §6 "later" dialect
`glither.world` and the compiler-spec §13 open seam *"Multi-ruleset / membrane-graph composition."*

---

## 0. One paragraph

Every other dialect (`mail`, `segment`, `decision`, `api`, `flow`) disposes of *artifacts crossing
one membrane*. `glither.world` is the **meta-dialect** whose artifact **is a membrane** (a compiled
`glither.*` component) and whose disposition is **how membranes wire to each other** — link,
compose, or refuse. A `glither.world` ruleset is a *policy over a graph of components*: it selects
components, guards each candidate **Pour → Pier** wiring against the same ligand/guarantee
discipline the inner dialects use, and emits a **composed membrane graph**. Because the substrate
is the WASM component model, composition is real linking (via `wac`), and an unsatisfiable wiring is
a **compose-time failure**, not a runtime stall — the §1 keystone, lifted from one membrane to the
graph.

---

## 1. Why a meta-dialect at all

The inner dialects answer *"may this artifact cross this membrane, and into what state?"*. A real
deployment is many membranes: a `glither.mail` verdict feeds a `glither.flow` redactor feeds a
`glither.segment` seeder; a `glither.decision` escalation crosses to a council surface. Someone must
answer the **next** question: *"which membranes connect to which, under what guarantees, and is the
resulting wiring sound?"* That is a disposition problem with the exact shape `glither` already
solves — so it is a dialect, not a new subsystem.

| inner dialect | `glither.world` |
|---|---|
| artifact = message / segment / decision | artifact = **component** (a membrane) |
| guard = ligand predicates over the artifact | guard = **wiring predicates** over a Pour→Pier edge |
| disposition = route / wrap / convene … | disposition = **link / compose / refuse / isolate** |
| terminal = delivered / live / assented … | terminal = **linked / refused** |
| keystone = unsatisfiable guard ⇒ link failure | keystone = unsatisfiable wiring ⇒ **compose failure** |

---

## 2. Artifact, verbs, states

**Convention** (sketch §11): `a < b` is a ladder; `{a, b}` a resolution set.

| | |
|---|---|
| artifact | a **component** (its derived WIT world = its membrane contract), or a candidate **edge** `(Pour.export → Pier.import)` |
| verbs | `link <pour> to <pier>` · `compose <graph>` · `isolate <component>` (tight junction) · `refuse` |
| ladders | `guarantee` (`none < transport < envelope-verified < disposition < promotion`, §4) |
| suspended † | `negotiating : Pending<{ linked, refused }>` — a Wish/Offer negotiation awaiting a satisfiable level |
| boxes | `linked` · `refused` |
| fold | `accumulate` (a world admits *many* edges; fan-out across audiences = subgraphs per tenant/region) |

A `glither.world` ruleset names a set of components and the edges it will permit between them; the
compiler resolves each edge to `linked` or `refused`, and the accumulated `linked` set **is** the
membrane graph.

---

## 3. The wiring guard — Pour ⟂ Pier, by construction

An edge `(Donor.Pour.export, Receiver.Pier.import)` is **linkable** iff the export's WIT type
*satisfies* the import's required type — exactly the component-model's own linking check. On top of
that structural check, `glither.world` layers the spec's negotiation:

1. **Type satisfaction** — `export ⊒ import` in the WIT type lattice (the component model enforces
   this; we surface a readable diagnostic instead of a raw linker error).
2. **Transport-mode compatibility** (§4 matrix) — the Donor's `delivery` × the Receiver's
   `retrograde` must resolve to `ok` or a guarantee, never an error. `acked × diode` is refused at
   wiring time (the biophysically-impossible cell).
3. **Guarantee negotiation** — `Wish ⊓ Offer` picks the highest mutually-available level; an
   unsatisfiable Wish ⇒ `refuse` (or a lint, per policy).
4. **Attestation gate** — an edge may require the Donor to carry a verified attestation (e.g.
   *"only link to a Pier whose component is a signed Dana membrane"* — see the
   [Dana / `no_retrograde` sketch](./dana-no-retrograde-sketch.md)).

```glither
#pragma dialect glither.world ; fold accumulate

group cleared_piers = components | dialect == glither.segment | attested.clearance >= restricted

rule seed_from_mail =
  edge | donor.dialect == glither.mail            // ⟨select⟩
       | pour.export ~ /verdict/                   // ⟨select⟩
       | pier in cleared_piers                     // ⟨crossing · attestation · audited⟩
       | guarantee.offer >= disposition            // ⟨crossing · Wish⊓Offer · audited⟩
  => link pour to pier
     negotiating
       on    wac.compose.ok     into linked
       after 0s                 into refused (reason = unsatisfiable_wiring)

rule dana_only_to_fleet =
  edge | pier.dialect == glither.segment | pier.region != donor.region   // ⟨select⟩
       | donor.attested.no_retrograde                                     // ⟨crossing · Dana vow · audited⟩
  => link pour to pier into linked
rule cross_region_default =
  edge | pier.region != donor.region | not donor.attested.no_retrograde   // ⟨select⟩
  => into refused (reason = cross_region_requires_dana)
```

The `negotiating` suspended state mirrors the inner dialects' `quarantine`/`occluded`: it carries a
liveness obligation, and its only legal settlements are `linked`/`refused`.

---

## 4. Composition mechanism

The committed substrate is the **WebAssembly Composition** toolchain (`wac` / `wasm-compose`), the
component-model-native way to wire components by satisfying one's imports with another's exports.

- A `glither.world` ruleset lowers (in the C-series compiler) to a **composition plan**: an ordered
  list of `linked` edges plus the components they wire.
- The plan is realized two ways, selectable per deployment:
  - **Static compose** — emit a `wac` graph and produce a *single composed component* whose own WIT
    world is the graph's outer contract (derived, signed — §6 of this sketch). Best for sealed,
    attestable bundles.
  - **Host orchestration** — emit a manifest the `glither-host` (compiler-spec §7) reads to
    instantiate components and wire imports↔exports at runtime. Best for hot-swap / per-crossing
    ephemerality and Dana per-instance lifecycle.
- **Unsatisfiable wiring = compose failure.** A `linked` edge whose types don't satisfy makes `wac`
  fail; `glither.world` catches it and reports `refused (reason = unsatisfiable_wiring)` with the
  offending interface — the keystone at graph scale.

---

## 5. The membrane graph as a typed object

The accumulated `linked` set is a directed graph: nodes = components (membranes), edges = Pour→Pier
wirings tagged with their negotiated transport mode and guarantee level. This graph is itself
**introspectable** (the BAZ.Weave move, §14): the compiler derives the graph's PlantUML topology,
its outer WIT world (the imports no inner component satisfies + the exports the graph offers), and
its **minimum capability set** (the union of unsatisfied imports = the authority the host must
grant). A Dana edge appears as a **uniport arrow with no back-edge** — visible in the diagram and
provable from the absence of a retrograde export.

---

## 6. Attestation of a composed graph

A composed graph gets the same treatment as a single component (compiler-spec §5.3): its derived
outer WIT world is canonicalized and hashed, the composed `.wasm` (static-compose) or the manifest
(orchestration) is content-addressed, and the pair is **cosign-signed**. The signed graph
attestation additionally records, per edge, the negotiated transport mode and guarantee level, and
**flags every Dana edge** so a verifier can check the corresponding `no_retrograde` vows
([Dana sketch](./dana-no-retrograde-sketch.md)). A third party can then verify *the whole
deployment's information-flow shape* from signed artifacts alone.

---

## 7. Relationship to the other dialects

- `glither.world` does not replace the inner dialects; it **composes** their compiled components.
- It reuses the **same lattices** (`guarantee`, and the Denning clearance lattice for cross-edge
  flow), so an illegal *down*-flow across an edge is the same type error as inside a rule (§5).
- Dana / `no_retrograde` is the edge-level guarantee `glither.world` most depends on for
  multi-tenant fleets (§11.4 enterprise value): cross-boundary sharing *with* provable no-leak.

---

## 8. Open questions (to ratify)

- **Static-compose vs host-orchestration default** — which is primary, and can one ruleset mix
  both (sealed sub-bundles wired at runtime)?
- **Edge artifact identity** — is the artifact the `(Pour, Pier)` pair, or the component with its
  edges as sub-artifacts? Affects how `fold accumulate` fan-out reads.
- **Graph-level liveness** — does `negotiating` need a real deadline, or is compose synchronous
  (settles immediately)? Probably synchronous for static-compose, deadline-bearing for negotiated
  runtime links.
- **Cycle policy** — are cyclic membrane graphs permitted (mutual import/export), and what does a
  cycle mean for attestation and the minimum-capability derivation?
- **Versioning / hot-swap** — replacing one node in a deployed graph: re-attest the whole graph, or
  attest a diff?

---

*Design sketch — the meta-dialect that makes "compile domain dialects to WASM components" into
"compose a whole verifiable membrane graph." Builds on the proven substrate (`wac`, component
linking); the novel surface is the wiring guard and the graph attestation.*

See [glither WASM/WIT compiler spec](./glither-wasm-wit-compiler-spec.md) for the compiler substrate this composes over, and [dana / no\_retrograde sketch](./dana-no-retrograde-sketch.md) for the one-way membrane attestation model.
