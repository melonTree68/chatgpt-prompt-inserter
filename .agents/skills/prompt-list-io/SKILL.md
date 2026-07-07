---
name: prompt-list-io
description: 维护 ChatGPT Prompt Inserter 的 prompt list 导入导出功能时使用。涵盖 JSON 数组格式、导入合并策略、重复项处理、时间字段策略、UI 入口和验证流程；不承载 prompt 插入策略。
---

# Prompt List IO

## 适用范围

当任务涉及 `chatgpt-prompt-inserter.user.js` 中 prompt list 的 Import / Export 功能时使用本 skill。脚本内容、代码和 UI 文案保持英文；项目 skill 和协作说明保持中文。

## 功能边界

- 本 skill 只记录 prompt list 导入导出功能。
- 不记录 ChatGPT composer 查找、DOM 插入、picker 插入行为；这些属于 `prompt-insertion`。
- 不记录全局项目故事和进展索引；这些属于 `project-progress` 和 `project-story`。

## 当前功能

- Prompt Manager header 提供 `Import` 和 `Export` 按钮。
- `Export` 将当前 prompt list 下载为 `chatgpt-prompts.json`。
- `Import` 使用隐藏 file input 选择 JSON 文件，并静默合并有效 prompt。
- 导入成功后刷新 picker 和 manager；导入完成不弹窗。
- 文件读取、JSON 解析或格式错误时使用 `window.alert()` 提示失败。
- userscript metadata 使用 `@icon https://chatgpt.com/favicon.ico`。

## 数据格式

- 导出格式是裸 JSON 数组，不使用 wrapper object。
- 数组元素结构沿用 prompt 存储结构：

```json
[
  {
    "id": "prompt-id",
    "name": "Prompt name",
    "content": "Prompt content",
    "createdAt": "2026-07-07T00:00:00.000Z",
    "updatedAt": "2026-07-07T00:00:00.000Z"
  }
]
```

## 导入策略

- 只接受 JSON 数组；非数组直接失败。
- 导入模式固定为 merge-only，不提供 replace。
- 每个导入项必须是 object，且 `name` 和 `content` 非空。
- `name` 使用 `trim()`；`content` 使用 `trimEnd()` 保存，但判空和去重使用 `trim()`。
- 每个导入项都重新生成 `id`，避免与本地 prompt 冲突。
- `createdAt` 和 `updatedAt` 若能被 `Date.parse()` 识别则保留原字符串，否则使用当前时间。
- 重复项定义为 `name.trim()` 和 `content.trim()` 同时相同；重复项会被跳过。
- 去重范围包括已有 prompt 和同一个导入文件内前面已接受的 prompt。

## 维护注意

- 导出使用 `Blob`、`URL.createObjectURL()` 和临时 `<a download>`，不新增 Tampermonkey grant。
- 导入读取文件优先保持浏览器原生 API，避免引入依赖。
- 导入成功路径保持静默；不要添加成功 alert，除非产品设计重新确认。
- 修改后先运行语法检查：

```bash
/Users/zhijiechen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check chatgpt-prompt-inserter.user.js
```

## Common Issues

- **重复导入后列表膨胀**：检查去重 key 是否仍使用 trimmed name + trimmed content，并确认导入文件内也加入同一个 `seen` 集合。
- **导入覆盖已有 prompt**：当前设计是 merge-only，导入项必须生成新 id，不允许直接复用文件里的 id 更新本地数据。
- **导入无提示但没有变化**：可能是文件里所有条目无效或都被判定为重复；当前成功路径按设计静默。
