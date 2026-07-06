---
title: Shipwrecks.se
sidebar_position: 16
description: Interactive Swedish shipwreck explorer — charted wrecks, dive records, and documented provenance over the Swedish coast.
---

# Shipwrecks.se

**Path:** `products/shipwrecks.se` · **Status:** live

`shipwrecks.se` is a vertical data-and-exploration application focused on Swedish shipwrecks. It is a niche but fully-realised product with enough surface area to become a subscription or organization-facing application.

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React, Leaflet (interactive map) |
| Backend | Node/Express API server |
| Database | PostgreSQL |
| Payments | Stripe |
| Auth | User authentication |

## Features

- **Interactive map** — Leaflet-based chart of the Swedish coast with clustered wreck markers, depth contours, exclusion zones, and maritime navigation layers
- **Wreck archive** — curated registry with per-wreck provenance: coordinates, depth, cargo, sinking date, discovery story, sonar scans, diver reports, and photos
- **Data import** — ingestion from spreadsheet-like formats into the normalized PostgreSQL schema
- **User auth + billing** — account system with Stripe subscription integration for access-tiered data
- **Admin interface** — curator tools for managing the archive and reviewing submissions

## Current Interpretation

The core application is already broader than a map demo. The combination of curated geographic data, user accounts, and Stripe integration gives it a clear subscription product arc — either as a diver community platform or a data license for maritime heritage organizations.

The main gap is deployment maturity and marketing. The technology is functional; the product gate is operational rather than technical.
