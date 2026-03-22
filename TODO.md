# Ywr-Extension TODO

> 生成时间：2026-03-22  
> 基于项目知识库分析整理

---

## 一、缺失的必要功能模块

- [ ] **搜索联想词 / 搜索建议**  
  `execute/search.js` 中 input 事件的联想词逻辑已被注释，`association.js` 后台消息通信为空壳。恢复搜索联想功能，防抖请求搜索建议，在搜索框下方显示联想词下拉，支持键盘上下键选择 + Enter 确认。

- [ ] **快捷键 / 键盘导航系统**  
  `manifest.json` 仅定义 `Ctrl+B` 打开 popup，新标签页内无键盘快捷操作。建议：`/` 或 `Ctrl+K` 聚焦搜索框、`Ctrl+N` 新建集合、`Esc` 关闭弹窗、方向键导航集合和链接。

- [ ] **集合/链接本地搜索过滤**  
  目前只有外部搜索引擎搜索，无法在已有集合和链接中搜索。增加本地搜索入口，按集合名称、链接名称、URL、备注模糊匹配并高亮命中项。

- [ ] **Content Script 注册**  
  `js/content.js` 实现了阅读时间估算，但 `manifest.json` 中没有 `content_scripts` 声明，脚本不会自动注入。需添加 manifest 配置或通过 `chrome.scripting.registerContentScripts` 动态注册。

- [ ] **Popup 弹窗功能改造**  
  当前 popup 只是教程级 demo。改造为常用快捷入口：快速添加当前页面到集合、搜索已有链接、显示最近添加的链接、一键打开设置页/新标签页。

- [ ] **数据自动备份**  
  导入/导出仅通过 JSON 文件手动操作，没有自动备份。利用 `chrome.alarms`（`alarms.js` 当前为空）定期将 IndexedDB 数据快照到 `chrome.storage.local`。

- [ ] **链接图标自动抓取**  
  手动添加链接时无自动获取 favicon，仅侧栏拖拽的标签自动带图标。新建链接时根据 URL 自动拼接 favicon 服务地址获取图标。

- [ ] **链接有效性检测**  
  没有链接状态检测逻辑。后台通过 `chrome.alarms` 定期 HEAD 请求检测链接可访问性，标记失效链接并在 UI 给出视觉提示。

- [ ] **Options 页设置补全**  
  `options/index.html` 的 Profile 区域只是占位文字"头像，个签"，Opacity 也只有一行文字。实现完整设置或合并到 SettingsManager。

---

## 二、现有模块优化建议

- [x] **搜索引擎清理**  
  已移除 360 和搜狗，保留 Baidu、Google、Bing。

- [ ] **集合渲染性能优化** `高优先级`  
  `renderCollections()` 每次操作都全量重绘 innerHTML 并重建所有 Sortable 实例。引入差量更新，缓存 Sortable 实例，排序操作时不重绘。

- [ ] **IndexedDB deleteWithCondition 性能** `高优先级`  
  `deleteWithCondition` 采用游标逐条扫描。为 `links` 表的 `collection` 字段创建索引，使用 `IDBIndex.openCursor(IDBKeyRange.only(value))` 精确范围删除。

- [ ] **collection/link updateOrder 调用路径修复** `高优先级`  
  `apis/index.js` 中 `updateOrder` 调用 `$indexedDB.$tables.update(r)`，`$tables` 上没有 `update` 方法，应为 `$tables.collections.update(r)` / `$tables.links.update(r)`。

- [ ] **标签/历史列表更新防抖** `高优先级`  
  `load.js` 在 `onUpdated`/`onRemoved`/`onMoved` 上都绑定 `updateTabsList()`，高频操作导致大量 Chrome API 调用。外层加 `debounce(300ms)` 合并触发。

- [ ] **背景图片存储策略** `高优先级`  
  SettingsManager 将 base64 全量存入 localStorage，大图可能接近 5MB 上限。改用 IndexedDB 或 `chrome.storage.local` 存储，或上传时压缩/缩放图片。

- [ ] **通知组件 z-index 管控**  
  `notification.js` 通知没有 z-index 管理，可能被设置面板或屏保层遮挡。统一 z-index 分层。

- [ ] **Modal 表单体验提升**  
  `form.js` 中 modal 无焦点管理（Tab 可跑到背后页面），无动画过渡。打开时 focus 第一个输入框，支持 Esc 关闭，添加淡入淡出动画。

- [ ] **拖拽体验优化**  
  从侧栏标签拖入集合后触发全量 `renderCollections()`，造成视觉闪烁。拖入后仅在目标位置插入 DOM 节点，异步写数据库，不重绘。

- [ ] **国际化（i18n）**  
  UI 文案混用中英文。使用 `chrome.i18n` 或至少统一语言方案，将字符串集中管理。

---

## 三、可添加的增值模块

- [ ] **Todo/任务管理** `中等难度`  
  HTML 中已注释 `btn-tool-task`，按钮坑位已留好，可实现简易待办。

- [ ] **置顶/收藏链接** `低难度`  
  在集合外增加全局"钉选"区域，放最常用链接。

- [ ] **时钟/日期组件** `低难度`  
  HTML 中已注释 `<div id="clock">`，可实现时钟 widget。

- [ ] **链接拖入排序动画** `低难度`  
  当前拖拽无视觉反馈（ghost），可加高亮放置区。

- [ ] **右键上下文菜单** `中等难度`  
  对链接/集合提供右键菜单（编辑/删除/复制 URL/在新窗口打开）。

- [ ] **标签分组管理** `中等难度`  
  联动 Chrome Tab Groups API，给侧栏标签分组上色。

- [ ] **历史数量可配置** `低难度`  
  当前固定 10 条，改为用户可配置。
