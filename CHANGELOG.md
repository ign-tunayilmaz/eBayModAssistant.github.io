# Changelog - eBay Moderation Tool

## Version 2.3.4 - January 13, 2026

### 🆕 New Templates

- Added **How to Reach eBay** guidance under Additional Templates so moderators can quickly direct members to official support channels.

### 🔧 Maintenance

- Synced all version labels and metadata to 2.3.4 for the UI, server, and caching layers.

---

## Version 2.3.3 - November 21, 2025

### ✨ Improvements

- Flag counters now include manual textboxes for NAR and every action type so supervisors can key-in exact counts without relying on repeated button clicks.
- Synced version labels across the UI and server to reflect the latest release.

### 🐛 Bug Fixes

- Resolved an issue where the standalone dashboard still displayed legacy flag labels without editable inputs.

---

## Version 2.3.2 - November 19, 2025

### 🆕 New Features

- **Customizable Keyboard Shortcuts** - Quick NAR counter increments (Ctrl+1/2/3/4 by default, fully customizable)
- **Copy to Admin Notes** - One-click button on PM templates to auto-fill Admin Notes with removed content and violations

### 🐛 Bug Fixes

- Fixed white screen loading issue (switched to cdnjs CDN)
- Fixed NAR button colors in light mode (white background, black text)
- Fixed keyboard shortcuts with Alt key combinations

### ✨ Improvements

- **Reset All** now clears counters, template inputs, and admin notes
- Keyboard shortcuts persist across sessions
- Added debug logging for keyboard shortcuts

---

### Quick Start
```bash
npm run server
```
Access at: `http://localhost:3001`

