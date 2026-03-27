# Theme System Redesign — Design Spec

**Date:** 2026-03-28
**Status:** Approved (rev 2 — spec review fixes applied)
**Scope:** Global visual language rebuild — CSS Design Token system + 6 themes + component restyling

---

## Overview

Rebuild the extension's visual design language from scratch. Current state: 8 themes that only swap color variables, with no coherent component design system. Target state: a CSS Design Token system driving 6 well-crafted themes (2 base + 4 high-saturation color themes), with unified component form language across all themes.

**Guiding aesthetic:** Refined — clear visual hierarchy, purposeful shadows, quality feel without coldness. Reference: Arc Browser, Raycast.

**Implementation strategy:** CSS Design Token rewrite + full component CSS rewrite. HTML structure preserved where possible (only add helper classes, never reorder). JS logic untouched except theme name array update.

---

## Design Token System

### Token Architecture

`css/variable.css` expands from color-only to a two-layer token system:

**Layer 1 — Color tokens** (each theme defines its own values):

| Token | Role |
|-------|------|
| `--bg` | Page background |
| `--surface` | Default surface (sidebar, panels) |
| `--surface-raised` | Elevated surface (cards, dropdowns) — **new** |
| `--text` | Primary text |
| `--text-secondary` | Secondary / muted text (replaces `--muted`) |
| `--primary` | Brand / interactive color |
| `--primary-hover` | Primary hover state — **new** |
| `--accent` | Secondary highlight color |
| `--border` | Default border |
| `--border-subtle` | Light divider — **new** |
| `--focus-ring` | Keyboard focus outline — **new** |
| `--shadow-color` | Shadow tint (neutral for light themes, primary-tinted for dark) — **new** |

**Backward compatibility:** All legacy variable names are preserved as aliases pointing to new tokens. No JS references break. Full alias list:

| Legacy name | Maps to |
|-------------|---------|
| `--muted` | `var(--text-secondary)` |
| `--borderGrey` | `var(--border)` |
| `--muted-surface` | `var(--surface-raised)` |
| `--greyLight-1` | `var(--surface-raised)` |
| `--greyLight-2` | `rgba(var(--shadow-color), 0.08)` |
| `--greyLight-3` | `var(--border)` |
| `--greyDark` | `var(--text-secondary)` |
| `--white` | `var(--surface)` |
| `--black` | `var(--text)` |
| `--deep-dark` | `var(--bg)` |
| `--shadow-1` | `var(--shadow-md)` |
| `--shadow-2` | `var(--shadow-lg)` |
| `--inset-subtle` | `inset 0.1rem 0.1rem 0.25rem rgba(var(--shadow-color), 0.08)` |
| `--inset-highlight` | `inset -0.1rem -0.1rem 0.25rem rgba(255,255,255,0.05)` |
| `--primary-light` | `var(--primary-hover)` |
| `--primary-dark` | `var(--primary)` |

**Layer 2 — Form tokens** (global, shared across all 6 themes, never theme-specific):

```css
/* Border radius */
--radius-sm:   6px
--radius-md:   10px
--radius-lg:   16px
--radius-full: 9999px

/* Spacing */
--space-xs: 0.25rem
--space-sm: 0.5rem
--space-md: 1rem
--space-lg: 1.5rem
--space-xl: 2rem

/* Shadows — all reference --shadow-color (RGB triplet, no alpha) */
--shadow-sm:   0 1px 4px rgba(var(--shadow-color), 0.06)
--shadow-md:   0 4px 16px rgba(var(--shadow-color), 0.10)
--shadow-lg:   0 8px 28px rgba(var(--shadow-color), 0.14)
--shadow-glow: 0 3px 10px rgba(var(--shadow-color), 0.35)  /* active icon glow — uses same --shadow-color */
```

Note: `--shadow-color` is defined as a bare RGB triplet (e.g. `0, 0, 0` or `99, 102, 241`) so it can be used inside `rgba()`. There is no separate `--primary-rgb` token.

---

## 6 Themes

### Theme 1 — 石墨浅调 `slate-light` (light base)

| Token | Value |
|-------|-------|
| `--bg` | `#f1f3f5` |
| `--surface` | `#ffffff` |
| `--surface-raised` | `#ffffff` |
| `--text` | `#212529` |
| `--text-secondary` | `#6c757d` |
| `--primary` | `#343a40` |
| `--primary-hover` | `#495057` |
| `--accent` | `#6c757d` |
| `--border` | `#dee2e6` |
| `--border-subtle` | `#e9ecef` |
| `--focus-ring` | `#343a40` |
| `--shadow-color` | `0, 0, 0` |

### Theme 2 — 深夜墨色 `midnight-ink` (dark base)

| Token | Value |
|-------|-------|
| `--bg` | `#0f1117` |
| `--surface` | `#1a1d27` |
| `--surface-raised` | `#22253a` |
| `--text` | `#e8eaf6` |
| `--text-secondary` | `#8b8fc0` |
| `--primary` | `#6366f1` |
| `--primary-hover` | `#818cf8` |
| `--accent` | `#a5b4fc` |
| `--border` | `#2d3048` |
| `--border-subtle` | `#252836` |
| `--focus-ring` | `#818cf8` |
| `--shadow-color` | `99, 102, 241` (primary-tinted glow) |

### Theme 3 — 珊瑚×金橙 `coral-amber` (warm color)

| Token | Value |
|-------|-------|
| `--bg` | `#fff8f5` |
| `--surface` | `#ffffff` |
| `--surface-raised` | `#fff3ee` |
| `--text` | `#3d1f14` |
| `--text-secondary` | `#a0522d` |
| `--primary` | `#ff6b6b` |
| `--primary-hover` | `#fa5252` |
| `--accent` | `#ffa94d` |
| `--border` | `#ffd6c4` |
| `--border-subtle` | `#ffe8dc` |
| `--focus-ring` | `#ff6b6b` |
| `--shadow-color` | `255, 107, 107` |

### Theme 4 — 靛蓝×薄荷 `indigo-mint` (cool color)

| Token | Value |
|-------|-------|
| `--bg` | `#eef2ff` |
| `--surface` | `#ffffff` |
| `--surface-raised` | `#f5f7ff` |
| `--text` | `#1e2a6e` |
| `--text-secondary` | `#5c6bc0` |
| `--primary` | `#4263eb` |
| `--primary-hover` | `#3451d1` |
| `--accent` | `#20c997` |
| `--border` | `#c7d2fe` |
| `--border-subtle` | `#dde4ff` |
| `--focus-ring` | `#4263eb` |
| `--shadow-color` | `66, 99, 235` |

### Theme 5 — 紫罗兰×柠黄 `violet-amber` (split-complementary)

| Token | Value |
|-------|-------|
| `--bg` | `#f5f3ff` |
| `--surface` | `#ffffff` |
| `--surface-raised` | `#ede9fe` |
| `--text` | `#2e1065` |
| `--text-secondary` | `#9d72d4` |
| `--primary` | `#7c3aed` |
| `--primary-hover` | `#6d28d9` |
| `--accent` | `#fbbf24` |
| `--border` | `#ddd6fe` |
| `--border-subtle` | `#ede9fe` |
| `--focus-ring` | `#7c3aed` |
| `--shadow-color` | `124, 58, 237` |

### Theme 6 — 玫红×天蓝 `rose-sky` (split-complementary)

| Token | Value |
|-------|-------|
| `--bg` | `#fef0f8` |
| `--surface` | `#ffffff` |
| `--surface-raised` | `#fce4f3` |
| `--text` | `#5c0a32` |
| `--text-secondary` | `#b5408a` |
| `--primary` | `#e91e8c` |
| `--primary-hover` | `#d81b7a` |
| `--accent` | `#00b4d8` |
| `--border` | `#f9c0e2` |
| `--border-subtle` | `#fce4f3` |
| `--focus-ring` | `#e91e8c` |
| `--shadow-color` | `233, 30, 140` |

---

## Component Redesign

All components use form tokens (`--radius-*`, `--shadow-*`, `--space-*`). No component has hard-coded pixel values for radius or shadow.

### Search Bar (`#user_input_area`)

**Changes:**
- Height: `3rem` → `3.25rem`
- Border-radius: `1.5rem` → `var(--radius-full)`
- Border: `1px solid var(--border)` (unchanged token, new value)
- Box-shadow: add `0 2px 16px rgba(var(--shadow-color), 0.07)` micro-glow
- Right side: replace icon-only button with a pill-shaped `<span>` styled as a search submit button using `--primary` background. No HTML change — CSS-only using `#btn-retrieval-content`.
- Focus state: `border-color: var(--primary)` + `box-shadow: 0 0 0 3px rgba(var(--shadow-color), 0.15)`

### Collection Container (`.collection`)

**Changes:**
- Collection header `.collection-head`: `background: var(--surface-raised)`, `border-radius: var(--radius-lg) var(--radius-lg) 0 0`, `border: 1.5px solid var(--border-subtle)`
- Collection body `.collection-links`: `border-radius: 0 0 var(--radius-lg) var(--radius-lg)`, `border: 1.5px solid var(--border-subtle)`, `border-top: none`
- Collection gap between groups: `margin-top: 1.5rem`
- Handle buttons `.collection-handle button`: `border-radius: var(--radius-sm)`, refined hover state

### Link Cards (`.collection-link`)

**Changes:**
- Border-radius: `0.2rem` → `var(--radius-md)` (10px)
- Box-shadow: `var(--shadow-sm)` at rest, `var(--shadow-md)` on hover
- Hover: `transform: translateY(-2px)` + shadow step up
- Link icon `.collection-link-icon`: `border-radius: var(--radius-sm)`, `background: var(--border-subtle)`, color `var(--text-secondary)`
- Remark area `.collection-link-remark`: `background: var(--surface-raised)` (subtle tint to differentiate from name area)

### Sidebar (`.ipage-aside`)

**Changes:**
- Width: implicit `~44px` → `52px` (via padding adjustment)
- Theme/setting icon wrapper: `width: 34px; height: 34px; border-radius: var(--radius-md)`
- Active icon (`.ipage-aside-theme`, `.ipage-aside-setting`): `background: var(--primary); color: #fff; box-shadow: var(--shadow-glow)`
- Add a `<div class="ipage-aside-sep">` divider between theme icon and setting icon (single HTML addition, low risk)
- Sidebar overall: `border-right: 1px solid var(--border-subtle)`

### Dropdown (`.dropdown`)

**Changes:**
- Border-radius: `0.5rem` → `var(--radius-lg)` (16px)
- Padding: `0.35rem 0` → `0.4rem`
- Border: `1px solid var(--border)` → `1.5px solid var(--border-subtle)`
- Box-shadow: upgrade to `var(--shadow-lg)`
- Items `.dropdown-item`: `border-radius: var(--radius-sm)` (items get their own radius so hover fills correctly within padded container)
- Item icon `.dropdown-item-icon`: `background: var(--border-subtle)`, `border-radius: var(--radius-sm)`
- Add separator `<div class="dropdown-sep">` support in CSS (1px `var(--border-subtle)` line with `0.3rem` vertical margin)

### Notification + Modal (`utils/notification.js`, `utils/form.js` styles)

**Changes (CSS only):**
- Toast `.notification`: `border-radius: var(--radius-md)`, `box-shadow: var(--shadow-lg)`
- Modal overlay: backdrop unchanged
- Modal dialog: `border-radius: var(--radius-lg)`, `border: 1.5px solid var(--border-subtle)`

---

## Files Changed

| File | Change type |
|------|-------------|
| `css/variable.css` | Full rewrite — 6 themes, two-layer token system, legacy aliases |
| `tab/src/css/search.css` | Height, radius, shadow, focus state, search button style |
| `tab/src/css/link.css` | Collection/link card radius, shadow, hover animation |
| `tab/src/css/home.css` | Sidebar width, icon size, active glow, separator |
| `tab/src/css/dropdown.css` | Radius, shadow, item radius, separator support |
| `tab/src/css/tabs.css` | Toolbar spacing and add-collection button style |
| `tab/src/css/edit-form.css` | Modal radius upgrade |
| `tab/src/css/notification.css` | Toast radius + shadow upgrade |
| `tab/src/js/theme-switcher.js` | `THEMES` array: replace 8 old names with 6 new slug names; update default fallback from `'default'` to `'slate-light'` |
| `tab/index.html` | `data-theme` attributes + display names for 6 themes; add `.ipage-aside-sep` |

### Theme option HTML mapping

Each `<div class="dropdown-item theme-option">` entry in `tab/index.html` must use:

| `data-theme` slug | Icon | Display name (Chinese) |
|-------------------|------|------------------------|
| `slate-light` | `◐` | 石墨浅调 |
| `midnight-ink` | `🌑` | 深夜墨色 |
| `coral-amber` | `🪸` | 珊瑚金橙 |
| `indigo-mint` | `💎` | 靛蓝薄荷 |
| `violet-amber` | `🔮` | 紫罗兰柠黄 |
| `rose-sky` | `🌸` | 玫红天蓝 |

---

## Constraints

- **No JS logic changes** beyond `THEMES` array in `theme-switcher.js`
- **Script load order in `tab/index.html` must not change**
- **`$indexedDB`, `$store`, `$apis` and all global objects are unaffected**
- **Legacy CSS variable names preserved as aliases** — no grep-and-replace needed in JS
- Theme is applied via `document.documentElement.setAttribute('data-theme', theme)` — mechanism unchanged
- The 4 彩色 themes are浅色 (light background) — deep dark is only `midnight-ink`
- **Theme migration fallback:** existing users may have an old theme name (e.g. `"default"`, `"purple-gold"`) saved in `localStorage`. The `loadSavedTheme()` function already falls back to `currentTheme` (`'default'`) when the saved value is not in `THEMES`. After the update, `'default'` is also no longer in `THEMES`, so it too falls through. The implementer must update **both** hardcoded `'default'` strings in `theme-switcher.js` to `'slate-light'`:
  1. `let currentTheme = 'default'` → `let currentTheme = 'slate-light'` (line 9, module-level init)
  2. `theme = 'default'` inside `applyTheme()` → `theme = 'slate-light'` (line 52, guard for unrecognized names)

---

## Out of Scope

- Options page (`options/`) — not restyled in this pass
- Popup (`popup/`) — not restyled in this pass
- Settings panel (`settings.css`) — no changes required; all values already use tokens that are preserved via the alias table above
- Font family — no change
- Layout proportions (column widths, sidebar/body split) — no change
- Screensaver layer — no change
