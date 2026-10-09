---
title: "doc.ragbaz — scope and future"
sidebar_label: "doc.ragbaz — scope and future"
description: "Proposal for what this site should contain: externalise the views, split out a document pipeline, and extend the design system to cover web surfaces."
---

# doc.ragbaz — scope, and a proposal for its future

Status: **proposal**. Nothing here is decided or implemented. Written after
surveying this repository, `ragbaz-common`, `www.ragbaz`, `design-system`, and
the book pipeline in `school-scarcity-wireless-hacking`.

## What this repository is today

A Docusaurus 3.10 site serving the **RAGBAZ Atlas** at `ragbaz.cc/doc/`, with a
Docker/nginx/HAProxy deployment bundle targeting the `konsonans` host. Roughly
150 MDX pages grouped into products, experiments, infra, research, private,
vendor, and an archive.

Three unrelated things share the tree:

1. **The Atlas** — hand-written and script-collected documentation. This is the
   real product.
2. **~6,350 lines of React view components** in `src/components/` —
   `HomepageFeatures`, `ColorPalette`, `ArchDiagram`, `DockerComposeView`,
   `PointCloudSphere`, `BoneLayout`, `CellularWidgets`, `ComposeSystemView`,
   `BAZaar`, plus a swizzled Navbar/Footer, a custom Prism theme, and 948 lines
   of `custom.css`. These are *views*, not documents.
3. **A numeric research library** in `scripts/` — 1,576 lines of dependency-free
   JavaScript: five colour encodings and the linearization trap
   (`lib/color.mjs`), exact-rational linear algebra (`lib/lin.mjs`), and a
   precision study judged against exact arithmetic with a committed baseline
   (`precision-study.mjs`, `precision-baseline.json`).

Worth correcting a common assumption: **item 3 is not scaffolding.** These are
finished, carefully argued numerical studies. `lin.mjs` self-tests to
`squaredError < 1e-20` against exact rationals, and the study's stated reason
for existing is that six earlier defects each produced "a finite, plausible,
wrong number" that a residual could not detect. It is misplaced in a docs site,
not incomplete.

## Why the split is worth making

- **Views are stranded.** `ColorPalette.tsx`, `theme-editor.mdx` and
  `font-chooser.mdx` are a *web* rendering of the design system, but they live in
  a docs site that had never been registered in frog and had no upstream remote
  until 2026-10-09. Meanwhile `design-system` owns `tokens.toml` and
  `themes.toml` (7 theme sections) and generates only Python and Rust
  projections — no CSS, no React, no HTML.
- **The document pipeline is reinvented per project.** The book already does
  MD → SVG → HTML with a figure manifest (`graphics/figure-specs.json`), per-figure
  alt text, renderer provenance, and synthetic-vs-measured labelling.
  `collect-descriptions.mjs` walks a source tree and emits an MDX section set.
  `library` builds a book into a Worker with a SHA-256 inventory manifest.
  Three pipelines, no shared contract.
- **`www.ragbaz` already exists** and is the ragbaz.cc main site (private,
  Next.js 15 + `@opennextjs/cloudflare`, serving `ragbaz.cc` and `www.ragbaz.cc`).
  This site serves `ragbaz.cc/doc/`. They are adjacent deployments with no
  shared component vocabulary and no token contract.
- **PDF is browser-print only.** The book instructs the reader to use
  "Print / save PDF" at A5/A4 and warns that "browser pagination varies". Every
  generated document inherits that.

## Proposal

### 1. Externalize the views to `www.ragbaz`

Move `src/components/`, `src/theme/`, `src/css/`, and the three view-draft pages
(`theme-editor`, `font-chooser`, `docker-compose-view`) into `www.ragbaz`, which
already is the web surface and already owns `ragbaz.cc`. Keep the non-visual
research notes in the Atlas.

This also resolves a latent conflict: `www.ragbaz` has no design-system
dependency today, and these components would force one — which is the point of
step 3.

### 2. A separate repository for document preparation

The durable part is the pipeline, not Docusaurus. A "document preparation
system" that lives *with* a site will keep being treated as a site concern.

```
source (MD/MDX, schemas, JSON)
  → preprocess     frontmatter resolve, includes, figure refs
  → derive         numbers, tables, graphs, alt text — from data
  → render         MD + derived fragments → document
  → emit           MD · SVG · HTML · PDF · MDX
```

What already exists and would move in, unchanged in intent:

| from | what |
|---|---|
| book `scripts/` + `graphics/figure-specs.json` | MD→SVG→HTML, figure manifest, renderer provenance |
| book `tools/figures/render-external.sh` | Docker and local modes writing the same named targets |
| this repo's `collect-descriptions.mjs` | source-tree walk → MDX section set |
| this repo's `scripts/lib/*.mjs`, `precision-study.mjs` | numeric studies with the `--verify` baseline discipline |
| `library` `build-scroll-manifest.mjs` | `ragbaz.artifact/0` + SHA-256 inventory |

The most valuable idea to generalise is the **`--verify` against a committed
baseline** pattern. The precision study and the book's manifest verifier both
do it, and both turn a claim into something checkable by a reader rather than by
the author. A pipeline where every derived artifact has a committed baseline is
what makes "derive data from schemas" trustworthy rather than merely plausible —
which is precisely the failure mode the precision study exists to prevent.

PDF is the one target with no precedent in the workspace and the largest new
dependency.

**This repository should not be created speculatively.** Building it before a
real document migrates through it would reproduce the fragmentation problem in a
new repository.

### 3. Extend the design system to cover all views

This is what makes 1 and 2 coherent rather than three independent decisions.
`generate.py` currently emits `ragbaz_design.py` and `ragbaz_design.rs`. It
should also emit:

- **CSS custom properties** — the single bridge from `tokens.toml` to every web
  surface, `www.ragbaz` included.
- **A theme/skin model** covering what the drafts already reach for:
  `theme-editor.mdx` and `font-chooser.mdx` are working prototypes for exactly
  this, and both are currently unreachable drafts.
- **Font pair variations** and a shared glyph/typographic scale. The terminal
  side already has a Nerd Font opt-in (`RAGBAZ_NERD_FONT=1`); the web side has
  no equivalent.

Consequence: `generated/` becomes the contract that `www.ragbaz`, the document
pipeline, `ragbaz-operator-tui`, `nostoi`, `frog` and `weftmark` all consume, and
a token change propagates to every surface instead of needing five edits. This
is the same "one projection, many consumers" argument the design system already
makes about its Python and Rust modules.

## On ragbaz-common

Recorded because it is easy to reach for the wrong repository.
`ragbaz-common` is **server-side Workers identity** — WebAuthn, passkeys, opaque
handles, hashed session tokens, Turnstile, an abuse gate, and `schema.sql`. It is
private with a single commit.

It is the right *model* for what is proposed — decisions extracted from one
product, decoupled from its config, consumed by several — and its `PROVENANCE.md`
is the pattern to copy for a document library's provenance story. But it has no
overlap with views, tokens, or rendering. It is not a candidate home for document
preparation or design-system work, and widening it would dilute a deliberately
narrow package.

## Options

| option | what you get | cost |
|---|---|---|
| **A** — views → `www.ragbaz`, pipeline → new repo | one authority per concern; design system gains web projections | a new repo; migrating view components that are still drafts |
| **B** — keep everything here, add the pipeline to this site | no migration | pipeline stays coupled to Docusaurus; numeric studies stay misfiled |
| **C** — pipeline into `www.ragbaz` too | no new repo | mixes a Next.js app with a document toolchain |

Recommendation is **A**.

## Sequencing

Cleanup, with no design decisions attached:

1. Delete `.scaffold-archive` — dead Docusaurus starter content.
2. Fix the README's `/data/src` and `../ragbaz-design-system` paths. The tree
   moved to `head/` and the sibling `ragbaz-design-system` does not exist here;
   the README still describes the old layout.
3. `doc.ragbaz` is now registered in frog (`git:55677d5a4eae8a71`).

Then the actual proposals, as two further items:

- **4.** Decide the fate of the numeric studies.
- **5.** Move views to `www.ragbaz`; create the document repository when it has
  a first real migration.

## Known build blocker

`npm run build` fails in this workspace, **on `main` as well as on local
commits**, with `MatchedAliasNotFound` for `@ragbaz-design-system`,
`@ragbaz/bazweave-theme/mdx`, `@ragbaz/bazweave-font/mdx`,
`@ragbaz/bazweave-kit/widgets` and `@font-chooser/mdx`. These alias to sibling
paths (`../experiments/bazweave-theme`, `../ragbaz-design-system`) that are not
present; `experiments/` contains only `never-created/`. The corresponding GitHub
repositories are private and not cloned here.

This is pre-existing and independent of the proposals above, but it does mean the
site cannot currently be built or deployed from this workspace, and it is worth
resolving before the pipeline is designed around building this site.

## Open questions

- Does the Atlas stay public? This repository is public on GitHub while serving
  `docs/private/` content. Worth confirming nothing sensitive is published.
- Is `ragbaz.cc/doc/` meant to merge into `www.ragbaz` long-term, or stay a
  separate subpath deployment? This determines whether this repository is a
  long-lived home or a staging area.
- Who owns the PDF target?
- Should `spec-phoneme-app.mdx` and `spec-audio-sink.mdx`, currently unreachable
  drafts, become real projects? See frog task `sensehub-dsp-spec-reconciliation`
  — the Phoneme spec describes the same DSP that `sensehub/dsp/` implements.
