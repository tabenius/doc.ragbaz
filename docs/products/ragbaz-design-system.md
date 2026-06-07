---
title: RAGBAZ Design System
sidebar_position: 3
description: Official brand and UI design system governing all RAGBAZ surfaces — colors, typography, spacing, components, and brand voice.
---

# RAGBAZ Design System

Path: `ragbaz-design-system/`

The RAGBAZ Design System codifies the brand vocabulary for all RAGBAZ surfaces. It enforces a warm solarized dark / gruvbox-dark-warm aesthetic with orange ember (`#f3c46c`) as the primary accent and cyan-blue (`#7ab8ff`) as the secondary accent. The system is derived from the MATCHES studio codebase and governs all products, documentation, and marketing surfaces.

## Design Philosophy

RAGBAZ builds for operators, not consumers. The aesthetic discipline is not decoration — it is a statement of values:

- **Clarity over charm** — tools should read like a well-maintained configuration file
- **Legibility over delight** — content hierarchy is structural, not decorative
- **Substance over surface** — every visual decision carries semantic weight

The emotional register is **warm precision** — the feeling of a terminal configured exactly right. `#f3c46c` (orange ember) against dark stone is the color of a desk lamp at 2 a.m., of work that matters to the person doing it.

## Design Constraints

Certain CSS properties are **outside the vocabulary** — not style choices you can opt back into:
- Glassmorphism / backdrop-filter blur
- `border-radius: 9999px` (rounded-full pills)
- Glow shadows (`box-shadow` with blur > 2px)
- Gradient backgrounds on surfaces
- Decorative animations

## Core Tokens (`colors_and_type.css`)

### Background Colors

| Token | Value | Use |
|---|---|---|
| `--bg-0` | `#181716` | Deepest backdrops |
| `--bg-1` | `#1d1c1b` | Main page background |
| `--bg-2` | `#242221` | Card/surface background |
| `--bg-3` | `#2a2827` | Elevated surfaces |
| `--bg-4` | `#2f2d2c` | Interactive hover states |
| `--bg-5` | `#353332` | Navbar, header areas |

### Border Colors

| Token | Value |
|---|---|
| `--border-0` | `#3a3735` |
| `--border-1` | `#403d3b` |
| `--border-2` | `#4a4744` |
| `--border-3` | `#54504d` |

### Text Colors

| Token | Value | Use |
|---|---|---|
| `--fg-0` | `#f0ece4` | Primary text (headings) |
| `--fg-1` | `#dbd5cb` | Body text |
| `--fg-2` | `#c7bfb3` | Secondary text / metadata |
| `--fg-3` | `#9e9487` | Placeholder / disabled |

### Brand Accents

| Token | Value | Role |
|---|---|---|
| `--orange-1` | `#f3c46c` | Primary brand — headings, active states |
| `--orange-2` | `#dba35a` | Alt primary |
| `--orange-3` | `#c68a47` | Dark primary |
| `--blue-1` | `#7ab8ff` | Secondary brand — links, info accents |
| `--blue-2` | `#5c9ad9` | Alt secondary |
| `--blue-3` | `#4a7db3` | Dark secondary |
| `--red-1` | `#ea6962` | Errors, destructive actions |
| `--green-1` | `#a9b665` | Success states |
| `--yellow-1` | `#d8a657` | Warnings |

### Type Scale

| Token | Size | Use |
|---|---|---|
| `--t-small` | `13px` | Labels, metadata, code |
| `--t-body` | `15px` | Body text |
| `--t-h4` | `16px` | Minor headings |
| `--t-h3` | `18px` | Section headings |
| `--t-h2` | `22px` | Major sections |
| `--t-h1` | `28px` | Page titles |

### Spacing Grid

8-step spacing scale: `--s-0` (4px) through `--s-10` (80px) at 4px/8px intervals.

### Borders

| Token | Value |
|---|---|
| `--r-1` | `2px` (small radii) |
| `--r-2` | `4px` (default radius) |
| `--r-3` | `6px` (generous radius) |
| `--btn-border-w` | `1.5px` (button borders) |

### Shadows

| Token | Value | Use |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 2px 4px rgba(0,0,0,0.35)` |
| `--shadow-lg` | `0 4px 8px rgba(0,0,0,0.4)` |
| `--shadow-inner` | `inset 0 1px 2px rgba(0,0,0,0.4)` |

### Typography

| Property | Value |
|---|---|
| Font Sans | `'Noto Sans', system-ui, sans-serif` |
| Font Serif | `'Noto Serif', Georgia, serif` |
| Font Mono | `'Intel One Mono', 'JetBrains Mono', 'Fira Code', monospace` |
| Line Height Body | `1.6` |
| Line Height Tight | `1.25` |

## Component Patterns

### Buttons

- `--btn-border-w: 1.5px` borders
- Flat backgrounds with border accent
- Hover: brighten border, shift background
- Three variants: default, primary (orange accent), ghost (no background)

### Pills

- Small `border-radius: var(--r-2)` (4px), not rounded-full
- Used for status indicators, tags, badges
- Color-coded by semantic role (red for error, green for success, etc.)

### Cards (`rb-card`)

- `--bg-2` background, `--border-1` border
- `--r-2` border-radius
- Variants: default, warm (orange border accent), cool (blue border accent), ghost (transparent background)
- Consistent `--s-5` (24px) internal padding

### Form Controls

- Minimal: flat borders, no background fill on default state
- Focus: orange accent border
- Input height: 32px base

### Borders and Dividers

- Horizontal rules: `--border-2` color
- Section dividers: `--border-3` for stronger separation
- No gradient borders

## Animation

| Token | Value |
|---|---|
| `--dur-fast` | `150ms` |
| `--ease-out` | `cubic-bezier(0.4, 0, 0.2, 1)` |

Animations are limited to:
- Hover transitions on interactive elements
- Focus ring transitions
- Content visibility (fade in/out)

No decorative or continuous animations.

## Repository Structure

```
ragbaz-design-system/
├── README.md                    — Full brand voice guide (425 lines)
├── colors_and_type.css          — All CSS tokens (425 lines)
├── SKILL.md                     — Portable skill manifest for agent use
├── preview/                     — Static HTML preview cards
│   ├── type-preview.html
│   ├── colors-preview.html
│   ├── spacing-preview.html
│   ├── buttons-preview.html
│   ├── form-controls-preview.html
│   ├── cards-preview.html
│   ├── dsl-snippet-preview.html
│   ├── timeline-markers-preview.html
│   ├── hud-chips-preview.html
│   ├── plot-3d-preview.html
│   ├── logo-preview.html
│   └── prospekt-preview.html
├── ui_kits/matches-studio/      — Interactive click-through UI kit
│   ├── TopBar.tsx
│   ├── Viewport.tsx
│   ├── DslEditor.tsx
│   ├── Timeline.tsx
│   ├── Transport.tsx
│   └── Primitives (Button, Pill, Card)
├── assets/                      — Logo, marketing layouts
└── project/                     — Project-level documentation
```

## Usage

The design system is imported into projects via:

```css
/* CSS */
@import "../path/to/ragbaz-design-system/colors_and_type.css";
```

The Docusaurus documentation atlas (`doc.ragbaz.xyz`) imports the design system directly:
```css
@import "../../../ragbaz-design-system/colors_and_type.css";
```

## Brand Voice (from README)

The README also serves as the **brand voice guide**, covering:
- **Voice principles:** lowercase, terse, refuses ornament
- **Colors:** semantic mapping and usage rules
- **Typography:** which faces for which contexts
- **Spacing:** the 8-step grid and layout principles
- **Iconography:** inline SVG only (no icon libraries)
- **Content fundamentals:** headings, lists, code blocks, links

## Relationship to Products

- **MATCHES** — the design system is derived from the MATCHES studio UI and governs all MATCHES surfaces
- **doc.ragbaz.xyz** — the Atlas imports and follows the design system
- **offer.ragbaz.xyz** — the landing page follows the design system
- **Future products** — all new RAGBAZ-branded work should follow this system per `AGENTS.md` policy
