---
title: Products Overview
sidebar_position: 1
description: Commercial and product-shaped work under /data/src/products.
---

# Products Overview

The `products/` tree contains the code that most clearly wants to become software someone uses, pays for, or depends on operationally.

## Portfolio shape

- **MATCHES** is the flagship RAGBAZ product — an autonomous cinematic battle simulation engine.
- **Frog** is the workspace coordination CLI governing all multi-agent work.
- **RAGBAZ Design System** codifies the brand vocabulary for all surfaces.
- **Articulate** is the main product family (commerce, WordPress runtime, mail).
- **DetCordon** is the strongest standalone security product candidate.
- **Typesetr** is a print-ready PDF typesetting pipeline.
- **AIED** is a scholarly review article on AI in education.
- **Slint-to-TSX** is a planned Rust transpiler for Slint UI files.
- **MailRoute/MailGuard** provides email security with Proton Bridge.
- **Chatwoot** is a self-hosted customer support platform.
- **Shipwrecks.se** is the strongest niche vertical application.
- **Discord bot**, **ESP32Tolk**, **Portfolio**, and **SciPub** are smaller or earlier-stage bets.

## Current interpretation

### Strongest active product lines

1. **Articulate Commerce Cloud**
   - Headless WordPress commerce and content delivery.
   - Cloudflare, Stripe, storage, admin tooling, and secure runtime work.
2. **Secure WordPress Runtime**
   - `gatekeeper` and `wp-sidecar` together define the most interesting infrastructure wedge inside the Articulate family.
3. **DetCordon**
   - Security and malware-observation product track.

### Niche or exploratory products

- `shipwrecks.se`: vertical data and community application.
- `esp32tolk`: hardware-assisted live translation device concept.
- `discord-bot`: operational companion, more platform add-on than standalone business.
- `portfolio`: business-development surface, not a direct revenue product.
- `scipub`: still too early to count as a defined product.

## Notes on scope

- The Articulate storefront has been canonicalized at `products/articulate/universe/storefront`; the old `storefront-xtas` tree is archived for reference.
- A few directories inside `products/` still look more like concept or R&D spaces than sellable offers. `wp-ai` and `scipub` are the clearest examples.

Use the sidebar to drill into each product or family.
