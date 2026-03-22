# Popup 弹窗功能改造设计

> 日期：2026-03-22  
> 状态：已批准

---

## 决策记录

| 维度 | 选项 | 决策 |
|---|---|---|
| 功能范围 | (A) 全选 | 快速收藏 + 搜索链接 + 最近添加 + 快捷入口 |
| 收藏交互 | (C) 极简一步 | 点击集合名即收藏当前页 |
| 布局方式 | (A) 单页纵向堆叠 | 搜索 → 收藏 → 最近 → 快捷按钮，整体可滚动 |
| 技术方案 | (A) Popup 独立全栈 | Popup 通过 sendMessage 与 SW 通信，SW 操作 IndexedDB |

---

## 1. 架构与数据流

### 通信架构

```
popup/index.js  ──sendMessage──►  service-worker/association.js  ──IndexedDB──►  initDB
                ◄──sendResponse──
```

Popup 通过 `chrome.runtime.sendMessage` 发送请求，Service Worker 的 `association.js` 统一处理消息并操作 IndexedDB，通过 `sendResponse` 返回结果。

### 消息协议

| type | 方向 | 用途 | 请求参数 | 返回 |
|---|---|---|---|---|
| `popup:getCollections` | popup → SW | 获取集合列表 | 无 | `{ collections: [{id, name, order}...] }` |
| `popup:addLink` | popup → SW | 快速收藏当前页到指定集合 | `{ collectionId, name, url, icon }` | `{ success: true }` |
| `popup:searchLinks` | popup → SW | 按关键词搜索链接 | `{ keyword }` | `{ links: [{name, url, icon, collectionName}...] }` |
| `popup:getRecentLinks` | popup → SW | 获取最近添加的链接 | `{ limit: 6 }` | `{ links: [{name, url, icon}...] }` |

### Service Worker IndexedDB 初始化

在 `service-worker/db.js` 中复用现有 `IndexedModel` 类和 `$indexedDBModel` 模型定义。首次收到 `popup:*` 消息时懒初始化数据库连接。

### 关键设计决策

- **懒初始化**：不在 SW import 时立即打开数据库，首次收到 `popup:*` 消息时才初始化
- **消息前缀**：所有 popup 消息用 `popup:` 前缀，与现有 `suggest` 类型区分
- **无状态**：popup 每次打开都重新请求数据，关闭后无残留

---

## 2. 文件变更清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `service-worker/db.js` | **新建** | IndexedDB 懒初始化模块（复用 IndexedModel 类和模型定义） |
| `service-worker/association.js` | 修改 | 新增 `popup:*` 四种消息处理器，调用 db.js |
| `service-worker/index.js` | 修改 | 添加 `import "./db.js"` |
| `popup/index.html` | **重写** | 新布局：搜索栏 → 集合列表 → 最近链接 → 底部快捷按钮 |
| `popup/index.css` | **重写** | 配套样式，复用 `css/variable.css` 主题变量 |
| `popup/index.js` | **重写** | 全部逻辑：初始化加载、搜索、收藏、快捷入口 |

---

## 3. Popup 页面布局

```
┌─────────────────────────────┐
│  🔍 [搜索链接...]           │  ← 搜索输入框
├─────────────────────────────┤
│  ⭐ 快速收藏                 │  ← 标题
│  ┌───────┐ ┌───────┐       │
│  │ 集合A  │ │ 集合B  │ ...  │  ← 集合按钮列表
│  └───────┘ └───────┘       │
├─────────────────────────────┤
│  🕐 最近添加                 │  ← 标题
│  favicon  链接名称      →   │  ← 链接条目
│  favicon  链接名称      →   │
│  ...（最多6条）              │
├─────────────────────────────┤
│  [📄 新标签页] [⚙️ 设置]    │  ← 底部快捷按钮栏
└─────────────────────────────┘
```

**尺寸**：宽 `320px`，高自适应（`min-height: 400px`，`max-height: 540px`），内容超出滚动。

---

## 4. 交互行为

### 搜索

- 输入框输入时 300ms 防抖 → 发送 `popup:searchLinks`
- 搜索时隐藏"快速收藏"和"最近添加"区域，显示搜索结果列表
- 清空搜索框 → 恢复默认视图
- 搜索结果每条：favicon + 链接名 + 所属集合名（灰色标签），点击新窗口打开

### 快速收藏

- Popup 打开时发送 `popup:getCollections` 获取集合列表，渲染为横向可换行的按钮
- 同时用 `chrome.tabs.query({active:true, currentWindow:true})` 获取当前标签页信息
- 点击集合按钮 → 发送 `popup:addLink`（collectionId、tab.title、tab.url、tab.favIconUrl）→ 按钮短暂显示 ✓ 反馈 → 1s 后恢复
- 无集合时显示"暂无集合，请先在新标签页创建"

### 最近添加

- Popup 打开时发送 `popup:getRecentLinks`（limit: 6）→ 按 id 降序
- 每条显示 favicon + 链接名，点击 `chrome.tabs.create({url})` 打开
- 无链接时显示"还没有添加过链接"

### 底部快捷按钮

- "新标签页" → `chrome.tabs.create({url: "/tab/index.html"})`
- "设置" → `chrome.runtime.openOptionsPage()`

---

## 5. 样式方案

- 引入 `css/variable.css` 复用主题色变量（`--surface`、`--text`、`--primary` 等）
- 引入 `css/base.css` 保持基础样式一致
- 集合按钮：圆角胶囊样式，`var(--surface)` 背景，hover 高亮
- 链接条目：flex 布局，favicon 16x16，溢出省略号

---

## 6. 不做的事

- 不在 popup 中编辑/删除链接或集合（保持极简）
- 不缓存数据（每次打开都请求最新）
- 不做主题切换（继承 variable.css 变量）
