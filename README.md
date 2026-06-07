# doc.ragbaz.xyz — RAGBAZ Atlas

The documentation atlas for everything under `/data/src`: products, experiments,
infrastructure, private research, archives, and vendored code. Built with
[Docusaurus](https://docusaurus.io/) and published at
**https://doc.ragbaz.xyz**.

Source of truth lives in `docs/` as Markdown; the rendered site is generated at
build time, following the RAGBAZ design system and docs policy in
`/data/src/AGENTS.md`.

## Structure

- `docs/` — the atlas content, grouped into Products, Experiments,
  Infrastructure, Private, Archive, and Vendor (see `sidebars.ts`).
- `src/` — custom homepage and theme CSS.
- `static/` + `../ragbaz-design-system/assets` — static assets and brand kit.
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

## Deployment

Production hosting is handled by the bundle in `deploy/` on the konsonans host:
build the static export, bake the nginx image, run it on `127.0.0.1:8890`, and
route `doc.ragbaz.xyz` to it via HAProxy. See `deploy/README.md` for the full
procedure.
