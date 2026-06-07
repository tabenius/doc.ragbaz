---
title: HWP Toolkit — Headless WordPress Toolkit
sidebar_position: 8
description: WP Engine's HWP Toolkit for building headless WordPress applications — vendored for the Articulate platform.
---

# HWP Toolkit

Path: `headless/hwptoolkit/`

A vendored copy of [WP Engine's HWP Toolkit](https://github.com/wpengine/hwptoolkit) — a toolkit for building headless WordPress applications with CLI tools, WordPress plugins, and npm packages. The toolkit provides patterns and tooling for decoupling WordPress into a headless CMS.

## Architecture

```
headless/hwptoolkit/
├── plugins/          — PHP WordPress plugins
│   ├── ...          (headless-specific WP plugins)
├── packages/         — NPM packages
│   ├── ...          (JS/TS tooling for headless frontends)
├── docs/             — Documentation
├── examples/         — Example implementations
└── ...               — CLI tools, configs
```

## Components

### WordPress Plugins (PHP)
WordPress PHP plugins that extend the WordPress backend for headless operation — custom REST API endpoints, menu support, preview handling, and headless-specific WordPress configuration.

### NPM Packages (TypeScript/JavaScript)
Frontend tooling packages for building headless WordPress frontends — API client libraries, authentication helpers, build tool integrations.

### CLI Tools
Command-line utilities for scaffolding, building, and deploying headless WordPress projects.

## Relationship to Workspace

This toolkit is vendored for use by the **Articulate** product family. Key integrations:

- **`universe/main/`** — the active storefront uses headless WordPress patterns and may leverage HWP toolkit packages
- **`gatekeeper/`** — the hardened WordPress runtime provides the backend that headless frontends connect to
- **`storefront-xtas/`** — the parallel storefront also uses headless WordPress architecture

The toolkit provides patterns for:
- WordPress as a headless CMS with GraphQL (WPGraphQL) or REST API
- Frontend authentication against WordPress
- Content preview workflows in a headless setup
- Menu and navigation management from WordPress

## Current Status

Vendored reference — not modified from upstream. Used as a patterns library and potential dependency for Articulate storefront work.
