# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-28
**Commit:** 54d521e
**Branch:** master

---

## OVERVIEW

**INIT** — Manifest V3 Chrome extension that replaces the new-tab page with a personal dashboard: bookmark collections, search bar (Baidu/Google/Bing with autocomplete), live tabs/history sidebar, theme switcher, and background customization. No build system, no package manager, no test framework.

---

## STRUCTURE

```
Ywr-Extension/
├── manifest.json               # Extension entry: permissions, surfaces, MV3 service worker declaration
├── service-worker/             # Background layer (ES Modules — only area using import/export)
│   ├── index.js                # Aggregator: imports all sub-modules, nothing else
│   ├── association.js          # ALL chrome.runtime.onMessage hub
│   ├── installed.js            # onInstalled: writes default color to chrome.storage.sync
│   ├── tabs.js                 # onCreated: console.log only (placeholder)
│   ├── alarms.js               # Placeholder — do not add alarms without purpose
│   ├── db.js                   # Lazy IndexedDB singleton (getDB()) for service-worker use
│   └── background.js           # Empty placeholder
├── tab/                        # New-tab page — highest complexity in the repo
│   ├── index.html              # Page skeleton + ordered <script> chain = runtime dependency graph
│   └── src/
│       ├── css/                # Tab page styles (9 files: dropdown, edit-form, home, link, etc.)
│       ├── img/                # SVG icons, favicon
│       ├── base/               # Local iconfont assets (iconfont.js, iconfont.json)
│       └── js/
│           ├── fun_module/
│           │   ├── declare/    # Phase 1: DOM capture + public API IIFEs → global $* objects
│           │   └── execute/    # Phase 2: event binding only, no DOM queries
│           ├── indexeddb/
│           │   ├── index.js    # IndexedModel class + initIndexedDB() + $indexedDB assignment
│           │   ├── models/index.model.js   # Schema: $indexedDBModel (collections + links stores)
│           │   └── utils/index.utils.js    # EMPTY FILE — stub never implemented
│           ├── store/index.js  # $store: runtime in-memory cache object (4 sub-maps)
│           ├── apis/index.js   # $apis: UI-to-IndexedDB bridge, import/export logic
│           ├── components/input-file.js    # Custom file input component
│           ├── settings-manager.js         # SettingsManager: background image/opacity/blur
│           ├── theme-switcher.js           # ThemeSwitcher: 8 themes via localStorage
│           └── load.js         # window.onload bootstrap — final startup gate
├── options/                    # Options page (lighter declare/execute structure)
│   ├── index.html              # Settings page skeleton
│   ├── load.js                 # Startup entry (lightweight)
│   └── src/css/                # Options styles
├── popup/                      # Quick-bookmark popup (Ctrl+B)
│   ├── index.html
│   ├── index.js
│   └── index.css
├── utils/                      # Shared UI helpers (globals: $utils, $el, $modal, $notify, $dropdown)
│   ├── index.js                # $utils: misc helpers
│   ├── declare_element.js      # $el: DOM query shorthands ($el.__(), $el.__all())
│   ├── form.js                 # $modal: dialog/form service
│   ├── notification.js         # $notify: toast notification service
│   ├── dropdown.js             # $dropdown: floating dropdown menu service
│   └── color.js                # Color utilities
├── css/                        # Global CSS (base, normalize, iconfont, variables)
├── js/content.js               # Content script — NOT registered in manifest, likely dead code
├── vender/                     # Vendored third-party scripts (sortablejs, fetch-jsonp)
└── knowledge-base/             # Legacy per-directory AGENTS.md files (superseded by this file)
```

---

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Permissions, surfaces, shortcuts, new-tab override | `manifest.json` |
| Install defaults, cross-surface messaging, tab events | `service-worker/` |
| Add a new background message handler | `service-worker/association.js` |
| New-tab UI: search, collections, sidebar, tools | `tab/src/js/fun_module/` |
| Collections/links data flow, import/export | `tab/src/js/apis/index.js` + `tab/src/js/indexeddb/` |
| Script load order / runtime dependencies | `tab/index.html` |
| Theme switching | `tab/src/js/theme-switcher.js` |
| Background image, opacity, blur settings | `tab/src/js/settings-manager.js` |
| Settings page (profile, data export/import) | `options/` |
| Quick-bookmark popup | `popup/` |
| Toast notifications, modal forms, DOM helpers, dropdowns | `utils/` |
| IndexedDB schema (tables, fields) | `tab/src/js/indexeddb/models/index.model.js` |
| Runtime in-memory state | `tab/src/js/store/index.js` |

---

## GLOBAL OBJECTS MAP

| Symbol | Type | Declared in | Role |
|--------|------|-------------|------|
| `$indexedDB` | `var` (null → IDBDatabase) | `indexeddb/index.js` | Live DB handle; null until `initIndexedDB()` resolves |
| `$indexedDBModel` | IIFE const | `indexeddb/models/index.model.js` | Schema definition fed to `onupgradeneeded` |
| `$store` | object | `store/index.js` | Runtime mirror cache: `{collections, links, tabs, history}` |
| `$apis` | IIFE | `apis/index.js` | All IndexedDB CRUD + export/import; UI's only data gateway |
| `$collections` | IIFE | `declare/collections.js` | Collection/link render, drag-drop state |
| `$searchEles` | IIFE | `declare/search.js` | Search bar DOM + suggestion state machine |
| `$tools` | IIFE | `declare/tools.js` | Toolbar button DOM reference bag |
| `$linksEles` | IIFE | `declare/links.js` | Legacy "quick links" panel render |
| `$sections` | IIFE | `declare/section.js` | Tabs + history list render (calls Chrome APIs) |
| `$aside` | IIFE | `declare/aside.js` | Sidebar fold/unfold + localStorage state |
| `$el` | IIFE | `utils/declare_element.js` | `$el.__(sel)` = `querySelector`, `$el.__all(sel)` = `querySelectorAll` |
| `$modal` | IIFE | `utils/form.js` | Dialog + form modal service |
| `$notify` | IIFE | `utils/notification.js` | Toast notification service |
| `$dropdown` | IIFE | `utils/dropdown.js` | Floating dropdown service |
| `$utils` | IIFE | `utils/index.js` | Misc utility functions |
| `SettingsManager` | IIFE (auto-init) | `settings-manager.js` | Background image/opacity/blur via `localStorage` |
| `ThemeSwitcher` | IIFE (auto-init) | `theme-switcher.js` | 8-theme system via `localStorage['ywr-extension-theme']` |

---

## STORAGE LAYERS

| Layer | Key/Store | What lives there |
|-------|-----------|-----------------|
| IndexedDB `"initDB"` v1 | `collections` | `{id (timestamp), name, order}` |
| IndexedDB `"initDB"` v1 | `links` | `{id (timestamp), name, url, remark, order, collection (FK), icon}` |
| `chrome.storage.sync` | `profile_avatar` | Base64 JPEG (quality compressed: 0.6→0.4→0.2, ~10KB cap) |
| `chrome.storage.sync` | `profile_signature` | Max 100 chars, used as `document.title` in tab page |
| `chrome.storage.sync` | `color` | Written on install (`"#3aa757"`), not read elsewhere |
| `localStorage` | `'ywr-extension-settings'` | JSON `{backgroundImage, backgroundOpacity (0.15), backgroundBlur (0)}` |
| `localStorage` | `'ywr-extension-theme'` | One of 8 theme name strings |
| `localStorage` | `'engine'` | `'baidu'` / `'google'` / `'bing'` |
| `localStorage` | `'is-aside-fold'` | `'0'` or `'1'` |
| `localStorage` | `'linksinfo'` | JSON array `[{href, name}]` — legacy quick links |

---

## DECLARE / EXECUTE PATTERN

The tab page (and options page) use a custom two-phase module convention:

**Phase 1 — `declare/`**: Each file is an IIFE that queries DOM elements, initializes state, defines methods, and assigns the result to a global `$name` const. Runs at parse time.

**Phase 2 — `execute/`**: Each file is a plain script that attaches event listeners by consuming the globals from declare. No DOM queries. No return value.

Rule: declare = structure + API; execute = side effects only.

The `tab/index.html` `<script>` order encodes all dependencies. Reordering any script breaks the page.

```
utils/* → store/index.js → declare_element.js → indexeddb/models → indexeddb/index.js
→ fun_module/declare/* → fun_module/execute/* → apis/index.js → load.js
```

---

## CROSS-SURFACE COMMUNICATION

```
Tab Page  ──sendMessage("suggest")──►  Service Worker  ──fetch──►  Baidu autocomplete API
Popup     ──sendMessage(action)──►  Service Worker  ──IndexedDB──►  response
Options   ──sendMessage("data:export"|"data:import")──►  Service Worker
Service Worker  ──broadcastDataChanged()──►  All tabs ("dataChanged" message)
Service Worker  ──chrome.tabs.sendMessage("profileChanged")──►  Tab pages
```

The service worker is the **only** surface allowed to fetch external URLs (host_permissions). The tab page accesses IndexedDB directly for its own CRUD but uses the service worker for Baidu suggestions and listens for broadcast invalidations.

---

## CONVENTIONS

- Service worker: ES Modules (`import`/`export`). Everything else: global `<script>` tags, no modules.
- Shared state: `$prefix` globals, not imports.
- New background capability: create a new module file, import it in `service-worker/index.js`.
- IDs are `Date.now()` (millisecond timestamps) — used as primary keys AND for "most recent" ordering.
- Cascade delete for links: `$apis.collection.delete` calls `deleteWithCondition({collection: id})` manually.
- `deleteWithCondition` uses full cursor scan — no secondary index queries.
- Drag-drop via SortableJS; after sort, `order` field is updated explicitly.

---

## ANTI-PATTERNS (THIS PROJECT)

- **Do not** use `$indexedDB` before `initIndexedDB()` resolves — it is `null` initially.
- **Do not** convert only one side of a declare/execute pair to ES Modules — breaks the entire load chain.
- **Do not** add `chrome.alarms` without a clear purpose — `alarms.js` comment explicitly warns against meaningless wake-ups.
- **Do not** treat `js/content.js` as active — it is not registered in `manifest.json`.
- **Do not** write new storage keys directly in execute files — route through existing `$apis` or `SettingsManager` boundaries.
- **Do not** assume `background.js` has logic — it is empty.
- **Do not** call `$indexedDB.$tables.update(r)` — the correct call is `$indexedDB.$tables.collections.update(r)` or `$indexedDB.$tables.links.update(r)`. (Known bug in `$apis.*.updateOrder`.)
- **Do not** rely on `indexeddb/utils/index.utils.js` — the file is an empty stub.
- **Do not** place new knowledge-base docs in subdirectories; this single file is the canonical reference.

---

## KNOWN BUGS / TECH DEBT

| Location | Issue |
|----------|-------|
| `tab/src/js/indexeddb/index.js:71` | `list()` opens `"readwrite"` transaction for read — unnecessary lock |
| `tab/src/js/apis/index.js` — `updateOrder` | Calls `$indexedDB.$tables.update()` (wrong level) — silently broken |
| `service-worker/db.js` vs `indexeddb/index.js` | `IndexedModel` class duplicated between tab and service-worker contexts |
| `tab/index.html` | Loads external CSS from `at.alicdn.com` — network dep + CSP/privacy risk |
| `indexeddb/utils/index.utils.js` | Empty stub |
| `service-worker/tabs.js` | `onCreated` does nothing but `console.log` |
| `indexeddb/index.js:64` | Stray `console.log(records)` left in production |

---

## COMMANDS

```bash
# Load extension (no build step needed)
# chrome://extensions → Load unpacked → select repo root

# After any change:
# chrome://extensions → click Reload on the extension

# Debug service worker:
# chrome://extensions → "Service Worker" link → DevTools

# Open options page:
# chrome-extension://<id>/options/index.html

# Open new tab page:
# Open any new tab after extension is loaded
```

---

## NOTES

- `$store` is a cache, not the source of truth. Many renders re-query IndexedDB before displaying.
- The service-worker `db.js` lazy singleton (`getDB()`) and the tab-page `IndexedModel` share the same IndexedDB database name `"initDB"` but are separate class instances with different transaction behavior.
- Profile data (avatar + signature) syncs across devices via `chrome.storage.sync`; bookmark data (collections/links) is local-only via IndexedDB.
- `$apis.exportConfig` (tab page) and `options/load.js → data:export` (service worker route) are duplicate export implementations — prefer the service-worker route for new export work.
