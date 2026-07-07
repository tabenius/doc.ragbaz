---
title: Products Overview
sidebar_position: 1
description: Commercial and product-shaped work under /data/src/products.
---

# Products Overview

The `products/` tree contains the code that most clearly wants to become software someone uses, pays for, or depends on operationally.

## Portfolio shape

- **AI Governance (KAGP)** is the Konsonans AI Governance Platform — policy-as-code EU AI Act compliance with a live WASM policy gate, tamper-evident audit chain, and HITL human oversight.
- **MATCHES** is the flagship RAGBAZ product — an autonomous cinematic battle simulation engine.
- **Frog** is the workspace coordination CLI governing all multi-agent work.
- **RAGBAZ Design System** codifies the brand vocabulary for all surfaces.
- **Articulate** is the main product family (commerce, WordPress runtime, mail).
- **DetCordon** is the strongest standalone security product candidate.
- **Typesetr** is a print-ready PDF typesetting pipeline.
- **BAZ Trade Signal Stack** is a three-tier algorithmic trading suite: [BAZ.HFT](baz-hft) owns the `glither.hft` compiler dialect and signed audit receipts, [BAZ.Palantir](baz-palantir) is the Rust orchestration server (rule lifecycle, enrichment, WebSocket streaming), and [BAZ.Luna](baz-luna) is the browser frontend (CodeMirror 6 notebook editor, lightweight-charts, backlog viewer).
- **AIED** is a scholarly review article on AI in education.
- **Slint-to-TSX** is a planned Rust transpiler for Slint UI files.
- **MailRoute/MailGuard** provides email security with Proton Bridge.
- **Chatwoot** is a self-hosted customer support platform.
- **Shipwrecks.se** is the strongest niche vertical application.
- **Discord bot**, **ESP32Tolk**, **Portfolio**, and **SciPub** are smaller or earlier-stage bets.

## Current interpretation

### Strongest active product lines

1. **AI Governance (KAGP)**
   - Policy-as-code control plane for EU AI Act compliance.
   - `glither.governance` dialect compiled to WASM, tamper-evident PostgreSQL audit chain, Ed25519 manifest signing, and HITL approval flow. Core runtime complete; Art 9/12/14 satisfied.
2. **Articulate Commerce Cloud**
   - Headless WordPress commerce and content delivery.
   - Cloudflare, Stripe, storage, admin tooling, and secure runtime work.
3. **Secure WordPress Runtime**
   - `gatekeeper` and `wp-sidecar` together define the most interesting infrastructure wedge inside the Articulate family.
4. **DetCordon**
   - Security and malware-observation product track.

### Niche or exploratory products

- **BAZ Trade Signal Stack**: compiler and audit primitives implemented; live order execution not yet enabled. The technical surface is real but the product gate (durable receipts + venue integration) is open. Best treated as an advanced spike with a clear promotion path.
- `shipwrecks.se`: vertical data and community application.
- `esp32tolk`: hardware-assisted live translation device concept.
- `discord-bot`: operational companion, more platform add-on than standalone business.
- `portfolio`: business-development surface, not a direct revenue product.
- `scipub`: still too early to count as a defined product.

## Notes on scope

- The Articulate storefront has been canonicalized at `products/articulate/universe/storefront`; the old `storefront-xtas` tree is archived for reference.
- A few directories inside `products/` still look more like concept or R&D spaces than sellable offers. `wp-ai` and `scipub` are the clearest examples.

Use the sidebar to drill into each product or family.
