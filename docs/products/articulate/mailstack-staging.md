---
title: Mailstack Staging
sidebar_position: 6
description: Staging or parallel environment for mailstack.
---

# Mailstack Staging

Path: `products/articulate/mailstack-staging`

`mailstack-staging` mirrors much of `mailstack` without presenting a clearly independent product purpose.

## Scope

The directory contains:

- its own `PLAN.md`,
- Python operations scripts,
- systemd and syslog-ng configuration,
- rootless deployment notes,
- and tests.

## Current interpretation

This directory currently reads as one of two things:

1. a staging environment for the main mail stack, or
2. a fork whose distinct purpose was never fully named.

Until that is clarified, it should be documented as operational overlap rather than an independent product.

## Recommendation

Document whether this is:

- a rehearsal environment,
- a deliverability test environment,
- or a deprecated fork.

If none of those are true, it should likely be merged back into `mailstack`.
