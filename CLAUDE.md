# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XL is a Chrome browser extension (Manifest V3) that enhances the X.com experience. It runs only on x.com and its subdomains.

## Development

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select this directory
4. The extension icon will appear in the toolbar

### Testing Changes

After modifying files, click the refresh icon on the extension card at `chrome://extensions/` to reload. For content script changes, also refresh the x.com tab.

## Architecture

- `manifest.json` - Extension configuration (Manifest V3 format)
- `popup.html` - Settings UI with X.com-style design
- `popup.js` - Handles domain detection, settings state, and storage sync
- `content.js` - Content script injected on x.com pages, listens for settings changes

### Storage

Settings are persisted via `chrome.storage.sync`. The popup sends messages to the content script when settings change for immediate effect.

### Content Script

Uses a `WeakSet` to track processed ad spans and a `Set` to store ad container references. This avoids reprocessing and allows instant mode switching without page refresh.

## Design System

Popup follows X.com's visual language:

### Colors
- Background: `#000`
- Primary text: `#e7e9ea`
- Secondary text: `#71767b`
- Borders: `#2f3336`
- Button border: `#536471`
- Primary blue: `#1d9bf0` (selected state)
- Primary blue hover: `#1a8cd8`
- Success green: `#00ba7c` (active badge)

### Typography
- Font: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Weights: 700 for titles/buttons, 400 for body

### Spacing
- Use 16px increments for padding/margins
- Button padding: `6px 16px`

### Components
- Container border-radius: 16px
- Pills/buttons: `border-radius: 9999px`
- Selected buttons use `#1d9bf0` fill with white text
- Unselected buttons are transparent with `#536471` border

### Popup Quirks
- Set `html { background: transparent }` to avoid corner clipping issues in Chrome extension popups

## Features

### Ad Posts
Controls visibility of ad posts in the feed. Detects `<span>` elements containing only "Ad" text and targets their 13th ancestor div. Uses MutationObserver for dynamically loaded content.

Modes:
- **Show** - No modification
- **Dim** - 50% opacity
- **Hide** - display: none

### Layout Controls

Resizable dividers and collapsible panels for X.com's three-column layout.

#### Target Elements
- **Left sidebar (nav)**: `header[role="banner"]`
- **Primary column**: `[data-testid="primaryColumn"]`
- **Right sidebar**: `[data-testid="sidebarColumn"]`

#### Resizable Dividers
Draggable resize handles between:
- Left sidebar ↔ Primary column
- Primary column ↔ Right sidebar

Behavior:
- Cursor: `col-resize` on hover
- Highlight on hover: `rgba(29, 155, 240, 0.3)`
- Persist widths to `localStorage`
- Minimum width for primary column: 400px

#### Collapsible Panels

**Chevron Buttons** (IDE-style collapse toggles):
- Position: Fixed vertically centered on the divider line, like VS Code panel collapse buttons
- Shape: Small circular button
- Style: `background: #16181c`, `border: 1px solid #2f3336`
- Icon color: `#71767b`, hover: `#1d9bf0`

**Primary Column** (left edge):
- Chevron at right edge of left sidebar / left edge of primary column
- Points left `◀` when left sidebar expanded, right `▶` when collapsed
- Collapses left sidebar (nav icons only or fully hidden)

**Right Sidebar** (left edge):
- Chevron at left edge of right sidebar
- Points right `▶` when expanded, left `◀` when collapsed
- Collapses sidebar entirely

#### Animation
- Collapse/expand: `200ms ease-out`
- Resize drag: instant (no transition during drag)

#### Persistence (localStorage)
- `xl-left-sidebar-width`: number
- `xl-right-sidebar-width`: number
- `xl-left-sidebar-collapsed`: boolean
- `xl-right-sidebar-collapsed`: boolean

#### Implementation Notes
- Use `MutationObserver` to re-inject controls after X.com SPA navigation
- Handle window resize gracefully
- Respect X.com's existing responsive breakpoints

#### Visual Reference
```
[  Nav  |◀] [        Primary Column        ] [▶|  Sidebar  ]
            ↑                                ↑
      chevron + handle               chevron + handle
```
