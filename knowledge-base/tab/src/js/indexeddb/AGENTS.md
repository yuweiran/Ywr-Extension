# 新标签页数据层知识库

## 概览
这里是新标签页的本地持久化层，基于 IndexedDB，负责集合和链接的表结构、初始化、CRUD 封装以及表访问入口。

## 结构
```text
knowledge-base/tab/src/js/indexeddb/AGENTS.md  # 当前文档，对应源码 tab/src/js/indexeddb/

indexeddb/
|- index.js                # IndexedModel 类、数据库初始化、表实例挂载
|- models/index.model.js   # 表结构与字段定义
`- utils/index.utils.js    # 与数据库相关的辅助工具
```

## 去哪里看
任务：新增表或字段
位置：tab/src/js/indexeddb/models/index.model.js 与 index.js

任务：调整增删改查语义
位置：tab/src/js/indexeddb/index.js

任务：理解导入导出配置格式
位置：tab/src/js/apis/index.js 与本目录配合阅读

## 约定
- `$indexedDB` 初始为 `null`，只有在 `initIndexedDB()` 完成后才可用。
- 表结构由 `$indexedDBModel` 集中声明，再在 `onupgradeneeded` 时落到数据库中。
- 表实例统一挂在 `db.$tables.<name>` 上。

## 本目录反模式
- 不要假设 `$indexedDB` 是同步可用的。
- 不要只在运行时随意写字段而不更新模型定义。
- 不要忽略导入时的 order 归一化，否则集合和链接顺序会混乱。

## 备注
- 当前核心表只有 `collections` 和 `links`。
- `deleteWithCondition` 采用游标扫描实现，数据量变大后可能成为性能关注点。