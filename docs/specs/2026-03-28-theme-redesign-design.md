# 主题系统重设计 — 设计规格文档

**日期：** 2026-03-28
**状态：** 已批准（第 2 版 — 已修复规格审查问题）
**范围：** 全局视觉语言重建 — CSS 设计 Token 系统 + 6 套主题 + 组件样式重写

---

## 概览

从零重建扩展的视觉设计语言。现状：8 套主题仅替换颜色变量，没有统一的组件设计系统。目标：以 CSS 设计 Token 系统驱动 6 套精心设计的主题（2 套基础款 + 4 套高饱和彩色款），所有主题共用统一的组件形态语言。

**设计基调：** 现代有质感（Refined）— 清晰的视觉层次，有分量感的阴影，精致而不冷漠。参考：Arc Browser、Raycast。

**实施策略：** CSS 设计 Token 重写 + 组件 CSS 全面重写。HTML 结构尽量保留（只添加辅助 class，不改变顺序）。JS 逻辑不动，仅更新主题名称数组。

---

## 设计 Token 系统

### Token 分层结构

`css/variable.css` 从纯颜色变量扩展为两层 Token 系统：

**第一层 — 颜色 Token**（每套主题各自定义）：

| Token | 用途 |
|-------|------|
| `--bg` | 页面背景色 |
| `--surface` | 默认面板色（侧边栏、面板） |
| `--surface-raised` | 抬高面板色（卡片、下拉浮层）— **新增** |
| `--text` | 主文字色 |
| `--text-secondary` | 次要/辅助文字色（替代 `--muted`） |
| `--primary` | 品牌色 / 交互主色 |
| `--primary-hover` | 主色悬浮态 — **新增** |
| `--accent` | 辅助强调色 |
| `--border` | 默认边框色 |
| `--border-subtle` | 轻量分割线色 — **新增** |
| `--focus-ring` | 键盘焦点轮廓色 — **新增** |
| `--shadow-color` | 阴影色调（浅色主题用中性灰，深色主题用主色调）— **新增** |

**向后兼容：** 所有旧变量名保留为新 Token 的别名，JS 中的引用不会失效。完整别名列表：

| 旧变量名 | 映射至 |
|----------|--------|
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

**第二层 — 形态 Token**（全局共用，6 套主题共享，不随主题变化）：

```css
/* 圆角 */
--radius-sm:   6px
--radius-md:   10px
--radius-lg:   16px
--radius-full: 9999px

/* 间距 */
--space-xs: 0.25rem
--space-sm: 0.5rem
--space-md: 1rem
--space-lg: 1.5rem
--space-xl: 2rem

/* 阴影 — 全部引用 --shadow-color（RGB 三元组，不含 alpha） */
--shadow-sm:   0 1px 4px rgba(var(--shadow-color), 0.06)
--shadow-md:   0 4px 16px rgba(var(--shadow-color), 0.10)
--shadow-lg:   0 8px 28px rgba(var(--shadow-color), 0.14)
--shadow-glow: 0 3px 10px rgba(var(--shadow-color), 0.35)  /* 激活图标光晕，同样引用 --shadow-color */
```

注意：`--shadow-color` 定义为裸 RGB 三元组（如 `0, 0, 0` 或 `99, 102, 241`），以便用于 `rgba()` 内部。不存在单独的 `--primary-rgb` token。

---

## 6 套主题

### 主题 1 — 石墨浅调 `slate-light`（浅色基础款）

| Token | 颜色值 |
|-------|--------|
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

### 主题 2 — 深夜墨色 `midnight-ink`（深色基础款）

| Token | 颜色值 |
|-------|--------|
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
| `--shadow-color` | `99, 102, 241`（主色调光晕） |

### 主题 3 — 珊瑚×金橙 `coral-amber`（暖调彩色）

| Token | 颜色值 |
|-------|--------|
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

### 主题 4 — 靛蓝×薄荷 `indigo-mint`（冷调彩色）

| Token | 颜色值 |
|-------|--------|
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

### 主题 5 — 紫罗兰×柠黄 `violet-amber`（分裂互补色）

| Token | 颜色值 |
|-------|--------|
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

### 主题 6 — 玫红×天蓝 `rose-sky`（分裂互补色）

| Token | 颜色值 |
|-------|--------|
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

## 组件重设计

所有组件使用形态 Token（`--radius-*`、`--shadow-*`、`--space-*`），组件 CSS 中不出现硬编码的圆角或阴影像素值。

### 搜索框（`#user_input_area`）

**改动：**
- 高度：`3rem` → `3.25rem`
- 圆角：`1.5rem` → `var(--radius-full)`
- 边框：`1px solid var(--border)`（token 不变，颜色值随主题更新）
- 阴影：新增 `0 2px 16px rgba(var(--shadow-color), 0.07)` 微光晕
- 右侧搜索按钮：将仅图标按钮改为 pill 形搜索按钮，使用 `--primary` 背景色。纯 CSS 实现，不改 HTML，选择器为 `#btn-retrieval-content`
- 聚焦态：`border-color: var(--primary)` + `box-shadow: 0 0 0 3px rgba(var(--shadow-color), 0.15)`

### 集合容器（`.collection`）

**改动：**
- 集合头部 `.collection-head`：`background: var(--surface-raised)`，`border-radius: var(--radius-lg) var(--radius-lg) 0 0`，`border: 1.5px solid var(--border-subtle)`
- 集合正文 `.collection-links`：`border-radius: 0 0 var(--radius-lg) var(--radius-lg)`，`border: 1.5px solid var(--border-subtle)`，`border-top: none`
- 集合间距：`margin-top: 1.5rem`
- 操作按钮 `.collection-handle button`：`border-radius: var(--radius-sm)`，细化悬浮态

### 链接卡片（`.collection-link`）

**改动：**
- 圆角：`0.2rem` → `var(--radius-md)`（10px）
- 阴影：静止态 `var(--shadow-sm)`，悬浮态 `var(--shadow-md)`
- 悬浮动效：`transform: translateY(-2px)` + 阴影升级
- 链接图标 `.collection-link-icon`：`border-radius: var(--radius-sm)`，`background: var(--border-subtle)`，颜色 `var(--text-secondary)`
- 备注区 `.collection-link-remark`：`background: var(--surface-raised)`（轻微着色，与名称区形成区分）

### 侧边栏（`.ipage-aside`）

**改动：**
- 宽度：原隐式 `~44px` → `52px`（通过调整 padding 实现）
- 图标容器（主题按钮、设置按钮）：`width: 34px; height: 34px; border-radius: var(--radius-md)`
- 激活态图标（`.ipage-aside-theme`、`.ipage-aside-setting`）：`background: var(--primary); color: #fff; box-shadow: var(--shadow-glow)`
- 在主题图标与设置图标之间新增 `<div class="ipage-aside-sep">` 分隔线（单处 HTML 添加，风险低）
- 侧边栏整体：`border-right: 1px solid var(--border-subtle)`

### 下拉菜单（`.dropdown`）

**改动：**
- 圆角：`0.5rem` → `var(--radius-lg)`（16px）
- 内边距：`0.35rem 0` → `0.4rem`
- 边框：`1px solid var(--border)` → `1.5px solid var(--border-subtle)`
- 阴影：升级为 `var(--shadow-lg)`
- 菜单项 `.dropdown-item`：`border-radius: var(--radius-sm)`（悬浮填充在圆角容器内正确显示）
- 图标 `.dropdown-item-icon`：`background: var(--border-subtle)`，`border-radius: var(--radius-sm)`
- 新增分隔线 `.dropdown-sep` 的 CSS 支持（1px `var(--border-subtle)` 线，上下各 `0.3rem` 边距）

### 通知 + 弹窗（对应 CSS 文件）

**改动（仅 CSS）：**
- Toast 提示 `.notification`：`border-radius: var(--radius-md)`，`box-shadow: var(--shadow-lg)`
- 遮罩层：不变
- 弹窗主体：`border-radius: var(--radius-lg)`，`border: 1.5px solid var(--border-subtle)`

---

## 改动文件清单

| 文件 | 改动说明 |
|------|----------|
| `css/variable.css` | 全部重写 — 6 套主题，两层 Token 系统，旧变量别名 |
| `tab/src/css/search.css` | 高度、圆角、阴影、聚焦态、搜索按钮样式 |
| `tab/src/css/link.css` | 集合/链接卡片圆角、阴影、悬浮动效 |
| `tab/src/css/home.css` | 侧边栏宽度、图标尺寸、激活光晕、分隔线 |
| `tab/src/css/dropdown.css` | 圆角、阴影、菜单项圆角、分隔线支持 |
| `tab/src/css/tabs.css` | 工具栏间距与添加集合按钮样式微调 |
| `tab/src/css/edit-form.css` | 弹窗圆角升级 |
| `tab/src/css/notification.css` | Toast 圆角 + 阴影升级 |
| `tab/src/js/theme-switcher.js` | `THEMES` 数组：替换为 6 个新主题 slug；默认值从 `'default'` 改为 `'slate-light'`（两处） |
| `tab/index.html` | 更新 6 套主题的 `data-theme` 属性和显示名；新增 `.ipage-aside-sep` |

### HTML 主题选项映射表

`tab/index.html` 中每个 `<div class="dropdown-item theme-option">` 条目的具体内容：

| `data-theme` 标识 | 图标 | 显示名 |
|-------------------|------|--------|
| `slate-light` | `◐` | 石墨浅调 |
| `midnight-ink` | `🌑` | 深夜墨色 |
| `coral-amber` | `🪸` | 珊瑚金橙 |
| `indigo-mint` | `💎` | 靛蓝薄荷 |
| `violet-amber` | `🔮` | 紫罗兰柠黄 |
| `rose-sky` | `🌸` | 玫红天蓝 |

---

## 约束条件

- **JS 逻辑不变**，仅修改 `theme-switcher.js` 中的 `THEMES` 数组和默认值
- **`tab/index.html` 的脚本加载顺序不得改变**
- **`$indexedDB`、`$store`、`$apis` 等全局对象不受影响**
- **旧 CSS 变量名通过别名保留**，JS 层无需任何 grep 替换
- 主题通过 `document.documentElement.setAttribute('data-theme', theme)` 应用，机制不变
- 4 套彩色主题均为浅色背景，深色主题仅 `midnight-ink` 一套
- **主题迁移兼容：** 老用户的 `localStorage` 中可能保存了旧主题名（如 `"default"`、`"purple-gold"`）。`loadSavedTheme()` 在旧名不在 `THEMES` 中时会回退至 `currentTheme`（原为 `'default'`），但更新后 `'default'` 本身也不在新 `THEMES` 中，因此会进一步落入 `applyTheme()` 的兜底逻辑。实施时需修改 `theme-switcher.js` 中**两处**硬编码的 `'default'`：
  1. `let currentTheme = 'default'` → `let currentTheme = 'slate-light'`（第 9 行，模块级初始化）
  2. `applyTheme()` 内 `theme = 'default'` → `theme = 'slate-light'`（第 52 行，无效主题兜底）

---

## 不在本次范围内

- 选项页（`options/`）— 本次不重构
- 弹窗（`popup/`）— 本次不重构
- 设置面板（`settings.css`）— 无需改动，现有值已通过别名表完整覆盖
- 字体族 — 不变
- 布局比例（列宽、侧边栏与主体分割）— 不变
- 屏保层 — 不变
