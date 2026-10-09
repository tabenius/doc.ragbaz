# doc.ragbaz.cc — RAGBAZ Atlas

The documentation atlas for the RAGBAZ workspace: products, experiments,
infrastructure, private research, archives, and vendored code. Built with
[Docusaurus](https://docusaurus.io/) and published at
**[doc.ragbaz.cc](https://doc.ragbaz.cc)**, served under the `ragbaz.cc/doc/`
path.

Source of truth lives in `docs/` as Markdown; the rendered site is generated at
build time.

## Structure

- `docs/` — the atlas content, grouped into Products, Experiments,
  Infrastructure, Private, Archive, and Vendor (see `sidebars.ts`).
- `src/` — custom homepage and theme CSS.
- `static/` — static assets and brand kit.
- `scripts/` — dependency-free numeric studies (colour encodings, exact-rational
  linear algebra) used by the research notes; `npm run precision:verify`.
- `docusaurus.config.ts` — site config (dark-mode, navbar, footer).
- `deploy/` — production deployment bundle (nginx container + HAProxy snippet);
  see `deploy/README.md`.

## Local development

```bash
npm install
npm run start      # dev server with live reload
npm run build      # production static export into build/ (validates links)
npm run serve      # serve the built site locally
```

`onBrokenLinks` is set to `throw`, so a successful `npm run build` also
validates that every sidebar entry and internal link resolves.

### Known blocker

`npm run build` currently fails with `MatchedAliasNotFound` for
`@ragbaz-design-system`, `@ragbaz/bazweave-theme/mdx`,
`@ragbaz/bazweave-font/mdx`, `@ragbaz/bazweave-kit/widgets` and
`@font-chooser/mdx`. Those alias to sibling paths in `docusaurus.config.ts`
(`../ragbaz-design-system`, `../experiments/bazweave-theme`) that are not present
in this workspace; the corresponding repositories are private and not cloned.
`npm run typecheck`, `npm run lint:md` and the numeric self-tests all pass. See
[docs/research/doc-ragbaz-scope-proposal.md](docs/research/doc-ragbaz-scope-proposal.md)
for the full write-up and the wider scope proposal.

## Deployment

Production hosting is handled by the bundle in `deploy/` on the konsonans host:
build the static export, bake the nginx image, run it on `127.0.0.1:8890`, and
route `doc.ragbaz.cc` to it via HAProxy. See `deploy/README.md` for the full
procedure.
