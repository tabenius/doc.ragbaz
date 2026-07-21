---
title: "DetCordon — Monetization Surface Design (Internal)"
sidebar_position: 11.5
description: "Internal design spec: reconciling ragbaz.cc and doc.ragbaz.cc's DetCordon narratives and adding a real discovery-to-conversion path. Owner review pending."
---

# DetCordon — Monetization Surface Design

**Internal engineering design document — owner review pending, not a buyer-facing page.**
See [DetCordon](/products/detcordon) for the buyer-facing product page and the
[DetCordon prospectus](pathname:///prospectus/detcordon.html).

Source: committed to the `detcordon` repository on branch
[`design/detcordon-monetization-surface-spec`](https://github.com/tabenius/BAZ.detcordon/tree/design/detcordon-monetization-surface-spec/docs/superpowers/specs/2026-07-21-detcordon-monetization-surface-design.md)
([open a PR](https://github.com/tabenius/BAZ.detcordon/pull/new/design/detcordon-monetization-surface-spec)).

Generated: 2026-07-21 | Status: proposed (owner review pending)

## 1. Problem

DetCordon has no working discovery-to-conversion path for a buyer who has never
talked to the owner. Two public surfaces already carry DetCordon content, and
they disagree with each other and with reality:

| Surface | What it says about DetCordon | Accuracy |
|---|---|---|
| `doc.ragbaz.cc` (technical Atlas: [`docs/products/detcordon.md`](/products/detcordon) + [`static/prospectus/detcordon.html`](pathname:///prospectus/detcordon.html)) | Two-host WAF-tap containment platform (waf/waf-sink/waf-vm-supervisor/waf-deploy), Docker + Firecracker backends, 10 non-negotiable containment rules, $12,000–$150,000/year tiers (Appliance/Managed Lab/Enterprise), most P0/P1 roadmap items marked Implemented | Matches the real repo and `doc/commercial-handoff.md` |
| `ragbaz.cc` (public marketing site: `site/index.html#p-detcordon`, `site/prospects/detcordon.html`, `site/completion.html`) | A "sandbox / recorder / analyzer / feeder" pipeline for browser and headless-runtime malware detonation, €99–399/mo per node, **status: research, 42% complete** | Describes a different, earlier product concept. Wrong architecture, wrong pricing model and currency, wrong maturity signal |

`ragbaz.cc` — not `doc.ragbaz.cc` — is the actual public-facing company site: it
is the Cloudflare Worker deployed at the `ragbaz.cc` zone, built with Next.js +
OpenNext, with a D1-backed accounts/newsletter system and Resend-based
transactional email already wired up (`lib/accounts/email.mjs`). It is the
surface a cold prospect is most likely to land on. Right now it actively
undersells and misdescribes a product that the code review
(`doc/code-review-handoff.md`) already rates "production-ready for controlled
demo environments," with 105 passing tests and most of the buyer-priority P0/P1
backlog (`doc/buyer-priority-tasks.md`) already `Implemented`.

Beyond the content mismatch, neither surface gives a prospect anything to
click that leads anywhere. `ragbaz.cc`'s DetCordon card links only to
`/prospects/detcordon`, `/school/forensics`, and `/doc/` — no contact path, no
demo request, no pricing conversation starter. `doc.ragbaz.cc`'s prospectus
ends in a "Further Reading" list of file paths, not a live link to the
containment-assurance checklist or buyer-demo-runbook a diligence reviewer
would actually want to open. There is no way to know a prospect looked.

This design is scoped to closing that gap: **reconcile the two public
narratives, and give a prospect a real next step.** It is not a redesign of
either site and not a general commercial-offer/SKU design — that is
`detcordon-commercial-offer-sku` (frog, p3), addressed in §6.

## 2. Goals / Non-Goals

**Goals**
- One consistent DetCordon story across `ragbaz.cc` and `doc.ragbaz.cc`,
  matching the real product, real pricing frame, and real maturity.
- A working, low-friction way for an interested prospect to reach a human
  (pilot/demo request), using infrastructure that already exists.
- A visible link from the marketing-facing pitch to the diligence-grade proof
  (`containment-assurance.md`, `buyer-demo-runbook.md`) that already exists
  but currently sits unlinked inside the repo.

**Non-Goals**
- Self-serve checkout or automated provisioning. DetCordon's own non-goals
  (`doc/commercial-handoff.md` §9, `doc/containment-assurance.md` "Non-Goals")
  explicitly exclude multi-tenant SaaS deployment, and a two-host
  Firecracker/Docker containment appliance in the $12K–$150K/year range is not
  a self-serve-cart product — see §5 for why this is deliberately deferred.
- Rebuilding either site's framework, design system, or navigation.
- Deciding the final price. The existing $12K–$150K/year tiers
  (`doc/commercial-handoff.md`) are treated as the source of truth to
  reconcile toward; this design does not re-derive pricing.
- Anything under the other detcordon-buyer-roadmap backlog items (TLS,
  test coverage, tenant boundaries, HA sink, SLOs) — those are separate,
  already-tracked frog tasks and out of scope here.

## 3. Approaches considered

### A — Content reconciliation + a mailto CTA (recommended, do first)
Rewrite the DetCordon content on `ragbaz.cc` (`site/index.html#p-detcordon`,
`site/prospects/detcordon.html`, the `€99–399/mo per node` pricing line
wherever it appears) to match the real architecture, the real
$12K–$150K/year tiers, and a maturity signal consistent with
`doc.ragbaz.cc`'s "active prototype, most P0/P1 Implemented" story instead of
"research, 42%". Add a styled mailto CTA ("Request a pilot") pointing at a
dedicated address, and add live links from both the Atlas prospectus and the
`ragbaz.cc` prospect page to the containment-assurance and buyer-demo-runbook
content (published as real pages, not file-path text — see §4).

- **Cost:** content-only edits to existing static HTML/Markdown files, no
  new service, no new infrastructure, no new secrets.
- **Risk:** near zero. No new attack surface, no payment handling, nothing
  that touches the AGENTS.md API security baseline.
- **Gap it leaves:** no structured intake — replies land in an inbox, not a
  queryable record. No signal for "how many people looked."

### B — Structured lead-capture form on top of A (recommended, do second)
Add a small intake form on `ragbaz.cc` (e.g. `/contact?product=detcordon`, or
a form embedded on the prospect page) that posts to a new Worker route,
storing the lead in the existing D1 database (reusing the accounts/newsletter
D1 pattern already in this repo) and sending a notification through the
existing `sendEmail()` helper (`lib/accounts/email.mjs`, Resend-backed) to a
sales inbox, plus an acknowledgement to the prospect that links the same
containment-assurance / buyer-demo-runbook proof.

- **Cost:** moderate — one new Worker route, one D1 migration (a `leads` or
  `pilot_requests` table), a small form, and the submission-endpoint
  hardening the AGENTS.md API security baseline requires (rate-limiting,
  server-side validation, no raw error messages back to the caller).
- **Risk:** low-moderate. New unauthenticated POST endpoint = new surface;
  must be rate-limited and validated per the workspace's standing API
  security baseline before it ships.
- **Gap it leaves:** still no SKU/checkout — intentional, see §5.

### C — Self-serve checkout / real SKU (rejected for now)
Wire a purchasable SKU (Stripe or similar) for the entry appliance tier
directly into `ragbaz.cc`'s pricing/completion surface and
`ragbaz.component.json`'s `commercial` block, so the lowest tier is buyable
without a human in the loop.

- **Cost:** high — payment handling, webhook signature verification,
  server-side price validation (mandatory per the AGENTS.md API security
  baseline), and reconciling the `detcordon-commercial-offer-sku` backlog
  item's full scope (tiered offer + support tier + `ragbaz.component.json`
  reconciliation + lifecycle bump prototype→production).
- **Why rejected here:** it doesn't match the actual buying motion for this
  product. A $12K–$150K/year two-host containment appliance requiring
  Firecracker/Docker operational setup is an enterprise sale — demo, pilot,
  procurement, contract — not a checkout button. Building self-serve
  purchase now would misrepresent the product's actual delivery model and is
  inconsistent with its own stated non-goals (not multi-tenant SaaS). This is
  exactly why `detcordon-commercial-offer-sku` is already correctly scored
  p3/idea rather than p0/p1 in the buyer roadmap — nothing found during this
  design changes that judgment. Approaches A and B produce the qualified-lead
  volume that would justify revisiting C later.

## 4. Design detail

### 4.1 Content reconciliation (Approach A)

Files to change, all on `ragbaz.cc`:

- `site/index.html` — the `#p-detcordon` product article block: replace the
  sandbox/recorder/analyzer/feeder description with the real two-host
  WAF-tap/waf-sink architecture (reuse the "Data flow" summary already
  written for `doc.ragbaz.cc/docs/products/detcordon.md`), replace
  `42% complete` / `research` with a status consistent with the Atlas page
  ("active prototype" plus a completion figure the owner confirms — see open
  decision in §7), replace `€99–399/mo per node` with the real
  $12,000–$150,000/year tier language.
- `site/prospects/detcordon.html` — same reconciliation applied to the
  status-grid cards (status, completion, current value, finished estimate)
  and the "What is done / What is left / Commercial frame" prose. Add the
  "Request a pilot" CTA (§4.2) into the existing CTA row alongside "Open
  product line" / "Open forensics school" / "Read docs".
- `site/completion.html` and any shared `/metadata/products.json` feeding
  both `index.html` and `completion.html` — update the same completion/value
  fields so the two pages don't drift again independently. (Confirm at
  implementation time whether these pages read the JSON file live or embed
  static numbers per page; reconcile whichever is authoritative and remove
  the duplicate source if both currently hardcode it.)

On `doc.ragbaz.cc`:

- `docs/products/detcordon.md` and `static/prospectus/detcordon.html` — add a
  "Request a pilot" CTA (§4.2) near the existing "Commercial position"
  section, and replace the "Further reading" plain-text file-path references
  with real links to published equivalents (§4.3) where a public-safe version
  exists.

### 4.2 CTA (Approach A, ships now)

A single mailto link styled as a primary button, e.g. an anchor tag with
`href="mailto:detcordon@ragbaz.cc?subject=DetCordon%20pilot%20request"` and
the label "Request a pilot".

Open decision: which address (§7). If RAGBAZ's existing mailstack/mailguard
infrastructure (`products/mailstack`, already running per `/data/src/AGENTS.md`)
can provision a new alias cheaply, prefer a dedicated `detcordon@ragbaz.cc`
over routing through a generic `sales@` inbox, so replies are easy to filter
and eventually feed the D1 lead table in Approach B without re-plumbing.

### 4.3 Publishing the diligence trail (both surfaces)

`doc/containment-assurance.md` and `doc/buyer-demo-runbook.md` are already
written to be safe for outside readers (no secrets, no sample bodies, no
live infrastructure values — each says so explicitly). They currently exist
only inside the `detcordon` repo. Publish public-safe copies as new pages
under `doc.ragbaz.cc/docs/products/detcordon/` (e.g.
`containment-assurance.md`, `buyer-demo-runbook.md`), linked from both the
Atlas product page and the `ragbaz.cc` prospect page. This turns "trust me"
prose into something a reviewer can actually click through to, matching the
existing publish-to-doc.ragbaz.cc convention this workspace already uses
for review-gated specs (this very page is an instance of that convention).

Do not publish `doc/code-review-handoff.md` externally — it is an internal
engineering review (unpatched findings, file:line references) and is out of
scope for a buyer-facing surface.

### 4.4 Structured intake (Approach B, ships next)

- New Worker route, e.g. `POST /api/leads`, in `ragbaz.cc`'s existing Next.js
  route-handler style (the `app/[...path]/route.js` pattern already used for
  HTML serving; a dedicated API route sits alongside it).
- New D1 table (migration alongside the existing `migrations/` in
  `ragbaz.cc`), minimally: `id, created_at, product, name, email, org,
  message, source_path`. Reuse the existing D1 binding rather than adding a
  new database.
- On submit: insert the row, then call the existing `sendEmail()` helper
  (`lib/accounts/email.mjs`) to notify the sales inbox and send the prospect
  an acknowledgement email linking the containment-assurance/buyer-demo-runbook
  pages from §4.3.
- Must satisfy the AGENTS.md API security baseline before shipping:
  rate-limit the endpoint, validate/size-bound all fields server-side, never
  echo raw error messages back to the caller, and do not trust any
  client-supplied identifier as authorization for anything.
- Form fields kept minimal (name, email, org, one free-text field) — this is
  a lead-capture form, not an onboarding flow.

## 5. Non-goal detail: why not wire a SKU now

Restated from §3C for visibility: `detcordon-commercial-offer-sku` (frog,
p3, `workflow_status: idea`) already anticipates this exact next step —
"Define the tiered offer and support tier, wire it to a real SKU, and
reconcile `ragbaz.component.json` + the ragbaz.cc pricing/completion
surface." Nothing found while researching this design contradicts that
task's own scoping. The right sequencing is: ship A and B, see whether pilot
requests materialize and what buyers actually ask for during the resulting
conversations, then revisit whether a real SKU (and which tier) is worth
wiring. Approach C is not "harder so skip it" — it is premature relative to
the product's actual enterprise sales motion, and building it now risks
locking in a self-serve pricing/packaging shape before a single real pilot
conversation has happened.

## 6. Build sequence

1. **A — content reconciliation** (`ragbaz.cc` + `doc.ragbaz.cc`, docs-only):
   fix the architecture/pricing/maturity mismatch, add the mailto CTA,
   publish containment-assurance/buyer-demo-runbook to the Atlas, link both
   surfaces to them. No new code, no new secrets, ships fast.
2. **B — structured intake**: Worker route + D1 migration + form +
   Resend notification, hardened per the API security baseline.
3. Only after A and B are live and have produced real inbound interest:
   revisit `detcordon-commercial-offer-sku` (C) with actual buyer signal
   informing which tier to wire first.

## 7. Open decisions for the owner

- **Contact address**: dedicated `detcordon@ragbaz.cc` alias (via mailstack)
  vs. routing through an existing generic sales/contact inbox. Assumed:
  dedicated alias, for cleaner filtering and future automation — confirm or
  override.
- **Public completion/maturity figure**: `ragbaz.cc`'s "42% complete /
  research" is clearly stale, but this design does not pick the replacement
  number — that is a judgment call about how much of the buyer-roadmap
  backlog (frog `detcordon-buyer-roadmap`, mostly still `idea`) counts
  toward "done" for a public completion percentage. Assumed: reword away
  from a bare percentage toward the Atlas page's existing
  Implemented/Planned framing, which is already accurate and doesn't require
  picking a number — confirm or override.
- **`/metadata/products.json` vs. per-page hardcoding**: this design assumes
  `ragbaz.cc` has (or should have) one authoritative source for
  completion/value/pricing metadata per product, feeding both `index.html`
  and `completion.html`; implementation should confirm which is currently
  true and fix the drift if both are hardcoded independently.
- **Whether to also reconcile other stale prospect pages** (mailroute,
  articulate, baz-signal-stack, matches all use the same status/completion/
  value card template): out of scope for this DetCordon-specific design, but
  the same staleness pattern likely exists there too — flagged for a
  separate pass, not addressed here.
