---
title: Typesetr — Print Typesetting Pipeline
sidebar_position: 4
description: Convert Word documents (.docx) to print-ready PDFs using Typst — full bleed, crop marks, front matter, and typography control.
---

# Typesetr

Path: `typeset/`

Typesetr converts Word documents (`.docx`) into print-ready PDFs using [Typst](https://typst.app/) as the typesetting engine. Designed for professional book printing with full support for:
- Bleed zones and crop marks
- Front matter (half-title, title page, copyright, dedication, TOC)
- Custom fonts (15 curated Google Font families)
- Color mode filtering (full color, grayscale, monochrome)
- PA5 format (140×210mm) as primary trim size
- Draft watermark overlay

## Architecture

```
input.docx
    |
    v
docx_to_typst_markup()    — parses Word paragraphs, headings, lists,
    |                         bold/italic runs, chapter numbering
    v
_build_typst_template()   — generates full Typst source with:
    |                          - page dimensions + bleed expansion
    |                          - crop marks (optional)
    |                          - front matter pages
    |                          - running headers (odd/even)
    |                          - color mode filter
    |                          - draft watermark
    v
typst compile              — Typst CLI compiles to print-ready PDF
    |
    v
output.pdf                 — with bleed, crop marks, proper margins
```

## Components

| File | Role |
|---|---|
| **`typesetr`** | CLI entry point (auto-re-execs under virtualenv) |
| **`typeset.py`** (826 lines) | Core engine — settings, docx parsing, Typst template building, PDF compilation |
| **`tui.py`** (844 lines) | Textual TUI — 6-tab interface (Overview, Front Matter, Page, Print Marks, Colour, Typography) |
| **`config.py`** | Production defaults: PA5 trim, bleed, crop marks, font setup, email delivery |
| **`download_fonts.py`** | Downloads 15 curated Google Font families |
| **`deliver-mail.py`** | Emails generated PDF with production manifest |
| **`hook_postfinish.py`** | Post-processing hook calling `deliver-mail.py` |

## Features

### Input Parsing (`docx_to_typst_markup()`)
- Paragraph styles: Normal, Heading 1-6, Block Text, Quote
- Inline formatting: bold, italic, bold-italic
- Lists: bullet, numbered
- Line breaks and section breaks
- Chapter detection: recognizes "KAPITEL N" patterns, merges with following heading

### Page Setup (`_build_typst_template()`)
- Trim sizes: PA5 (140×210mm default), A3-A6, B4-B5, DL, Letter, custom
- Bleed expansion (3mm default)
- Crop marks (optional, with offset control)
- Two-sided layout with mirror margins
- Running headers: chapter title (even), author (odd)

### Front Matter
- Half-title page (title only)
- Title page (title, subtitle, author, publisher, ISBN, year)
- Copyright page (publisher, edition, printing info, ISBN)
- Dedication page (centered italic)
- Table of contents (auto-generated)

### Typography
- 15 curated Google Font families downloaded automatically
- Presets: `book` (first-line indent), `report` (no indent), `block` (generous spacing)
- Exercise blocks: bold-first-paragraph quotes rendered as guided exercises
- Draft watermark overlay (optional)

### Output

| Option | Values |
|---|---|
| Trim sizes | PA5, A3-A6, B4-B5, DL, Letter, custom |
| Bleed | 0-10mm (3mm default) |
| Color mode | Color, Grayscale, Monochrome |
| Crop marks | On/Off with offset control |
| Draft watermark | Optional overlay |
| Front matter | Configurable pages |

## Usage

```bash
# Convert a document
./typesetr input.docx output.pdf

# Launch TUI
./typesetr --tui

# With options
./typesetr input.docx output.pdf \
  --trim pa5 \
  --bleed 3 \
  --crop-marks \
  --color-mode grayscale \
  --front-matter standard
```

Defaults are persisted in `.typesetr.json` (gitignored).

## Technology Stack

| Layer | Technology |
|---|---|
| Language | Python 3.11+ |
| Typesetting Engine | Typst |
| TUI Framework | Textual |
| DOCX Parsing | python-docx |
| CLI | Direct executable |
| Fonts | Google Fonts (15 families) |

## Current Status

Production-ready. Used to produce actual print-ready PDFs (samples include `honsomleder25majefterlunch.pdf` and `UTKAST.pdf`). Test suite covers CLI, escape handling, integration, markup parsing, settings, and template generation.
