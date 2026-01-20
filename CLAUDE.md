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

### Target Elements
- **Left sidebar (nav)**: `header[role="banner"]`
- **Primary column**: `[data-testid="primaryColumn"]`
- **Right sidebar**: `[data-testid="sidebarColumn"]`

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
- Pills/buttons: `border-radius: 9999px`
- Selected buttons use `#1d9bf0` fill with white text
- Unselected buttons are transparent with `#536471` border
- Toggle rows: label on left, radio group on right
- Custom input: `border-radius: 8px`, shows Apply button

## Features

### Ad Posts
Controls visibility of ad posts in the feed. Detects `<span>` elements containing only "Ad" text and targets their 13th ancestor div. Uses MutationObserver for dynamically loaded content.

Modes:
- **Show** - No modification
- **Dim** - 50% opacity
- **Hide** - display: none

### Layout
Toggle visibility of sidebars via popup controls.

- **Navigation**: Show/Hide - toggles `xl-hidden` class on `header[role="banner"]`
- **Sidebar**: Show/Hide - toggles `xl-hidden` class on `[data-testid="sidebarColumn"]`

### Feed Width
Sets width constraint on the primary column.

**Property**: Choose between `min-width` (default) or `max-width`

**Value** presets:
- **600px** - Default X.com width
- **100%** - Full width
- **70%** - Percentage-based
- **Custom** - Accepts any CSS width value (px, %, vw, vh). Enter value and click Apply or press Enter.
