---
title: Articulate Overview
sidebar_position: 2
description: Overview of the Articulate product family.
---

# Articulate Overview

`products/articulate` is the largest product family in `/data/src`. It is best understood as a connected set of commerce, WordPress runtime, delivery, and operational support projects.

## Core story

Articulate aims to let WordPress remain the editorial system while a modern frontend, payment stack, storage layer, and operational tooling handle the commercial and technical edge.

## Main components

- `universe`: multi-repo workspace for the active storefront, admin, and related Cloudflare services.
- `gatekeeper`: hardened WordPress ingress and runtime layer built around a Rust edge service.
- `mailstack`: mail relay and host automation lane for the broader platform.
- `wp-sidecar`: alternative Rust-owned edge plus private `php-fpm` sidecar model.
- `wp-wasi`: experiment for per-tenant WordPress GraphQL hosts packaged as OCI WASI artifacts.
- `storefront-xtas`: overlapping storefront work that appears to predate or parallel `universe/main`.
- `registry`: internal Docker registry used for delivery and packaging convenience.
- `wp-ai`: concept stub for tenant or AI-related WordPress work.

## Strategic interpretation

The family wants to become at least two offers:

1. **Headless WordPress commerce platform**.
2. **Secure WordPress runtime / hosting substrate**.

Its main risk is not lack of substance. It is ambiguity over which repo is canonical, which architecture is primary, and which supporting tools are part of the product versus just internal ops.
