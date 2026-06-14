---
title: Slint-to-TSX Transpiler
sidebar_position: 6
description: Rust transpiler converting Slint UI files (.slint) into TypeScript React components with CSS Modules.
---

# Slint-to-TSX Transpiler

Path: `slint/`

A Rust-based transpiler that converts [Slint](https://slint.dev/) UI language (`.slint` files) into TypeScript React (`.tsx`) components with CSS Modules. `.slint` files remain the source of truth; `.tsx` + `.module.css` files are regenerated on change. The goal is proper HTML/DOM elements instead of Slint's canvas-based web rendering.

## Status

**Planning phase** — design documents exist, no code has been written yet. Two comprehensive plan documents in `docs/plans/`.

## Architecture (Planned)

```
.slint files
    |
    v
i-slint-compiler (Object Tree IR)   -- Rust crate, pinned v1.15.1
    |
    v
Codegen IR (intermediate representation)
    |
    ├──▶ .tsx files (React components with @preact/signals-react)
    └──▶ .module.css files (scoped styles)
```

## Pipeline

1. **Slint parsing** — uses `i-slint-compiler` Rust crate to parse `.slint` files into an Object Tree IR
2. **Codegen IR** — a custom intermediate representation decoupled from Slint internals, representing components, elements, properties, bindings, callbacks, states, and animations
3. **CSS Module emitter** — generates scoped `.module.css` files from layout and style properties
4. **TSX emitter** — generates React components with `@preact/signals-react` for reactive state

## Element Mapping

| Slint Element | React Output |
|---|---|
| `Rectangle` | `<div>` with CSS background/border |
| `Text` | `<span>` with font properties |
| `Image` | `<img>` with src prop |
| `TouchArea` | `<div onClick={...}>` |
| `VerticalLayout` | `<div display: flex; flex-direction: column>` |
| `HorizontalLayout` | `<div display: flex; flex-direction: row>` |
| `GridLayout` | `<div display: grid>` |
| `Flickable` | `<div overflow: auto>` |
| `FocusScope` | `<div tabIndex={0} onKeyDown={...}>` |
| `PopupWindow` | React Portal (v0.3) |
| `Path` | `<svg>` (v0.3) |

## Reactivity Model

Uses `@preact/signals-react` to mirror Slint's automatic dependency tracking:
- `property<T> name: value` → `const name = signal(value)`
- `in property<T> name` → React prop, wrapped as signal internally
- Binding expressions → `computed(() => ...)`
- Two-way binding `<=>` → shared signal reference

## Roadmap

| Version | Scope |
|---|---|
| **v0.1** | Components, basic elements (Rectangle, Text, Image, TouchArea, layouts), properties, callbacks, conditionals, repeats, structs, basic expressions |
| **v0.2** | Animations/transitions, states, globals (React Context), enums |
| **v0.3** | Path/SVG, PopupWindow/Portals, i18n, built-in widget library |

## Planned Project Structure

```
slint2tsx/
├── Cargo.toml
├── crates/
│   ├── slint2tsx-core/      — Core transpiler library
│   │   ├── lib.rs
│   │   ├── ir.rs             — Codegen IR types
│   │   ├── transform.rs      — Object Tree → Codegen IR
│   │   ├── emit_tsx.rs       — Codegen IR → TSX string
│   │   ├── emit_css.rs       — Codegen IR → CSS Module string
│   │   ├── mappings.rs       — Element/property mapping tables
│   │   └── expr.rs           — Expression transpilation
│   ├── slint2tsx-cli/        — CLI binary (clap)
│   └── slint2tsx-wasm/       — WASM target (deferred)
├── npm/                       — npm packages (WASM wrapper, Vite plugin)
└── tests/                     — fixtures/ and snapshots/
```

## Hard Limitations

- Slint's layout engine is not CSS — subtle sizing/constraint differences will exist
- Pixel-perfect fidelity is a non-goal; semantic HTML correctness is the goal
- Some constraint properties produce best-effort CSS approximations
- Built-in widgets beyond the core set are deferred to v0.3

## Implementation Tasks (12 planned, sequential)

1. Project scaffolding (workspace + crate structure)
2. Codegen IR types
3. Slint parsing integration (i-slint-compiler)
4. Element mapping tables
5. Expression transpilation
6. Element tree transformation
7. CSS Module emitter
8. TSX emitter
9. End-to-end pipeline & public API
10. CLI implementation
11. Snapshot tests (insta)
12. More fixtures & edge cases
