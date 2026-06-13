---
sidebar_label: Dana / no_retrograde
description: The Dana one-way membrane and the signed no_retrograde attestation, verifiable from the WIT world.
---

# Dana & the `no_retrograde` attestation (sketch)

**Status:** design sketch, non-normative. Companion to `glither-spec.md` (§3 lexicon, §4 membrane
matrix, §13 seam) and `docs/superpowers/specs/2026-06-13-glither-wasm-wit-compiler-design.md` (§5.3
attestation, §13 seam). Fleshes out *"the concrete signed `no_retrograde` (Dana vow) document and
how a third party verifies a diode claim from the WIT world."*

---

## 0. One paragraph

A **Dana** membrane is the pure one-way gift: a component that **imports** (receives Grout) but
exports **nothing that carries data back to the donor** — passive uniport, no retrograde ACK, no
side-channel (tight junction). The value is multi-tenant fleet intelligence-sharing *without*
cross-boundary leakage (§11.4): a donor can pour into a receiver and **prove** the receiver cannot
talk back. The `no_retrograde` attestation is the signed, third-party-verifiable document that makes
that proof. Its core claim is **structural and checkable, not merely asserted**: a Dana membrane's
WIT world has no retrograde export, so the diode property is *visible in the contract the component
actually compiles against* — the attestation binds a signature to that structural fact plus the
component hash.

---

## 1. What "Dana" means precisely (§3, §4)

| property | meaning | how it shows up |
|---|---|---|
| **passive uniport** | one-way influx; no coupled counter-species | WIT world: `import`s only; no data-returning `export` |
| **no retrograde** | no ACK / receipt channel back to the donor | no export interface that the donor binds |
| **tight junction** | no paracellular / side-channel crossing | no WASI capability that could exfiltrate (no sockets, no fs, no clock-as-covert-channel) |
| **passive energy mode** | downhill; no attestation-powered uphill transport | no active-transport import |

From the §4 matrix, Dana is exactly the cell `delivery = fire_and_forget` × `retrograde = diode` ⇒
guarantee **`SECURE_ONEWAY`**. The `acked × diode` cell is biophysically impossible (a diode passes
no counter-species), so a valid Dana component **cannot** also claim an ACK — the attestation
asserts the delivery mode to close that off.

> Note on "imports only": a Dana component may still emit a **host-side receipt** for audit (the
> donor never sees it). The discriminator is *direction*: a retrograde export is one the **donor**
> binds; a host receipt is one the **host** collects and never returns. The structural check (§3)
> is about the *donor-facing* surface of the world.

---

## 2. The vow is verifiable from the WIT world

This is the crux. Because the compiler **derives** the WIT world from the IR (compiler-spec §5),
the world is not marketing — it is the exact contract the component links against. So:

- A retrograde channel can only exist if the world declares a donor-bound **export** carrying data
  back. A Dana world declares **none**. Therefore *the absence of a retrograde export in the signed
  world is a proof of the diode property* — by construction, the component has no way to expose one.
- Conversely, any component claiming Dana while exporting a donor-facing data interface **fails the
  structural check**, regardless of what its vow says. The signature cannot launder a contradiction.

This is why the attestation signs *the WIT world*, not a prose promise: the promise is mechanically
re-derivable and re-checkable.

---

## 3. The `no_retrograde` document

A detached, signed JSON document (a Sigstore/`cosign` *attestation*, in-toto-style predicate). One
per attested component; published alongside the OCI artifact (compiler-spec §8) as a referrer.

```json
{
  "_type": "https://glither.ragbaz/attestation/dana/v1",
  "subject": [
    {
      "name": "registry.ragbaz.cc/glither/segment/fleet-seed",
      "digest": { "sha256": "<component .wasm content hash>" }
    }
  ],
  "predicate": {
    "claim": {
      "no_retrograde": true,
      "tight_junction": true,
      "delivery": "fire_and_forget",
      "energy_mode": "passive",
      "guarantee": "SECURE_ONEWAY"
    },
    "wit": {
      "world": "glither:segment/dana-fleet@0.1.0",
      "canonical_hash": "sha256:<hash of canonicalized world text>",
      "donor_facing_exports": [],
      "imports": ["glither:roux/types", "glither:segment/enrich"]
    },
    "capabilities": {
      "wasi": [],
      "sockets": false,
      "filesystem": false,
      "clock": false
    },
    "issuer": "ragbaz-glither-ci",
    "compiler": { "roux": "0.1.0", "target": "wasm32-wasip2" },
    "issued_at": "2026-06-13T00:00:00Z"
  }
}
```

The whole document is signed (cosign keyless via Fulcio, or a pinned key per AGENTS.md
credentials policy); the signature covers `subject` (the component digest) **and** the `predicate`
(the claim + WIT facts). `donor_facing_exports: []` is the machine-checkable heart of the vow.

---

## 4. Third-party verification algorithm

Given a pulled component, its `no_retrograde` document, and the registry, a verifier (the host
before instantiation, or an auditor) runs:

1. **Signature** — verify the cosign signature; check the issuer against the allowed-issuer policy
   (Fulcio identity or pinned key). Reject if unsigned/untrusted.
2. **Subject binding** — recompute the component `.wasm` sha256; assert it equals
   `subject[].digest.sha256`. (The vow is about *this* artifact, not a look-alike.)
3. **WIT re-derivation** — extract the component's embedded WIT world, canonicalize it, hash it;
   assert it equals `predicate.wit.canonical_hash`. (The signed world is the real world.)
4. **Structural diode check** — walk the world's exports; assert **no donor-facing export carries
   data back** (the only permitted exports are host-collected receipts marked as such). This is the
   proof, not the prose `no_retrograde: true`.
5. **Tight-junction check** — assert the component requests **no** capability that forms a
   side-channel: no sockets, no preopened fs, no ambient clock beyond a coarse audited one. Cross-
   check against `predicate.capabilities` *and* the actual component imports (don't trust the
   field alone).
6. **Mode consistency** — assert `delivery == fire_and_forget` and the world declares no ACK import
   (the impossible `acked × diode` cell is excluded).

Pass ⇒ the verifier may treat the component as a trustworthy diode and (in `glither.world`) permit
a cross-boundary edge to it. Any step failing ⇒ the Dana claim is **rejected**, fail-closed
(compiler-spec §11).

> Steps 2–5 are the load-bearing ones: they make the vow *adversarial-safe*. A malicious publisher
> cannot ship a back-channel and a `no_retrograde: true` field — step 4 inspects the actual world,
> step 5 the actual capabilities, both re-derived from the signed artifact.

---

## 5. Relationship to `glither.world`

A `glither.world` edge (the [composition sketch](./glither-world-sketch.md)) can **require** a Dana
vow on the receiver before permitting a cross-boundary link:
`pier | donor.attested.no_retrograde => link …`. The graph attestation then records the edge as a
**uniport / no-back-edge** arrow, so the *whole deployment's* leak-freeness is checkable from signed
artifacts. Dana is the edge-guarantee that the multi-tenant fleet story (§11.4) is built on.

---

## 6. Open questions (to ratify)

- **Receipt vs retrograde discriminator** — the exact WIT convention that marks an export as a
  *host-collected receipt* (allowed) vs a *donor-facing return* (forbidden). Candidate: a reserved
  interface name / annotation the deriver emits and the verifier keys on.
- **Side-channel completeness** — clocks, memory-pressure, timing: how far does "tight junction"
  go, and which are out of scope for a structural check vs runtime sandbox policy?
- **Revocation & freshness** — TTL on a vow, transparency-log inclusion (Rekor), and how a verifier
  learns a previously-valid vow was revoked.
- **Predicate type URI** — pin the in-toto predicate type and version; align with Sigstore bundle
  format so standard tooling verifies it.
- **Audited host receipts** — formalize that a Dana component *may* emit host-only receipts (for
  the donor's audit trail, delivered out-of-band) without that counting as retrograde.

---

*Design sketch — the document that turns "trust me, it's one-way" into "here is the signed world;
check it yourself." The diode is provable because the WIT world is derived, signed, and
structurally inspectable.*
