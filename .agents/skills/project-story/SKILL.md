---
name: project-story
description: 记录 chatgpt-prompt-inserter 项目的逻辑发展顺序和故事。用于按依赖与动机顺序理解项目，并维护各功能独立 skill 的知识边界。
---

# Project Story

## 1. 仓库基础

- 动机：项目需要先具备干净的版本控制基础，才能稳定迭代后续脚本与知识归档。
- 已实现功能：维护 `.gitignore`，忽略本地系统噪声文件。
- 对应 skill：`project-progress`。

## 2. Prompt Insertion

- 动机：用户经常复用 prompt，需要在 ChatGPT 网页端快速填入输入框，同时保留人工检查和发送控制。
- 已实现功能：Tampermonkey 脚本在 ChatGPT composer 左侧提供浮动入口；compact picker 负责插入 prompt；主面板负责 Add、Edit、Delete 管理；prompt 本地持久化保存。
- 对应 skill：`prompt-insertion`。

## 3. 项目知识管理

- 动机：脚本依赖 ChatGPT 页面 DOM 和 Tampermonkey 环境，后续维护需要记录选择器、插入策略和常见问题。
- 已实现功能：项目本地 skill 记录当前功能、调试流程、常见问题和项目进展。
- 对应 skill：`project-progress`、`prompt-insertion`。

## 4. 功能级知识解耦

- 动机：项目将继续开发 prompt insertion 之外的功能。如果所有知识都沉淀到项目同名 skill 或全局标准 skill，后续功能会互相污染上下文，增加维护成本。
- 已实现功能：确立“一个功能对应一个 project-local skill”的规则；现有 `prompt-insertion` 只作为 prompt insertion 功能 skill；未来新增功能必须先拥有自己的功能 skill，再把全局进展索引写入 `project-progress` 和本 skill。
- 对应 skill：`project-progress`、`prompt-insertion`。
