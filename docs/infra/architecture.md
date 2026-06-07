---
title: Architecture
sidebar_position: 2
description: Interactive system architecture diagrams for the RAGBAZ platform.
---

# Architecture

Interactive diagrams showing how RAGBAZ services connect across layers. Click nodes
to inspect, switch layouts to explore different dependency views.

## Articulate Commerce Cloud

The full Articulate stack from edge to database — Cloudflare terminates TLS,
Traefik and HAProxy route to WordPress backends, Infisical manages secrets,
and services communicate over encrypted channels.

```mdx-code-block
import ArchDiagram from '@site/src/components/ArchDiagram';

<ArchDiagram title="Articulate Commerce Cloud — Layer Topology"
  layers={[
    { id: 'port', label: 'Port / Endpoint' },
    { id: 'protocol', label: 'Protocol / Service' },
    { id: 'encryption', label: 'Encryption / Secrets' },
  ]}
  nodes={[
    { id: 'browser',     label: 'Browser',       layer: 'port' },
    { id: 'cloudflare',  label: 'Cloudflare',     layer: 'port' },
    { id: 'stripe',      label: 'Stripe API',     layer: 'port' },
    { id: 'cf-workers',  label: 'CF Workers',     layer: 'protocol' },
    { id: 'traefik',     label: 'Traefik',        layer: 'protocol' },
    { id: 'haproxy',     label: 'HAProxy',        layer: 'protocol' },
    { id: 'wp-sidecar',  label: 'WP Sidecar',     layer: 'protocol' },
    { id: 'wp-backend',  label: 'WordPress',      layer: 'protocol' },
    { id: 'storefront',  label: 'Storefront',     layer: 'protocol' },
    { id: 'infisical',   label: 'Infisical',      layer: 'encryption' },
    { id: 'letsencrypt', label: 'Let\'s Encrypt', layer: 'encryption' },
  ]}
  edges={[
    { source: 'browser',    target: 'cloudflare',  label: 'HTTPS',      encrypted: true,  mandatory: true },
    { source: 'cloudflare', target: 'cf-workers',  label: 'HTTP',       encrypted: true,  mandatory: true },
    { source: 'cloudflare', target: 'traefik',     label: 'HTTP/2',     encrypted: true,  mandatory: true },
    { source: 'traefik',    target: 'haproxy',     label: 'TCP',        encrypted: false, mandatory: true },
    { source: 'haproxy',    target: 'wp-backend',  label: 'FCGI',       encrypted: false, mandatory: true },
    { source: 'haproxy',    target: 'wp-sidecar',  label: 'HTTP',       encrypted: false, mandatory: false },
    { source: 'wp-sidecar', target: 'wp-backend',  label: 'WP API',     encrypted: false, mandatory: true },
    { source: 'storefront', target: 'wp-sidecar',  label: 'Storefront', encrypted: false, mandatory: false },
    { source: 'wp-sidecar', target: 'infisical',   label: 'Secrets',    encrypted: true,  mandatory: true },
    { source: 'traefik',    target: 'letsencrypt', label: 'ACME',       encrypted: true,  mandatory: true },
    { source: 'cf-workers', target: 'stripe',      label: 'Stripe API', encrypted: true,  mandatory: true },
  ]}
/>
```

## MATCHES Solve Pipeline

The MATCHES cinematic simulation pipeline — Blender exports assets, the
Rust solver computes trajectories, and each stage communicates over typed
protocols.

```mdx-code-block
<ArchDiagram title="MATCHES — Solve Pipeline"
  layers={[
    { id: 'port', label: 'I/O Boundary' },
    { id: 'protocol', label: 'Pipeline Stage' },
    { id: 'encryption', label: 'Storage' },
  ]}
  nodes={[
    { id: 'blender',     label: 'Blender Export',  layer: 'port' },
    { id: 'ingest',      label: 'Ingest Stage',     layer: 'protocol' },
    { id: 'match',       label: 'Match Stage',      layer: 'protocol' },
    { id: 'solve',       label: 'Solve Stage',      layer: 'protocol' },
    { id: 'render',      label: 'Render Stage',     layer: 'protocol' },
    { id: 'preview',     label: 'Preview Stage',    layer: 'protocol' },
    { id: 'json-store',  label: 'JSON Schema',      layer: 'encryption' },
    { id: 'fs-cache',    label: 'File Cache',       layer: 'encryption' },
  ]}
  edges={[
    { source: 'blender',   target: 'ingest',    label: 'GLTF',     encrypted: false, mandatory: true },
    { source: 'ingest',    target: 'match',     label: 'Config',   encrypted: false, mandatory: true },
    { source: 'match',     target: 'solve',     label: 'Params',   encrypted: false, mandatory: true },
    { source: 'solve',     target: 'render',    label: 'Frames',   encrypted: false, mandatory: true },
    { source: 'render',    target: 'preview',   label: 'Video',    encrypted: false, mandatory: true },
    { source: 'ingest',    target: 'json-store', label: 'Write',   encrypted: false, mandatory: false },
    { source: 'solve',     target: 'fs-cache',   label: 'Cache',  encrypted: false, mandatory: false },
    { source: 'json-store', target: 'solve',     label: 'Read',   encrypted: false, mandatory: false },
  ]}
/>
```

## RAGBAZ Frog — Service Architecture

The Frog workspace CLI follows a three-layer architecture: CLI frontend,
service layer, and SQLite persistence.

```mdx-code-block
<ArchDiagram title="Frog — Layered Architecture"
  layers={[
    { id: 'port', label: 'Interface' },
    { id: 'protocol', label: 'Service' },
    { id: 'encryption', label: 'Persistence' },
  ]}
  nodes={[
    { id: 'cli',        label: 'CLI / MCP',   layer: 'port' },
    { id: 'service',    label: 'Service Layer', layer: 'protocol' },
    { id: 'agent-svc',  label: 'Agent Service', layer: 'protocol' },
    { id: 'repo-svc',   label: 'Repo Service',  layer: 'protocol' },
    { id: 'task-svc',   label: 'Task Service',  layer: 'protocol' },
    { id: 'lock-svc',   label: 'Lock Service',  layer: 'protocol' },
    { id: 'sqlite',     label: 'AGENTS.db',    layer: 'encryption' },
    { id: 'lock-store', label: 'Lock Records',  layer: 'encryption' },
  ]}
  edges={[
    { source: 'cli',      target: 'service',   label: 'gRPC',    encrypted: false, mandatory: true },
    { source: 'service',  target: 'agent-svc', label: 'Agent',   encrypted: false, mandatory: true },
    { source: 'service',  target: 'repo-svc',  label: 'Repo',    encrypted: false, mandatory: true },
    { source: 'service',  target: 'task-svc',  label: 'Task',    encrypted: false, mandatory: true },
    { source: 'service',  target: 'lock-svc',  label: 'Lock',    encrypted: false, mandatory: true },
    { source: 'agent-svc', target: 'sqlite',    label: 'SQL',    encrypted: false, mandatory: true },
    { source: 'repo-svc',  target: 'sqlite',    label: 'SQL',    encrypted: false, mandatory: true },
    { source: 'task-svc',  target: 'sqlite',    label: 'SQL',    encrypted: false, mandatory: true },
    { source: 'lock-svc',  target: 'lock-store', label: 'Lock',  encrypted: false, mandatory: true },
  ]}
/>
```

## Navigation Tips

- **Pan** — click and drag the canvas
- **Zoom** — scroll wheel or pinch
- **Select** — click any node to see its ID in the toolbar
- **Layout** — use the buttons above each diagram to switch between Dagre (hierarchical),
  Circle, Concentric, Breadth-first, Force-directed, and Grid layouts
- **Drag** — individual nodes can be moved freely after layout
