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
- `prompt.json` - Editable scoring prompt template for Cerebras AI

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
- Borders/input borders: `#2f3336`
- Button border: `#536471`
- Selected button: `#eff3f4` background, `#0f1419` text
- Selected button hover: `#d7dbdc`
- Primary blue: `#1d9bf0` (focus states)
- Success green: `#00ba7c` (active badge)
- Scrollbar thumb: `#3e4144`, hover `#5c5f63`

### Typography
- Font: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Weights: 700 for titles/buttons, 400 for body

### Spacing
- Use 16px increments for padding/margins
- Button padding: `6px 16px`

### Components
- Pills/buttons: `border-radius: 9999px`
- Selected buttons use `#eff3f4` fill with `#0f1419` text (white on black)
- Unselected buttons are transparent with `#536471` border
- Toggle rows: label on left, radio group on right with `justify-content: space-between`
- Text inputs: `border-radius: 4px`, `#2f3336` border, blue focus ring
- Scrollbar: Custom webkit styling with dark thumb and transparent track

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
Sets width constraint on the primary column. The column is centered horizontally via `margin: auto`.

**Property**: Choose between `min-width` (default) or `max-width`

**Value**: Text input accepting any CSS width value (px, %, vw, vh). Placeholder shows `600px` as default. Click Apply or press Enter to apply.

### Quick Actions
Adds shortcut buttons to tweet action bars for quick access to common actions.

- **Not Interested**: When enabled, adds a button (circle with slash icon) to each tweet's action bar. Clicking it automates the "Not interested in this post" flow by:
  1. Clicking the tweet's "..." (caret) menu button
  2. Waiting for the dropdown menu to appear
  3. Finding and clicking the "Not interested" menu item

Target elements:
- Tweet articles: `article[data-testid="tweet"]`
- Caret/more button: `[data-testid="caret"]`
- Dropdown menu: `[data-testid="Dropdown"]`
- Menu items: `[role="menuitem"]`

### Post Scoring
Uses Cerebras AI to rate posts on a 1-3 scale for technical impressiveness and insight. Requires a Cerebras API key.

**Scoring scale** (all scores show colored dots):
- **3** (green `#00ba7c`): Non-obvious ideas with world-changing potential (groundbreaking startup concepts, important discoveries)
- **2** (yellow `#ffd400`): Indeterminate quality - neither clearly impressive nor obvious slop
- **1** (red `#f4212e`): Obvious slop, generic content, or AI-generated filler

**UI**:
- Dots appear in the top-right action row, left of the Grok button
- Clicking a dot shows an alert with the score and AI-generated reason
- Quota exceeded and API errors display in the popup under Post Scoring section

**Files**:
- `prompt.json` - Contains the scoring prompt template (editable for customization)

**Configuration**:
- Toggle scoring On/Off
- Enter Cerebras API key (stored securely in `chrome.storage.sync`)

**Implementation**:
- Uses `llama-3.3-70b` model via Cerebras API
- Scores are cached per tweet using WeakMap to avoid re-scoring
- Skips posts with less than 20 characters
- Handles extension context invalidation (prompts page refresh after extension reload)
- Debug logging: all Cerebras traffic logged to console with `XL Cerebras` prefix

**Error handling**:
- Quota exceeded (429) errors stored in `chrome.storage.sync.scoringStatus`
- Status displayed in red in popup, updates in real-time
- Clears on successful API calls
