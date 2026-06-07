---
title: AIED — AI in Education Review Article
sidebar_position: 5
description: Scholarly review article analyzing how AI redistributes feedback, attention, judgment, and institutional power in education.
---

# AIED — AI in Education

Path: `AIED/`

A scholarly review article (target: 20-40 pages) on AI in education, analyzing how AI redistributes feedback, attention, judgment, and institutional power. Swedish is the canonical source language; an English adaptation is derived from it.

## Scope

The article examines AI in education through four analytical lenses:
1. **Feedback** — how AI-mediated feedback changes the learning loop
2. **Attention** — how AI shapes what (and who) gets attention in educational settings
3. **Judgment** — how AI systems exercise judgment that was previously human
4. **Institutional power** — how AI redistributes authority in educational institutions

## Structure

```
AIED/
├── article/
│   ├── sv/ai-i-utbildning.qmd    — Swedish source manuscript
│   └── en/ai-in-education.qmd    — English adaptation
├── plans/                         — Planning docs
│   ├── agent-coordination-board.md
│   ├── philosophical-mapping.md
│   └── implementation-plan.md
├── _quarto.yml                    — Quarto config (HTML/PDF/GFM)
├── Dockerfile                     — Reproducible build
├── docker-compose.yml
├── Makefile
├── META.md                        — Project state meta-analysis
├── FEEDBACK.md                    — External review of the plan
└── TECH.md                        — Technical build instructions
```

## Technology Stack

| Layer | Technology |
|---|---|
| Publishing | Quarto |
| PDF Engine | XeLaTeX |
| Diagrams | Mermaid |
| CSS | Tufte-inspired styling |
| Fonts | Noto family |
| Build | Docker + Makefile |
| Languages | Swedish (source), English (derived) |

## Build

```bash
# Build all formats
make

# Build specific format
make html
make pdf
make gfm      # GitHub-flavored markdown

# With Docker (reproducible)
docker compose run --build article make
```

## Coordination

The project uses a multi-agent coordination protocol (detailed in `AGENTS.md`) for async writing work. An agent coordination board tracks progress across:
- Manuscript writing (SV and EN)
- Evidence localization
- Production build
- Delivery package
- Consistency and proofing passes

## Current Status

The backbone is complete. Evidence localization has been done for both Swedish (sections 3-14) and English (sections 1-14). Production build, delivery package, consistency pass, diagram SVG assets, typography pass, and philosophy audit are all complete.
