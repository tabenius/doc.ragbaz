---
title: WP WASI
sidebar_position: 11
description: Per-tenant WordPress GraphQL hosts packaged as OCI WASI artifacts.
---

# WP WASI

Path: `experiments/wp-wasi`

`wp-wasi` is the proposed secure-hosting experiment for running WordPress as a
bounded, per-tenant WASI workload. The intended OCI WASI artifact is the
WordPress API host, not the public HTML frontend.

## Correct target

The shared target is:

```text
OCI WASI artifact:
  WordPress + PHP/WASM + SQLite + WPGraphQL
  = headless WordPress API host

separate frontend/renderers:
  Next.js
  Python
  Rust
  static generator
  optional WASI HTML renderer
  anything that consumes GraphQL
```

The HTML renderer may be a future artifact, but it is not the primary security
or packaging target. The first goal is to package and run the WordPress GraphQL
host itself as an isolated OCI WASI workload.

## Security premise

The operating assumption is hostile tenancy:

- a tenant may be hostile,
- a tenant team member may be compromised,
- an approved plugin may still contain a vulnerability,
- WordPress and its plugin/theme ecosystem are the usual security bottleneck,
- one tenant compromise must not become host compromise,
- one tenant compromise must not affect other tenants,
- a compromised user inside one tenant should have bounded impact on that
  tenant as a whole.

This makes WASI attractive less for speed and more for containment,
reproducibility, and disposability.

## Runtime model

Each tenant should get a separate WordPress API workload:

```text
request
  -> gatekeeper
     -> tenant resolver / domain policy
     -> isolated wp-wasi GraphQL host
        - PHP/WASM
        - WordPress
        - WPGraphQL
        - SQLite mount
        - approved plugins only
        - constrained WASI filesystem/network
     -> external upload service
     -> external scheduler
     -> frontend of choice
```

Provider-owned policy remains outside WordPress. WordPress should not own public
ingress, upload trust, scheduler authority, or arbitrary outbound network
access.

## Isolation requirements

Per-tenant isolation should include:

- one WASI instance or instance pool per tenant,
- one SQLite database namespace per tenant,
- one upload namespace per tenant,
- separate cache keys and invalidation tags,
- separate scheduler identity,
- separate secrets,
- separate logs and audit trails,
- no shared mutable WordPress process between tenants.

The WordPress runtime should be mounted mostly read-only. Tenant writes should
be constrained to SQLite state and controlled media metadata.

## Plugin and theme policy

Tenant admins should not be able to install, edit, or mutate arbitrary plugins
and themes.

Approved plugins should be:

- pinned by version,
- vulnerability checked,
- tested against SQLite,
- tested against PHP/WASM,
- free of shell/process execution assumptions,
- free of broad filesystem assumptions,
- compatible with external uploads and external scheduling.

The default approved set should stay small:

- WordPress core,
- SQLite integration,
- WPGraphQL,
- RAGBAZ mu-plugin policy pack,
- optional ACF/WPGraphQL ACF only after the base GraphQL path is stable.

## Files, uploads, and scheduler

Uploads should be externalized:

1. the tenant admin uploads through gatekeeper or a dedicated upload service,
2. Rust validates size and magic bytes,
3. the object is stored in R2, S3, or another object backend,
4. WordPress receives metadata through a private media-ingest endpoint,
5. GraphQL exposes public media URLs from the object backend.

WP-Cron should not be the production scheduler. The scheduler should be an
external service with explicit tenant identity and provider policy.

External scheduled work includes:

- scheduled publishing,
- cache invalidation,
- GraphQL schema health checks,
- Litestream backup and restore checks,
- plugin vulnerability scans,
- email queue delivery if enabled.

## SQLite and Litestream

SQLite is the tenant-local database. Litestream should normally run as a
separate sidecar/process, not inside the WASI WordPress artifact.

The desired model is:

- one writer per tenant database,
- restore before runtime start,
- replicate continuously while the tenant runtime is active,
- snapshot before destructive admin operations,
- keep provider-managed recovery independent of WordPress admin access.

## Relationship to gatekeeper

`products/articulate/gatekeeper` remains the policy and ingress layer.

It already provides many of the pieces this experiment should reuse:

- domain and subdomain routing patterns,
- `/graphql` and `/wp-json*` routing,
- GraphQL depth, complexity, and pagination guardrails,
- upload validation and media ingest,
- reverse-proxy samples,
- metrics and logs,
- Litestream-oriented SQLite deployment model,
- content webhook and storefront revalidation flow.

`wp-wasi` should add a new runtime target behind gatekeeper, not replace
gatekeeper.

## Relationship to wp-sidecar

`products/articulate/wp-sidecar` is the native sidecar comparison:

```text
native sidecar:
  Rust -> FastCGI -> private php-fpm WordPress

WASI sidecar:
  Rust/gatekeeper -> WASI runtime -> PHP/WASM WordPress
```

Both share the same product instinct: WordPress is a bounded content sidecar,
not the public application shell.

## Frontend consequences

Because the OCI WASI target is the GraphQL host, public frontend rendering is
deliberately flexible.

Valid frontend options include:

- Next.js consuming WPGraphQL,
- Python static generation,
- Rust HTML generation,
- Cloudflare Workers/Pages frontends,
- cached static pages,
- an optional WASI HTML renderer later.

This keeps the hosting security work separate from frontend choice. The
frontends consume GraphQL; they do not dictate how the tenant WordPress runtime
is packaged.

## First implementation path

1. Start from WordPress Playground because it already tracks PHP/WASM,
   WordPress bootstrap behavior, SQLite integration, blueprints, and CLI
   workflows.
2. Build a headless fixture with SQLite and WPGraphQL.
3. Package the WordPress GraphQL host as an OCI WASI artifact.
4. Mount tenant SQLite state and approved plugin/runtime files with strict WASI
   permissions.
5. Put gatekeeper in front for host mapping, policy, uploads, GraphQL limits,
   cache, and admin exposure.
6. Keep Litestream and scheduler external.
7. Add frontend adapters independently.

## Current implementation

The experiment now has a first host-side control CLI in
`experiments/wp-wasi/scripts/wp-wasi-ctl`.

It provides:

- tenant runtime contract validation,
- approved plugin manifest validation,
- Playground CLI command generation,
- WPGraphQL `nodeByUri` smoke query generation,
- local fixture GraphQL serving for contract tests without a booted Playground,
- PHP/WASM extension policy output,
- OCI annotation generation for the future WordPress GraphQL host artifact,
- gatekeeper tenant mapping output,
- deterministic build-context metadata for future OCI/WASI packaging,
- a local mu-plugin policy pack copied into the generated build context.

Useful commands:

```sh
scripts/wp-wasi-ctl validate
scripts/wp-wasi-ctl playground-command
scripts/wp-wasi-ctl graphql-smoke /hello-wasi/ --dry-run
scripts/wp-wasi-ctl graphql-smoke /hello-wasi/
scripts/wp-wasi-ctl fixture-server
scripts/wp-wasi-ctl fixture-smoke /hello-wasi/
scripts/wp-wasi-ctl extensions
scripts/wp-wasi-ctl oci-annotations
scripts/wp-wasi-ctl gatekeeper-mapping
scripts/wp-wasi-ctl bundle-manifest
scripts/wp-wasi-ctl build-context --force
```

Verification commands:

```sh
make test
make lint-php
make playground-smoke
make fixture-smoke
make extensions
make verify
make verify-runtime
```

Real Playground smoke status:

- the blueprint validates with `@wp-playground/cli@3.1.36`,
- the fixture avoids the `login` step because it redirects `/graphql`,
- `runPHP` explicitly loads `/wordpress/wp-load.php`,
- WPGraphQL returns the `Hello WASI` post through `nodeByUri`,
- the generated Playground command disables `redis` and `memcached` until
  dedicated runtime A/B tests pass.

PHP/WASM extension policy:

- `intl`: available in asyncify and JSPI builds; enabled for the fixture.
- `redis`: available in JSPI builds only; disabled for now.
- `memcached`: available in JSPI builds only; disabled for now.
- `xdebug`: available in asyncify and JSPI builds; disabled outside debugging.

The original npx cache contained a truncated local PHP 8.4 JSPI main module:

```text
@php-wasm/node-8-4/jspi/8_4_21/php_8_4.wasm
```

Fresh stable npm assets validate with `wasm-validate --enable-all`, including
the PHP 8.4 JSPI runtime and extension modules. The immediate fix is to build
from a clean source, validate with the required WASM features, and keep redis
and memcached disabled until dedicated runtime A/B tests pass. The longer-term
fix is to vendor or build a validated PHP/WASM runtime set and record its
hashes in the OCI bundle manifest.

### Runtime builder and A/B promotion

The experiment now defines a Docker-based PHP/WASM runtime builder with two
candidate lanes:

- A: PHP 8.4 runtime from pinned stable npm `@wp-playground/cli`,
- B: PHP 8.4 runtime rebuilt from official `WordPress/wordpress-playground`
  git source.

Both lanes use the same pinned stable Playground CLI as the test harness, so
the PHP/WASM runtime is the isolated A/B variable. Each artifact includes its
PHP 8.4 runtime package, an artifact-local `run-server`, and a candidate
manifest containing SHA-256 hashes and `wasm-validate` results for every
`.wasm` and `.so` asset. The B lane pins PHP `8.4.21` and must contain both the
JSPI and Asyncify main PHP WASM modules. The same WordPress Playground
blueprint and WPGraphQL `nodeByUri` smoke test are run against both candidates
before promotion.

Pipeline commands:

```sh
make builder-image
make build-candidates
make ab-test
make ab-gate
make ab-approve
```

The promotion gate checks baseline and candidate WASM validation, GraphQL smoke
results, matching CLI harness and PHP version, git provenance, extension
policy, expected content, and startup time. A candidate is not deployable until
manual review writes a `deployable.json` marker with `"deployable": true`.

The upstream PHP/WASM source compiler invokes Docker internally, so the trusted
git builder lane mounts the Docker socket on a dedicated build runner. Its
inner Docker daemon resolves bind-mount paths on the host, so the lane also
uses a provider-owned host-backed work directory mounted at the same absolute
path inside the builder. Tenant-controlled paths must never be used for this
purpose. This privilege is build-time only: tenant code, runtime containers,
and gatekeeper requests must never receive Docker socket access. The builder
fails closed if either main runtime module is absent or WASM validation fails.

Recommended deployment remains staged: internal tenant, provider-owned canary
domain, small tenant cohort, then broad promotion with the stable A candidate
kept available for rollback.

The generated build context lives at
`experiments/wp-wasi/build/wp-wasi-demo` by default and contains:

- `bundle-manifest.json`,
- `tenant.json`,
- `approved-plugins.json`,
- `oci-annotations.json`,
- `gatekeeper-mapping.json`.
- `mu-plugins/ragbaz-wasi-policy-pack.php`.

This build context is intentionally metadata-only for now. It records the
contract that a future PHP/WASM WordPress package must preserve without
pretending that the final runtime image is already complete.

The policy pack is a first WordPress-level hardening shim. It denies local
plugin/theme/core file modification, disables automatic updates, blocks normal
local uploads, rewrites upload URLs for external storage when configured,
denies outbound WordPress HTTP unless a host is explicitly allowed, and exposes
a placeholder media-ingest route gated by a gatekeeper token.

## Non-goals

- arbitrary plugin/theme installation,
- public PHP theme rendering as the default frontend,
- shared WordPress process across tenants,
- WordPress-owned uploads,
- WP-Cron as a provider scheduler,
- unrestricted outbound network access,
- Docker socket or host filesystem access from tenant runtime.

## Strategic interpretation

`wp-wasi` is a containment experiment for hostile-tenant WordPress hosting. It
fits the same secure WordPress runtime story as `gatekeeper` and `wp-sidecar`,
but pushes the risky part of the stack into a smaller, more reproducible, more
disposable sandbox.
