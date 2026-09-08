# 新标签页产品化 UI 重设计 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 按 `docs/specs/2026-03-28-product-ui-redesign-design.md` 把新标签页改造为产品化布局（顶栏 + Hero + 工作区 grid），新增多源壁纸引擎、WidgetRegistry 小组件体系（时钟/待办/语录/工具组/多引擎）、设置面板 Tab 化与主题 Token 增强。收藏集合保持主体。

**架构：** 保留 declare/execute 两阶段 IIFE 与无构建约束，在既有代码上做"产品化外壳"。布局重排为 `.content-area > (.shell-topbar | .shell-hero | .shell-workbench[grid])`；壁纸二进制入 IndexedDB 新表、配置入 `chrome.storage.local['ywr-wallpaper']`，每日轮换经 SW alarm 路由 `wallpaper:setDaily`；小组件经 `WidgetRegistry` 注册 payload（不新增顶层全局），布局开关/位置存 `localStorage['ywr-widget-layout']`。IndexedDB v1→v2 一次迁移同建 `todos`+`wallpapers`。

**技术栈：** 原生 CSS 自定义属性、原生 JavaScript（IIFE 全局模式）、Manifest V3 service worker（ES Module）、IndexedDB、chrome.storage.local、chrome.alarms。无构建工具、无测试框架——验收方式为 `chrome://extensions` Reload + 人工功能核对。

**规格文档：** `docs/specs/2026-03-28-product-ui-redesign-design.md`（实现本计划的唯一事实来源，冲突时以规格为准）

---

## 关键既有事实（写码前必读）

| 文件 | 事实 |
|------|------|
| `tab/index.html` | `.content-area` 是最外层包裹；`.ipage-aside` 竖条含主题入口 `.ipage-aside-theme`（内含 `#theme-switcher` 下拉）与设置入口 `.ipage-aside-setting`；`.ipage-body` 内含 `.ipage-body-center`（`#user_search_area`/`#ipage-tabs`/`#ipage-collections`）与 `.ipage-body-right`（Tabs/History）。脚本链尾部为 `apis/index.js` → `load.js`，**只允许尾部追加** |
| `css/base.css` | 全站 reset；`body` 用 `--bg/--text`；滚动条全局样式 |
| `css/variable.css` | 双层 Token：`:root` 形态 Token + 6 套 `[data-theme]` 颜色 Token（含旧名别名）|
| `tab/src/css/task.css:1` | `.ipage-body .ipage-body-right { width:16rem; ... }`（右侧栏主样式，依赖 `.ipage-body` 祖先）|
| `tab/src/css/home.css:88` | `.content-area .ipage-body { flex:1; display:flex }`；home.css 顶部 `@import` 链（normalize/variable/base/iconfont/link/search/task/edit-form/notification/tabs/dropdown/settings）|
| `tab/src/js/load.js` | `window.onload`：初始化 engine/折叠默认值 → `initIndexedDB()` → `refreshCollections()`；监听 `dataChanged/profileChanged/tab:iconChanged/tab:iconReset`；`chrome.tabs.onUpdated` 等驱动 `$sections` |
| `tab/src/js/fun_module/declare/aside.js` | `$aside`：`btnSetting(.ipage-aside-setting)`、`btnFold(.btn-aside-fold)`、`asideRightArea(.ipage-body-right)`、`handleFoldToggle`/`initFoldState` 读写 `localStorage['is-aside-fold']` |
| `tab/src/js/fun_module/execute/aside.js` | `$aside.btnFold.addEventListener("click", $aside.handleFoldToggle)` |
| `tab/src/js/fun_module/declare/search.js` | `$searchEles`：`engineItem` 是 parse 期空 NodeList（无 `.engine-item` 节点，死代码）；`initEngineIcon(engine)` 写 `#btn-retrieval-engine` 内图标 |
| `tab/src/js/fun_module/execute/search.js` | 引擎切换内联在 `#btn-retrieval-engine` 点击回调（`$dropdown.show` → 写 `localStorage.engine` + `initEngineIcon`）；第 26-41 行 `.engine-item` 委托是死代码 |
| `tab/src/js/settings-manager.js` | `SettingsManager` IIFE，`createSettingsPanel()` 字符串生成 320px 右侧抽屉（背景/更多两区），`applyBackground` 读 `localStorage['ywr-extension-settings']`，屏保逻辑 query `.content-area`；DOMContentLoaded 自动 init |
| `tab/src/js/theme-switcher.js` | `ThemeSwitcher` IIFE，`.ipage-aside-theme` 开合 `#theme-switcher`；`THEMES` 6 主题；暴露 `init/getTheme/setTheme` |
| `tab/src/js/indexeddb/index.js` | `indexedDB.open("initDB", 1)` 字面量 1；`initIndexedDBStructure` 无 contains 守卫（v1→v2 会抛 ConstraintError）；`IndexedModel.add` 覆写 `record.id=Date.now()` |
| `tab/src/js/indexeddb/models/index.model.js` | `$indexedDBModel`：`{collections, links}` 每表 `{key, properties}` |
| `service-worker/db.js` | `DB_NAME="initDB"`、`DB_VERSION=1`、`MODELS`（collections/links）；`openDB` 已带 contains 守卫；`IndexedModel.add(record,{preserveId})` |
| `service-worker/association.js` | `chrome.runtime.onMessage` 集中路由；`getDB()` import 自 db.js；已有 suggest/data:*/popup:*/profileChanged/iconChanged |
| `service-worker/index.js` | import 六个模块，**新增模块在此 import** |
| `manifest.json` | host_permissions 仅 `suggestion.baidu.com`；已含 `alarms` 权限 |
| `utils/dropdown.js` | `$dropdown.show(el, {tag,data,callback})` / `$dropdown.hidden()` |
| `utils/notification.js` | `$notify.success/error/warning({message, duration})` |
| `utils/declare_element.js` | `$el.__(sel)` / `$el.__all(sel)`（`$el.__` = querySelector）|

---

## 文件改动总览

| 文件 | 操作 | 里程碑 |
|------|------|--------|
| `tab/index.html` | 布局重排 + 脚本尾部追加 | M1 |
| `tab/src/css/home.css` | `.ipage-aside` 外壳样式移除、`@import` 追加、workbench 容器样式 | M1/M2 |
| `tab/src/css/topbar.css` | **新建** 顶栏样式 | M1/M2 |
| `tab/src/css/hero.css` | **新建** Hero/搜索区产品化样式 | M1/M2 |
| `tab/src/css/task.css` | `.ipage-body` 祖先选择器改 `.shell-workbench` | M1 |
| `tab/src/js/fun_module/declare/aside.js` | 折叠键迁移 `is-aside-fold`→`ywr-layout-right-fold` | M1 |
| `tab/src/js/load.js` | 折叠键默认值/迁移、初始化顺序（DB await 后 WallpaperManager/WidgetRegistry init）| M1/M3/M5 |
| `css/variable.css` | 追加形态/颜色 Token | M2 |
| `tab/src/js/indexeddb/models/index.model.js` | + `todos`/`wallpapers` 表 | M3 |
| `tab/src/js/indexeddb/index.js` | 版本字面量 1→2 + contains 守卫 | M3 |
| `service-worker/db.js` | 同步 + 两表，版本 1→2 | M3 |
| `tab/src/js/wallpaper-manager.js` | **新建** 壁纸引擎 | M3 |
| `service-worker/wallpaper.js` | **新建** SW 壁纸 fetch/alarm 代理 | M3 |
| `service-worker/index.js` | import wallpaper.js | M3 |
| `service-worker/association.js` | `wallpaper:fetch` / `wallpaper:setDaily` 路由 | M3 |
| `manifest.json` | host_permissions 追加 | M3 |
| `tab/src/js/settings-manager.js` | 面板 Tab 化 + 背景职责移交 | M4 |
| `tab/src/css/settings.css` | Tab 面板、380px 抽屉 | M4 |
| `tab/src/js/fun_module/declare/search.js` | + `setEngine(engine)` 共享 API | M4 |
| `tab/src/js/fun_module/execute/search.js` | 引擎回调改调 `setEngine`；删死代码委托 | M4 |
| `tab/src/js/widgets/registry.js` | **新建** WidgetRegistry | M4 |
| `tab/src/css/widgets.css` | **新建** widget 通用样式 | M4/M5 |
| `tab/src/js/widgets/{clock,todo,quote,tools,engines}.js` | **新建** 5 个小组件 | M5 |
| `tab/src/css/{clock,todo,quote,tools,engines 相关}.css` 或并入 widgets.css | 组件样式（并入 widgets.css 单文件）| M5 |

---

# M1：布局骨架（顶栏 + Hero + 工作区 grid）

> 里程碑验收（M1 结束手动核对，全过才算完成）：主题切换、设置面板、右栏折叠、搜索/引擎、屏保五项功能不回归。

## Task M1-1：重排 `tab/index.html` 为三段式结构

**文件：** `tab/index.html`

- [ ] **步骤 1：读取现有文件**

  阅读 `tab/index.html`（159 行）。当前结构：`.content-area` 内 `.ipage-aside`（含 `.ipage-aside-theme` + `#theme-switcher` 下拉、`.ipage-aside-sep`、`.ipage-aside-setting`）与 `.ipage-body`（`.ipage-body-center` 含 `#user_search_area`/`#ipage-tabs`/`#ipage-collections`；`.ipage-body-right` 含 `.ipage-aside-header`/`.ipage-sections`）。

- [ ] **步骤 2：重写 `<body>` 内的结构部分（第 14-121 行）**

  用以下内容替换 `index.html` 中 `<body style="height: 100vh">` 之后的整个 `.content-area` 块（保留 `<body>` 到 `<!-- 引入第三方库 -->` 之间的全部 `<script>` 链不变；新脚本在本任务末尾按步骤 3 追加）：

  ```html
<body style="height: 100vh">
  <!-- -------------------------内容区域 -------------------------------->
  <div class="content-area">
    <!-- 顶栏 -->
    <header class="shell-topbar">
      <div class="shell-topbar-left">
        <span class="shell-logo" id="shell-logo" title="INIT">❄</span>
      </div>
      <div class="shell-topbar-right">
        <div class="shell-topbar-slot shell-zone-topbar" data-widget-zone="topbar"></div>
        <!-- 主题切换器（由左侧竖条迁入，保留全部 class/id 钩子） -->
        <div class="ipage-aside-theme">
          <span class="icon-theme"></span>
          <div class="theme-switcher dropdown" id="theme-switcher">
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
          </div>
        </div>
        <!-- 设置入口（保留 class 钩子） -->
        <div class="ipage-aside-setting" id="shell-setting-btn">
          <span class="icon-setting"></span>
        </div>
      </div>
    </header>
    <!-- Hero 搜索区 -->
    <main class="shell-hero">
      <div id="user_search_area">
        <div id="user_input_area">
          <button id="btn-retrieval-engine">
            <span class="icon-baidu"></span>
          </button>
          <input type="text" spellcheck="false" id="user-content" />
          <button id="btn-retrieval-content">
            <span class="icon-search"></span>
          </button>
        </div>
        <div class="suggestion-list" id="suggestion-list"></div>
      </div>
      <div class="shell-zone-hero" data-widget-zone="hero"></div>
    </main>
    <!-- 工作区（三列 grid） -->
    <section class="shell-workbench">
      <div class="shell-widgets-left" data-widget-zone="left">
        <div class="shell-widgets-left-inner"></div>
      </div>
      <div class="shell-workbench-center">
        <div id="ipage-tabs">
          <button class="tab-btn-add-collection">
            <span class="icon-plus add-collection-icon"></span><span class="add-collection-text">ADD COLLECTION</span>
          </button>
        </div>
        <div id="ipage-collections"></div>
      </div>
      <div class="ipage-body-right">
        <div class="ipage-aside-header">
          <button class="btn-aside-fold">
            <span class="icon-fold ipage-aside-fold"></span>
          </button>
        </div>
        <div class="ipage-sections">
          <div class="section">
            <div class="section-title">Tabs</div>
            <ul class="section-tabs-show"></ul>
          </div>
          <div class="section">
            <div class="section-title">History</div>
            <ul class="section-history-show"></ul>
          </div>
        </div>
      </div>
    </section>
  </div>
  ```

  注意：
  - `.content-area` 保持最外层包裹（`settings-manager.js` 屏保逻辑与 `execute/search.js` 首行 `contentArea.addEventListener` 依赖它）。
  - `.ipage-aside-theme`（含 `#theme-switcher`）、`.ipage-aside-setting` 两个钩子**原样迁入顶栏右侧**，class 名一个不改（`theme-switcher.js` 第 18 行与 `settings-manager.js` 第 257 行依赖）。
  - `.ipage-body-right` 与 `#ipage-tabs`/`#ipage-collections` id 全部保留（`declare/tools.js:2`、`declare/collections.js:2`、`$aside` 依赖）。
  - 原 `.ipage-aside` 竖条外壳与 `.ipage-aside-sep` 删除；原 `.ipage-body` 包裹层删除，中间列由 `.shell-workbench-center` 替代。

- [ ] **步骤 3：在脚本链尾部追加新脚本标签（`load.js` 之后）**

  找到 `<!-- load -->` 下的 `<script src="./src/js/load.js"></script>`（原第 156 行），在其**后面**追加以下三行（M1 阶段只引入 registry 空壳，见 Task M1-3；wallpaper/widgets 模块在 M3/M5 创建后本行保持不动——registry.js 在 M1 即创建）：

  ```html
  <!-- widgets registry -->
  <script src="./src/js/widgets/registry.js"></script>
  ```

- [ ] **步骤 4：检查 DOM 引用完整性**

  运行后手动核对（需先完成 Task M1-2 的 CSS 才有视觉，但此时先确保**无 JS 报错**）：打开 `chrome://extensions` → 点本扩展 **Reload** → 开新标签页 → 打开 DevTools Console：
  - 期望：无 `TypeError: Cannot read properties of null`、无 `addEventListener of null`。
  - 若 `settings-manager.js`/`theme-switcher.js` 报 null，检查 `.ipage-aside-setting`/`.ipage-aside-theme` 是否仍在 DOM（步骤 2 已保留）。
  - 结构核对：`.content-area > .shell-topbar + .shell-hero + .shell-workbench` 三层齐全，`.shell-workbench` 含三个子列。

- [ ] **步骤 5：提交**

  ```bash
  git add tab/index.html
  git commit -m "feat(M1): 新标签页三段式布局骨架（顶栏/Hero/工作区）"
  ```

## Task M1-2：CSS 布局重排（home/task 迁移 + topbar/hero 初版）

**文件：** `tab/src/css/home.css`、`tab/src/css/task.css`、`tab/src/css/topbar.css`（新建）、`tab/src/css/hero.css`（新建）

- [ ] **步骤 1：在 `home.css` 顶部 `@import` 链追加两行**

  在 `home.css` 第 12 行 `@import "./settings.css"; /*设置面板*/` 之后追加：

  ```css
  @import "./topbar.css"; /*顶栏*/
  @import "./hero.css"; /*Hero 搜索区*/
  ```

- [ ] **步骤 2：替换 `home.css` 中 `.ipage-aside`/`.ipage-body` 相关规则**

  删除 `home.css` 中以下旧规则块（第 28-102 行区间内与 `.ipage-aside`、`.ipage-body .ipage-body-left`、`.ipage-body .ipage-body-center` 相关的块），替换为工作区容器规则（粘贴到原 `.content-area` 规则之后）：

  ```css
  /* ========== 三段式布局（顶栏/Hero/工作区） ========== */
  .content-area {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .content-area .shell-topbar {
    flex: none;
  }
  .content-area .shell-hero {
    flex: none;
  }
  .content-area .shell-workbench {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    overflow: hidden;
  }
  .shell-workbench .shell-widgets-left {
    width: 15rem;
    min-width: 15rem;
    max-width: 19rem;
    overflow-y: auto;
    padding: 0.75rem 0.5rem 0.75rem 0.75rem;
  }
  .shell-workbench .shell-widgets-left:empty {
    display: none;
  }
  .shell-workbench .shell-workbench-center {
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 0.5rem 1rem;
    overflow: hidden;
  }
  ```

- [ ] **步骤 3：将 `.ipage-aside` 图标按钮的通用形态保留为可复用类**

  把旧 `.ipage-aside .ipage-aside-setting`、`.ipage-aside-theme` 的 34px 方形图标形态迁移为通用类（供顶栏使用），新建 `tab/src/css/topbar.css` 并写入：

  ```css
  /* ============================================================
     顶栏 .shell-topbar
  ============================================================ */
  .shell-topbar {
    height: var(--topbar-h, 3.25rem);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border-subtle);
    position: relative;
    z-index: 50;
  }
  .shell-topbar-left,
  .shell-topbar-right {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .shell-logo {
    font-size: 1.25rem;
    line-height: 1;
    color: var(--text-secondary);
    cursor: pointer;
    width: 2.125rem;
    height: 2.125rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    transition: background-color 140ms ease, color 140ms ease;
    user-select: none;
  }
  .shell-logo:hover {
    background-color: var(--surface-raised);
    color: var(--text);
  }
  /* 主题与设置入口：沿用 .ipage-aside-theme / .ipage-aside-setting 钩子的形态 */
  .ipage-aside-theme,
  .ipage-aside-setting {
    font-size: 1.25rem;
    padding: 0;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-md);
    width: 2.125rem;
    height: 2.125rem;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: background-color 140ms ease, color 140ms ease;
  }
  .ipage-aside-theme:hover,
  .ipage-aside-setting:hover {
    background-color: var(--surface-raised);
    color: var(--text);
  }
  /* 主题下拉：改从顶栏按钮向右下展开 */
  .ipage-aside-theme .theme-switcher {
    left: auto;
    right: 0;
    top: calc(100% + 0.5rem);
    transform: translateX(8px);
  }
  .ipage-aside-theme .theme-switcher.is-visible {
    transform: translateX(0);
  }
  /* 顶栏小组件槽位（clock widget 渲染位，M5 启用） */
  .shell-zone-topbar:empty {
    display: none;
  }
  ```

  （原 `home.css` 中 `.ipage-aside-theme/.theme-switcher/.ipage-aside-setting/.ipage-aside-sep` 等旧规则整块删除。）

- [ ] **步骤 4：改写 `task.css` 的祖先选择器**

  `task.css:1` 的 `.ipage-body .ipage-body-right { ... }` 改为（`task.css` 其余 `.ipage-body-right ...` 规则不改，因为 `.ipage-body-right` class 仍在 DOM）：

  ```css
  .shell-workbench .ipage-body-right {
    width: 16rem;
    border-left: 1px solid var(--borderGrey);
    overflow: auto;
    display: flex;
    position: relative;
    flex-direction: column;
    background-color: var(--bg);
  }
  ```

  （若 `.is-fold.ipage-body-right { width: 0 }` 等折叠规则正常工作，无需再改；折叠相关验收见 Task M1-4。）

- [ ] **步骤 5：新建 `tab/src/css/hero.css` 并写入 Hero 初版样式**

  ```css
  /* ============================================================
     Hero 搜索区 .shell-hero
  ============================================================ */
  .shell-hero {
    min-height: var(--hero-h, 11rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem 0.75rem;
    position: relative;
  }
  /* 搜索区与建议列表容器维持原有行为（#user_search_area 原有 600px 居中） */
  .shell-zone-hero:empty {
    display: none;
  }
  ```

- [ ] **步骤 6：Reload 并核对布局**

  `chrome://extensions` → Reload → 新标签页：
  - 期望：顶部出现顶栏（左 logo、右主题/设置图标）；中间 Hero 有搜索框；下方左侧空列（widgets 槽位，为空所以收窄）、中间收藏区、右侧 Tabs/History 栏。
  - 期望：收藏集合、搜索、Tab/History 列表、屏保入口均可见可点。

- [ ] **步骤 7：提交**

  ```bash
  git add tab/src/css/home.css tab/src/css/task.css tab/src/css/topbar.css tab/src/css/hero.css
  git commit -m "feat(M1): topbar/hero/workbench 布局与样式初版"
  ```

## Task M1-3：折叠键迁移 + WidgetRegistry 空壳

**文件：** `tab/src/js/fun_module/declare/aside.js`、`tab/src/js/load.js`、`tab/src/js/widgets/registry.js`（新建）

- [ ] **步骤 1：改写 `declare/aside.js` 的折叠键**

  将 `declare/aside.js` 中三处 `is-aside-fold` 全部改为 `ywr-layout-right-fold`（第 8、11、15 行），其余不动：

  ```js
  const $aside = (() => {
    const btnSetting = $el.__(".ipage-aside-setting");
    const btnFold = $el.__(".btn-aside-fold");
    const asideRightArea = $el.__(".ipage-body-right");
    const FOLD_KEY = "ywr-layout-right-fold";
    const handleFoldToggle = () => {
      if ($aside.asideRightArea.classList.contains("is-fold")) {
        $aside.asideRightArea.classList.remove("is-fold");
        localStorage.setItem(FOLD_KEY, "0");
      } else {
        $aside.asideRightArea.classList.add("is-fold");
        localStorage.setItem(FOLD_KEY, "1");
      }
    };
    const initFoldState = () => {
      // 一次性迁移旧键
      const legacy = localStorage.getItem("is-aside-fold");
      if (legacy !== null && localStorage.getItem(FOLD_KEY) === null) {
        localStorage.setItem(FOLD_KEY, legacy);
      }
      localStorage.removeItem("is-aside-fold");
      const isFold = localStorage.getItem(FOLD_KEY) === "1";
      if (isFold) {
        $aside.asideRightArea.classList.add("is-fold");
      }
    };
    return {
      btnSetting,
      btnFold,
      asideRightArea,
      handleFoldToggle,
      initFoldState,
    };
  })();
  ```

- [ ] **步骤 2：改写 `load.js` 的折叠键默认值写入与初始化调用**

  将 `load.js` 第 44-47 行：

  ```js
  if (!localStorage.getItem("is-aside-fold")) {
    localStorage.setItem("is-aside-fold", "0");
  }
  $aside.initFoldState()
  ```

  替换为：

  ```js
  if (!localStorage.getItem("ywr-layout-right-fold")) {
    localStorage.setItem("ywr-layout-right-fold", "0");
  }
  $aside.initFoldState()
  ```

- [ ] **步骤 3：新建 `widgets/registry.js`（M1 最小空壳）**

  ```js
  /**
   * WidgetRegistry — 小组件注册表
   * declare 阶段：各 widget 模块调用 WidgetRegistry.register({...}) 注册 payload（不产生顶层全局）
   * execute 阶段：WidgetRegistry.init() 读取 localStorage['ywr-widget-layout'] 并按 zone 渲染
   */
  const WidgetRegistry = (function () {
    const STORAGE_KEY = "ywr-widget-layout";
    const widgets = new Map(); // id -> { id, title, icon, zones, render, refresh? }

    const register = (def) => {
      if (!def || !def.id) return;
      widgets.set(def.id, def);
    };

    const getLayout = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn("WidgetRegistry: parse layout failed", e);
      }
      return {};
    };

    const saveLayout = (layout) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      } catch (e) {
        console.warn("WidgetRegistry: save layout failed", e);
      }
    };

    /**
     * 默认布局：所有组件开，位置按模块 zones[0]
     */
    const defaultLayout = () => {
      const layout = {};
      widgets.forEach((w, id) => {
        layout[id] = { zone: w.zones && w.zones[0] ? w.zones[0] : "off", enabled: true };
      });
      return layout;
    };

    const init = () => {
      let layout = getLayout();
      if (Object.keys(layout).length === 0) {
        layout = defaultLayout();
        saveLayout(layout);
      }
      renderAll(layout);
    };

    const renderAll = (layout) => {
      // 先清除全部已挂载 widget 槽位，避免组件换 zone 后旧节点残留
      document.querySelectorAll("[data-widget-id]").forEach((el) => el.remove());
      widgets.forEach((w, id) => {
        const cfg = layout[id] || { zone: "off", enabled: false };
        const zoneName = cfg.enabled === false ? "off" : cfg.zone || "off";
        const mount = document.querySelector(`[data-widget-zone="${zoneName}"]`);
        if (zoneName === "off" || !mount) return;
        const slot = document.createElement("section");
        slot.className = "widget";
        slot.setAttribute("data-widget", id);
        slot.setAttribute("data-widget-id", id);
        mount.appendChild(slot);
        try {
          w.render(slot, { enabled: true });
        } catch (e) {
          console.error(`WidgetRegistry: render ${id} failed`, e);
        }
      });
    };

    const refresh = (id) => {
      const def = widgets.get(id);
      if (!def || !def.refresh) return;
      document.querySelectorAll(`[data-widget-id="${id}"]`).forEach((slot) => {
        try {
          def.refresh(slot);
        } catch (e) {
          console.error(`WidgetRegistry: refresh ${id} failed`, e);
        }
      });
    };

    return {
      register,
      init,
      refresh,
      getLayout,
      saveLayout,
      get widgets() {
        return widgets;
      },
    };
  })();
  ```

- [ ] **步骤 4：Reload 验证**

  - 期望：打开新标签页 Console 无报错；`WidgetRegistry` 可在 Console 中访问；`localStorage['ywr-widget-layout']` 为空（无组件注册，默认 layout 为空对象，不写入）——若后续 M5 注册组件后才写入。
  - 折叠按钮点击一次 → 右栏收起；再点 → 展开。刷新页面后折叠状态保持（键 `ywr-layout-right-fold`）。旧键 `is-aside-fold` 被清除。

- [ ] **步骤 5：提交**

  ```bash
  git add tab/src/js/fun_module/declare/aside.js tab/src/js/load.js tab/src/js/widgets/registry.js
  git commit -m "feat(M1): 折叠键迁移 ywr-layout-right-fold + WidgetRegistry 空壳"
  ```

## Task M1-4：M1 里程碑验收（五项功能回归）

**验收清单（无代码改动，全过则 M1 完成）：**

- [ ] **步骤 1：主题切换** — 点顶栏主题图标 → 下拉展开 → 选"深夜墨色"等任一主题 → 背景/卡片颜色变化；再刷新保持所选主题。
- [ ] **步骤 2：设置面板** — 点顶栏设置图标 → 右侧 320px 面板滑出；ESC 关闭；重新打开正常。
- [ ] **步骤 3：右栏折叠** — 点 Tabs/History 栏顶部折叠按钮 → 收起；再点展开；刷新保持。
- [ ] **步骤 4：搜索/引擎** — 输入关键字出现百度联想；回车/点搜索按钮打开新页；点搜索框左侧引擎图标切换 Baidu/Google/Bing，图标随之更新；页面整体无报错。
- [ ] **步骤 5：屏保** — 设置面板 → 上传一张背景图 → 进入屏保 → 移动鼠标退出，内容恢复显示。
- [ ] **步骤 6：提交空提交标记**（若期间有零散修复一并提交）

  ```bash
  git add -A
  git commit -m "feat(M1): 布局骨架完成——五项功能回归通过" --allow-empty
  ```

---

# M2：主题 Token 增强 + 毛玻璃视觉

## Task M2-1：`css/variable.css` 追加形态 Token

**文件：** `css/variable.css`

- [ ] **步骤 1：在 `:root` 形态 Token 块（第 4-23 行）追加新 Token**

  找到 `:root { /* 圆角 */ ... }` 块，在其 `}` 前追加：

  ```css
  /* 毛玻璃 */
  --glass-bg:        rgba(255, 255, 255, 0.55);
  --glass-bg-strong: rgba(255, 255, 255, 0.72);
  --glass-border:    rgba(255, 255, 255, 0.45);
  --glass-blur:      14px;

  /* 结构 */
  --topbar-h: 3.25rem;
  --hero-h:   11rem;

  /* 动效 */
  --dur-fast: 140ms;
  --dur-med:  220ms;
  --ease-out: cubic-bezier(0.22, 0.61, 0.36, 1);
  ```

- [ ] **步骤 2：为 6 套主题各补 3 个颜色 Token**

  在 `variable.css` 每套主题块（`[data-theme="..."]`）的 `--shadow-color` 行之后追加（示例以 slate-light 为准，各主题取对应色值）：

  ```css
  /* 深色主题 midnight-ink */
  --bg-deep:        rgba(4, 6, 12, 0.55);
  --on-image:       #f4f5fb;
  --accent-soft:    rgba(99, 102, 241, 0.14);
  ```

  各主题取值表：

  | 主题 | `--bg-deep` | `--on-image` | `--accent-soft` |
  |------|-------------|--------------|-----------------|
  | slate-light | `rgba(15, 23, 36, 0.42)` | `#1e2430` | `rgba(52, 58, 64, 0.10)` |
  | midnight-ink | `rgba(4, 6, 12, 0.55)` | `#f4f5fb` | `rgba(99, 102, 241, 0.14)` |
  | coral-amber | `rgba(92, 34, 14, 0.30)` | `#2b150c` | `rgba(255, 107, 107, 0.12)` |
  | indigo-mint | `rgba(20, 33, 90, 0.32)` | `#101a45` | `rgba(66, 99, 235, 0.10)` |
  | violet-amber | `rgba(42, 12, 82, 0.32)` | `#1c0838` | `rgba(124, 58, 237, 0.10)` |
  | rose-sky | `rgba(84, 8, 45, 0.30)` | `#380621` | `rgba(233, 30, 140, 0.10)` |

  注意：`slate-light` 同时在 `:root, [data-theme="slate-light"]` 联合选择器里，追加一次即可（追加在该联合块内）。

- [ ] **步骤 3：Reload 验证**

  新标签页 Console 无报错；DevTools 中 `document.documentElement` 能解析出新 Token（如 `getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')` 返回 `3.25rem`）；切换 6 套主题均无视觉异常。

- [ ] **步骤 4：提交**

  ```bash
  git add css/variable.css
  git commit -m "feat(M2): 追加毛玻璃/结构/动效与每主题颜色 Token"
  ```

## Task M2-2：毛玻璃视觉接入（顶栏/Hero/搜索框/右栏头部）

**文件：** `tab/src/css/topbar.css`、`tab/src/css/hero.css`、`tab/src/css/search.css`

- [ ] **步骤 1：`topbar.css` 追加毛玻璃形态**

  在 `topbar.css` 末尾追加（使顶栏在壁纸背景下呈毛玻璃）：

  ```css
  /* 壁纸模式下顶栏毛玻璃（有背景时 body 加 .has-wallpaper） */
  body.has-wallpaper .shell-topbar {
    background: var(--glass-bg);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    border-bottom-color: var(--glass-border);
  }
  ```

- [ ] **步骤 2：`search.css` 追加 Hero 毛玻璃与聚焦升级**

  在 `search.css` 末尾追加：

  ```css
  /* ========== Hero 毛玻璃形态 ========== */
  body.has-wallpaper #user_input_area {
    background: var(--glass-bg-strong);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    border-color: var(--glass-border);
  }
  ```

- [ ] **步骤 3：Reload 验证**

  设置背景图后：顶栏与搜索框呈半透明毛玻璃（背景透出 + 模糊）；无背景图时 `body.has-wallpaper` 不存在，形态回落普通 `--surface`。此项依赖 M3 的 `.has-wallpaper` 切换；M2 阶段先在 Console 手动 `document.body.classList.add('has-wallpaper')` 验证样式生效，M3 完成后自动切换。

- [ ] **步骤 4：提交**

  ```bash
  git add tab/src/css/topbar.css tab/src/css/search.css
  git commit -m "feat(M2): 毛玻璃视觉接入（顶栏/搜索框）"
  ```

---

# M3：壁纸引擎（IndexedDB v1→v2 + WallpaperManager + SW 代理）

## Task M3-1：IndexedDB 模型与版本升级（三处同步）

**文件：** `tab/src/js/indexeddb/models/index.model.js`、`tab/src/js/indexeddb/index.js`、`service-worker/db.js`

- [ ] **步骤 1：改写 tab 侧模型 `index.model.js`**

  用以下完整内容替换 `tab/src/js/indexeddb/models/index.model.js`：

  ```js
  const $indexedDBModel = (() => {
    const key = "id";
    const collections = {
      key,
      properties: [key, "name", "order"],
    };
    const links = {
      key,
      properties: [key, "name", "url", "remark", "order", "collection", "icon"],
    };
    const todos = {
      key,
      properties: [key, "text", "done", "createdAt"],
    };
    const wallpapers = {
      key,
      // 注意：data 字段（base64/渐变字符串）不进索引，避免复制大体积
      properties: [key, "type"],
    };
    return {
      collections,
      links,
      todos,
      wallpapers,
    };
  })();
  ```

- [ ] **步骤 2：改写 tab 侧打开逻辑 `indexeddb/index.js`**

  定位 `indexeddb/index.js` 第 148-175 行，做两处修改：

  a) `indexedDB.open(dbName, 1)` → `indexedDB.open(dbName, 2)`
  b) 替换 `initIndexedDBStructure` 函数体（加 contains 守卫，防止 v1 旧库升级时对既有 store 抛 ConstraintError）：

  ```js
  const initIndexedDBStructure = async (db, models) => {
    for (let model in models) {
      if (db.objectStoreNames.contains(model)) continue;
      const key = models[model].key;
      const modelStore = db.createObjectStore(model, { keyPath: key });
      for (let p of models[model].properties) {
        modelStore.createIndex(p, p, { unique: p === key });
      }
    }
  };
  ```

  其余（`IndexedModel` 类、`initIndexedDBFunction`）不动。

- [ ] **步骤 3：改写 SW 侧 `service-worker/db.js`**

  三处修改：

  a) `DB_VERSION = 1` → `const DB_VERSION = 2;`
  b) `MODELS` 增加两表：

  ```js
  const MODELS = {
    collections: { key: "id", properties: ["id", "name", "order"] },
    links: { key: "id", properties: ["id", "name", "url", "remark", "order", "collection", "icon"] },
    todos: { key: "id", properties: ["id", "text", "done", "createdAt"] },
    wallpapers: { key: "id", properties: ["id", "type"] },
  };
  ```

  c) `getDB()` 中建表循环已有 contains 守卫（无需改），但 `onupgradeneeded` 的守卫已经存在，无需改动。

- [ ] **步骤 4：升级验证**

  - 先备份当前库：DevTools → Application → IndexedDB → 右键 `initDB` → 导出/记录当前 collections 数量。
  - Reload 扩展 → 开新标签页 → DevTools Application → IndexedDB `initDB` 版本应显示 **2**，含 `collections/links/todos/wallpapers` 四个 store。
  - 收藏数据完好（原有 collections/links 内容不丢）；Console 无 `ConstraintError`。
  - 重复 Reload 数次确认无报错（幂等）。

- [ ] **步骤 5：提交**

  ```bash
  git add tab/src/js/indexeddb/models/index.model.js tab/src/js/indexeddb/index.js service-worker/db.js
  git commit -m "feat(M3): IndexedDB v2 迁移——新增 todos/wallpapers 表（含升级守卫）"
  ```

## Task M3-2：manifest 与 SW 壁纸代理

**文件：** `manifest.json`、`service-worker/wallpaper.js`（新建）、`service-worker/index.js`、`service-worker/association.js`

- [ ] **步骤 1：`manifest.json` host_permissions 追加**

  将 `host_permissions` 改为：

  ```json
  "host_permissions": [
    "https://suggestion.baidu.com/*",
    "https://picsum.photos/*",
    "https://fastly.picsum.photos/*",
    "https://www.bing.com/*"
  ],
  ```

  （`fastly.picsum.photos` 是 Picsum 302 重定向目标，必须一并授权。）

- [ ] **步骤 2：新建 `service-worker/wallpaper.js`**

  ```js
  /**
   * Service Worker 端壁纸代理
   * - wallpaper:fetch      Bing archive 解析 / Picsum 重定向链验证
   * - wallpaper:setDaily   每日轮换开关（chrome.alarms 仅 SW 可用）
   * 图片字节永不写入 storage —— tab 页用返回的 URL 直连 CSS background-image
   */

  const WALLPAPER_KEY = "ywr-wallpaper";
  const DAILY_ALARM = "wallpaperDaily";

  function getConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get([WALLPAPER_KEY], (data) => {
        resolve(data[WALLPAPER_KEY] || null);
      });
    });
  }

  async function writeConfig(mutator) {
    const cfg = await getConfig();
    const next = mutator(cfg || { current: null, library: [], favorites: [], daily: false, view: { opacity: 0.15, blur: 0 } });
    await new Promise((resolve) => chrome.storage.local.set({ [WALLPAPER_KEY]: next }, resolve));
    return next;
  }

  async function daySeed() {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * Picsum 按日 URL（纯构造，无 fetch）
   */
  function picsumUrl(seed) {
    return `https://picsum.photos/1920/1080?seed=${seed}`;
  }

  /**
   * Bing 每日壁纸解析（唯一 fetch-and-parse 场景）
   */
  async function fetchBingUrl() {
    const res = await fetch(
      "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN"
    );
    if (!res.ok) throw new Error("bing http " + res.status);
    const json = await res.json();
    const base = json.images && json.images[0];
    if (!base || !base.url) throw new Error("bing empty");
    return "https://www.bing.com" + base.url;
  }

  /**
   * 验证 Picsum 重定向链可达（M3 spike；成功后只返回 URL，不存字节）
   */
  async function spikePicsum() {
    const url = picsumUrl(await daySeed());
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok && res.status !== 302) throw new Error("picsum http " + res.status);
    return url;
  }

  /**
   * 更新在线源条目 url（用于每日轮换）
   */
  async function rotateOnline() {
    return writeConfig((cfg) => {
      const online = (cfg.library || []).find((it) => it.type === "online");
      if (!online) return cfg;
      // Picsum 直连优先；若库中 bing 标记则走 Bing 解析
      if (online.provider === "bing") {
        online.url = null; // 置空由调用方补齐——rotate 使用 async 解析
      } else {
        online.url = picsumUrl(new Date().toISOString().slice(0, 10));
      }
      return cfg;
    }).then(async (cfg) => {
      // 二次处理 Bing 源（需要在写库前拿到 URL）
      const online = (cfg.library || []).find((it) => it.type === "online");
      if (online && online.provider === "bing") {
        const bingUrl = await fetchBingUrl();
        await writeConfig((c) => {
          const it = (c.library || []).find((x) => x.type === "online");
          if (it) it.url = bingUrl;
          return c;
        });
      }
      return cfg;
    });
  }

  /**
   * alarm 回调：触发每日轮换
   */
  async function handleDailyAlarm() {
    const cfg = await getConfig();
    if (!cfg || cfg.daily !== true) {
      // 陈旧 alarm：清理后返回
      chrome.alarms.clear(DAILY_ALARM);
      return;
    }
    await rotateOnline();
    chrome.runtime.sendMessage({ type: "wallpaperChanged" }).catch(() => {});
  }

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === DAILY_ALARM) handleDailyAlarm();
  });

  /**
   * 对外消息路由（供 association.js 转发）
   */
  export async function handleWallpaperMessage(message) {
    if (message.type === "wallpaper:fetch") {
      const kind = message.kind || "picsum";
      try {
        if (kind === "bing") {
          const url = await fetchBingUrl();
          return { success: true, url };
        }
        const url = await spikePicsum();
        return { success: true, url };
      } catch (err) {
        return { success: false, error: err.message || "wallpaper fetch failed" };
      }
    }
    if (message.type === "wallpaper:setDaily") {
      const enabled = !!message.enabled;
      await writeConfig((cfg) => ({ ...cfg, daily: enabled }));
      if (enabled) {
        chrome.alarms.create(DAILY_ALARM, { periodInMinutes: 24 * 60 });
      } else {
        chrome.alarms.clear(DAILY_ALARM);
      }
      return { success: true };
    }
    return null;
  }
  ```

- [ ] **步骤 3：`service-worker/index.js` import 新模块**

  ```js
  import "./wallpaper.js";
  ```

  （追加在 `import "./tabs.js";` 之后。）

- [ ] **步骤 4：`service-worker/association.js` 加路由**

  在 `chrome.runtime.onMessage.addListener` 回调开头（第 50 行 `{` 之后）追加：

  ```js
  import { handleWallpaperMessage } from "./wallpaper.js";
  ```

  然后在该回调内、`suggest` 分支之前追加：

  ```js
  if (message.type === "wallpaper:fetch" || message.type === "wallpaper:setDaily") {
    handleWallpaperMessage(message).then((result) => {
      if (result) sendResponse(result);
    });
    return true;
  }
  ```

  注意：`handleWallpaperMessage` 可能返回 `null`（未知类型）——此时不要 sendResponse，避免错误；因此 `.then` 内判 `if (result)`。

- [ ] **步骤 5：Reload 验证**

  - `chrome://extensions` Reload → Service Worker 日志无报错。
  - Console（新标签页）执行：

    ```js
    chrome.runtime.sendMessage({ type: "wallpaper:fetch", kind: "bing" }, (res) => console.log(res))
    ```

    期望 `{success:true, url:"https://www.bing.com/th?id=..."}`。
  - 再测 Picsum：

    ```js
    chrome.runtime.sendMessage({ type: "wallpaper:fetch", kind: "picsum" }, (res) => console.log(res))
    ```

    期望 `{success:true, url:"https://picsum.photos/1920/1080?seed=..."}`（302 链可达；若被重定向目标权限拦截返回 success:false，记录并以 Bing 为主源——见规格 §3.4 spike 结论）。

- [ ] **步骤 6：提交**

  ```bash
  git add manifest.json service-worker/wallpaper.js service-worker/index.js service-worker/association.js
  git commit -m "feat(M3): SW 壁纸代理——wallpaper:fetch/setDaily + host 权限"
  ```

## Task M3-3：`WallpaperManager`（tab 侧壁纸引擎主模块）

**文件：** `tab/src/js/wallpaper-manager.js`（新建）、`tab/index.html`、`tab/src/js/load.js`

- [ ] **步骤 1：新建 `tab/src/js/wallpaper-manager.js`**

  ```js
  /**
   * WallpaperManager — 多源壁纸引擎
   * 数据分层：
   *   - 二进制/渐变字符串  -> IndexedDB 表 wallpapers（tab 直接读写）
   *   - 配置(current/library/favorites/daily/view/seeded) -> chrome.storage.local['ywr-wallpaper']
   *     （SW 的 alarm 需要写，故配置不落 localStorage）
   * 能力 API（供 settings-manager 面板调用）：listSources/applySource/addGradient/
   *   uploadLocal/toggleFavorite/setCurrent/setDaily/getView/setView/removeSource/migrateLegacy
   */
  const WallpaperManager = (function () {
    const CONFIG_KEY = "ywr-wallpaper";
    const LEGACY_SETTINGS_KEY = "ywr-extension-settings";
    const PRESET_GRADIENTS = [
      { label: "晨雾", gradient: "linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)" },
      { label: "暮光", gradient: "linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)" },
      { label: "深海", gradient: "linear-gradient(135deg,#2b5876 0%,#4e4376 100%)" },
      { label: "极光", gradient: "linear-gradient(135deg,#56ab2f 0%,#a8e063 100%)" },
      { label: "日落", gradient: "linear-gradient(135deg,#f83600 0%,#f9d423 100%)" },
      { label: "紫夜", gradient: "linear-gradient(135deg,#41295a 0%,#2f0743 100%)" },
      { label: "薄荷", gradient: "linear-gradient(135deg,#43cea2 0%,#185a9d 100%)" },
      { label: "蜜桃", gradient: "linear-gradient(135deg,#ff758c 0%,#ff7eb3 100%)" },
      { label: "天空", gradient: "linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)" },
      { label: "柠檬", gradient: "linear-gradient(135deg,#f6d365 0%,#fda085 100%)" },
      { label: "石墨", gradient: "linear-gradient(135deg,#232526 0%,#414345 100%)" },
      { label: "晚霞", gradient: "linear-gradient(135deg,#ff9a9e 0%,#fecfef 100%)" },
    ];
    const MAX_UPLOAD_BYTES = 1024 * 1024; // 1MB

    let config = null;
    let bgEl = null;
    let overlayEl = null;

    /* ---------- 配置读写 ---------- */
    const defaultConfig = () => ({
      current: null,
      library: [],
      favorites: [],
      daily: false,
      view: { opacity: 0.15, blur: 0 },
      // seeded 仅在播种完成后补写，初始态不含
    });

    const loadConfig = () =>
      new Promise((resolve) => {
        chrome.storage.local.get([CONFIG_KEY], (data) => {
          config = data[CONFIG_KEY] || defaultConfig();
          resolve(config);
        });
      });

    const saveConfig = (next) =>
      new Promise((resolve) => {
        config = next;
        chrome.storage.local.set({ [CONFIG_KEY]: next }, resolve);
      });

    /* ---------- IndexedDB 访问（wallpapers 表） ---------- */
    const dbTable = () => ($indexedDB && $indexedDB.$tables ? $indexedDB.$tables.wallpapers : null);

    const dbAddWallpaper = async (record) => {
      const t = dbTable();
      if (!t) throw new Error("wallpapers table not ready");
      // IndexedModel.add 会覆写 id = Date.now()
      return await t.add(record);
    };

    const dbGetWallpaper = (id) => {
      const t = dbTable();
      if (!t) return Promise.resolve(null);
      // list 走 getAll，此处按需从全部中取（数据量小）
      return t.list().then((rows) => rows.find((r) => r.id === id) || null);
    };

    const dbDeleteWallpaper = (id) => {
      const t = dbTable();
      return t ? t.delete(id) : Promise.resolve();
    };

    /* ---------- 背景层 ---------- */
    const ensureBackgroundLayer = () => {
      if (bgEl) return;
      bgEl = document.createElement("div");
      bgEl.className = "page-background";
      bgEl.id = "page-background";
      bgEl.innerHTML = '<div class="page-background-overlay" id="page-background-overlay"></div>';
      document.body.insertBefore(bgEl, document.body.firstChild);
      overlayEl = bgEl.querySelector(".page-background-overlay");
    };

    const resolveSourceCss = async (src) => {
      if (!src) return null;
      if (src.type === "local") {
        const row = await dbGetWallpaper(src.id);
        return row ? `url(${row.data})` : null;
      }
      if (src.type === "gradient") {
        const row = await dbGetWallpaper(src.id);
        return row ? row.data : null;
      }
      if (src.type === "online") {
        const meta = (config.library || []).find((it) => it.id === src.id);
        return meta && meta.url ? `url(${meta.url})` : null;
      }
      return null;
    };

    const applyBackground = async () => {
      ensureBackgroundLayer();
      const src = config.current;
      const css = await resolveSourceCss(src);
      const isImage = src && (src.type === "local" || src.type === "online");
      const view = config.view || { opacity: 0.15, blur: 0 };
      if (css) {
        bgEl.style.backgroundImage = css;
        bgEl.style.filter = view.blur > 0 ? `blur(${view.blur}px)` : "none";
        overlayEl.style.opacity = isImage ? 1 - view.opacity : 0.35;
        document.body.classList.add("has-wallpaper");
      } else {
        bgEl.style.backgroundImage = "none";
        overlayEl.style.opacity = 1;
        document.body.classList.remove("has-wallpaper");
      }
    };

    /* ---------- 生命周期：播种/迁移 ---------- */
    const seedPresetGradients = async () => {
      if (config.seeded === true) return;
      if (config.library && config.library.length > 0) return;
      const presets = [];
      for (const p of PRESET_GRADIENTS) {
        const row = await dbAddWallpaper({ type: "gradient", data: p.gradient });
        presets.push({ id: row.id, type: "gradient", label: p.label, addedAt: Date.now() });
      }
      config.library = presets;
      config.seeded = true;
      await saveConfig(config);
    };

    const migrateLegacy = async () => {
      try {
        const raw = localStorage.getItem(LEGACY_SETTINGS_KEY);
        if (!raw) return;
        const legacy = JSON.parse(raw);
        const oldImage = legacy && legacy.backgroundImage;
        if (!oldImage) return;
        const row = await dbAddWallpaper({ type: "local", data: oldImage });
        config.library = config.library || [];
        config.library.push({ id: row.id, type: "local", label: "我的壁纸", addedAt: Date.now() });
        config.current = { id: row.id, type: "local" };
        delete legacy.backgroundImage;
        localStorage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify(legacy));
        await saveConfig(config);
      } catch (e) {
        console.warn("WallpaperManager: legacy migrate failed", e);
      }
    };

    /* ---------- 能力 API ---------- */
    const listSources = () => config.library || [];

    const setCurrent = async (id) => {
      const meta = (config.library || []).find((it) => it.id === id);
      if (!meta) return false;
      config.current = { id: meta.id, type: meta.type };
      await saveConfig(config);
      await applyBackground();
      return true;
    };

    const addGradient = async () => {
      // 随机生成渐变
      const hue1 = Math.floor(Math.random() * 360);
      const hue2 = (hue1 + 40 + Math.floor(Math.random() * 140)) % 360;
      const gradient = `linear-gradient(135deg, hsl(${hue1},70%,60%) 0%, hsl(${hue2},70%,55%) 100%)`;
      const row = await dbAddWallpaper({ type: "gradient", data: gradient });
      const meta = { id: row.id, type: "gradient", label: "随机渐变", addedAt: Date.now() };
      config.library = config.library || [];
      config.library.push(meta);
      await saveConfig(config);
      return meta;
    };

    const uploadLocal = (file) =>
      new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith("image/")) {
          reject(new Error("仅支持图片文件"));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = async () => {
            try {
              const data = await compressImage(img);
              const bytes = data.length * 0.75; // base64 近似字节数
              if (bytes > MAX_UPLOAD_BYTES) {
                reject(new Error("图片过大（>1MB），请压缩后重试"));
                return;
              }
              const row = await dbAddWallpaper({ type: "local", data });
              const meta = { id: row.id, type: "local", label: file.name, addedAt: Date.now() };
              config.library = config.library || [];
              config.library.push(meta);
              await saveConfig(config);
              resolve(meta);
            } catch (e) {
              reject(e);
            }
          };
          img.onerror = () => reject(new Error("图片解码失败"));
          img.src = reader.result;
        };
        reader.onerror = () => reject(new Error("文件读取失败"));
        reader.readAsDataURL(file);
      });

    const compressImage = (img) =>
      new Promise((resolve) => {
        const MAX_SIDE = 1920;
        let { width, height } = img;
        if (width > MAX_SIDE || height > MAX_SIDE) {
          const ratio = MAX_SIDE / Math.max(width, height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const qualities = [0.85, 0.6, 0.4, 0.2];
        let out = canvas.toDataURL("image/jpeg", 0.85);
        for (const q of qualities) {
          const data = canvas.toDataURL("image/jpeg", q);
          if (data.length * 0.75 <= MAX_UPLOAD_BYTES) {
            out = data;
            break;
          }
        }
        resolve(out);
      });

    const removeSource = async (id) => {
      config.library = (config.library || []).filter((it) => it.id !== id);
      config.favorites = (config.favorites || []).filter((f) => f !== id);
      if (config.current && config.current.id === id) {
        config.current = null; // 回退主题色，不隐式跳转
      }
      await dbDeleteWallpaper(id);
      await saveConfig(config);
      await applyBackground();
    };

    const toggleFavorite = async (id) => {
      const favs = config.favorites || [];
      const idx = favs.indexOf(id);
      if (idx === -1) favs.push(id);
      else favs.splice(idx, 1);
      config.favorites = favs;
      await saveConfig(config);
      return config.favorites;
    };

    const isFavorite = (id) => (config.favorites || []).includes(id);

    const setDaily = async (enabled) => {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "wallpaper:setDaily", enabled }, (res) => {
          if (chrome.runtime.lastError || !res || !res.success) {
            reject(new Error(chrome.runtime.lastError ? chrome.runtime.lastError.message : "setDaily failed"));
            return;
          }
          config.daily = enabled;
          resolve(true);
        });
      });
    };

    const setView = async (patch) => {
      config.view = Object.assign({}, config.view || { opacity: 0.15, blur: 0 }, patch);
      await saveConfig(config);
      await applyBackground();
    };

    const getView = () => config.view || { opacity: 0.15, blur: 0 };

    /* ---------- 初始化 ---------- */
    const init = async () => {
      await loadConfig();
      await migrateLegacy();
      await seedPresetGradients();
      ensureBackgroundLayer();
      await applyBackground();
      // 响应 SW 广播：每日轮换 / 状态变化
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "wallpaperChanged") {
          loadConfig().then(applyBackground);
        }
      });
    };

    return {
      init,
      listSources,
      setCurrent,
      addGradient,
      uploadLocal,
      removeSource,
      toggleFavorite,
      isFavorite,
      setDaily,
      setView,
      getView,
    };
  })();
  ```

- [ ] **步骤 2：`tab/index.html` 脚本链尾部追加 wallpaper-manager**

  在 `load.js` 之后、registry.js 之前插入（registry 需在 widget 模块前，wallpaper-manager 需在 load.js 之前被解析即可，顺序为：… → load.js 之前的任何位置均可，这里放在 registry 前）：

  ```html
  <!-- wallpaper engine -->
  <script src="./src/js/wallpaper-manager.js"></script>
  ```

  最终尾部脚本顺序：

  ```html
  <!-- load -->
  <script src="./src/js/load.js"></script>
  <!-- wallpaper engine -->
  <script src="./src/js/wallpaper-manager.js"></script>
  <!-- widgets registry -->
  <script src="./src/js/widgets/registry.js"></script>
  ```

  说明：`load.js` 的 `window.onload` 回调内才调用 `WallpaperManager.init()`，脚本解析顺序不构成依赖；`wallpaper-manager.js` 定义全局 IIFE 即可。

- [ ] **步骤 3：`load.js` 初始化顺序接入**

  将 `load.js` 中 `initIndexedDB().then(...)` 回调（第 51-56 行）改为等待 DB 后先初始化 WallpaperManager 再刷新收藏：

  ```js
  initIndexedDB().then(async (db) => {
    $indexedDB = db
    await initIndexedDBFunction(db, $indexedDBModel)
    if (typeof WallpaperManager !== "undefined") {
      await WallpaperManager.init()
    }
    refreshCollections()
    if (typeof WidgetRegistry !== "undefined") {
      WidgetRegistry.init()
    }
  })
  ```

  说明：`initIndexedDBFunction` 同步建 `$tables`；`WallpaperManager.init()` 内部读写 `wallpapers` 表（必须等 DB 就绪）；渐变播种与旧数据迁移也在此路径内。

- [ ] **步骤 4：Reload 验证（本地 + 渐变 + 配置落库）**

  - Console 检查 `chrome.storage.local`：

    ```js
    chrome.storage.local.get(["ywr-wallpaper"], (d) => console.log(d["ywr-wallpaper"]))
    ```

    期望（首次）：`seeded:true`、`library` 含 12 个渐变项、`current:null`、`view:{opacity:0.15,blur:0}`。再次 Reload 不重复播种（library 仍 12 项）。
  - DevTools Application → IndexedDB `wallpapers` 表 12 行。
  - 手动执行：

    ```js
    WallpaperManager.addGradient().then(() => WallpaperManager.listSources().length)
    ```

    期望 13；`document.body.classList.contains('has-wallpaper')` 仍为 false（current 未设置时纯主题色）。

- [ ] **步骤 5：提交**

  ```bash
  git add tab/src/js/wallpaper-manager.js tab/index.html tab/src/js/load.js
  git commit -m "feat(M3): WallpaperManager 引擎——渐变播种/本地压缩/配置分层"
  ```

## Task M3-4：SettingsManager 背景职责移交 WallpaperManager（最小改动）

**文件：** `tab/src/js/settings-manager.js`、`tab/src/js/wallpaper-manager.js`

> M3 只做"旧设置面板中背景相关实现不再直接持有背景层、改委托 WallpaperManager"的最小改动，避免双背景层/双数据源。**不做模板重构、不新增 UI 控件**（在线/收藏/每日等全部 UI 收归 M4-2 的 Tab 化重写，避免跨任务重复绑定）。

- [ ] **步骤 1：`settings-manager.js` 删除自建背景层**

  - 删除 `SettingsManager.init()` 中对 `createPageBackground()` 的调用（第 27 行）。
  - 删除 `createPageBackground` 函数体（第 149-155 行），背景层统一由 `WallpaperManager.init()` 创建。

- [ ] **步骤 2：背景应用委托 WallpaperManager**

  - `applyBackground` 函数体（第 237-250 行）替换为：

  ```js
  const applyBackground = () => {
    // 背景层与壁纸状态由 WallpaperManager 统一持有
    if (typeof WallpaperManager !== "undefined" && WallpaperManager.refresh) {
      WallpaperManager.refresh();
    }
  };
  ```

  - 在 `WallpaperManager` 的 return 对象中确保暴露 `refresh`（M3-3 步骤 1 的 return 列表已含 `init/listSources/setCurrent/...`，需追加 `refresh: () => applyBackground(),`）。

- [ ] **步骤 3：移除旧上传/移除处理（防双写）**

  - 删除 `handleImageFile` 与 `removeBackground` 函数体（第 377-409 行）——本地图片的写入改走 `WallpaperManager.uploadLocal`（UI 绑定在 M4-2 重做，M3 阶段旧面板上传按钮暂不动作，属可接受中间态）。
  - `bindEvents` 中旧"背景图片上传/更换/移除"监听（原绑定到 `bg-upload-area`/`bg-input`/`bg-change-btn`/`bg-remove-btn`）与"透明度/模糊滑块"监听：**保留控件 id 与面板 HTML 不动**，仅将其回调改为 no-op + 注释"M4-2 接入 WallpaperManager"，避免 M3 阶段误写 localStorage 旧键。

  ```js
  // [M3-4] 旧背景控件暂置空，UI 于 M4-2 统一接入 WallpaperManager
  // 背景上传/滑块在 M4-2 前不动作（localStorage 旧键已废弃）
  ```

- [ ] **步骤 4：Reload 验证**

  - Console 无报错；页面只有**一个** `#page-background` 元素（WallpaperManager 创建）。
  - 旧的 `ywr-extension-settings.backgroundImage` 若存在会被 M3-3 迁移走；本地/渐变应用后背景正确显示（`WallpaperManager.setCurrent(...)` 控制台验证）。
  - 屏保进出正常（内容区隐藏/恢复，背景仍在）。

- [ ] **步骤 5：提交**

  ```bash
  git add tab/src/js/settings-manager.js tab/src/js/wallpaper-manager.js
  git commit -m "feat(M3): SettingsManager 背景职责移交 WallpaperManager"
  ```

## Task M3-5：引擎能力补全（收藏/每日/在线 API）+ Console 验收

**文件：** `tab/src/js/wallpaper-manager.js`、`service-worker/wallpaper.js`（M3-2 已建）

> 在线/收藏/每日的**引擎 API** 在此补齐并通过 Console 验收；这些能力的**设置面板 UI 与绑定**在 M4-2 的 Tab 化面板一次性接入（避免 M3-5 加一遍 UI、M4-2 又重建一遍导致重复监听）。

- [ ] **步骤 1：`wallpaper-manager.js` 补 `addOnline`、`daily` getter、`toggleFavorite/isFavorite` 已有**

  在 `WallpaperManager` 的能力区追加（M3-3 已含 `toggleFavorite/isFavorite/setDaily/setView/getView`，此处补在线源与每日 getter）：

  ```js
  const addOnline = async (url, provider) => {
    const meta = {
      id: "online-" + Date.now(),
      type: "online",
      provider: provider || "picsum",
      url,
      label: provider === "bing" ? "Bing 每日壁纸" : "Picsum 随机",
      addedAt: Date.now(),
    };
    config.library = config.library || [];
    config.library.push(meta);
    config.current = { id: meta.id, type: "online" };
    await saveConfig(config);
    await applyBackground();
    return meta;
  };

  const getDaily = () => config.daily === true;
  ```

  return 对象追加 `addOnline` 与 `get daily() { return getDaily(); }`。

- [ ] **步骤 2：Console 验收（不碰 UI）**

  新标签页 Console 依次执行并核对：

  ```js
  // 1) 在线源（Bing 解析走 SW）
  chrome.runtime.sendMessage({ type: "wallpaper:fetch", kind: "bing" }, async (res) => {
    if (res && res.success) {
      await WallpaperManager.addOnline(res.url, "bing");
      console.log("applied bing:", WallpaperManager.listSources().slice(-1)[0]);
    }
  });
  // 2) Picsum 纯 URL
  chrome.runtime.sendMessage({ type: "wallpaper:fetch", kind: "picsum" }, async (res) => {
    if (res && res.success) await WallpaperManager.addOnline(res.url, "picsum");
  });
  // 3) 收藏当前
  const cur = await WallpaperManager.listSources();
  await WallpaperManager.toggleFavorite(cur[cur.length - 1].id);
  console.log("favorites:", (await chrome.storage.local.get(["ywr-wallpaper"])).ywr-wallpaper?.favorites);
  // 4) 每日开关（SW 注册/清除 alarm）
  await WallpaperManager.setDaily(true);
  ```

  期望：
  - 背景切换到对应在线壁纸；`has-wallpaper` 生效。
  - `favorites` 含刚收藏的 id；重复收藏幂等。
  - `setDaily(true)` 后 SW DevTools 中 `chrome.alarms.getAll()` 含 `wallpaperDaily`；`setDaily(false)` 后清空。

- [ ] **步骤 3：提交**

  ```bash
  git add tab/src/js/wallpaper-manager.js
  git commit -m "feat(M3): 壁纸引擎 addOnline/daily 能力 + Console 验收"
  ```


---

# M4：WidgetRegistry 完善 + 设置面板 Tab 化 + 引擎驱动重构

## Task M4-1：`$searchEles.setEngine` 共享 API 与死代码清理

**文件：** `tab/src/js/fun_module/declare/search.js`、`tab/src/js/fun_module/execute/search.js`

- [ ] **步骤 1：`declare/search.js` 追加 `setEngine`**

  在 `initEngineIcon` 之后（第 19 行后）追加：

  ```js
  const setEngine = (engine) => {
    localStorage.setItem("engine", engine);
    initEngineIcon(engine);
  };
  ```

  return 对象（第 62-80 行）追加 `setEngine`。

- [ ] **步骤 2：`execute/search.js` 引擎下拉回调改调 `setEngine`**

  将第 122-135 行改为：

  ```js
  $searchEles.engineBtn.addEventListener("click", () => {
    $dropdown.show($searchEles.engineBtn, {
      tag: "engine",
      data: [
        { id: "", icon: "baidu", value: "baidu", label: "Baidu" },
        { id: "", icon: "google", value: "google", label: "Google" },
        { id: "", icon: "bing", value: "bing", label: "Bing" },
      ],
      callback: (value) => {
        $searchEles.setEngine(value)
      }
    })
  })
  ```

- [ ] **步骤 3：删除死代码委托（第 26-41 行）**

  删除 `$searchEles.contentArea.addEventListener("mouseover", ...)` 整块（`.engine-item` 委托；DOM 中不存在 `.engine-item`，属死代码——M1 后 contentArea 仍被建议列表等使用，但此委托块无用）。保留 `contentArea` 引用本身（其他代码不用它则可一并从 return 删除，但删除可能影响未知引用——保守起见仅删监听块，引用保留）。

- [ ] **步骤 4：Reload 验证**

  搜索框引擎图标点击切换三种引擎正常、图标更新、`localStorage.engine` 正确；Console 无报错。

- [ ] **步骤 5：提交**

  ```bash
  git add tab/src/js/fun_module/declare/search.js tab/src/js/fun_module/execute/search.js
  git commit -m "feat(M4): $searchEles.setEngine 共享 API + 清理引擎委托死代码"
  ```

## Task M4-2：设置面板 Tab 化（外观/布局/组件/更多）

**文件：** `tab/src/js/settings-manager.js`、`tab/src/css/settings.css`

> 面板唯一 owner 是 `settings-manager.js`：外壳、Tab 切换、分区模板；外观 Tab 壁纸源事件委托 `WallpaperManager`，布局 Tab 委托 `WidgetRegistry`，主题复用 `ThemeSwitcher`。

- [ ] **步骤 1：重写 `createSettingsPanel()` 模板为四 Tab 结构**

  将 `createSettingsPanel()` 中 `panelEl.innerHTML = ...` 的整体模板替换为以下内容（保留原有全部控件 id，保证既有绑定不失效；宽度 380px 见步骤 3）：

  ```js
  panelEl.innerHTML = `
    <div class="settings-panel-header">
      <span class="settings-panel-title">设置</span>
      <button class="settings-panel-close" id="settings-close">✕</button>
    </div>
    <div class="settings-tabs" role="tablist">
      <button class="settings-tab is-active" data-tab="appearance">外观</button>
      <button class="settings-tab" data-tab="layout">布局</button>
      <button class="settings-tab" data-tab="components">组件</button>
      <button class="settings-tab" data-tab="more">更多</button>
    </div>
    <div class="settings-panel-body">

      <!-- ============ 外观 ============ -->
      <div class="settings-tab-panel is-active" data-tab-panel="appearance">
        <div class="settings-section">
          <div class="settings-section-title">主题</div>
          <div class="settings-item">
            <div class="theme-picker-grid" id="theme-picker-grid"></div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">壁纸</div>
          <div class="settings-item">
            <label class="settings-item-label">壁纸源</label>
            <div class="settings-item-desc">本地图片 / 渐变 / 在线图库，均可收藏</div>
            <div class="wallpaper-source-list" id="wallpaper-source-list"></div>
          </div>
          <div class="settings-item">
            <div class="settings-item-desc">或从本地上传新图片（JPG/PNG/WebP）</div>
            <div class="bg-upload-area" id="bg-upload-area">
              <div class="bg-upload-icon">🖼️</div>
              <div class="bg-upload-text">点击上传或拖拽图片</div>
              <img class="bg-upload-preview" id="bg-preview" alt="背景预览">
              <input type="file" class="bg-upload-input" id="bg-input" accept="image/*">
            </div>
            <div class="bg-controls">
              <button class="bg-control-btn" id="bg-online-btn">🎲 随机在线</button>
              <button class="bg-control-btn" id="bg-bing-btn">📷 Bing 今日</button>
              <button class="bg-control-btn" id="bg-change-btn">更换</button>
              <button class="bg-control-btn danger" id="bg-remove-btn">移除</button>
            </div>
          </div>
          <div class="settings-item">
            <label class="settings-item-label">背景透明度</label>
            <div class="slider-row">
              <input type="range" class="settings-slider" id="bg-opacity-slider" min="0" max="100" value="15">
              <span class="slider-value" id="bg-opacity-value">15%</span>
            </div>
          </div>
          <div class="settings-item">
            <label class="settings-item-label">背景模糊</label>
            <div class="slider-row">
              <input type="range" class="settings-slider" id="bg-blur-slider" min="0" max="20" value="0">
              <span class="slider-value" id="bg-blur-value">0px</span>
            </div>
          </div>
          <div class="settings-item">
            <label class="settings-item-label">每日自动换壁纸</label>
            <button class="settings-link-btn" id="bg-daily-btn">
              <span id="bg-daily-label">○ 已关闭</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============ 布局 ============ -->
      <div class="settings-tab-panel" data-tab-panel="layout">
        <div class="settings-section">
          <div class="settings-section-title">小组件</div>
          <div id="widget-layout-list" class="widget-layout-list"></div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">侧栏</div>
          <div class="settings-item">
            <label class="settings-item-label">右侧 Tabs/History 栏</label>
            <button class="settings-link-btn" id="right-fold-btn">
              <span id="right-fold-label">显示</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============ 组件 ============ -->
      <div class="settings-tab-panel" data-tab-panel="components">
        <div class="settings-section">
          <div class="settings-section-title">待办清单</div>
          <div class="settings-item">
            <button class="settings-link-btn" id="todo-clear-done-btn">
              <span>清除已完成</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">快捷工具</div>
          <div class="settings-item">
            <div class="settings-item-desc">管理常用工具入口</div>
            <div id="tools-edit-list"></div>
            <button class="settings-link-btn" id="tools-add-btn" style="margin-top:0.5rem">
              <span>＋ 添加工具</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">语录</div>
          <div class="settings-item">
            <button class="settings-link-btn" id="quote-next-btn">
              <span>换一条语录</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============ 更多 ============ -->
      <div class="settings-tab-panel" data-tab-panel="more">
        <div class="settings-section">
          <div class="settings-section-title">屏保</div>
          <div class="settings-item">
            <button class="settings-link-btn" id="screensaver-btn">
              <span>🌙 进入屏保</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">扩展</div>
          <div class="settings-item">
            <button class="settings-link-btn" id="open-options-btn">
              <span>扩展选项</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  ```

  说明：
  - 旧控件 id（`bg-upload-area`/`bg-input`/`bg-preview`/`bg-change-btn`/`bg-remove-btn`/`bg-opacity-slider`/`bg-blur-slider`/`screensaver-btn`/`open-options-btn`/`settings-close`）全部保留在"外观/更多"Tab 内 → **M3 已绑定的监听器无需改写 id**。
  - 移除旧的"上传区 has-image 预览"专用逻辑，改由 `#wallpaper-source-list` 源列表统一展示当前源。

- [ ] **步骤 2：在 `bindEvents()` 末尾追加（Tab 切换 + 各 Tab 渲染 + 壁纸控件绑定）**

  > **作用域规则（重要）**：`openPanel` 在模块中是 `const`，**不得重赋值**。此处采用"追加第二个设置按钮监听器"方案：原 `bindEvents` 已把 `.ipage-aside-setting` 点击绑定到 `openPanel`（先执行），本步骤再追加一个点击监听（后执行），在面板变为可见后刷新各动态 Tab 内容。

  ```js
  /* ================= M4-2：设置面板 Tab 化 ================= */

  /* ---- 面板打开后刷新动态内容（第二个监听器，运行在 openPanel 之后） ---- */
  const refreshDynamicPanels = () => {
    renderThemeGrid();
    renderSourceList();
    renderDailyLabel();
    renderWidgetLayout();
    renderRightFoldLabel();
    renderToolsEdit();
  };
  document.querySelector(".ipage-aside-setting") &&
    document.querySelector(".ipage-aside-setting").addEventListener("click", () => {
      setTimeout(refreshDynamicPanels, 0);
    });

  /* ---- Tab 切换 ---- */
  document.querySelectorAll(".settings-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".settings-tab").forEach((t) => t.classList.remove("is-active"));
      document.querySelectorAll(".settings-tab-panel").forEach((p) => p.classList.remove("is-active"));
      tab.classList.add("is-active");
      document.querySelector(`.settings-tab-panel[data-tab-panel="${tab.dataset.tab}"]`).classList.add("is-active");
    });
  });

  /* ---- 外观：主题网格 ---- */
  const THEME_LIST = [
    { id: "slate-light", name: "石墨浅调" },
    { id: "midnight-ink", name: "深夜墨色" },
    { id: "coral-amber", name: "珊瑚金橙" },
    { id: "indigo-mint", name: "靛蓝薄荷" },
    { id: "violet-amber", name: "紫罗兰柠黄" },
    { id: "rose-sky", name: "玫红天蓝" },
  ];
  const themeGrid = document.getElementById("theme-picker-grid");
  const renderThemeGrid = () => {
    if (!themeGrid) return;
    const current = ThemeSwitcher.getTheme();
    themeGrid.innerHTML = THEME_LIST.map((t) => {
      const active = current === t.id ? " is-active" : "";
      return `<button class="theme-picker-item${active}" data-theme="${t.id}" title="${t.name}">
        <span class="theme-picker-swatch" data-theme="${t.id}"></span>
        <span class="theme-picker-name" data-theme="${t.id}">${t.name}</span>
      </button>`;
    }).join("");
  };
  themeGrid &&
    themeGrid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-theme]");
      if (!btn) return;
      ThemeSwitcher.setTheme(btn.dataset.theme);
      renderThemeGrid();
    });

  /* ---- 外观：壁纸源列表 ---- */
  const readWallpaperCfg = () =>
    new Promise((res) => chrome.storage.local.get(["ywr-wallpaper"], (d) => res(d["ywr-wallpaper"] || null)));
  const sourceListEl = document.getElementById("wallpaper-source-list");
  const renderSourceList = async () => {
    if (!sourceListEl) return;
    const cfg = await readWallpaperCfg();
    const sources = (cfg && cfg.library) || [];
    const favs = (cfg && cfg.favorites) || [];
    const curId = cfg && cfg.current ? cfg.current.id : null;
    if (sources.length === 0) {
      sourceListEl.innerHTML = '<div class="settings-item-desc">暂无壁纸，上传或生成一张吧</div>';
      return;
    }
    sourceListEl.innerHTML = sources
      .map((s) => {
        const active = s.id === curId ? " is-active" : "";
        const fav = favs.includes(s.id) ? "♥" : "♡";
        const label = s.type === "online" ? "🌐 " : s.type === "gradient" ? "🎨 " : "🖼️ ";
        return `<div class="wallpaper-source-item${active}" data-id="${s.id}">
          <span class="wallpaper-source-name">${label}${s.label || s.id}</span>
          <span class="wallpaper-source-actions">
            <button class="ws-btn ws-fav" data-id="${s.id}" title="收藏">${fav}</button>
            <button class="ws-btn ws-use" data-id="${s.id}" title="应用">✓</button>
            <button class="ws-btn ws-del" data-id="${s.id}" title="删除">✕</button>
          </span>
        </div>`;
      })
      .join("");
  };
  sourceListEl &&
    sourceListEl.addEventListener("click", async (e) => {
      const btn = e.target.closest(".ws-btn");
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.classList.contains("ws-use")) {
        await WallpaperManager.setCurrent(id);
      } else if (btn.classList.contains("ws-fav")) {
        await WallpaperManager.toggleFavorite(id);
      } else if (btn.classList.contains("ws-del")) {
        await WallpaperManager.removeSource(id);
      }
      await renderSourceList();
      renderDailyLabel();
    });

  /* ---- 外观：每日轮换 ---- */
  const renderDailyLabel = async () => {
    const cfg = await readWallpaperCfg();
    const daily = !!(cfg && cfg.daily);
    const label = document.getElementById("bg-daily-label");
    if (label) label.textContent = daily ? "● 已开启" : "○ 已关闭";
  };
  const dailyBtn = document.getElementById("bg-daily-btn");
  dailyBtn &&
    dailyBtn.addEventListener("click", async () => {
      const cfg = await readWallpaperCfg();
      const next = !(cfg && cfg.daily);
      WallpaperManager.setDaily(next).then(renderDailyLabel);
    });

  /* ---- 外观：在线壁纸 / 上传 / 滑块（委托 WallpaperManager） ---- */
  const onlineBtn = document.getElementById("bg-online-btn");
  const bingBtn = document.getElementById("bg-bing-btn");
  const applyOnline = (kind) => {
    chrome.runtime.sendMessage({ type: "wallpaper:fetch", kind }, (res) => {
      if (chrome.runtime.lastError || !res || !res.success) {
        $notify.error({ message: "获取在线壁纸失败", duration: 3000 });
        return;
      }
      WallpaperManager.addOnline(res.url, kind).then(() => {
        renderSourceList();
        $notify.success({ message: "已应用在线壁纸", duration: 2000 });
      });
    });
  };
  onlineBtn && onlineBtn.addEventListener("click", () => applyOnline("picsum"));
  bingBtn && bingBtn.addEventListener("click", () => applyOnline("bing"));

  const fileInput2 = document.getElementById("bg-input");
  const changeBtn = document.getElementById("bg-change-btn");
  const removeBtn = document.getElementById("bg-remove-btn");
  const uploadArea2 = document.getElementById("bg-upload-area");
  changeBtn && changeBtn.addEventListener("click", (e) => { e.stopPropagation(); fileInput2 && fileInput2.click(); });
  uploadArea2 &&
    uploadArea2.addEventListener("click", (e) => {
      if (e.target.closest(".bg-controls")) return;
      fileInput2 && fileInput2.click();
    });
  fileInput2 &&
    fileInput2.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        WallpaperManager.uploadLocal(file)
          .then(() => { renderSourceList(); $notify.success({ message: "已添加壁纸", duration: 1500 }); })
          .catch((err) => $notify.error({ message: err.message, duration: 3000 }));
      }
    });
  removeBtn &&
    removeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const cfg = await readWallpaperCfg();
      const id = cfg && cfg.current ? cfg.current.id : null;
      if (id) {
        await WallpaperManager.removeSource(id);
        renderSourceList();
      }
    });

  const opacitySlider = document.getElementById("bg-opacity-slider");
  const opacityValue = document.getElementById("bg-opacity-value");
  const blurSlider = document.getElementById("bg-blur-slider");
  const blurValue = document.getElementById("bg-blur-value");
  let _viewTimer = null;
  const queueView = (patch) => {
    if (_viewTimer) clearTimeout(_viewTimer);
    _viewTimer = setTimeout(() => WallpaperManager.setView(patch), 200);
  };
  const syncSliders = () => {
    const view = WallpaperManager.getView();
    if (opacitySlider) opacitySlider.value = Math.round(view.opacity * 100);
    if (opacityValue) opacityValue.textContent = Math.round(view.opacity * 100) + "%";
    if (blurSlider) blurSlider.value = view.blur;
    if (blurValue) blurValue.textContent = view.blur + "px";
  };
  opacitySlider && opacitySlider.addEventListener("input", (e) => {
    if (opacityValue) opacityValue.textContent = e.target.value + "%";
    queueView({ opacity: Number(e.target.value) / 100 });
  });
  blurSlider && blurSlider.addEventListener("input", (e) => {
    if (blurValue) blurValue.textContent = e.target.value + "px";
    queueView({ blur: Number(e.target.value) });
  });
  syncSliders();

  /* ---- 布局：小组件开关+位置 ---- */
  const renderWidgetLayout = () => {
    const list = document.getElementById("widget-layout-list");
    if (!list) return;
    const layout = WidgetRegistry.getLayout();
    const defs = [];
    WidgetRegistry.widgets.forEach((w, id) => defs.push({ id, ...w }));
    if (defs.length === 0) {
      list.innerHTML = '<div class="settings-item-desc">暂无小组件（M5 后出现）</div>';
      return;
    }
    const zoneLabels = { topbar: "顶栏", hero: "搜索区下", left: "左侧栏", off: "隐藏" };
    list.innerHTML = defs
      .map((d) => {
        const cfg = layout[d.id] || { zone: "off", enabled: false };
        const enabled = cfg.enabled !== false;
        const zones = (d.zones || ["off"])
          .map((z) => `<option value="${z}" ${cfg.zone === z ? "selected" : ""}>${zoneLabels[z] || z}</option>`)
          .join("");
        return `<div class="widget-layout-row" data-widget-id="${d.id}">
          <label class="widget-layout-name">${d.icon || ""} ${d.title}</label>
          <input type="checkbox" class="widget-toggle" data-id="${d.id}" ${enabled ? "checked" : ""}>
          <select class="widget-zone" data-id="${d.id}" ${enabled ? "" : "disabled"}>${zones}</select>
        </div>`;
      })
      .join("");
  };
  const layoutListEl = document.getElementById("widget-layout-list");
  layoutListEl &&
    layoutListEl.addEventListener("change", (e) => {
      const id = e.target.dataset.id;
      if (!id) return;
      const layout = WidgetRegistry.getLayout();
      if (!layout[id]) layout[id] = { zone: "off", enabled: false };
      if (e.target.classList.contains("widget-toggle")) {
        layout[id].enabled = e.target.checked;
        if (!e.target.checked) layout[id].zone = "off";
        const row = e.target.closest(".widget-layout-row");
        const sel = row && row.querySelector(".widget-zone");
        if (sel) sel.disabled = !e.target.checked;
      } else if (e.target.classList.contains("widget-zone")) {
        layout[id].zone = e.target.value;
        layout[id].enabled = e.target.value !== "off";
        const row = e.target.closest(".widget-layout-row");
        const tog = row && row.querySelector(".widget-toggle");
        if (tog) tog.checked = layout[id].enabled;
      }
      WidgetRegistry.saveLayout(layout);
      WidgetRegistry.init(); // 全量重渲染（registry.renderAll 会先清除旧槽位）
    });

  /* ---- 布局：右栏折叠 ---- */
  const renderRightFoldLabel = () => {
    const label = document.getElementById("right-fold-label");
    if (label) label.textContent = $aside.asideRightArea.classList.contains("is-fold") ? "已折叠" : "显示";
  };
  const rightFoldBtn = document.getElementById("right-fold-btn");
  rightFoldBtn &&
    rightFoldBtn.addEventListener("click", () => {
      $aside.handleFoldToggle();
      renderRightFoldLabel();
    });

  /* ---- 组件：待办清完成 / 语录换一条 / 工具组 ---- */
  const todoClearBtn = document.getElementById("todo-clear-done-btn");
  todoClearBtn &&
    todoClearBtn.addEventListener("click", async () => {
      const t = $indexedDB && $indexedDB.$tables ? $indexedDB.$tables.todos : null;
      if (!t) return;
      const all = await t.list();
      for (const item of all) if (item.done === 1) await t.delete(item.id);
      WidgetRegistry.refresh("todo");
      $notify.success({ message: "已清除已完成项", duration: 1500 });
    });
  const quoteNextBtn = document.getElementById("quote-next-btn");
  quoteNextBtn &&
    quoteNextBtn.addEventListener("click", () => {
      WidgetRegistry.refresh("quote");
      $notify.success({ message: "已换一条", duration: 1200 });
    });

  const renderToolsEdit = () => {
    const list = document.getElementById("tools-edit-list");
    if (!list || typeof $widgetStore === "undefined") return;
    $widgetStore.tools.list().then((items) => {
      list.innerHTML = items
        .map((it) => `<div class="tools-edit-row">${it.name}
          <button class="ws-btn ws-del" data-name="${it.name}">✕</button></div>`)
        .join("");
      list.querySelectorAll(".ws-del").forEach((b) =>
        b.addEventListener("click", () => {
          $widgetStore.tools.remove(b.dataset.name).then(() => {
            renderToolsEdit();
            WidgetRegistry.refresh("tools");
          });
        })
      );
    });
  };
  const toolsAddBtn = document.getElementById("tools-add-btn");
  toolsAddBtn &&
    toolsAddBtn.addEventListener("click", () => {
      if (typeof $widgetStore === "undefined") return;
      const name = prompt("工具名称", "GitHub");
      const url = prompt("工具地址", "https://github.com");
      if (!name || !url) return;
      $widgetStore.tools.add({ name, url }).then(() => {
        renderToolsEdit();
        WidgetRegistry.refresh("tools");
      });
    });
  ```

- [ ] **步骤 3：`settings.css` 改为 380px + Tab/新组件样式**

  在 `settings.css` 中把第 7 行 `width: 320px` 改为 `width: 380px`，并在文件末尾追加：

  ```css
  /* ========== Tab 面板（M4） ========== */
  .settings-tabs {
    display: flex;
    border-bottom: 1px solid var(--borderGrey);
    padding: 0 0.75rem;
    gap: 0.25rem;
    background: var(--surface);
    flex: none;
  }
  .settings-tab {
    flex: 1;
    padding: 0.6rem 0.25rem;
    background: transparent;
    color: var(--muted);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 140ms ease, border-color 140ms ease;
  }
  .settings-tab:hover { color: var(--text); }
  .settings-tab.is-active { color: var(--primary); border-bottom-color: var(--primary); }
  .settings-tab-panel { display: none; }
  .settings-tab-panel.is-active { display: block; }

  /* 主题网格 */
  .theme-picker-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .theme-picker-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 0.5rem;
    background: var(--surface);
    border: 1.5px solid var(--borderGrey);
    border-radius: 10px;
    cursor: pointer;
    transition: border-color 140ms ease, transform 140ms ease;
  }
  .theme-picker-item:hover { border-color: var(--primary); transform: translateY(-1px); }
  .theme-picker-item.is-active { border-color: var(--primary); box-shadow: var(--shadow-glow); }
  .theme-picker-swatch {
    width: 100%;
    height: 1.6rem;
    border-radius: 6px;
    background: var(--bg);
    border: 1px solid var(--borderGrey);
  }
  .theme-picker-name { font-size: 0.72rem; color: var(--text); }

  /* 壁纸源列表 */
  .wallpaper-source-list { max-height: 11rem; overflow-y: auto; }
  .wallpaper-source-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.45rem 0.6rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 140ms ease;
  }
  .wallpaper-source-item:hover { background: var(--muted-surface); }
  .wallpaper-source-item.is-active { background: var(--muted-surface); color: var(--primary); font-weight: 600; }
  .wallpaper-source-name { font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wallpaper-source-actions { display: inline-flex; gap: 0.25rem; }
  .ws-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--muted);
    font-size: 0.85rem;
    border-radius: 6px;
    width: 1.6rem;
    height: 1.6rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background-color 140ms ease, color 140ms ease;
  }
  .ws-btn:hover { background: var(--borderGrey); color: var(--text); }

  /* 布局 tab */
  .widget-layout-list { display: flex; flex-direction: column; gap: 0.4rem; }
  .widget-layout-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--borderGrey);
    border-radius: 8px;
    background: var(--surface);
  }
  .widget-layout-name { flex: 1; font-size: 0.875rem; }
  .widget-toggle { accent-color: var(--primary); }
  .widget-zone {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--borderGrey);
    border-radius: 6px;
    padding: 0.2rem 0.35rem;
    font-size: 0.8rem;
  }
  .tools-edit-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 0.5rem;
    border-bottom: 1px solid var(--border-subtle);
    font-size: 0.85rem;
  }
  ```

- [ ] **步骤 4：Reload 验证**

  - 点设置图标 → 380px 抽屉带 4 个 Tab；默认"外观"，动态内容已刷新。
  - "外观"：6 主题点选即时生效；壁纸源列表出现 12 渐变 + 上传项；点某源"✓"应用；♥ 收藏；✕ 删除（删除当前壁纸回退主题色）；"🎲 随机在线"/"📷 Bing 今日"可用（需联网）；滑块调节背景透明/模糊。
  - "布局"：小组件列表（M5 前显示"暂无小组件"提示）；右栏折叠按钮切换显示/折叠并同步状态。
  - "组件"：工具组增删（M5 前 store 已可用）；"更多"：屏保/扩展选项可用。
  - Console 无报错（重点：无 `grid is not defined`、无 `openPanel` 赋值错误）；ESC 关闭面板正常。

- [ ] **步骤 5：提交**

  ```bash
  git add tab/src/js/settings-manager.js tab/src/css/settings.css
  git commit -m "feat(M4): 设置面板四 Tab 化（外观/布局/组件/更多）+ 380px 抽屉"
  ```

---

# M5：五个小组件

## Task M5-1：时钟/问候 widget

**文件：** `tab/src/js/widgets/clock.js`（新建）

- [ ] **步骤 1：新建 `clock.js`（最终版本，timer 仅启动一次）**

  ```js
  (function () {
    if (typeof WidgetRegistry === "undefined") return;

    const greeting = (h) =>
      h < 5 ? "夜深了" : h < 9 ? "早上好" : h < 12 ? "上午好" : h < 14 ? "中午好" : h < 18 ? "下午好" : h < 23 ? "晚上好" : "夜深了";

    const paint = (slot) => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const week = ["日", "一", "二", "三", "四", "五", "六"][now.getDay()];
      slot.innerHTML = `
        <div class="clock-greeting">${greeting(now.getHours())}</div>
        <div class="clock-time">${hh}:${mm}</div>
        <div class="clock-date">${now.getMonth() + 1}月${now.getDate()}日 周${week}</div>`;
    };

    const render = (slot) => {
      paint(slot);
      // 每 30s 刷新一次；用 slot 上标记保证 interval 只启动一次
      if (!slot.__clockTimer) {
        slot.__clockTimer = setInterval(() => paint(slot), 30000);
      }
    };

    WidgetRegistry.register({
      id: "clock",
      title: "时钟",
      icon: "🕐",
      zones: ["topbar", "hero"],
      render,
    });
  })();
  ```

- [ ] **步骤 2：注册脚本**（`index.html` 在 `registry.js` 后追加）

  ```html
  <!-- widgets -->
  <script src="./src/js/widgets/clock.js"></script>
  ```

- [ ] **步骤 3：`widgets.css` 追加 clock 样式（hero/topbar 两种形态）**

  ```css
  /* 时钟/问候 */
  .widget[data-widget="clock"] { background: transparent; border: none; box-shadow: none; }
  .clock-greeting { font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 0.1rem; }
  .clock-time { font-size: 3rem; font-weight: 700; line-height: 1.1; color: var(--text); font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
  .clock-date { font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.2rem; }
  .shell-zone-topbar .widget[data-widget="clock"] { display: inline-flex; align-items: baseline; gap: 0.6rem; }
  .shell-zone-topbar .clock-greeting { font-size: 0.8rem; margin: 0; }
  .shell-zone-topbar .clock-time { font-size: 1.05rem; }
  .shell-zone-topbar .clock-date { font-size: 0.8rem; margin: 0; }
  body.has-wallpaper .widget[data-widget="clock"] .clock-time,
  body.has-wallpaper .widget[data-widget="clock"] .clock-greeting,
  body.has-wallpaper .widget[data-widget="clock"] .clock-date { color: var(--on-image); }
  ```

- [ ] **步骤 4：Reload 验证**

  默认布局中 clock 的 zone 取 `zones[0] = "topbar"`，因此刷新后顶栏右侧出现紧凑问候/时间（若想验证 Hero 大号时间形态：Console 设 `localStorage['ywr-widget-layout']` 为 `{"clock":{"zone":"hero","enabled":true}}` 后刷新 → Hero 下方出现大号时间；1 分钟后分钟更新）。两种 zone 形态切换正常、无报错。

- [ ] **步骤 5：提交**

  ```bash
  git add tab/src/js/widgets/clock.js tab/index.html tab/src/css/widgets.css
  git commit -m "feat(M5): 时钟/问候 widget"
  ```

## Task M5-2：待办清单 widget（+ todos 表数据层）

**文件：** `tab/src/js/widgets/todo.js`（新建）、`tab/src/css/widgets.css`、`tab/index.html`

- [ ] **步骤 1：新建 `todo.js`**

  ```js
  (function () {
    if (typeof WidgetRegistry === "undefined") return;

    const table = () => ($indexedDB && $indexedDB.$tables ? $indexedDB.$tables.todos : null);

    const render = (slot) => {
      const t = table();
      if (!t) {
        slot.innerHTML = "";
        return;
      }
      t.list().then((items) => {
        const sorted = items.slice().sort((a, b) => a.done - b.done || a.id - b.id);
        slot.innerHTML = `
          <div class="widget-head">✓ 待办清单 <span class="todo-count">${items.filter((i) => i.done !== 1).length}</span></div>
          <ul class="todo-list">
            ${sorted
              .map(
                (it) => `<li class="todo-item${it.done === 1 ? " is-done" : ""}" data-id="${it.id}">
                  <input type="checkbox" class="todo-check" data-id="${it.id}" ${it.done === 1 ? "checked" : ""}>
                  <span class="todo-text">${escapeHtml(it.text)}</span>
                  <button class="todo-del" data-id="${it.id}">✕</button>
                </li>`
              )
              .join("")}
          </ul>
          <form class="todo-form">
            <input class="todo-input" type="text" placeholder="添加待办…" maxlength="100">
            <button class="todo-add" type="submit">＋</button>
          </form>`;
        slot.querySelectorAll(".todo-check").forEach((cb) =>
          cb.addEventListener("change", async () => {
            const t2 = table();
            const row = (await t2.list()).find((r) => r.id === Number(cb.dataset.id));
            if (row) {
              await t2.update({ id: row.id, done: cb.checked ? 1 : 0 });
              render(slot);
            }
          })
        );
        slot.querySelectorAll(".todo-del").forEach((b) =>
          b.addEventListener("click", async () => {
            await table().delete(Number(b.dataset.id));
            render(slot);
          })
        );
        slot.querySelector(".todo-form").addEventListener("submit", async (e) => {
          e.preventDefault();
          const input = slot.querySelector(".todo-input");
          const text = input.value.trim();
          if (!text) return;
          const t2 = table();
          await t2.add({ text, done: 0, createdAt: Date.now() });
          input.value = "";
          render(slot);
        });
      });
    };

    const escapeHtml = (s) =>
      String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    WidgetRegistry.register({
      id: "todo",
      title: "待办",
      icon: "✓",
      zones: ["left"],
      render,
      refresh: render,
    });
  })();
  ```

- [ ] **步骤 2：`widgets.css` 追加 todo 样式**

  ```css
  .widget-head { padding: 0.6rem 0.75rem; font-size: 0.85rem; font-weight: 600; display:flex; align-items:center; gap:0.35rem; border-bottom: 1px solid var(--border-subtle); }
  .todo-count { font-size: 0.7rem; background: var(--accent-soft); color: var(--primary); border-radius: 999px; padding: 0.05rem 0.4rem; }
  .todo-list { list-style: none; max-height: 12rem; overflow-y: auto; }
  .todo-item { display: flex; align-items: center; gap: 0.45rem; padding: 0.4rem 0.75rem; font-size: 0.85rem; }
  .todo-item:hover { background: var(--surface-raised); }
  .todo-item.is-done .todo-text { text-decoration: line-through; color: var(--text-secondary); }
  .todo-check { accent-color: var(--primary); }
  .todo-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .todo-del { visibility: hidden; background: transparent; border: none; color: var(--muted); cursor: pointer; }
  .todo-item:hover .todo-del { visibility: visible; }
  .todo-form { display: flex; gap: 0.35rem; padding: 0.5rem 0.75rem; border-top: 1px solid var(--border-subtle); }
  .todo-input { flex: 1; min-width: 0; background: var(--surface-raised); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.35rem 0.5rem; color: var(--text); font-size: 0.85rem; outline: none; }
  .todo-input:focus { border-color: var(--primary); }
  .todo-add { background: var(--primary); color: #fff; border: none; border-radius: 8px; width: 1.9rem; cursor: pointer; }
  ```

- [ ] **步骤 3：注册脚本 + Reload 验证**

  `index.html` registry 后追加 `<script src="./src/js/widgets/todo.js"></script>`。Reload：Console 设 layout `{"todo":{"zone":"left","enabled":true}}` → 左侧出现待办卡；增/勾/删/清完成正常；刷新数据仍在（IndexedDB `todos`）。

- [ ] **步骤 4：提交**

  ```bash
  git add tab/src/js/widgets/todo.js tab/src/css/widgets.css tab/index.html
  git commit -m "feat(M5): 待办清单 widget（IndexedDB todos）"
  ```

## Task M5-3：每日语录 widget

**文件：** `tab/src/js/widgets/quote.js`（新建）、`tab/src/css/widgets.css`、`tab/index.html`

- [ ] **步骤 1：新建 `quote.js`（内置 50 条 + 按日固定）**

  ```js
  (function () {
    if (typeof WidgetRegistry === "undefined") return;
    const STORAGE_KEY = "ywr-quote-state";
    const QUOTES = [
      "种一棵树最好的时间是十年前，其次是现在。",
      "知不足而奋进，望远山而前行。",
      "把每一件简单的事做好就是不简单。",
      "千里之行，始于足下。",
      "少壮不努力，老大徒伤悲。",
      "不积跬步，无以至千里。",
      "学而不思则罔，思而不学则殆。",
      "博观而约取，厚积而薄发。",
      "天行健，君子以自强不息。",
      "路漫漫其修远兮，吾将上下而求索。",
      "业精于勤，荒于嬉。",
      "锲而不舍，金石可镂。",
      "纸上得来终觉浅，绝知此事要躬行。",
      "千磨万击还坚劲，任尔东西南北风。",
      "会当凌绝顶，一览众山小。",
      "长风破浪会有时，直挂云帆济沧海。",
      "沉舟侧畔千帆过，病树前头万木春。",
      "山重水复疑无路，柳暗花明又一村。",
      "宝剑锋从磨砺出，梅花香自苦寒来。",
      "读书破万卷，下笔如有神。",
      "问渠那得清如许？为有源头活水来。",
      "人生在勤，不索何获。",
      "志当存高远。",
      "不登高山，不知天之高也。",
      "非淡泊无以明志，非宁静无以致远。",
      "老骥伏枥，志在千里。",
      "穷且益坚，不坠青云之志。",
      "不畏浮云遮望眼，自缘身在最高层。",
      "海内存知己，天涯若比邻。",
      "落红不是无情物，化作春泥更护花。",
      "春蚕到死丝方尽，蜡炬成灰泪始干。",
      "山不厌高，海不厌深。",
      "我劝天公重抖擞，不拘一格降人才。",
      "横眉冷对千夫指，俯首甘为孺子牛。",
      "为中华之崛起而读书。",
      "世上无难事，只怕有心人。",
      "失败是成功之母。",
      "时间就是生命，时间就是速度，时间就是力量。",
      "知识就是力量。",
      "书籍是人类进步的阶梯。",
      "天才就是百分之一的灵感加百分之九十九的汗水。",
      "行动胜于言语。",
      "今日事，今日毕。",
      "坚持就是胜利。",
      "细节决定成败。",
      "态度决定高度。",
      "越努力，越幸运。",
      "心若向阳，无谓悲伤。",
      "你若盛开，蝴蝶自来。",
      "生活不止眼前的苟且，还有诗和远方。",
    ];

    const dayIndex = () => {
      const d = new Date();
      return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    };

    const loadState = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const state = raw ? JSON.parse(raw) : {};
        if (state.day !== dayIndex()) return { day: dayIndex(), idx: -1 };
        return state;
      } catch (e) {
        return { day: dayIndex(), idx: -1 };
      }
    };

    const nextIndex = (idx) => {
      const n = QUOTES.length;
      const used = (idx + 1 + Math.floor(Math.random() * (n - 1))) % n;
      return used;
    };

    const render = (slot) => {
      let state = loadState();
      if (state.idx < 0 || state.idx >= QUOTES.length) {
        state.idx = Math.floor(Math.random() * QUOTES.length);
      }
      saveState(state);
      slot.innerHTML = `
        <div class="quote-card">
          <div class="quote-mark">“</div>
          <div class="quote-text">${QUOTES[state.idx]}</div>
          <button class="quote-next" title="换一条">↻</button>
        </div>`;
      const btn = slot.querySelector(".quote-next");
      if (btn) {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          state = loadState();
          state.idx = nextIndex(state.idx);
          saveState(state);
          render(slot);
        });
      }
    };

    const saveState = (state) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        /* ignore */
      }
    };

    WidgetRegistry.register({
      id: "quote",
      title: "语录",
      icon: "❝",
      zones: ["left"],
      render,
      refresh: render,
    });
  })();
  ```

- [ ] **步骤 2：`widgets.css` 追加 quote 样式**

  ```css
  /* 语录 */
  .quote-card { position: relative; padding: 0.9rem 1rem; }
  .quote-mark { position: absolute; top: 0.25rem; left: 0.6rem; font-size: 2rem; line-height: 1; color: var(--accent-soft); }
  .quote-text { font-size: 0.85rem; line-height: 1.6; color: var(--text); }
  .quote-next { position: absolute; right: 0.5rem; bottom: 0.5rem; background: transparent; border: none; color: var(--muted); cursor: pointer; font-size: 0.9rem; border-radius: 6px; width: 1.6rem; height: 1.6rem; }
  .quote-next:hover { background: var(--surface-raised); color: var(--text); }
  ```

- [ ] **步骤 3：注册脚本 + Reload 验证**

  `index.html` registry 后追加 quote.js。Reload 设 layout `{"quote":{"zone":"left","enabled":true}}` → 出现语录卡；点 ↻ 换一条；同日刷新不重置（state.day 匹配当日）。

- [ ] **步骤 4：提交**

  ```bash
  git add tab/src/js/widgets/quote.js tab/src/css/widgets.css tab/index.html
  git commit -m "feat(M5): 每日语录 widget"
  ```

## Task M5-4：快捷工具组 widget

**文件：** `tab/src/js/widgets/store.js`（新建）、`tab/src/js/widgets/tools.js`（新建）、`tab/src/css/widgets.css`、`tab/index.html`

> 工具组数据经新增边界 `$widgetStore`（全局，`widgets/store.js` 定义），tools widget 与设置面板"组件"Tab（M4-2 引用的 `$widgetStore.tools.add/list/remove`）共用同一读写层——避免两处各写一套 localStorage 逻辑。

- [ ] **步骤 1：新建 `widgets/store.js`（$widgetStore 边界）**

  ```js
  /**
   * $widgetStore — 小组件数据边界
   * tools：localStorage JSON 数组（键 ywr-tools-list）
   * todo 数据不入此层（todos 走 IndexedDB 表）
   */
  const $widgetStore = (function () {
    const TOOLS_KEY = "ywr-tools-list";
    const DEFAULT_TOOLS = [
      { name: "GitHub", url: "https://github.com" },
      { name: "知乎", url: "https://www.zhihu.com" },
      { name: "Gmail", url: "https://mail.google.com" },
      { name: "B站", url: "https://www.bilibili.com" },
      { name: "掘金", url: "https://juejin.cn" },
      { name: "邮箱", url: "https://mail.163.com" },
      { name: "地图", url: "https://maps.google.com" },
      { name: "翻译", url: "https://translate.google.com" },
    ];

    const tools = {
      list: () => {
        try {
          const raw = localStorage.getItem(TOOLS_KEY);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) return Promise.resolve(list);
          }
        } catch (e) { /* ignore */ }
        try {
          localStorage.setItem(TOOLS_KEY, JSON.stringify(DEFAULT_TOOLS));
        } catch (e) { /* ignore */ }
        return Promise.resolve(DEFAULT_TOOLS.slice());
      },
      add: (item) =>
        tools.list().then((list) => {
          if (!item || !item.name || !item.url) return list;
          list.push({ name: item.name, url: item.url });
          try {
            localStorage.setItem(TOOLS_KEY, JSON.stringify(list));
          } catch (e) { /* ignore */ }
          return list;
        }),
      remove: (name) =>
        tools.list().then((list) => {
          const next = list.filter((it) => it.name !== name);
          try {
            localStorage.setItem(TOOLS_KEY, JSON.stringify(next));
          } catch (e) { /* ignore */ }
          return next;
        }),
    };

    return { tools };
  })();
  ```

- [ ] **步骤 2：新建 `tools.js`（widget 模块，读写走 $widgetStore）**

  ```js
  (function () {
    if (typeof WidgetRegistry === "undefined") return;
    const FAVICON = "https://www.google.com/s2/favicons?domain=";

    const faviconOf = (url) => {
      let host = "";
      try {
        host = new URL(url).hostname;
      } catch (e) { /* ignore */ }
      return host ? FAVICON + host : "";
    };

    const render = (slot) => {
      $widgetStore.tools.list().then((items) => {
        slot.innerHTML = `
          <div class="widget-head">🧭 常用工具</div>
          <div class="tools-grid">
            ${items
              .map(
                (it, i) => `<a class="tools-item" href="${it.url}" target="_blank" rel="noopener" data-i="${i}">
                  <img class="tools-icon" src="${faviconOf(it.url)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
                  <span class="tools-name">${it.name}</span>
                </a>`
              )
              .join("")}
          </div>`;
      });
    };

    WidgetRegistry.register({
      id: "tools",
      title: "工具组",
      icon: "🧭",
      zones: ["left"],
      render,
      refresh: render,
    });
  })();
  ```

- [ ] **步骤 3：注册脚本 + `widgets.css` 追加 tools 样式**

  `index.html` 在 `registry.js` 之后追加 **store.js（必须先于 tools.js）与 tools.js**（clock/todo/quote 的 script 标签已在 M5-1/M5-2/M5-3 各自追加，勿重复添加）：

  ```html
  <!-- widgets -->
  <script src="./src/js/widgets/store.js"></script>
  <script src="./src/js/widgets/tools.js"></script>
  ```

  `widgets.css` 追加：

  ```css
  /* 工具组 */
  .tools-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; padding: 0.6rem 0.75rem; }
  .tools-item { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; padding: 0.4rem 0.2rem; border-radius: 8px; text-decoration: none; transition: background-color 140ms ease; }
  .tools-item:hover { background: var(--surface-raised); }
  .tools-icon { width: 1.4rem; height: 1.4rem; border-radius: 4px; }
  .tools-name { font-size: 0.68rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
  ```

- [ ] **步骤 4：Reload 验证**

  layout `{"tools":{"zone":"left","enabled":true}}` → 左侧 2 行×4 工具图标；点击新标签打开站点；设置"组件"Tab 增删工具 → `WidgetRegistry.refresh('tools')` 后左侧同步（增删经 `$widgetStore` 同一数据源）。

- [ ] **步骤 5：提交**

  ```bash
  git add tab/src/js/widgets/store.js tab/src/js/widgets/tools.js tab/src/css/widgets.css tab/index.html
  git commit -m "feat(M5): $widgetStore 边界 + 快捷工具组 widget"
  ```

## Task M5-5：多引擎快速搜索 chips widget

**文件：** `tab/src/js/widgets/engines.js`（新建）、`tab/src/css/widgets.css`、`tab/index.html`

- [ ] **步骤 1：新建 `engines.js`（复用 `$searchEles.setEngine`）**

  ```js
  (function () {
    if (typeof WidgetRegistry === "undefined") return;
    const ENGINES = [
      { id: "baidu", label: "百度", icon: "icon-baidu" },
      { id: "google", label: "Google", icon: "icon-google" },
      { id: "bing", label: "Bing", icon: "icon-bing" },
    ];

    const render = (slot) => {
      const current = localStorage.getItem("engine") || "baidu";
      slot.innerHTML = `<div class="engine-chips">
        ${ENGINES.map(
          (e) => `<button class="engine-chip${e.id === current ? " is-active" : ""}" data-engine="${e.id}">
            <span class="${e.icon}"></span>${e.label}</button>`
        ).join("")}
      </div>`;
      slot.querySelectorAll(".engine-chip").forEach((chip) =>
        chip.addEventListener("click", () => {
          if (typeof $searchEles !== "undefined" && $searchEles.setEngine) {
            $searchEles.setEngine(chip.dataset.engine);
          }
          render(slot);
          const input = document.getElementById("user-content");
          if (input) input.focus();
        })
      );
    };

    WidgetRegistry.register({
      id: "engines",
      title: "引擎",
      icon: "🔍",
      zones: ["hero"],
      render,
      refresh: render,
    });
  })();
  ```

- [ ] **步骤 2：`widgets.css` 追加 chips 样式**

  ```css
  /* 引擎 chips */
  .engine-chips { display: inline-flex; gap: 0.45rem; }
  .engine-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.75rem;
    background: var(--glass-bg-strong);
    border: 1.5px solid var(--border-subtle);
    border-radius: var(--radius-full);
    color: var(--text-secondary);
    font-size: 0.8rem;
    cursor: pointer;
    transition: background-color 140ms ease, color 140ms ease, border-color 140ms ease;
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }
  .engine-chip:hover { color: var(--text); border-color: var(--primary); }
  .engine-chip.is-active { background: var(--primary); color: #fff; border-color: var(--primary); }
  ```

- [ ] **步骤 3：注册脚本 + Reload 验证**

  `index.html` registry 后追加 engines.js。默认 layout 中 engines 落在 `hero`。Reload → Hero 搜索框下方出现 3 个 chips，当前引擎高亮；点击其它 chip → 高亮切换 + 搜索框引擎图标同步 + `localStorage.engine` 更新。

- [ ] **步骤 4：提交**

  ```bash
  git add tab/src/js/widgets/engines.js tab/src/css/widgets.css tab/index.html
  git commit -m "feat(M5): 多引擎快速搜索 chips widget"
  ```

## Task M5-6：默认布局落盘 + 小组件整体验收

**文件：** `tab/src/js/widgets/registry.js`（默认 zones 已含：clock→topbar、todo→left、quote→left、tools→left、engines→hero——检查 registry `defaultLayout` 行为）

- [ ] **步骤 1：确认默认布局**

  由于 M5 各 widget 均在脚本加载时注册，registry 的 `defaultLayout()` 会在**首次**没有 layout 时写入默认（各组件 enabled，位置 = `zones[0]`）。核对 zones[0]：
  - clock：`["topbar","hero"]` → **topbar**（规格默认 topbar）
  - todo：`["left"]` → left
  - quote：`["left"]` → left
  - tools：`["left"]` → left
  - engines：`["hero"]` → hero
  若某 widget zones 顺序需改（如 clock 默认 hero），改其 `zones` 数组首位即可。

- [ ] **步骤 2：全新配置验证**

  清 `localStorage` 的 `ywr-widget-layout` 后 Reload：默认布局自动生成（`clock` topbar、`todo/quote/tools` left、`engines` hero），五个组件全部可见可交互。

- [ ] **步骤 3：设置面板联动验证**

  设置 → 布局 Tab：五个组件各带开关 + 位置下拉（topbar/hero/left/off 按组件可选）；关闭 clock → 顶栏问候消失；engines 切 off → chips 消失；全部即时生效并持久化（刷新保持）。

- [ ] **步骤 4：提交**

  ```bash
  git add -A
  git commit -m "feat(M5): 五小组件默认布局与设置联动验收" --allow-empty
  ```

---

# M6：动效打磨、回归测试、数据迁移验证

## Task M6-1：入场动效 + reduced-motion 降级

**文件：** `tab/src/css/hero.css`、`tab/src/css/widgets.css`、`tab/src/css/base.css`

- [ ] **步骤 1：Hero 与组件一次性入场 fadeUp**

  在 `hero.css` 追加：

  ```css
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .shell-hero { animation: fadeUp var(--dur-med) var(--ease-out) both; }
  .shell-workbench .widget { animation: fadeUp var(--dur-med) var(--ease-out) both; }
  ```

- [ ] **步骤 2：reduced-motion 降级**

  在 `base.css` 末尾追加：

  ```css
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

- [ ] **步骤 3：Reload 验证**

  新标签页刷新 → Hero/组件轻微上浮淡入一次；系统开"减弱动态效果"后无位移动画（颜色过渡仍在可接受范围）。

- [ ] **步骤 4：提交**

  ```bash
  git add tab/src/css/hero.css tab/src/css/widgets.css css/base.css
  git commit -m "feat(M6): 入场动效 + prefers-reduced-motion 降级"
  ```

## Task M6-2：五项功能 + 六里程碑整体回归

**验收清单（全过即完成）：**

- [ ] **步骤 1：功能回归**
  - 主题切换 6 套正常；设置面板 4 Tab 可操作；右栏折叠/展开；搜索联想/回车/引擎切换（含 chips）；屏保进入退出。
- [ ] **步骤 2：壁纸引擎**
  - 本地（压缩/超限提示/删除回退）、渐变（预设 12 + 随机）、在线（Picsum/Bing/断网降级）、收藏/取消、每日开关与 alarm 注册/清除、透明度/模糊 debounce 持久化、`.has-wallpaper` 毛玻璃生效。
- [ ] **步骤 3：小组件**
  - clock/todo/quote/tools/engines 各显其能；布局 Tab 开关/位置即时生效并持久化；todo 增删勾清完成。
- [ ] **步骤 4：数据迁移与升级**
  - IndexedDB v2 四个 store；旧 collections/links 完好；旧 `is-aside-fold` 已迁移到 `ywr-layout-right-fold`；旧 `backgroundImage` 迁入 wallpaper library；`ywr-extension-settings` 不再含 backgroundImage。
- [ ] **步骤 5：控制台无错误**

  全流程操作后 Console 无 uncaught error、无 `TypeError`。

- [ ] **步骤 6：最终提交**

  ```bash
  git add -A
  git commit -m "feat(M6): 产品化 UI 全量回归通过" --allow-empty
  ```

---

## 自检对照表（writing-plans self-review 用）

| 规格要求 | 对应任务 |
|----------|----------|
| §1 三段式布局、`.content-area` 保留、hooks 迁顶栏 | M1-1/M1-2 |
| §1 折叠键迁移 | M1-3 |
| §2.4 IndexedDB v1→v2 两表单次迁移 + contains 守卫三处同步 | M3-1 |
| §2.3 engines 驱动 `setEngine` | M4-1 + M5-5 |
| §2.1 WidgetRegistry payload-only | M1-3/M4-2/M5 |
| §3 壁纸分层（IDB 二进制 / storage.local 配置）| M3-1/M3-3 |
| §3.3 压缩管线/超限拒绝 | M3-3 |
| §3.3 SW fetch 职责（Bing 解析/Picsum spike/URL-only）| M3-2 |
| §3.3 每日轮换 alarm 生命周期 `wallpaper:setDaily` | M3-2 |
| §3.2 生命周期不变量（默认态/删除/幂等/播种/单写者）| M3-3/M3-4/M3-5 |
| §4 Token 追加 + 毛玻璃 | M2-1/M2-2 |
| §5 设置面板 Tab 化 + owner 归属 | M4-2 |
| §6.3 M6 回归/迁移验证 | M6-1/M6-2 |





