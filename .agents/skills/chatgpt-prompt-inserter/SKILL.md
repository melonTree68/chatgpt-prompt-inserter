---
name: chatgpt-prompt-inserter
description: 维护 ChatGPT Prompt Inserter Tampermonkey 脚本时使用。涵盖脚本目标、DOM 注入、prompt 存储、输入框插入策略、Chrome/Tampermonkey 调试和常见问题。
---

# ChatGPT Prompt Inserter

## 适用范围

当任务涉及 `chatgpt-prompt-inserter.user.js` 的功能开发、调试或维护时使用本 skill。脚本内容、代码和 UI 文案保持英文；项目 skill 和协作说明保持中文。

## 当前功能

- 在 ChatGPT 网页端 composer 左侧附近注入一个浮动按钮。
- 点击按钮打开 compact prompt picker；picker 中每条 prompt 可单击插入到 composer，并额外追加一个空行，不发送消息。
- picker 左上角 `+` 打开主面板。
- 主面板只管理 prompt，支持 Add、Edit、Delete，不提供 Insert。
- prompt 初始列表为空，由用户通过主面板添加。
- 删除无需二次确认。

## 数据与文件

- 主脚本：`chatgpt-prompt-inserter.user.js`。
- Tampermonkey metadata 匹配：
  - `https://chatgpt.com/*`
  - `https://chat.openai.com/*`
- 存储使用 `GM_getValue` / `GM_setValue`。
- 存储 key：`chatgptPromptInserter.prompts`。
- prompt 数据结构：`{ id, name, content, createdAt, updatedAt }[]`。

## DOM 与输入策略

- composer 查找优先级包括 `#prompt-textarea`、`textarea[data-testid='prompt-textarea']`、含 Message placeholder 的 textarea、`contenteditable` 和 `div.ProseMirror[contenteditable='true']`。
- 浮动按钮使用 composer 或其最近 `form` 的可见矩形定位；页面变化通过 `MutationObserver`、scroll、resize 重新定位。
- textarea 使用 `setRangeText()` 插入并派发 `input` / `change`。
- contenteditable 优先派发带 `text/plain` 的 synthetic paste，再回退到 `document.execCommand("insertText")`，最后回退到 Range 文本节点插入。
- 插入文本固定为 `prompt.content + "\n\n"`，让光标停在 prompt 后的新空行。

## 调试流程

- 修改后先运行语法检查：

```bash
/Users/zhijiechen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check chatgpt-prompt-inserter.user.js
```

- 真实页面调试使用 Chrome + Tampermonkey：
  - 安装或更新 userscript。
  - 打开 ChatGPT 页面，确认按钮出现、picker 可打开、主面板可管理 prompt。
  - 验证从 picker 插入 prompt 后没有自动发送消息。
  - 验证刷新页面后 prompt 仍然存在。

## Common Issues

- **按钮不出现**：先检查 ChatGPT 是否改了 composer DOM；更新 `findComposer()` 的 selector，并确认元素可见矩形不为 0。
- **插入后 React 状态不同步**：优先检查是否触发了 `input` 事件；对 ProseMirror 类 composer，保留 paste 优先、`execCommand` 回退的策略。
- **主面板误提供插入能力**：主面板条目只能有 `Edit` 和 `Delete`，`Insert` 只能存在于 compact picker。
- **Tampermonkey 存储不可用**：确认 metadata 中保留 `@grant GM_getValue` 和 `@grant GM_setValue`。
- **页面导航后按钮位置错误**：确认 `MutationObserver`、scroll、resize 仍调用 `updateButtonPosition()`。
