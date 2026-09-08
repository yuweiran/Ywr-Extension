# 新标签页产品化 UI 重设计 — 设计规格文档

**日期：** 2026-03-28
**状态：** 草案 v2（修订规格审查问题）
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

1. **移除现有固定左竖条 `.ipage-aside` 的外壳**，但其**内部节点与 class 钩子保留并迁入顶栏**：主题按钮沿用 `.ipage-aside-theme` + `#theme-switcher` 下拉、设置按钮沿用 `.ipage-aside-setting`。**这是硬性约束**：`theme-switcher.js` 与 `settings-manager.js` 通过这两个 class 自动绑定，M1 阶段必须保持钩子可用，否则主题切换与设置入口立刻失效。M1 验收包含"点顶栏主题/设置图标功能正常"。
2. **三段式容器**：
   - `.shell-topbar`：高度 `--topbar-h`，含引擎 logo、问候/日期（可选 `clock` widget hero 变体）、主题入口、设置入口
   - `.shell-hero`：高度 `--hero-h`，承载主搜索区（现 `#user_search_area` 迁入）与引擎 chips
   - `.shell-workbench`：`display: grid`，列布局 `[widgets 列(auto, 可关) | 收藏区(1fr) | 右栏(auto, 可折叠)]`
3. **收藏集合为主体**：`#ipage-collections` 渲染逻辑与 `$collections` 不动，仅外层容器与间距样式变化。
4. **小组件 = `<section class="widget" data-widget="id">`**，由 `WidgetRegistry` 统一渲染、开关、定位（见 §2）。
5. **右栏（Tabs + History）**：保留 `.ipage-body-right`/`.ipage-sections` 现有渲染与折叠机制（`declare/aside.js`），在 grid 中占右列。折叠状态键迁移见 §2.2 与 M1 任务。
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

- 每个 widget 模块暴露 `{ id, title, icon, zones, render(el), refresh? }`（`id` 为稳定 slug，如 `'clock'`）。**全局命名约束**：widget 模块只向 registry 注册 payload，**不得引入新的顶层全局对象**——现有 `$tools`（declare/tools.js）等名字已被占用，`widgets/tools.js` 等文件名与既有 declare 文件同名，必须以注册 payload 形式存在（如 `WidgetRegistry.register({id:'tools', ...})`），避免 IIFE 全局冲突。
- **declare 阶段**：各 widget 调用 `WidgetRegistry.register(...)`。
- **execute 阶段**：`WidgetRegistry.init()` 读取布局配置，将启用项渲染至对应 zone。
- **刷新机制（同页直连）**：widget 内的用户操作（如新增待办）由该 widget 自己的事件处理完成后直接重渲染自身，或调用 `WidgetRegistry.refresh(id)`。**不依赖跨页广播**——`dataChanged` 广播只服务收藏集合；todo 等本页数据不做跨 tab 实时同步（本轮范围外，见 §8）。
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

- **Zone 枚举**（**无 `right`**）：`topbar` / `hero` / `left` / `off`。右列专属 Tabs/History，不放入组件 zone。
- 设置面板以「开关 + 位置下拉」呈现（表单驱动，不引入拖拽）。
- **右栏折叠键迁移**：新键 `localStorage['ywr-layout-right-fold']`（`'0'/'1'`）。一次性迁移逻辑放入 **M1**：读旧 `is-aside-fold` 有值则写入新键并删除旧键；`load.js` 的默认值写入与 `$aside.initFoldState()` 同步改用新键；`declare/aside.js` 读取键同步更新。**两处键读写（declare/aside.js + load.js）必须同轮改完**，否则折叠状态行为分裂。

### 2.3 五个小组件规格（轻量、无外部 API）

| Widget | id | 数据/存储 | 说明 |
|--------|----|-----------|------|
| 时钟/问候 | `clock` | 无（Date 实时） | 大号时间 + 日期/星期 + 按时段中文问候（早/午/晚/夜）；**默认 24h 制**（`HH:mm`），日期格式 `M月d日 周X`（中文，与现有 UI 文案语言一致，不依赖 `<html lang>`）；可停靠 `topbar`/`hero` |
| 待办清单 | `todo` | IndexedDB 新表 `todos` | 增删/勾选/清除已完成；空态引导；同页事件直连刷新（见 §2.1）|
| 每日语录 | `quote` | 内置 ~50 条 + localStorage 记录当日索引 | 随机展示，点按换一条；按天固定（同日不重复随机）|
| 快捷工具组 | `tools` | localStorage JSON 数组 | 默认 8 个（GitHub/知乎/Gmail/B站/掘金/邮箱/地图/翻译），可增删改；图标用 emoji 或 iconfont |
| 多引擎搜索 | `engines` | 复用 `'engine'` | chips 展示 3 引擎，点击切换主搜索框引擎并聚焦。**注意：与 Hero 内引擎 chips 是同一个实例**——引擎状态由既有 `$searchEles`/`execute/search.js` 驱动，widget 只渲染 UI 并调用既有切换 API，避免出现两行重复 chips |

### 2.4 IndexedDB schema 升级

- 新表 **`todos`**：`{ id: Date.now(), text, done: 0|1, createdAt }`。
- 新表 **`wallpapers`**：`{ id: Date.now(), type: 'local'|'gradient', data }`（`data` = base64 dataURL 或 CSS gradient 字符串；**二进制/长字符串一律存这里，不进 localStorage**）。在线壁纸只存 URL 于配置，无二进制。
  - **注意**：`wallpapers` 表的 `properties` 只列 `[id, type]`，**不要把 `data` 加入 properties**——`initIndexedDBStructure` 会为 properties 每个字段建索引，`data` 入索引等于把每张 ≤1MB base64 再复制一份。
- 数据库版本 **v1 → v2**（**一次升级，两表同时建**）：`onupgradeneeded` 中**为每个 store 加 `objectStoreNames.contains()` 守卫**后 `createObjectStore`；本次 v2 迁移**同时创建 `todos` 与 `wallpapers` 两个 store**。该迁移由 M3 落地（M3 最先触碰版本号），M5 的 todo widget 只消费已存在的 `todos` store，**不得再做第二次版本号提升**。
- **必须同步的 3 处文件**（tab 与 SW 各持有一份模型/打开逻辑，且 tab 侧 `indexeddb/index.js` 的 `initIndexedDBStructure` **当前无 contains 守卫**——版本号从字面量 `1` 升为 `2`，无守卫会在旧库升级时对 `collections`/`links` 抛 `ConstraintError`）：
  1. `tab/src/js/indexeddb/models/index.model.js`（加两表，版本/结构常量）
  2. `tab/src/js/indexeddb/index.js`（版本字面量 `1`→`2`，`initIndexedDBStructure` 加 contains 守卫）
  3. `service-worker/db.js`（其结构已带 contains 守卫，只需加两表 + 版本 `1`→`2`）
- 旧用户 v1 库自动升级；先在本机保留 v1 副本做升级验证（见 §9）。
- **数据导出/导入（`data:export`/`data:import`，options 页）本轮不覆盖 `todos`/`wallpapers`**：保持只处理 collections/links，导入清空仅限这两表。`todos` 属易失性清单数据，暂不随配置导出（明确决策，避免导入把待办清空/覆盖）。

---

## 3. 壁纸引擎 `WallpaperManager`

### 3.1 现状与目标

现状：`SettingsManager` 仅支持本地 base64 上传（`FileReader.readAsDataURL` 原样读入，**无压缩管线**）+ 透明度 + 模糊 + 屏保。目标：多源壁纸（本地/渐变/在线）+ 收藏 + 每日轮换，保留透明度/模糊/屏保能力。

### 3.2 存储架构（关键决策）

**壁纸数据按类型分两层存储，规避 localStorage 5MB 配额风险：**

| 内容 | 存储位置 | 理由 |
|------|----------|------|
| 本地图片二进制、渐变字符串（可 MB 级）| IndexedDB 表 `wallpapers` | 配额大；避免每次滑块输入都整包序列化 base64 |
| 壁纸配置 `{current, library(元数据), favorites, daily}` | **`chrome.storage.local` 键 `'ywr-wallpaper'`** | **SW 的 alarm 必须能写**（SW 无 tab 页 localStorage）；tab 与 SW 共享可读 |
| 滑块即时值（透明度/模糊）| 沿用 `localStorage` 会话内暂存或并入配置后 debounce 写 | 交互轻量 |

**配置 schema（chrome.storage.local）：**

```json
{
  "current":   { "id": "1750000000000", "type": "local" },
  "library":   [
    { "id": "1750000000000", "type": "local", "label": "我的壁纸", "addedAt": 1750000000000 },
    { "id": "1750000000001", "type": "gradient", "label": "极光", "addedAt": 1750000000001 },
    { "id": "1750000000002", "type": "online", "url": "https://picsum.photos/1920/1080?seed=2026-03-28", "label": "每日随机", "addedAt": 1750000000002 }
  ],
  "favorites": ["1750000000000"],
  "daily":     false
}
```

- **`id` 来源（唯一实现路径）**：tab 侧 `IndexedModel.add()` 会无条件覆写 `record.id = Date.now()`（`tab/src/js/indexeddb/index.js`），**不采用预设 slug/预计算 id**。所有 `local`/`gradient` 项的 `id` 一律取 **DB 写入后返回的真实 id**（时间戳），并回填到配置 library 条目；`current`/`favorites` 引用同一 id。渐变预设可预先写入 DB 得到稳定 id 后回填。
- **`online` 项的 URL 归属（明确）**：URL 作为 `url` 字段存在 **library 条目自身**（如上示例）；`current` 只存 `{id, type}`，渲染时按 id 从 library 解析出 URL。每日轮换时 SW 按日 seed 重算 URL → 更新对应 library 条目 `url` 字段 → 广播。
- `favorites` 只存 id 索引，**绝不复制二进制**。
- 渲染时按 `current.type` 解析：`local`/`gradient` → 查 IndexedDB `wallpapers` 取 `data`；`online` → 从 library 条目取 `url`。
- **旧数据迁移（一次、幂等）**：`WallpaperManager` 初始化时读旧 `localStorage['ywr-extension-settings'].backgroundImage`，若有 base64 → 写入 IndexedDB + 生成 library 项 → 置为 current → 移除旧字段。同时 `SettingsManager.saveSettings()` 的 try/catch 不再吞 `QuotaExceededError`（改为上报 `$notify`）。

### 3.3 四类壁纸能力

1. **本地上传（新增真实压缩管线，替代不存在的旧假设）**：
   - `FileReader` 读入 → `canvas` 等比缩放到最长边 ≤ 1920px → `toDataURL('image/jpeg', 0.85)`，若 > 300KB 降质量档重压（0.85→0.6→0.4→0.2），上限默认 1MB（可配置）。
   - 结果写入 IndexedDB `wallpapers` + library 元数据入配置；预览即时反馈。
2. **渐变生成器**：预设 12 组渐变 + 随机渐变（HSL 双色），字符串入 IndexedDB，label 入配置。
3. **在线壁纸**：
   - 主：**Picsum Photos** `https://picsum.photos/1920/1080?seed=<dayKey>`（免费、无需 key、稳定）。
   - 备：Bing 每日壁纸（`https://www.bing.com/HPImageArchive.aspx`），经 SW 代理解析出 URL。
   - **全部经 service worker 代理 fetch**（仓库约束：仅 SW 可发外部请求），广播结果。
4. **收藏与每日轮换**：
   - 当前壁纸可收藏/取消收藏（操作 `favorites` id 索引）。
   - 每日轮换开关开启后注册 `chrome.alarms`（`wallpaperDaily`，24h 周期）→ SW 拉取在线壁纸 → 更新 `chrome.storage.local['ywr-wallpaper']` → 广播 `wallpaperChanged`。
   - **端到端通道（明确）**：alarm 在 SW 触发 → SW 写 `chrome.storage.local` → `chrome.runtime.sendMessage({type:'wallpaperChanged'})` → tab 页监听后读 `chrome.storage.local` 刷新背景层。Picsum 用**按日 seed**（如 `new Date().toISOString().slice(0,10)`），保证同日多次触发结果一致。
   - 这是 alarms 的合规用途（有明确目的）。

### 3.4 manifest 与 SW 变更

```json
"host_permissions": [
  "https://suggestion.baidu.com/*",
  "https://picsum.photos/*",
  "https://fastly.picsum.photos/*",
  "https://www.bing.com/*"
]
```

- **`fastly.picsum.photos` 必须一并授权**：Picsum 图片 URL 会 302 到 `fastly.picsum.photos`，MV3 对 fetch 重定向目标是否继承 host 权限未明确保证，主源可能静默失败。M3 含一次 spike 验证实际重定向链；若重定向目标在已授权列表仍失败，则在线主源降级为 Bing。

- `service-worker/wallpaper.js`：`wallpaper:fetch` 消息路由 + 每日 alarm 处理；import 进 `service-worker/index.js`，路由注册进 `association.js`。
- 广播沿用 `chrome.runtime.sendMessage({ type: 'wallpaperChanged' })`。
- 图片 URL 直接用于 CSS `background-image`（CSS 可跨源加载图片，无需 host 权限存图）。

### 3.5 保留项

- 透明度/模糊滑块作用于当前壁纸视图（`wallpaper.current` 的预览 + 全局默认）。
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

- 抽屉宽度 320px → **380px**；保留 `.settings-panel` / `.settings-overlay` 命名与开合机制（`.ipage-aside-setting` 打开入口保留），内部 body 改 Tab 容器。
- 该面板 HTML 目前由 `settings-manager.js` 的 `createSettingsPanel()` 字符串生成 → 本轮**按 Tab 分区重构该字符串模板**（倾向控制改动面，不引入 declare/execute 拆分）。

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

**CSS 接线方式**：三个新 CSS 文件由 `tab/src/css/home.css` 的 `@import` 链追加（现有模式：`home.css` 单 `<link>` + 链式 `@import`），不新增 `<link>` 标签，与"脚本/样式顺序只追加"一致。

### 6.2 改动文件

| 文件 | 改动 |
|------|------|
| `tab/index.html` | 布局重排（顶栏/Hero/工作区）；`.ipage-aside` 节点迁入顶栏并**保留 `.ipage-aside-theme`/`.ipage-aside-setting`/`#theme-switcher` 钩子**；脚本链尾部追加新模块 |
| `css/variable.css` | 追加形态/颜色 Token（§4）|
| `tab/src/css/home.css` | `@import` 追加 hero/topbar/widgets；迁移原 `.ipage-aside` 外壳样式 |
| `tab/src/js/load.js` | 初始化顺序（WallpaperManager → WidgetRegistry → 既有流程）；折叠键默认值写入改新键；旧键迁移调用 |
| `tab/src/js/settings-manager.js` | 背景职责移交 WallpaperManager；面板 Tab 化；saveSettings 配额错误上报 |
| `tab/src/js/fun_module/declare/aside.js` | 折叠键读取迁移（`is-aside-fold`→`ywr-layout-right-fold`）|
| `tab/src/js/theme-switcher.js` | 若顶栏迁移后钩子选择器需重绑（默认保留 class 则免改）；可选 Hero 联动 |
| `tab/src/js/indexeddb/models/index.model.js` | + `todos`、`wallpapers` 表，v1→v2 |
| `tab/src/js/indexeddb/index.js` | 版本字面量 `1`→`2`；`initIndexedDBStructure` 加 `objectStoreNames.contains()` 守卫 |
| `service-worker/db.js` | 同步 + 两表，版本 `1`→`2` |
| `service-worker/index.js` | import wallpaper.js |
| `service-worker/association.js` | `wallpaper:fetch` 等路由 |
| `manifest.json` | host_permissions 追加（§3.4）|
| `tab/src/css/settings.css` | Tab 面板、380px 抽屉 |

### 6.3 实施顺序（每步独立验收）

1. **M1 布局骨架**：顶栏 + Hero + 工作区 grid；`.ipage-aside` 节点迁入顶栏并保钩子；折叠键迁移（declare/aside.js + load.js 同轮）。**M1 清单必须包含**：
   - 主题/设置下拉从"左栏右侧弹出"改为"顶栏下拉"方向定位（`.theme-switcher` 原 `left: calc(100% + .5rem)` 依赖左栏位置，迁顶栏后需重定坐标；`.ipage-aside-setting` 仍须在 parse 期可查——`declare/aside.js` 与 `settings-manager.js` 均在解析/初始化时 querySelector 它，DOM 必须先生成或在脚本前存在）
   - **验收：主题切换、设置面板、右栏折叠三项功能不回归。**
2. **M2 主题 Token 增强 + 毛玻璃视觉**
3. **M3 壁纸引擎**：IndexedDB `wallpapers` 表 + 配置入 `chrome.storage.local` → 渐变 → 本地（真实压缩管线）→ 在线 → 收藏/每日轮换
4. **M4 WidgetRegistry + 设置面板 Tab 化**（开关/位置表单）
5. **M5 五个小组件逐个落地**
6. **M6 动效打磨、回归测试、v1→v2 升级与旧壁纸数据迁移验证**

---

## 7. 约束条件

- **脚本加载顺序**：`tab/index.html` 只允许尾部追加，不动既有链。
- **JS 逻辑兼容**：既有 `$collections/$searchEles/$sections/$aside/$modal/$notify/$dropdown/$apis` 契约不变；仅收纳/移动 DOM 容器，且 **class 钩子不得更名**（`.ipage-aside-theme`/`.ipage-aside-setting`/`#theme-switcher`）。
- **存储键隔离**：新增键不覆盖旧键；迁移逻辑一次性、幂等。
- **alarms 用途明确**：仅"每日壁纸轮换"注册 alarms。
- **无新增第三方运行时依赖**：小组件与壁纸引擎均原生实现；不引入框架、不新增构建步骤。
- **service worker 是唯一 fetch 代理**。
- 收藏集合数据（collections/links）不受影响，schema 仅追加 `todos`/`wallpapers`。
- IndexedDB 升级必须**三处文件同步、版本一致、含 contains 守卫**。

## 8. 不在本次范围内

- `options/` 选项页 — 不动（保留"扩展选项"入口跳转）；其 data:export/import 不扩展至新表
- `popup/` 快速收藏弹窗 — 不动
- 收藏集合/链接的编辑交互 — 仅容器样式变化
- 屏保内容多样化（保持壁纸全屏）
- 在线壁纸的搜索/分类浏览（首版仅随机 + 每日）
- 拖拽式自由布局（已确认不做，用开关+位置预设）
- todo 跨 tab 实时同步（同页直连刷新）

## 9. 风险与回退

| 风险 | 缓解 |
|------|------|
| 布局重排破坏既有交互 | 每里程碑独立提交；M1 收 DOM 但保 class 钩子，M1 验收含三功能回归检查 |
| IndexedDB v1→v2 升级损坏旧库 | tab 侧 `initIndexedDBStructure` 加 contains 守卫 + 版本常量同步三处；先在本机保留 v1 副本验证升级 |
| 壁纸二进制撑爆 localStorage | 二进制全部入 IndexedDB；配置（纯元数据）才入 chrome.storage.local |
| 在线壁纸 API 不可用 | Picsum+Bing 双源；失败回退渐变/本地；离线仍可用 |
| 毛玻璃/动效性能 | 组件数量小；`prefers-reduced-motion` 降级 |
| 外部 CSS 依赖（at.alicdn.com） | 本轮不处理，保持现状（已在 tech debt 中记录）|
| 每日轮换双端状态不一致 | 状态单一来源 = chrome.storage.local；tab 仅监听广播后重读 |
