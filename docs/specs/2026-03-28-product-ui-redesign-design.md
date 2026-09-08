# 新标签页产品化 UI 重设计 — 设计规格文档

**日期：** 2026-03-28
**状态：** 草案（待规格审查）
**范围：** 新标签页（`tab/`）全面产品化改造 — 布局重构 + 壁纸引擎升级 + 小组件体系 + 设置面板重做 + 主题 Token 增强

---

## 概览

对标 WeTab/iTab/Infinity 等国内新标签页产品，对本扩展的新标签页做**全面产品化**改造。核心形态经确认：**收藏集合仍为主体**，在其上叠加沉浸式壁纸、Hero 搜索、可开关/可定位的小组件、设置面板分区化。

**实施策略（方案 A — 产品化外壳）：** 保留现有 `declare/execute`、全局 IIFE、CSS Token 双层体系与数据层（IndexedDB / chrome.storage / localStorage），不推翻既有代码。分层新增 `WallpaperManager`、`WidgetRegistry` 与布局引擎，HTML 骨架重排为三段式结构。增量提交、每步可独立验收回滚。

**设计基调：** 现代产品型启动页 — 沉浸壁纸 + 毛玻璃面板 + 清晰层级。参考：iTab、Infinity、Arc Browser。

---

## 1. 布局与信息架构

### 1.1 页面总结构

```
┌─────────────────────────────────────────────────────────┐
│ 页面背景层（壁纸/渐变 fixed 全屏，蒙层+模糊，z-index -1） │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 顶栏 .shell-topbar：引擎logo · 问候/日期 … 折叠/设置 │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Hero 区 .shell-hero：大号毛玻璃搜索框 + 引擎 chips   │ │
│ ├───────────────────────┬─────────────────────────────┤ │
│ │ 工作区 .shell-workbench                             │ │
│ │  grid: 左列widgets | 收藏集合(主体) | 右栏Tabs/历史 │ │
│ └───────────────────────┴─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 1.2 关键决策

1. **移除现有固定左竖条 `.ipage-aside`**：其入口（主题、设置）并入顶栏 `.shell-topbar`；折叠按钮语义迁移至右栏自身。释放横向空间，收藏为主体。
2. **三段式容器**：
   - `.shell-topbar`：高度 `--topbar-h`，含问候/时间（可选 widget `clock` 的 hero 变体）、主题入口、设置入口
   - `.shell-hero`：高度 `--hero-h`，承载主搜索区（现 `#user_search_area` 迁入）与引擎 chips
   - `.shell-workbench`：`display: grid`，列布局 `[widgets 列(auto, 可关) | 收藏区(1fr) | 右栏(auto, 可折叠)]`
3. **收藏集合为主体**：`#ipage-collections` 渲染逻辑与 `$collections` 不动，仅外层容器与间距样式变化。
4. **小组件 = `<section class="widget" data-widget="id">`**，由 `WidgetRegistry` 统一渲染、开关、定位（见 §2）。
5. **右栏（Tabs + History）**：保留 `.ipage-sections` 现有渲染，改为右列 zone；折叠语义由 `is-aside-fold` 迁移至新键（见 §2.2）。
6. **屏保模式保留**：语义从"隐藏内容区"改为"整页壁纸展示"（`SettingsManager.enterScreensaver` 样式层调整），触发/退出机制不变。

### 1.3 兼容与降级

- 主题仍通过 `document.documentElement.setAttribute('data-theme', theme)` 应用，机制不变。
- 脚本加载顺序约束不变（`tab/index.html` 链只允许在**尾部追加**新脚本）。
- 所有新 zone 无 JS 报错时降级为：widgets 列隐藏、右栏收拢、页面仍可搜索/浏览收藏。

---

## 2. 小组件体系（WidgetRegistry）与布局自定义

### 2.1 模块结构

新增 `tab/src/js/widgets/` 目录，遵循 declare/execute 约定：

```
widgets/
├── registry.js      # WidgetRegistry：注册表 + init/渲染调度 + zone 布局
├── clock.js         # 时钟/问候（可 hero 变体）
├── todo.js          # 待办清单
├── quote.js         # 每日语录
├── tools.js         # 快捷工具组
└── engines.js       # 多引擎快速搜索 chips
```

- 每个 widget 模块暴露 `{ id, title, icon, zones, render(el), refresh? }`（`id` 为稳定 slug，如 `'clock'`）。
- **declare 阶段**：各 widget 调用 `WidgetRegistry.register(...)`。
- **execute 阶段**：`WidgetRegistry.init()` 读取布局配置，将启用项渲染至对应 zone；`refresh()` 供待办等实时数据更新时调用。
- 数据流遵守仓库约定：**不在 execute 直写存储键**，统一经 `$apis` 或新增 `$widgetStore` 边界。

### 2.2 布局配置与存储

- 键：`localStorage['ywr-widget-layout']`，JSON：

  ```json
  {
    "clock":   { "zone": "topbar", "enabled": true },
    "todo":    { "zone": "left",   "enabled": true },
    "quote":   { "zone": "left",   "enabled": true },
    "tools":   { "zone": "left",   "enabled": true },
    "engines": { "zone": "hero",   "enabled": true }
  }
  ```

- **Zone 枚举**：`topbar` / `hero` / `left` / `right` / `off`。
- 设置面板以「开关 + 位置下拉」呈现（表单驱动，不引入拖拽）。
- 右栏折叠：新键 `localStorage['ywr-layout-right-fold']`（`'0'/'1'`）；迁移旧 `is-aside-fold` 值一次。

### 2.3 五个小组件规格（轻量、无外部 API）

| Widget | id | 数据/存储 | 说明 |
|--------|----|-----------|------|
| 时钟/问候 | `clock` | 无（Date 实时） | 大号时间 + 日期/星期 + 按时段问候语；12/24h 跟随 `locale`；可停靠 `topbar`/`hero` |
| 待办清单 | `todo` | IndexedDB 新表 `todos` | 增删/勾选/清除已完成；空态引导；`refresh()` 监听表变更 |
| 每日语录 | `quote` | 内置 ~50 条 + localStorage 记录当日索引 | 随机展示，点按换一条；按天固定（同日不重复随机）|
| 快捷工具组 | `tools` | localStorage JSON 数组 | 默认 8 个（GitHub/知乎/Gmail/B站/掘金/邮箱/地图/翻译），可增删改；图标用 emoji 或 iconfont |
| 多引擎搜索 | `engines` | 复用 `'engine'` | chips 展示 3 引擎，点击切换主搜索框引擎并聚焦 |

### 2.4 IndexedDB schema 升级

- 新表 `todos`：`{ id: Date.now(), text, done: 0|1, createdAt }`。
- 数据库版本 **v1 → v2**：`onupgradeneeded` 建 `todos`，不改既有 `collections`/`links` store。
- 注意：`IndexedModel` 在 tab 与 service-worker 各有一份（`tab/src/js/indexeddb/models/index.model.js` 与 `service-worker/db.js`），**两处同步加表**，版本号一致。
- 旧用户 v1 库由 onupgradeneeded 自动升级，无需数据迁移。

---

## 3. 壁纸引擎 `WallpaperManager`

### 3.1 现状与目标

现状：`SettingsManager` 仅支持本地 base64 上传 + 透明度 + 模糊 + 屏保。目标：多源壁纸（本地/渐变/在线/收藏）+ 每日轮换，保留透明度/模糊/屏保能力。

### 3.2 壁纸源模型

```
wallpaperSource = {
  type:     'local' | 'gradient' | 'online' | 'preset' | 'favorite',
  url?,         // 图片 URL / base64（local/online）
  gradient?,    // CSS gradient 字符串（gradient）
  blur?,  opacity?,   // 可选覆盖，缺省用全局设置
  label?, source?,    // 展示名 / 图库标记（online）
  addedAt?,          // 收藏/加入时间
}
```

存储升级 `'ywr-extension-settings'` → 增加字段：

```
{
  ...旧字段(backgroundImage/Opacity/Blur 保留为“当前壁纸视图”),
  wallpaper: {
    current:  wallpaperSource | null,
    library:  wallpaperSource[],   // 本地/渐变/收藏全集
    favorites: string[],           // library 项的 id/url 索引
    daily:    false                // 每日轮换开关
  }
}
```

**旧数据迁移**：首次读到旧 `backgroundImage` 时，转为 `library[0]` + `current`，随后不再依赖旧字段。

### 3.3 四类壁纸能力

1. **本地上传**：沿用现有压缩流程（质量 0.6→0.4→0.2），上限改为可配置（默认 1MB），结果入 `library`。
2. **渐变生成器**：预设 12 组渐变 + 随机渐变（HSL 双色），纯前端，入 `library`。
3. **在线壁纸**：
   - 主：**Picsum Photos** `https://picsum.photos/1920/1080?random=N`（免费、无需 key、稳定）。
   - 备：Bing 每日壁纸（`https://www.bing.com/HPImageArchive.aspx`），经 SW 代理解析。
   - **全部经 service worker 代理 fetch**（仓库约束：仅 SW 可发外部请求），广播结果。
4. **收藏与每日轮换**：
   - 当前壁纸可收藏/取消收藏（`favorites` 索引）。
   - 每日轮换开关开启后注册 `chrome.alarms`（`wallpaperDaily`，24h 周期）→ SW 拉取在线壁纸 → 写 storage → 广播 `wallpaperChanged`。这是 alarms 的合规用途（有明确目的）。

### 3.4 manifest 与 SW 变更

```json
"host_permissions": [
  "https://suggestion.baidu.com/*",
  "https://picsum.photos/*",
  "https://www.bing.com/*"
]
```

- `service-worker/wallpaper.js`：`wallpaper:fetch` 消息路由 + 每日 alarm 处理；import 进 `service-worker/index.js`，路由注册进 `association.js`。
- 广播沿用 `chrome.runtime.sendMessage({ type: 'wallpaperChanged' })`；tab 页监听后刷新背景层。
- 图片 URL 直接用于 CSS `background-image`（CSS 可跨源加载图片，无需 host 权限存图）。

### 3.5 保留项

- 透明度/模糊滑块作用于 `wallpaper.current`（或全局默认）。
- 屏保层展示当前壁纸全屏；无壁纸时的空态提示沿用"请先设置背景图片"逻辑。

---

## 4. 主题与视觉语言升级

Token 双层体系（`css/variable.css`）**根基不动**，追加增强：

1. **形态 Token 追加**（全局层，向后兼容）：
   - `--glass-bg` / `--glass-border` / `--glass-blur`（毛玻璃面板）
   - `--topbar-h`、`--hero-h`（结构高度）
   - `--dur-fast: 140ms`、`--ease-out`（动效规范）
2. **每主题追加颜色 Token**（6 套同步补）：
   - `--bg-deep`：壁纸蒙层底色（深色主题偏不透）
   - `--on-image`：图像上文字色（浅色主题深字、深色主题浅字，主题内可覆写）
   - `--accent-soft`：强调色柔和底（chips/标签）
3. **深色主题强化**：`midnight-ink` 蒙层默认透明度更高，保证壁纸上可读性。
4. **动效规范**：微交互沿用 140ms；Hero/组件首次入场一次性 `fadeUp`（150–220ms）；`prefers-reduced-motion: reduce` 时禁用位移动效。
5. **字体**：沿用系统栈，不引入网络字体。

---

## 5. 设置面板重做

现有 `settings.css` + `settings-manager.js` 单页抽屉 → **分区 Tab 右侧抽屉**：

| Tab | 内容 |
|-----|------|
| 外观 | 主题选择（6 套）；壁纸源管理：本地/渐变/在线/收藏 + 预览切换、透明度/模糊、每日轮换开关 |
| 布局 | widget 开关 + 位置下拉；右栏折叠开关 |
| 组件 | 待办数据管理、快捷工具组编辑、语录偏好 |
| 更多 | 屏保、扩展选项入口（沿用）|

- 抽屉宽度 320px → **380px**；保留 `.settings-panel` / `.settings-overlay` 命名与开合机制，内部 body 改 Tab 容器。
- 该面板 HTML 目前由 `settings-manager.js` 的 `createSettingsPanel()` 字符串生成 → 本轮拆为 **declare 模板 + execute 绑定** 或保留字符串但按 Tab 分区重构（二选一，倾向后者以控制改动面）。

---

## 6. 文件改动清单与实施阶段

### 6.1 新增文件

| 文件 | 用途 |
|------|------|
| `tab/src/js/widgets/registry.js` | WidgetRegistry |
| `tab/src/js/widgets/clock.js` | 时钟/问候 widget |
| `tab/src/js/widgets/todo.js` | 待办 widget |
| `tab/src/js/widgets/quote.js` | 语录 widget |
| `tab/src/js/widgets/tools.js` | 工具组 widget |
| `tab/src/js/widgets/engines.js` | 引擎 chips widget |
| `tab/src/js/wallpaper-manager.js` | 壁纸引擎（吸收/扩展 SettingsManager 背景职责）|
| `service-worker/wallpaper.js` | SW 壁纸 fetch/alarm 代理 |
| `tab/src/css/widgets.css` | widget 通用 + 各组件样式 |
| `tab/src/css/hero.css` | Hero/搜索区产品化样式 |
| `tab/src/css/topbar.css` | 顶栏样式 |
| `docs/specs/2026-03-28-product-ui-redesign-design.md` | 本文档 |

### 6.2 改动文件

| 文件 | 改动 |
|------|------|
| `tab/index.html` | 布局重排（顶栏/Hero/工作区）+ 脚本链尾部追加新模块 |
| `css/variable.css` | 追加形态/颜色 Token（§4）|
| `tab/src/js/load.js` | 初始化顺序：WallpaperManager → WidgetRegistry → 既有流程 |
| `tab/src/js/settings-manager.js` | 背景职责移交 WallpaperManager；面板 Tab 化 |
| `tab/src/js/indexeddb/models/index.model.js` | + `todos` 表，v1→v2 |
| `service-worker/db.js` | 同步 + `todos` 表 v1→v2 |
| `service-worker/index.js` | import wallpaper.js |
| `service-worker/association.js` | `wallpaper:fetch` 等路由 |
| `manifest.json` | host_permissions 追加（§3.4）|
| `tab/src/css/home.css` | 侧栏相关删除/迁移至 topbar.css |
| `tab/src/css/settings.css` | Tab 面板、380px 抽屉 |
| `tab/src/js/theme-switcher.js` | 如 Hero/问候联动主题名（可选）|

### 6.3 实施顺序（每步独立验收）

1. **M1 布局骨架**：顶栏 + Hero + 工作区 grid（HTML/CSS 先行，功能不回归）
2. **M2 主题 Token 增强 + 毛玻璃视觉**
3. **M3 壁纸引擎**：渐变 → 本地 → 在线 → 收藏/每日轮换
4. **M4 WidgetRegistry + 设置面板 Tab 化**（开关/位置表单）
5. **M5 五个小组件逐个落地**
6. **M6 动效打磨、回归测试、旧数据迁移验证**

---

## 7. 约束条件

- **脚本加载顺序**：`tab/index.html` 只允许尾部追加，不动既有链。
- **JS 逻辑兼容**：既有 `$collections/$searchEles/$sections/$aside/$modal/$notify/$dropdown/$apis` 契约不变；仅收纳/移动 DOM 容器。
- **存储键隔离**：新增键不覆盖旧键；迁移逻辑一次性、幂等。
- **alarms 用途明确**：仅"每日壁纸轮换"注册 alarms。
- **无新增第三方运行时依赖**：小组件与壁纸引擎均原生实现；不引入框架、不新增构建步骤。
- **service worker 是唯一 fetch 代理**。
- 收藏集合数据（collections/links）不受影响，schema 仅追加 `todos`。

## 8. 不在本次范围内

- `options/` 选项页 — 不动（保留"扩展选项"入口跳转）
- `popup/` 快速收藏弹窗 — 不动
- 收藏集合/链接的编辑交互 — 仅容器样式变化
- 屏保内容多样化（保持壁纸全屏）
- 在线壁纸的搜索/分类浏览（首版仅随机 + 每日）
- 拖拽式自由布局（已确认不做，用开关+位置预设）

## 9. 风险与回退

| 风险 | 缓解 |
|------|------|
| 布局重排破坏既有交互 | 每里程碑独立提交；M1 仅收 DOM 不改逻辑 |
| IndexedDB 升级损坏旧库 | 仅 `createObjectStore` 追加；先在本机保留 v1 副本验证 |
| 在线壁纸 API 不可用 | Picsum+Bing 双源；失败回退渐变/本地；离线仍可用 |
| 毛玻璃/动效性能 | 组件数量小；`prefers-reduced-motion` 降级 |
| 外部 CSS 依赖（at.alicdn.com） | 本轮不处理，保持现状（已在 tech debt 中记录）|
