# 后台模块知识库

## 概览
这是扩展的 MV3 后台层，入口是 `service-worker/index.js`。其组织方式是“入口文件只负责导入，子文件各自注册监听器”。

## 结构
```text
knowledge-base/service-worker/AGENTS.md  # 当前文档，对应源码 service-worker/

service-worker/
|- index.js         # 统一导入所有后台子模块
|- installed.js     # 安装时初始化默认数据
|- association.js   # 消息通信
|- alarms.js        # 定时任务入口
|- tabs.js          # 标签页事件监听
`- background.js    # 预留文件，当前为空
```

## 去哪里看
任务：调整安装时默认值
位置：service-worker/installed.js

任务：处理页面或内容脚本发送的消息
位置：service-worker/association.js

任务：监听标签页创建、关闭、移动等事件
位置：service-worker/tabs.js

任务：新增后台能力
位置：新建独立模块，并在 service-worker/index.js 中导入

## 约定
- 后台层是本仓库里少数真正使用 ES Module 的区域。
- 每个模块应在顶层直接注册 Chrome 监听器，不依赖外部手动调用。
- `index.js` 只做汇总导入，不承载具体业务。

## 本目录反模式
- 不要把所有后台逻辑堆进 `index.js`。
- 不要把 UI 细节塞进后台模块，后台应保持事件驱动和 Chrome API 导向。
- 不要假设 `background.js` 已经有业务逻辑，它目前只是占位点。

## 备注
- 当前后台逻辑还比较轻，但它决定了扩展生命周期和跨运行面的基础通信边界。