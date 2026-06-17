---
title: Experiments Overview
sidebar_position: 1
description: Exploratory apps and framework spikes under /data/src/experiments.
---

# Experiments Overview

The `experiments/` tree contains code that is useful for learning, design discovery, and architectural comparison, but is not yet the canonical product path.

## Main clusters

- **BAZ Platform**: algorithmic trading suite with three services — [BAZ.CX](baz-cx) (exchange connector), [BAZ.Palantir](baz-palantir) (orchestration server), [BAZ.Luna](baz-luna) (frontend notebook), and the [glither.hft compiler](baz-architecture) dialect.
- `omniland/`: editor, UI, and content-oriented experiments.
- `tanstack-*`: framework starter and integration examples.
- `phpvm/`: PHP runtime exploration.
- `comet-trail/`: small visual interaction experiments.

## How to read this category

These pages are intentionally lighter than the product pages. The goal is to capture what each experiment seems to be for, so future work can either promote it into a product line or safely leave it as a spike.
