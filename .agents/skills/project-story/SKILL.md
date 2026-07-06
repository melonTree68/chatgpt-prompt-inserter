---
name: project-story
description: 记录 prompt-dock 项目的逻辑发展顺序和故事。用于按依赖与动机顺序理解项目，而不是查看具体实现路径。
---

# Project Story

## 1. 仓库基础

- 动机：项目需要先具备干净的版本控制基础，才能稳定迭代后续脚本与知识归档。
- 已实现功能：维护 `.gitignore`，忽略本地系统噪声文件。
- 对应 skill：`project-progress`。

## 2. ChatGPT Prompt Inserter

- 动机：用户经常复用 prompt，需要在 ChatGPT 网页端快速填入输入框，同时保留人工检查和发送控制。
- 已实现功能：Tampermonkey 脚本在 ChatGPT composer 左侧提供浮动入口；compact picker 负责插入 prompt；主面板负责 Add、Edit、Delete 管理；prompt 本地持久化保存。
- 对应 skill：`chatgpt-prompt-inserter`。

## 3. 项目知识管理

- 动机：脚本依赖 ChatGPT 页面 DOM 和 Tampermonkey 环境，后续维护需要记录选择器、插入策略和常见问题。
- 已实现功能：项目本地 skill 记录当前功能、调试流程、常见问题和项目进展。
- 对应 skill：`project-progress`、`chatgpt-prompt-inserter`。
