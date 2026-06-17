---
sidebar_label: BAZ.Luna frontend
description: BAZ.Luna — notebook-based trading frontend with charting, editor, and live signal visualization.
---

# BAZ.Luna — trading frontend

**Location:** `/data/src/experiments/BAZ.Luna/`

## Overview

BAZ.Luna is the frontend for the BAZ platform — a browser-based notebook interface for authoring, compiling, and monitoring `glither.hft` trading strategies. It communicates with BAZ.Palantir over REST + WebSocket on `:8080`.

```
Browser ── REST/WS ──▶ BAZ.Palantir (:8080) ── WS ──▶ BAZ.CX (:8000)
```

## Stack

| Layer | Library | Purpose |
|-------|---------|---------|
| Build | Vite 6 | Dev server, proxy, code splitting |
| Charts | [lightweight-charts](https://github.com/tradingview/lightweight-charts) | Candlestick + RSI + signal markers |
| Editor | [CodeMirror 6](https://codemirror.net/) | Markdown editing with syntax highlighting |
| Renderer | [marked](https://marked.js.org/) + [highlight.js](https://highlightjs.org/) | Markdown preview with syntax-highlighted code blocks |
| Language | Custom `glith` language for hljs | Syntax highlighting for Glith.HFT dialects |
| Runtime | Vanilla JS (no framework) | ~2.7 kB initial JS chunk |

## Key features

### Notebook editor

Side-by-side layout: CodeMirror 6 editor on the left, rendered Markdown preview on the right. Supports three example notebooks (Mean Reversion, Trend Following, Blank Template) loaded via the toolbar. Cheat sheet panel (Ctrl+H) documents all Glith.HFT constructs.

Every fenced `` ```glith `` code block gets a **Compile** button that POSTs the block content to BAZ.Palantir `/api/notebook/compile` and shows results inline. A **Compile All** button processes all blocks sequentially.

### Signal markers

Compiled rules produce signals displayed as colored markers on the candlestick chart:
- **Buy** (green up-arrow)
- **Sell** (red down-arrow)
- **Close** (yellow circle)

Each marker has a hover tooltip showing the reason, timestamp, and rule name. Signals arrive from three sources: WebSocket `signal` messages, compilation results, and annotation side-channel.

### Lazy loading

All heavy frontend libraries are deferred via dynamic `import()` at idle (`requestIdleCallback`):

| Resource | Size | Load strategy |
|----------|------|---------------|
| Initial entry | 79 B + 2.7 kB app + 8 kB CSS | Synchronous (instant) |
| CodeMirror 6 | 969 kB | `requestIdleCallback` |
| marked | 43 kB | On first viewer render |
| highlight.js | varied | On first code block render |
| Examples | 6.2 kB | On toolbar click |
| Glith language def | 1.1 kB | With highlight.js |

This keeps the initial paint lean — the chart and UI render before any editor code loads.

### Charts and indicators

- **Main pane:** candlestick chart (lightweight-charts) with optional Bollinger Band overlays
- **Sub-pane:** RSI oscillator (line series)
- **Series:** SMA, EMA drawn as line overlays
- **Backlog:** scrollable event log from SQLite
- **Annotations:** free-form text annotations via WebSocket side-channel

## Architecture

```
index.html
  └─ src/app.js          (main: api(), charts, WS, signals, backlog)
       ├─ src/notebook.js (CodeMirror + marked + hljs + compile)
       ├─ src/examples.js (3 notebooks, lazy-loaded)
       ├─ src/glith-lang.js (hljs language, lazy-loaded)
       └─ src/styles.css  (RAGBAZ-themed)
```

## API contract

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/candles?symbol=BTC/USDT&timeframe=1m` | GET | Historical candles |
| `/api/backlog` | GET | Event log entries |
| `/api/daemon/status` | GET | Strategy daemon status |
| `/api/rules/:name/compile` | POST | Compile Glith source |
| `/ws` | WebSocket | Real-time ticks, candles, signals, annotations |

All proxied through Vite dev server (`/api` → `:8080`, `/ws` → `ws://:8080`).

## Build & run

```bash
npm install
npm run dev          # Dev server with HMR at :5173
npm run build        # Production build → dist/
```

Production build: ~1.8 MB total across 16 chunks (gzip ~570 kB), builds in ~3s.
