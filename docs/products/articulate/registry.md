---
title: Registry
sidebar_position: 7
description: Private Docker registry used by the Articulate family.
---

# Registry

Path: `products/articulate/registry`

`registry` is a small internal infrastructure repository for a private Docker registry.

## Scope

The codebase consists mainly of:

- a `docker-compose.yml`,
- registry configuration,
- htpasswd authentication,
- and a garbage-collection helper script.

## Current role

This is not a product in the customer-facing sense. It is internal delivery plumbing that supports container-based workflows elsewhere in the tree.

## Why it still matters

Internal distribution tooling improves the operational credibility of the broader portfolio when multiple apps or services are deployed on the same hosts.
