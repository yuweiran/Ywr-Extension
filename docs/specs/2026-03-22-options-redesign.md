# Options 页设置补全 — 设计规格

> 日期：2026-03-22
> 方案：A — 精简重建（移除空壳，仅保留 Profile + 数据管理）

---

## 1. 概述

将 Options 页从四栏空壳（Theme / Custom / Opacity / Profile）精简为两个功能区：

- **Profile**：头像上传 + 个性签名，存储到 `chrome.storage.sync`，同步到新标签页 `document.title`
- **数据管理**：导出 / 导入 IndexedDB 中的全部集合和链接

Theme、Custom、Opacity 已在新标签页 SettingsManager / ThemeSwitcher 中实现，Options 页不再重复。

---

## 2. 文件结构变动

| 操作 | 文件 | 说明 |
|------|------|------|
| 重写 | `options/index.html` | 移除四栏侧边栏，改为两区卡片布局 |
| 重写 | `options/load.js` | 初始化 Profile 表单 + 数据导入导出逻辑 |
| 删除 | `options/src/js/declare/*` | 8 个空壳 declare/execute 文件不再需要 |
| 删除 | `options/src/js/execute/*` | 同上 |
| 重写 | `options/src/css/profile.css` | Profile + 数据管理样式 |
| 删除 | `options/src/css/custom.css` | 不再需要 |
| 删除 | `options/src/css/theme.css` | 不再需要 |
| 保留 | `options/src/css/index.css` | 页面基础布局样式 |
| 修改 | `tab/src/js/load.js` | 监听 `profileChanged` 消息，更新 `document.title` |
| 修改 | `service-worker/association.js` | 新增 `data:export`、`data:import`、`profileChanged` 消息处理 |

---

## 3. 存储方案

```
chrome.storage.sync
├── profile_signature  : string    // 个签文本，≤100 字符
└── profile_avatar     : string    // base64 Data URL
                                   // 头像压缩至 64×64 JPEG quality=0.6（约 2-4KB）
                                   // 在 chrome.storage.sync 单 key 8KB 限制内
```

选择 `chrome.storage.sync` 的理由：
- 数据量极小，在 sync 配额内
- 跨设备同步
- 与 `installed.js` 现有 sync 用法一致

---

## 4. 数据流

### Profile 保存

```
Options 页「保存 Profile」
  → chrome.storage.sync.set({ profile_avatar, profile_signature })
  → chrome.runtime.sendMessage({ type: "profileChanged" })
  → Service Worker 广播到所有 tab
  → 新标签页监听 → document.title = signature || "新标签页"
```

### 数据导出

```
Options 页「导出数据」
  → sendMessage({ type: "data:export" })
  → SW 从 IndexedDB 读取全部 collections + links
  → 返回 JSON
  → 前端 Blob + URL.createObjectURL + <a download> 触发下载
  → 文件名: ywr-backup-YYYY-MM-DD.json
```

### 数据导入

```
Options 页「导入数据」
  → <input type="file" accept=".json"> 选择文件
  → FileReader 读取 → 校验 JSON（必须含 collections + links 数组）
  → confirm("导入将覆盖现有数据，是否继续？")
  → sendMessage({ type: "data:import", data })
  → SW 清空旧表 → 写入新数据
  → 广播 dataChanged → 所有标签页刷新
  → 成功提示
```

---

## 5. 页面布局

单页垂直布局，无侧边栏，居中卡片式：

```
┌─────────────────────────────────────┐
│  Ywr Extension 设置                  │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │  📷 个人资料                    │  │
│  │  ┌──────┐                     │  │
│  │  │ 64×64│  ← 圆形预览         │  │
│  │  └──────┘                     │  │
│  │  [选择图片]  [移除]            │  │
│  │                               │  │
│  │  个性签名                      │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ placeholder: 写点什么…   │  │  │
│  │  └─────────────────────────┘  │  │
│  │              [保存 Profile]    │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  📦 数据管理                    │  │
│  │  [导出数据]  导出全部集合和链接  │  │
│  │  [导入数据]  从 JSON 文件恢复   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 6. 交互行为

### Profile

1. **头像上传**：点击「选择图片」→ `<input type="file" accept="image/*">` → Canvas 压缩至 64×64 JPEG（quality=0.6）→ 圆形预览
2. **移除头像**：清空预览，保存时写入空字符串
3. **保存**：点击「保存 Profile」→ `chrome.storage.sync.set(...)` → 成功提示 → `sendMessage({ type: "profileChanged" })`；若 `chrome.runtime.lastError` 则提示"保存失败，请重试"
4. **页面加载**：`chrome.storage.sync.get(...)` → 回填表单

### 数据管理

1. **导出**：触发 SW `data:export` → 成功则下载 JSON 文件；若 DB 读取失败则返回 `{ success: false, error }` → 前端提示"导出失败"
2. **导入**：选择文件 → 校验 → confirm 确认 → SW `data:import` → 广播刷新 → 成功提示
3. **dataChanged 响应**：新标签页 `load.js` 已有 `chrome.runtime.onMessage` 监听 `dataChanged` → 调用 `$collections.renderCollections()` 刷新页面（已在 Popup 阶段实现）

---

## 7. SW 新增消息类型

| type | 方向 | 说明 |
|------|------|------|
| `profileChanged` | Options → SW → 全部 tab | 通知 Profile 已更新 |
| `data:export` | Options → SW → Options | 返回 `{ collections, links }` |
| `data:import` | Options → SW → Options | 接收数据写入 DB，广播 `dataChanged` |

---

## 8. 新标签页联动

- 监听 `profileChanged` 消息 → 读取 `chrome.storage.sync` → `document.title = signature || "新标签页"`
- 页面初始加载时也从 `chrome.storage.sync` 读取签名设置 `document.title`
- **广播方式**：SW 收到 `profileChanged` 后使用 `chrome.tabs.query({})` + `chrome.tabs.sendMessage()` 逐一发送给所有 tab（与现有 `broadcastDataChanged` 保持一致）

---

## 9. IndexedModel 扩展

需要为 `service-worker/db.js` 中的 `IndexedModel` 添加 `clearAll()` 方法用于导入前清空旧数据：

```javascript
clearAll() {
  // objectStore.clear() 一次性清空整张表
}
```

导入流程在**单个 readwrite 事务**中执行：先 `objectStore.clear()` collections 和 links 两张表，再逐条 `put()` 写入新数据。单事务保证原子性——若任一步失败，整个事务自动回滚，数据不变。

---

## 10. 消息响应格式

所有 SW 消息统一响应格式：

```javascript
// 成功
{ success: true, data: ... }

// 失败
{ success: false, error: "错误描述" }
```

适用于 `data:export`、`data:import`。`profileChanged` 为广播型，无需回执。

---

## 11. 错误处理与边界情况

### 头像压缩

- Canvas 压缩后检查 base64 字符串长度，若 > 10666 字符（对应 ~8KB 二进制，sync 单 key 上限）则降低 quality 重试（0.4 → 0.2）
- 若仍超限，提示用户选择更小的图片

### 签名长度

- `<input maxlength="100">` 前端限制
- 保存前再次校验 `signature.length <= 100`

### 导入校验

- JSON 解析失败 → 提示"文件格式错误"
- 缺少 `collections` 或 `links` 字段 → 提示"数据结构不完整"
- 每条 collection 必须含 `id`、`name`；每条 link 必须含 `id`、`name`、`url`、`collection` → 不符合则过滤跳过并提示跳过数量
- DB 写入失败 → 事务回滚，提示"导入失败，数据未变更"

### 导出格式

```json
{
  "version": 1,
  "exportDate": "2026-03-22T10:00:00.000Z",
  "collections": [...],
  "links": [...]
}
```

导入时若 `version` 缺失视为 v1 兼容处理。
