# 主题系统重设计 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 重建扩展的视觉设计语言——用双层 CSS Token 系统驱动 6 套主题，并对所有主要 UI 组件的形态进行全面升级。

**架构：** 以 `css/variable.css` 作为单一数据源，定义颜色 Token（每套主题独立）和形态 Token（全局共用）。所有组件 CSS 文件改为引用 Token，不再出现硬编码颜色或圆角值。HTML 结构和 JS 逻辑基本不动，仅做最小改动（更新主题名数组、新增一个分隔线 div）。

**技术栈：** 原生 CSS 自定义属性（CSS Custom Properties）、原生 JavaScript（IIFE 模式）、无构建工具

---

## 文件改动总览

| 文件 | 操作 |
|------|------|
| `css/variable.css` | 全部重写 |
| `tab/src/css/search.css` | 全部重写 |
| `tab/src/css/link.css` | 全部重写 |
| `tab/src/css/home.css` | 局部修改（侧边栏相关部分） |
| `tab/src/css/dropdown.css` | 全部重写 |
| `tab/src/css/tabs.css` | 全部重写 |
| `tab/src/css/edit-form.css` | 局部修改（圆角、边框） |
| `tab/src/css/notification.css` | 局部修改（圆角、阴影） |
| `tab/src/js/theme-switcher.js` | 局部修改（THEMES 数组 + 两处默认值） |
| `tab/index.html` | 局部修改（主题选项列表 + 新增分隔线 div） |

---

## Task 1：重写 `css/variable.css`——建立双层 Token 系统

**文件：**
- 修改：`css/variable.css`

这是所有后续任务的基础，必须第一步完成。

- [ ] **步骤 1：阅读现有文件，理解结构**

  阅读 `css/variable.css`（全文 210 行）。确认当前有 8 套主题，每套定义约 15 个 CSS 变量。注意 `:root` 与 `[data-theme="default"]` 共用同一块声明。

- [ ] **步骤 2：写入新文件**

  用以下完整内容替换 `css/variable.css`：

  ```css
  /* ============================================================
     设计 Token 系统 — 第二层：形态 Token（全局，不随主题变化）
  ============================================================ */
  :root {
    /* 圆角 */
    --radius-sm:   6px;
    --radius-md:   10px;
    --radius-lg:   16px;
    --radius-full: 9999px;

    /* 间距 */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;

    /* 阴影（引用 --shadow-color，由各主题定义为裸 RGB 三元组） */
    --shadow-sm:   0 1px 4px rgba(var(--shadow-color), 0.06);
    --shadow-md:   0 4px 16px rgba(var(--shadow-color), 0.10);
    --shadow-lg:   0 8px 28px rgba(var(--shadow-color), 0.14);
    --shadow-glow: 0 3px 10px rgba(var(--shadow-color), 0.35);
  }

  /* ============================================================
     主题 1：石墨浅调 slate-light（浅色基础款，同时作为 :root 默认值）
  ============================================================ */
  :root,
  [data-theme="slate-light"] {
    --bg:             #f1f3f5;
    --surface:        #ffffff;
    --surface-raised: #ffffff;
    --text:           #212529;
    --text-secondary: #6c757d;
    --primary:        #343a40;
    --primary-hover:  #495057;
    --accent:         #6c757d;
    --border:         #dee2e6;
    --border-subtle:  #e9ecef;
    --focus-ring:     #343a40;
    --shadow-color:   0, 0, 0;

    /* 向后兼容别名 */
    --muted:           var(--text-secondary);
    --borderGrey:      var(--border);
    --muted-surface:   var(--surface-raised);
    --greyLight-1:     var(--surface-raised);
    --greyLight-2:     rgba(var(--shadow-color), 0.08);
    --greyLight-3:     var(--border);
    --greyDark:        var(--text-secondary);
    --white:           var(--surface);
    --black:           var(--text);
    --deep-dark:       var(--bg);
    --shadow-1:        var(--shadow-md);
    --shadow-2:        var(--shadow-lg);
    --inset-subtle:    inset 0.1rem 0.1rem 0.25rem rgba(var(--shadow-color), 0.08);
    --inset-highlight: inset -0.1rem -0.1rem 0.25rem rgba(255,255,255,0.05);
    --primary-light:   var(--primary-hover);
    --primary-dark:    var(--primary);
  }

  /* ============================================================
     主题 2：深夜墨色 midnight-ink（深色基础款）
  ============================================================ */
  [data-theme="midnight-ink"] {
    --bg:             #0f1117;
    --surface:        #1a1d27;
    --surface-raised: #22253a;
    --text:           #e8eaf6;
    --text-secondary: #8b8fc0;
    --primary:        #6366f1;
    --primary-hover:  #818cf8;
    --accent:         #a5b4fc;
    --border:         #2d3048;
    --border-subtle:  #252836;
    --focus-ring:     #818cf8;
    --shadow-color:   99, 102, 241;

    --muted:           var(--text-secondary);
    --borderGrey:      var(--border);
    --muted-surface:   var(--surface-raised);
    --greyLight-1:     var(--surface-raised);
    --greyLight-2:     rgba(var(--shadow-color), 0.08);
    --greyLight-3:     var(--border);
    --greyDark:        var(--text-secondary);
    --white:           var(--surface);
    --black:           var(--text);
    --deep-dark:       var(--bg);
    --shadow-1:        var(--shadow-md);
    --shadow-2:        var(--shadow-lg);
    --inset-subtle:    inset 0.1rem 0.1rem 0.25rem rgba(var(--shadow-color), 0.08);
    --inset-highlight: inset -0.1rem -0.1rem 0.25rem rgba(255,255,255,0.03);
    --primary-light:   var(--primary-hover);
    --primary-dark:    var(--primary);
  }

  /* ============================================================
     主题 3：珊瑚×金橙 coral-amber（暖调彩色）
  ============================================================ */
  [data-theme="coral-amber"] {
    --bg:             #fff8f5;
    --surface:        #ffffff;
    --surface-raised: #fff3ee;
    --text:           #3d1f14;
    --text-secondary: #a0522d;
    --primary:        #ff6b6b;
    --primary-hover:  #fa5252;
    --accent:         #ffa94d;
    --border:         #ffd6c4;
    --border-subtle:  #ffe8dc;
    --focus-ring:     #ff6b6b;
    --shadow-color:   255, 107, 107;

    --muted:           var(--text-secondary);
    --borderGrey:      var(--border);
    --muted-surface:   var(--surface-raised);
    --greyLight-1:     var(--surface-raised);
    --greyLight-2:     rgba(var(--shadow-color), 0.08);
    --greyLight-3:     var(--border);
    --greyDark:        var(--text-secondary);
    --white:           var(--surface);
    --black:           var(--text);
    --deep-dark:       var(--bg);
    --shadow-1:        var(--shadow-md);
    --shadow-2:        var(--shadow-lg);
    --inset-subtle:    inset 0.1rem 0.1rem 0.25rem rgba(var(--shadow-color), 0.08);
    --inset-highlight: inset -0.1rem -0.1rem 0.25rem rgba(255,255,255,0.9);
    --primary-light:   var(--primary-hover);
    --primary-dark:    var(--primary);
  }

  /* ============================================================
     主题 4：靛蓝×薄荷 indigo-mint（冷调彩色）
  ============================================================ */
  [data-theme="indigo-mint"] {
    --bg:             #eef2ff;
    --surface:        #ffffff;
    --surface-raised: #f5f7ff;
    --text:           #1e2a6e;
    --text-secondary: #5c6bc0;
    --primary:        #4263eb;
    --primary-hover:  #3451d1;
    --accent:         #20c997;
    --border:         #c7d2fe;
    --border-subtle:  #dde4ff;
    --focus-ring:     #4263eb;
    --shadow-color:   66, 99, 235;

    --muted:           var(--text-secondary);
    --borderGrey:      var(--border);
    --muted-surface:   var(--surface-raised);
    --greyLight-1:     var(--surface-raised);
    --greyLight-2:     rgba(var(--shadow-color), 0.08);
    --greyLight-3:     var(--border);
    --greyDark:        var(--text-secondary);
    --white:           var(--surface);
    --black:           var(--text);
    --deep-dark:       var(--bg);
    --shadow-1:        var(--shadow-md);
    --shadow-2:        var(--shadow-lg);
    --inset-subtle:    inset 0.1rem 0.1rem 0.25rem rgba(var(--shadow-color), 0.08);
    --inset-highlight: inset -0.1rem -0.1rem 0.25rem rgba(255,255,255,0.9);
    --primary-light:   var(--primary-hover);
    --primary-dark:    var(--primary);
  }

  /* ============================================================
     主题 5：紫罗兰×柠黄 violet-amber（分裂互补色）
  ============================================================ */
  [data-theme="violet-amber"] {
    --bg:             #f5f3ff;
    --surface:        #ffffff;
    --surface-raised: #ede9fe;
    --text:           #2e1065;
    --text-secondary: #9d72d4;
    --primary:        #7c3aed;
    --primary-hover:  #6d28d9;
    --accent:         #fbbf24;
    --border:         #ddd6fe;
    --border-subtle:  #ede9fe;
    --focus-ring:     #7c3aed;
    --shadow-color:   124, 58, 237;

    --muted:           var(--text-secondary);
    --borderGrey:      var(--border);
    --muted-surface:   var(--surface-raised);
    --greyLight-1:     var(--surface-raised);
    --greyLight-2:     rgba(var(--shadow-color), 0.08);
    --greyLight-3:     var(--border);
    --greyDark:        var(--text-secondary);
    --white:           var(--surface);
    --black:           var(--text);
    --deep-dark:       var(--bg);
    --shadow-1:        var(--shadow-md);
    --shadow-2:        var(--shadow-lg);
    --inset-subtle:    inset 0.1rem 0.1rem 0.25rem rgba(var(--shadow-color), 0.08);
    --inset-highlight: inset -0.1rem -0.1rem 0.25rem rgba(255,255,255,0.9);
    --primary-light:   var(--primary-hover);
    --primary-dark:    var(--primary);
  }

  /* ============================================================
     主题 6：玫红×天蓝 rose-sky（分裂互补色）
  ============================================================ */
  [data-theme="rose-sky"] {
    --bg:             #fef0f8;
    --surface:        #ffffff;
    --surface-raised: #fce4f3;
    --text:           #5c0a32;
    --text-secondary: #b5408a;
    --primary:        #e91e8c;
    --primary-hover:  #d81b7a;
    --accent:         #00b4d8;
    --border:         #f9c0e2;
    --border-subtle:  #fce4f3;
    --focus-ring:     #e91e8c;
    --shadow-color:   233, 30, 140;

    --muted:           var(--text-secondary);
    --borderGrey:      var(--border);
    --muted-surface:   var(--surface-raised);
    --greyLight-1:     var(--surface-raised);
    --greyLight-2:     rgba(var(--shadow-color), 0.08);
    --greyLight-3:     var(--border);
    --greyDark:        var(--text-secondary);
    --white:           var(--surface);
    --black:           var(--text);
    --deep-dark:       var(--bg);
    --shadow-1:        var(--shadow-md);
    --shadow-2:        var(--shadow-lg);
    --inset-subtle:    inset 0.1rem 0.1rem 0.25rem rgba(var(--shadow-color), 0.08);
    --inset-highlight: inset -0.1rem -0.1rem 0.25rem rgba(255,255,255,0.9);
    --primary-light:   var(--primary-hover);
    --primary-dark:    var(--primary);
  }
  ```

- [ ] **步骤 3：在浏览器中加载扩展，验证默认主题（石墨浅调）显示正常**

  `chrome://extensions` → 点击 Reload → 打开新标签页。预期：页面背景为 `#f1f3f5`，组件白色，无报错。

- [ ] **步骤 4：提交**

  ```bash
  git add css/variable.css
  git commit -m "style: rebuild CSS token system with 6 themes"
  ```

---

## Task 2：更新 `theme-switcher.js` 和 `tab/index.html`——同步主题名称

**文件：**
- 修改：`tab/src/js/theme-switcher.js`（第 7、9、52 行）
- 修改：`tab/index.html`（主题选项列表 + 新增分隔线 div）

- [ ] **步骤 1：修改 `theme-switcher.js` 的 THEMES 数组和两处默认值**

  阅读 `tab/src/js/theme-switcher.js`。找到以下三处并修改：

  **第 7 行**，将：
  ```js
  const THEMES = ['default', 'purple-gold', 'forest-green', 'cyber-neon', 'caramel-warm', 'ocean-blue', 'sakura-pink', 'midnight-star'];
  ```
  改为：
  ```js
  const THEMES = ['slate-light', 'midnight-ink', 'coral-amber', 'indigo-mint', 'violet-amber', 'rose-sky'];
  ```

  **第 9 行**，将：
  ```js
  let currentTheme = 'default';
  ```
  改为：
  ```js
  let currentTheme = 'slate-light';
  ```

  **第 52 行**（`applyTheme` 函数内的兜底逻辑），将：
  ```js
    theme = 'default';
  ```
  改为：
  ```js
    theme = 'slate-light';
  ```

- [ ] **步骤 2：更新 `tab/index.html` 的主题选项列表**

  阅读 `tab/index.html` 第 31–64 行，找到 `<div class="theme-switcher dropdown" id="theme-switcher">` 内的全部 8 个 `<div class="dropdown-item theme-option">` 条目，替换为以下 6 个：

  ```html
  <div class="dropdown-item theme-option" data-theme="slate-light">
    <span class="dropdown-item-icon">◐</span>
    <span>石墨浅调</span>
  </div>
  <div class="dropdown-item theme-option" data-theme="midnight-ink">
    <span class="dropdown-item-icon">🌑</span>
    <span>深夜墨色</span>
  </div>
  <div class="dropdown-item theme-option" data-theme="coral-amber">
    <span class="dropdown-item-icon">🪸</span>
    <span>珊瑚金橙</span>
  </div>
  <div class="dropdown-item theme-option" data-theme="indigo-mint">
    <span class="dropdown-item-icon">💎</span>
    <span>靛蓝薄荷</span>
  </div>
  <div class="dropdown-item theme-option" data-theme="violet-amber">
    <span class="dropdown-item-icon">🔮</span>
    <span>紫罗兰柠黄</span>
  </div>
  <div class="dropdown-item theme-option" data-theme="rose-sky">
    <span class="dropdown-item-icon">🌸</span>
    <span>玫红天蓝</span>
  </div>
  ```

- [ ] **步骤 3：在 `tab/index.html` 侧边栏新增分隔线 div**

  在 `.ipage-aside-theme` div 与 `.ipage-aside-setting` div 之间新增一行：

  ```html
  <div class="ipage-aside-sep"></div>
  ```

  改后该区域结构为：
  ```html
  <div class="ipage-aside-theme">
    ...（主题切换器，不动）
  </div>
  <div class="ipage-aside-sep"></div>
  <div class="ipage-aside-setting">
    ...
  </div>
  ```

- [ ] **步骤 4：验证主题切换功能正常**

  Reload 扩展 → 打开新标签页 → 点击侧边栏主题图标 → 下拉菜单应显示 6 个新主题名 → 点击任意主题，`<html>` 的 `data-theme` 属性应更新为对应 slug → 刷新页面后主题保持。

- [ ] **步骤 5：提交**

  ```bash
  git add tab/src/js/theme-switcher.js tab/index.html
  git commit -m "style: update theme switcher to 6 new themes"
  ```

---

## Task 3：重写 `tab/src/css/search.css`——搜索框升级

**文件：**
- 修改：`tab/src/css/search.css`

- [ ] **步骤 1：阅读现有文件**

  阅读 `tab/src/css/search.css`（共 113 行）。注意 `#user_input_area` 高度 `3rem`，圆角 `1.5rem`；`#ipage-tabs` 的样式也在本文件（`#ipage-tabs .tab-item` 行高相关）。

- [ ] **步骤 2：写入新文件**

  用以下内容完整替换 `tab/src/css/search.css`：

  ```css
  #user_search_area {
    width: 600px;
    margin: 0 auto 1.5rem auto;
    overflow: visible;
    position: relative;
  }

  /* 建议列表 */
  .suggestion-list {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--surface);
    border: 1.5px solid var(--border-subtle);
    border-top: none;
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    max-height: 320px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: var(--shadow-md);
  }
  .suggestion-list.is-visible {
    display: block;
  }
  .suggestion-item {
    padding: 0.6rem 1.2rem;
    cursor: pointer;
    color: var(--text);
    font-size: 0.875rem;
    transition: background 120ms ease;
  }
  .suggestion-item.is-active,
  .suggestion-item:hover {
    background: var(--surface-raised);
  }

  /* 工具栏标签（#ipage-tabs 内的 .tab-item） */
  #ipage-tabs .tab-item {
    height: 2rem;
    line-height: 2rem;
    margin: 0 0.5rem;
    padding: 0 0.5rem;
    cursor: pointer;
  }
  .tab-item .tab-item-text {
    margin-left: 0.5rem;
  }

  /* 搜索框主体 */
  #user_input_area {
    width: 100%;
    height: 3.25rem;
    display: flex;
    position: relative;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-full);
    box-shadow: 0 2px 16px rgba(var(--shadow-color), 0.07);
    transition: box-shadow 180ms ease, border-color 180ms ease;
    align-items: center;
  }
  #user_input_area:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--shadow-color), 0.15), 0 2px 16px rgba(var(--shadow-color), 0.07);
  }
  /* 建议列表展开时搜索框下圆角变直 */
  #user_input_area.has-suggestions {
    border-radius: var(--radius-full) var(--radius-full) var(--radius-lg) var(--radius-lg);
  }

  /* 输入框 */
  #user-content {
    flex: 1;
    font-size: 14px;
    background-color: transparent;
    outline: none;
    border: none;
    color: var(--text);
    padding: 0 3rem;
  }
  #user-content::placeholder {
    color: var(--text-secondary);
  }

  /* 引擎切换按钮（左侧） */
  #btn-retrieval-engine {
    position: absolute;
    border: none;
    left: 0;
    height: 100%;
    padding: 0 1rem;
    cursor: pointer;
    background-color: transparent;
    color: var(--text-secondary);
    transition: color 140ms ease;
    display: flex;
    align-items: center;
  }
  #btn-retrieval-engine:hover {
    color: var(--primary);
  }

  /* 搜索提交按钮（右侧，pill 形） */
  #btn-retrieval-content {
    position: absolute;
    right: 0.4rem;
    border: none;
    height: calc(100% - 0.8rem);
    padding: 0 1.1rem;
    cursor: pointer;
    background-color: var(--primary);
    color: #fff;
    border-radius: var(--radius-full);
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 140ms ease, transform 100ms ease;
  }
  #btn-retrieval-content:hover {
    background-color: var(--primary-hover);
  }
  #btn-retrieval-content:active {
    transform: scale(0.96);
  }

  #btn-retrieval-engine span,
  #btn-retrieval-content span {
    font-size: 1.1rem;
  }

  .selected-engine-item {
    box-shadow: var(--inset-subtle), var(--inset-highlight) !important;
  }
  ```

- [ ] **步骤 3：验证搜索框外观**

  Reload 扩展 → 新标签页。预期：搜索框比之前稍高，两端完全圆弧，右侧有带颜色的圆形搜索按钮，聚焦时出现主色边框光晕。切换到深色主题（深夜墨色），预期：搜索框背景深色，搜索按钮为靛紫色。

- [ ] **步骤 4：提交**

  ```bash
  git add tab/src/css/search.css
  git commit -m "style: redesign search bar with token-driven styles"
  ```

---

## Task 4：重写 `tab/src/css/dropdown.css`——下拉菜单升级

**文件：**
- 修改：`tab/src/css/dropdown.css`

- [ ] **步骤 1：阅读现有文件**

  阅读 `tab/src/css/dropdown.css`（40 行）。

- [ ] **步骤 2：写入新文件**

  ```css
  .dropdown {
    position: absolute;
    background-color: var(--surface);
    color: var(--text);
    border: 1.5px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: 0.4rem;
    min-width: 8rem;
    z-index: 1000;
    overflow: hidden;
  }

  .dropdown .dropdown-item {
    padding: 0.55rem 0.75rem;
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    border-radius: var(--radius-sm);
    transition: background-color 120ms ease, color 120ms ease;
  }
  .dropdown .dropdown-item:hover {
    color: var(--text);
    background-color: var(--surface-raised);
  }
  .dropdown .dropdown-item:active {
    background-color: var(--border-subtle);
  }

  .dropdown-item .dropdown-item-icon {
    margin-right: 0.55rem;
    width: 1.5rem;
    height: 1.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    color: var(--text-secondary);
    background: var(--border-subtle);
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }

  /* 分隔线（可选用于 HTML 中的 <div class="dropdown-sep">） */
  .dropdown-sep {
    height: 1px;
    background: var(--border-subtle);
    margin: 0.3rem 0;
  }
  ```

- [ ] **步骤 3：验证下拉菜单**

  Reload 扩展 → 新标签页 → 点击侧边栏主题图标（调出主题下拉）、点击工具栏 MORE 按钮（调出更多菜单）。预期：菜单圆角更大（16px），内边距宽松，菜单项悬浮时自身有圆角高亮（而不是整个菜单宽度填充）。

- [ ] **步骤 4：提交**

  ```bash
  git add tab/src/css/dropdown.css
  git commit -m "style: redesign dropdown with larger radius and token-driven styles"
  ```

---

## Task 5：重写 `tab/src/css/tabs.css`——工具栏升级

**文件：**
- 修改：`tab/src/css/tabs.css`

- [ ] **步骤 1：阅读现有文件**

  阅读 `tab/src/css/tabs.css`（70 行）。

- [ ] **步骤 2：写入新文件**

  ```css
  #ipage-tabs {
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    border-top: 1px solid var(--border-subtle);
    border-bottom: 1px solid var(--border-subtle);
    margin-bottom: 1rem;
    font-size: 13px;
    font-weight: 400;
    gap: 0.4rem;
  }

  #ipage-tabs .tab-item {
    display: inline-flex;
    align-items: center;
    padding: 0.4rem 0.65rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--text-secondary);
    background-color: transparent;
    border: 1px solid transparent;
    transition: background-color 140ms ease, color 140ms ease, border-color 140ms ease;
  }
  #ipage-tabs .tab-item:hover {
    background-color: var(--surface-raised);
    color: var(--text);
  }
  #ipage-tabs .tab-item [class^="icon-"] {
    font-size: 1rem;
    margin-right: 0.35rem;
  }
  #ipage-tabs .tab-item .tab-item-text {
    font-size: 12px;
    font-weight: 500;
  }

  /* 添加集合按钮 */
  #ipage-tabs .tab-btn-add-collection {
    padding: 0.4rem 0.75rem;
    margin-left: auto;
    background-color: var(--surface);
    color: var(--text);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
  }
  #ipage-tabs .tab-btn-add-collection:hover {
    border-color: var(--primary);
    background-color: var(--surface-raised);
    box-shadow: var(--shadow-md);
  }

  .add-collection-text {
    font-weight: 600;
    margin-left: 0.4rem;
    font-size: 12px;
  }
  .add-collection-icon {
    font-size: 12px;
    color: var(--text-secondary);
    background: var(--border-subtle);
    padding: 0.2rem;
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  ```

- [ ] **步骤 3：验证工具栏**

  Reload 扩展 → 新标签页。预期：工具栏分割线更细（border-subtle），ADD COLLECTION 按钮悬浮时出现主色边框，整体间距稍微宽松。

- [ ] **步骤 4：提交**

  ```bash
  git add tab/src/css/tabs.css
  git commit -m "style: upgrade toolbar with token-driven styles"
  ```

---

## Task 6：重写 `tab/src/css/link.css`——集合与链接卡片升级

**文件：**
- 修改：`tab/src/css/link.css`

- [ ] **步骤 1：阅读现有文件**

  阅读 `tab/src/css/link.css`（201 行）。重点注意集合头部 `.collection-head`、正文 `.collection-links`、链接卡片 `.collection-link` 的现有圆角（3px）、边框分体式结构和 `.collection-link-handle` 的定位。

- [ ] **步骤 2：写入新文件**

  ```css
  #ipage-collections {
    position: relative;
    flex: 1;
    overflow: auto;
    padding: 1rem;
  }

  /* 集合组 */
  #ipage-collections .collection {
    position: relative;
    width: 100%;
  }
  #ipage-collections .collection + .collection {
    border-top: none;
    margin-top: 1.5rem;
  }

  /* 集合头部 */
  #ipage-collections .collection .collection-head {
    padding: 0.85rem 1rem;
    font-size: 14px;
    display: flex;
    font-weight: 700;
    background: var(--surface-raised);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    border: 1.5px solid var(--border-subtle);
    color: var(--text);
    letter-spacing: 0.01em;
  }
  .collection-head .collection-handle {
    visibility: visible;
    margin-left: auto;
    display: flex;
    gap: 0.35rem;
  }
  .collection-head .collection-handle button {
    background-color: var(--surface);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.3rem 0.55rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.9rem;
    min-height: 1.9rem;
    font-size: 0.9rem;
    line-height: 1;
    box-shadow: var(--shadow-sm);
    transition: background-color 140ms ease, color 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
  }
  .collection-head .collection-handle button:hover {
    background-color: var(--surface-raised);
    color: var(--text);
    border-color: var(--primary);
    box-shadow: var(--shadow-md);
  }

  /* 集合正文（链接容器） */
  #ipage-collections .collection .collection-links {
    position: relative;
    display: flex;
    padding: 0.9rem;
    gap: 0.8rem;
    flex-wrap: wrap;
    border: 1.5px solid var(--border-subtle);
    border-top: none;
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    background: var(--surface);
  }

  /* 链接卡片基础 */
  .collection-link,
  .collection-links .sortable-chosen {
    position: relative;
    display: flex;
    flex-direction: column;
    background-color: var(--surface);
    width: 12rem;
    aspect-ratio: 4/2;
    margin-right: 0;
    margin-bottom: 0;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-subtle);
    transition: box-shadow 180ms ease, transform 150ms ease;
  }
  .collection-links .sortable-chosen .tab-item-close {
    display: none;
  }
  #ipage-collections .collection .collection-links .collection-link:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  /* 拖拽占位 */
  .collection-links .sortable-chosen .tab-item-title {
    color: var(--text);
  }
  .collection-links .sortable-chosen .tab-item-favicon {
    height: 1.6rem;
    width: 1.6rem;
    font-size: 1.2rem;
    color: var(--text-secondary);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--border-subtle);
    border-radius: var(--radius-sm);
    padding: 0.12rem;
  }
  .collection-links .sortable-chosen .tab-item-prefixer {
    padding: 0.5rem;
    display: flex;
    align-items: center;
    flex: 3;
    border-bottom: 1px solid var(--border-subtle);
    overflow: hidden;
  }
  .collection-links .sortable-chosen .tab-item-remark {
    flex: 2;
    color: var(--text-secondary);
    padding: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .collection-links .sortable-chosen .tab-item-title {
    padding: 0.5rem;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 链接卡片名称区 */
  .collection-link .collection-link-name {
    padding: 0.5rem;
    font-size: 14px;
    flex: 3;
    color: var(--text);
    display: flex;
    align-items: center;
  }
  .collection-link .collection-link-name .collection-link-icon {
    height: 1.6rem;
    width: 1.6rem;
    flex-shrink: 0;
    font-size: 1.2rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--border-subtle);
    border-radius: var(--radius-sm);
    padding: 0.12rem;
  }
  .collection-link .collection-link-name .collection-link-title {
    white-space: nowrap;
    margin-left: 0.4rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* 链接卡片备注区 */
  .collection-link .collection-link-remark {
    padding: 0.5rem;
    font-size: 12px;
    flex: 2;
    color: var(--text-secondary);
    border-top: 1px solid var(--border-subtle);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: var(--surface-raised);
    border-radius: 0 0 var(--radius-md) var(--radius-md);
  }

  /* 链接操作按钮（悬浮显示） */
  .collection-link-handle {
    visibility: hidden;
    position: absolute;
    right: 0;
    top: 50%;
    transform: translate(50%, -50%);
  }
  .collection-link-handle .link-tool-remove {
    cursor: pointer;
    font-size: 20px;
    color: unset;
  }
  .collection-link-handle .link-tool-edit {
    cursor: pointer;
    font-size: 20px;
    margin-top: 1rem;
  }
  .collection-link:hover .collection-link-handle {
    visibility: visible;
  }

  /* 拖拽中状态 */
  .is-dragging {
    position: absolute;
    top: 0;
    left: 0;
  }
  .is-dragging .collection-link-handle {
    display: none;
  }

  /* 备注伪元素对齐辅助（保留原有逻辑） */
  .collection-links .sortable-chosen .tab-item-remark::after,
  .collection-links .sortable-chosen .tab-item-remark::before,
  .collection-link .collection-link-remark::after,
  .collection-link .collection-link-remark::before {
    content: "";
    display: inline-block;
    height: 100%;
    vertical-align: middle;
  }
  ```

- [ ] **步骤 3：验证集合与链接卡片**

  Reload 扩展 → 新标签页。预期：
  - 集合头部和正文圆角更大（16px），整体像一个统一的卡片容器
  - 链接卡片圆角从几乎直角变为 10px，备注区有轻微底色区分
  - 悬停链接卡片时轻微上浮（translateY -2px）并阴影加深
  - 切换各主题，颜色随 token 变化正常

- [ ] **步骤 4：提交**

  ```bash
  git add tab/src/css/link.css
  git commit -m "style: redesign collection and link cards with rounded corners and hover lift"
  ```

---

## Task 7：修改 `tab/src/css/home.css`——侧边栏升级

**文件：**
- 修改：`tab/src/css/home.css`

- [ ] **步骤 1：阅读现有文件**

  阅读 `tab/src/css/home.css`（165 行）。找到 `.ipage-aside`、`.ipage-aside-theme`、`.ipage-aside-setting`、`.theme-switcher` 相关的样式块。

- [ ] **步骤 2：更新侧边栏相关样式**

  将以下样式块替换/更新（保留文件其余内容不变，只修改下列选择器对应的块）：

  `.content-area .ipage-aside` 改为：
  ```css
  .content-area .ipage-aside {
    display: flex;
    flex-direction: column;
    padding: 0.75rem 0.6rem;
    border-right: 1px solid var(--border-subtle);
    background-color: var(--surface);
    gap: 0.3rem;
    min-width: 52px;
  }
  ```

  `.ipage-aside .ipage-aside-setting` 改为：
  ```css
  .ipage-aside .ipage-aside-setting {
    margin-top: auto;
    text-align: center;
    font-size: 20px;
    padding: 0.4rem;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-md);
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 140ms ease, color 140ms ease;
  }
  .ipage-aside .ipage-aside-setting:hover {
    background-color: var(--surface-raised);
    color: var(--text);
  }
  ```

  `.ipage-aside-theme` 改为：
  ```css
  .ipage-aside-theme {
    position: relative;
    text-align: center;
    font-size: 20px;
    padding: 0.4rem;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-md);
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 140ms ease, color 140ms ease;
  }
  .ipage-aside-theme:hover {
    background-color: var(--surface-raised);
    color: var(--text);
  }
  ```

  新增 `.ipage-aside-sep` 样式（在文件末尾添加）：
  ```css
  .ipage-aside-sep {
    height: 1px;
    background: var(--border-subtle);
    margin: 0.2rem 0;
    border-radius: 1px;
  }
  ```

  保持 `.theme-switcher` 及其子样式不变（位置定位逻辑不动）。

- [ ] **步骤 3：验证侧边栏**

  Reload 扩展 → 新标签页。预期：侧边栏图标容器为方形（34×34px），圆角 10px，设置按钮和主题按钮之间有 1px 细线分隔。深色主题下侧边栏背景为深色。

- [ ] **步骤 4：提交**

  ```bash
  git add tab/src/css/home.css
  git commit -m "style: upgrade sidebar icon sizing and add separator"
  ```

---

## Task 8：升级 `tab/src/css/edit-form.css` 和 `tab/src/css/notification.css`

**文件：**
- 修改：`tab/src/css/edit-form.css`
- 修改：`tab/src/css/notification.css`

- [ ] **步骤 1：阅读两个文件**

  阅读 `tab/src/css/edit-form.css` 和 `tab/src/css/notification.css`，找到弹窗主体的圆角/阴影设置，以及 Toast 通知的圆角/阴影设置。

- [ ] **步骤 2：修改弹窗圆角**

  在 `edit-form.css` 中找到弹窗容器（通常是 `.modal`、`.modal-dialog` 或 `.form-modal` 类），将其 `border-radius` 改为 `var(--radius-lg)`，`border` 改为 `1.5px solid var(--border-subtle)`，`box-shadow` 改为 `var(--shadow-lg)`。

  若存在弹窗遮罩 `.modal-overlay` 或 `.overlay`，背景色保持不变。

- [ ] **步骤 3：修改 Toast 通知圆角**

  在 `notification.css` 中找到 `.notification` 或 `.toast` 选择器，将 `border-radius` 改为 `var(--radius-md)`，`box-shadow` 改为 `var(--shadow-lg)`。

- [ ] **步骤 4：验证弹窗和通知**

  Reload 扩展 → 新标签页 → 点击添加/编辑集合（触发弹窗）、触发任意操作（触发 Toast 通知）。预期：弹窗圆角更大，Toast 圆角更大，阴影更有层次感。

- [ ] **步骤 5：提交**

  ```bash
  git add tab/src/css/edit-form.css tab/src/css/notification.css
  git commit -m "style: upgrade modal and toast border-radius with design tokens"
  ```

---

## Task 9：全主题回归测试

- [ ] **步骤 1：逐一切换 6 套主题，检查以下组件**

  对每套主题（slate-light、midnight-ink、coral-amber、indigo-mint、violet-amber、rose-sky）逐一验证：

  | 组件 | 检查项 |
  |------|--------|
  | 页面背景 | 颜色正确，无白色闪烁 |
  | 侧边栏 | 背景色、分隔线、图标颜色正确 |
  | 搜索框 | 背景、边框、右侧搜索按钮颜色正确 |
  | 主题下拉菜单 | 6 个选项显示正确，选中项高亮 |
  | 工具栏 | 分割线、ADD COLLECTION 按钮颜色正确 |
  | 集合头部 | 背景色（surface-raised）与正文（surface）有层次区分 |
  | 链接卡片 | 卡片白色/浅色正确，备注区有轻微底色 |
  | 下拉菜单 | 圆角正确，菜单项悬浮高亮正确 |
  | 弹窗 | 圆角、边框、阴影正确 |
  | Toast 通知 | 圆角、阴影正确 |

- [ ] **步骤 2：检查深色主题（midnight-ink）的特殊表现**

  深色主题阴影为靛紫色光晕（`--shadow-color: 99, 102, 241`），卡片悬浮时应有紫色光晕效果，而非灰色投影。

- [ ] **步骤 3：检查主题持久化**

  切换到任意主题 → 刷新页面 → 主题应保持。关闭标签页重新打开 → 主题应保持。

- [ ] **步骤 4：最终提交**

  ```bash
  git add -A
  git commit -m "style: complete theme system redesign — all 6 themes verified"
  ```

---

## 自查清单（对照规格文档）

| 规格要求 | 对应 Task | 状态 |
|----------|-----------|------|
| 双层 Token 系统（颜色 + 形态） | Task 1 | - |
| 6 套主题颜色值 | Task 1 | - |
| 旧变量别名完整保留（16 个） | Task 1 | - |
| THEMES 数组更新为 6 个新 slug | Task 2 | - |
| 两处 `'default'` 改为 `'slate-light'` | Task 2 | - |
| HTML 主题选项 6 条，含 icon 和中文名 | Task 2 | - |
| 新增 `.ipage-aside-sep` div | Task 2 | - |
| 搜索框高度 3.25rem，pill 圆角，右侧搜索按钮 | Task 3 | - |
| 搜索框聚焦态主色边框 + 光晕 | Task 3 | - |
| 下拉菜单圆角 16px，item 自身圆角，分隔线支持 | Task 4 | - |
| 工具栏 border-subtle 分割线，ADD COLLECTION 按钮升级 | Task 5 | - |
| 集合头部/正文统一圆角卡片 | Task 6 | - |
| 链接卡片圆角 10px，hover 上浮 | Task 6 | - |
| 侧边栏宽度 52px，图标 34×34px | Task 7 | - |
| 弹窗圆角升级 | Task 8 | - |
| Toast 圆角升级 | Task 8 | - |
| 全主题回归验证 | Task 9 | - |
