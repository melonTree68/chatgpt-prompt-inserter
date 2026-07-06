// ==UserScript==
// @name         ChatGPT Prompt Inserter
// @namespace    https://github.com/local/chatgpt-prompt-inserter
// @version      0.1.1
// @description  Manage reusable prompts and insert them into the ChatGPT composer without sending.
// @author       Codex
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  const STORAGE_KEY = "chatgptPromptInserter.prompts";
  const ROOT_ID = "prompt-dock-root";
  const STYLE_ID = "prompt-dock-style";

  const state = {
    pickerOpen: false,
    managerOpen: false,
    editorOpen: false,
    editingId: null,
    positionUpdateFrame: null,
    prompts: [],
    root: null,
    button: null,
    picker: null,
    manager: null,
    editor: null,
  };

  function nowIso() {
    return new Date().toISOString();
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `prompt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function readPrompts() {
    const raw = GM_getValue(STORAGE_KEY, []);
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        id: String(item.id || makeId()),
        name: String(item.name || "Untitled"),
        content: String(item.content || ""),
        createdAt: String(item.createdAt || nowIso()),
        updatedAt: String(item.updatedAt || item.createdAt || nowIso()),
      }))
      .filter((item) => item.content.trim().length > 0 || item.name.trim().length > 0);
  }

  function savePrompts(prompts) {
    state.prompts = prompts;
    GM_setValue(STORAGE_KEY, prompts);
    renderPicker();
    renderManager();
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID} {
        position: relative;
        z-index: 2147483640;
        color: #202123;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #${ROOT_ID} * {
        box-sizing: border-box;
      }

      .pd-trigger {
        position: fixed;
        width: 36px;
        height: 36px;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 8px;
        background: #ffffff;
        color: #202123;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.14);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 120ms ease, transform 120ms ease, opacity 120ms ease;
      }

      .pd-trigger:hover {
        background: #f4f4f4;
        transform: translateY(-1px);
      }

      .pd-trigger svg {
        width: 19px;
        height: 19px;
      }

      .pd-panel {
        position: fixed;
        width: min(320px, calc(100vw - 24px));
        max-height: min(430px, calc(100vh - 140px));
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
        overflow: hidden;
      }

      .pd-panel-header {
        min-height: 42px;
        padding: 8px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .pd-icon-button,
      .pd-text-button,
      .pd-danger-button {
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 7px;
        background: #ffffff;
        color: #202123;
        cursor: pointer;
        font: inherit;
        transition: background 120ms ease, border-color 120ms ease;
      }

      .pd-icon-button {
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        padding: 0;
      }

      .pd-icon-button:hover,
      .pd-text-button:hover {
        background: #f3f4f6;
        border-color: rgba(0, 0, 0, 0.2);
      }

      .pd-danger-button:hover {
        background: #fff1f2;
        border-color: #fb7185;
      }

      .pd-panel-title {
        flex: 1;
        min-width: 0;
        font-size: 13px;
        font-weight: 650;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pd-list {
        padding: 6px;
        overflow: auto;
        max-height: calc(min(430px, calc(100vh - 140px)) - 43px);
      }

      .pd-empty {
        padding: 24px 14px;
        color: #6b7280;
        font-size: 13px;
        line-height: 1.35;
        text-align: center;
      }

      .pd-item {
        width: 100%;
        min-height: 46px;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: #202123;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 7px 7px 10px;
        text-align: left;
      }

      .pd-item:hover {
        background: #f3f4f6;
      }

      .pd-item-main {
        min-width: 0;
        flex: 1;
        cursor: pointer;
      }

      .pd-item-name {
        font-size: 13px;
        font-weight: 650;
        line-height: 1.25;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pd-item-preview {
        margin-top: 3px;
        color: #6b7280;
        font-size: 12px;
        line-height: 1.25;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pd-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.38);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
      }

      .pd-modal {
        width: min(720px, calc(100vw - 36px));
        max-height: min(760px, calc(100vh - 36px));
        border-radius: 8px;
        background: #ffffff;
        color: #202123;
        box-shadow: 0 28px 80px rgba(0, 0, 0, 0.32);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .pd-modal-header {
        min-height: 58px;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .pd-modal-title {
        flex: 1;
        min-width: 0;
        font-size: 16px;
        font-weight: 700;
      }

      .pd-text-button,
      .pd-danger-button {
        min-height: 32px;
        padding: 0 11px;
        font-size: 13px;
        font-weight: 600;
      }

      .pd-primary {
        border-color: #10a37f;
        background: #10a37f;
        color: #ffffff;
      }

      .pd-primary:hover {
        border-color: #0d8f70;
        background: #0d8f70;
      }

      .pd-modal-body {
        overflow: auto;
        padding: 10px 12px 14px;
      }

      .pd-manager-item {
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        padding: 11px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
        align-items: start;
      }

      .pd-manager-item + .pd-manager-item {
        margin-top: 8px;
      }

      .pd-manager-name {
        font-size: 14px;
        font-weight: 700;
        line-height: 1.3;
      }

      .pd-manager-content {
        margin-top: 5px;
        color: #4b5563;
        font-size: 13px;
        line-height: 1.4;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .pd-actions {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .pd-form {
        padding: 16px;
        display: grid;
        gap: 12px;
      }

      .pd-field {
        display: grid;
        gap: 6px;
      }

      .pd-label {
        font-size: 13px;
        font-weight: 650;
      }

      .pd-input,
      .pd-textarea {
        width: 100%;
        border: 1px solid rgba(0, 0, 0, 0.18);
        border-radius: 7px;
        background: #ffffff;
        color: #202123;
        font: inherit;
        font-size: 14px;
        line-height: 1.4;
        outline: none;
      }

      .pd-input {
        min-height: 36px;
        padding: 7px 9px;
      }

      .pd-textarea {
        min-height: 220px;
        resize: vertical;
        padding: 9px;
      }

      .pd-input:focus,
      .pd-textarea:focus {
        border-color: #10a37f;
        box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.16);
      }

      .pd-form-error {
        min-height: 18px;
        color: #b91c1c;
        font-size: 12px;
      }

      .pd-hidden {
        display: none !important;
      }

      @media (max-width: 720px) {
        .pd-trigger {
          width: 34px;
          height: 34px;
        }

        .pd-manager-item {
          grid-template-columns: 1fr;
        }

        .pd-actions {
          justify-content: flex-end;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getVisibleRect(element) {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      return null;
    }
    return rect;
  }

  function findComposer() {
    const selectors = [
      "#prompt-textarea",
      "textarea[data-testid='prompt-textarea']",
      "textarea[placeholder*='Message']",
      "div[contenteditable='true'][data-testid='prompt-textarea']",
      "div[contenteditable='true'][aria-label*='Message']",
      "div.ProseMirror[contenteditable='true']",
      "form textarea",
      "form div[contenteditable='true']",
    ];

    const candidates = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    const unique = Array.from(new Set(candidates));
    return unique.reverse().find((element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }
      if (element.closest(`#${ROOT_ID}`)) {
        return false;
      }
      return Boolean(getVisibleRect(element));
    }) || null;
  }

  function getComposerRect() {
    const composer = findComposer();
    if (!composer) {
      return null;
    }

    const form = composer.closest("form");
    const formRect = form instanceof HTMLElement ? getVisibleRect(form) : null;
    return formRect || getVisibleRect(composer);
  }

  function updateButtonPosition() {
    if (!state.button) {
      return;
    }

    const rect = getComposerRect();
    if (!rect) {
      if (!state.button.classList.contains("pd-hidden")) {
        state.button.classList.add("pd-hidden");
      }
      return;
    }

    const buttonSize = 36;
    const leftOutside = rect.left - buttonSize - 10;
    const leftInside = rect.left + 8;
    const left = leftOutside >= 8 ? leftOutside : leftInside;
    const top = Math.min(
      Math.max(rect.top + rect.height / 2 - buttonSize / 2, 8),
      window.innerHeight - buttonSize - 8,
    );

    const nextLeft = `${Math.round(left)}px`;
    const nextTop = `${Math.round(top)}px`;
    if (state.button.style.left !== nextLeft) {
      state.button.style.left = nextLeft;
    }
    if (state.button.style.top !== nextTop) {
      state.button.style.top = nextTop;
    }
    if (state.button.classList.contains("pd-hidden")) {
      state.button.classList.remove("pd-hidden");
    }

    if (state.pickerOpen) {
      positionPicker();
    }
  }

  function scheduleButtonPositionUpdate() {
    if (state.positionUpdateFrame !== null) {
      return;
    }

    state.positionUpdateFrame = window.requestAnimationFrame(() => {
      state.positionUpdateFrame = null;
      updateButtonPosition();
    });
  }

  function positionPicker() {
    if (!state.picker || !state.button) {
      return;
    }

    const buttonRect = state.button.getBoundingClientRect();
    const panelWidth = Math.min(320, window.innerWidth - 24);
    const panelHeight = Math.min(430, window.innerHeight - 140);
    const left = Math.min(
      Math.max(buttonRect.left, 12),
      window.innerWidth - panelWidth - 12,
    );
    const top = Math.min(
      Math.max(buttonRect.bottom + 8, 12),
      window.innerHeight - panelHeight - 12,
    );

    state.picker.style.left = `${Math.round(left)}px`;
    state.picker.style.top = `${Math.round(top)}px`;
  }

  function iconSvg() {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 5.75C5 4.78 5.78 4 6.75 4h10.5c.97 0 1.75.78 1.75 1.75v12.5c0 .97-.78 1.75-1.75 1.75H6.75C5.78 20 5 19.22 5 18.25V5.75Z" stroke="currentColor" stroke-width="1.7"/>
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
      </svg>
    `;
  }

  function renderRoot() {
    installStyle();
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }
    state.root = root;

    if (!state.button) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pd-trigger pd-hidden";
      button.title = "Prompt dock";
      button.setAttribute("aria-label", "Open prompt dock");
      button.innerHTML = iconSvg();
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        togglePicker();
      });
      root.appendChild(button);
      state.button = button;
    }
  }

  function renderPicker() {
    if (!state.root) {
      return;
    }

    if (!state.picker) {
      const picker = document.createElement("div");
      picker.className = "pd-panel pd-hidden";
      picker.setAttribute("role", "dialog");
      picker.setAttribute("aria-label", "Prompt picker");
      state.root.appendChild(picker);
      state.picker = picker;
    }

    const items = state.prompts.map((prompt) => `
      <div class="pd-item" data-id="${escapeHtml(prompt.id)}">
        <div class="pd-item-main" data-action="insert" title="Insert prompt">
          <div class="pd-item-name">${escapeHtml(prompt.name || "Untitled")}</div>
          <div class="pd-item-preview">${escapeHtml(prompt.content || "Empty prompt")}</div>
        </div>
        <button class="pd-icon-button pd-danger-button" type="button" data-action="delete" title="Delete prompt" aria-label="Delete prompt">×</button>
      </div>
    `).join("");

    state.picker.innerHTML = `
      <div class="pd-panel-header">
        <button class="pd-icon-button" type="button" data-action="open-manager" title="Open prompt manager" aria-label="Open prompt manager">+</button>
        <div class="pd-panel-title">Prompts</div>
      </div>
      <div class="pd-list">
        ${items || '<div class="pd-empty">No prompts yet. Use + to add one.</div>'}
      </div>
    `;

    state.picker.classList.toggle("pd-hidden", !state.pickerOpen);
    if (state.pickerOpen) {
      positionPicker();
    }
  }

  function renderManager() {
    if (!state.managerOpen) {
      if (state.manager) {
        state.manager.remove();
        state.manager = null;
      }
      return;
    }

    if (!state.root) {
      return;
    }

    if (!state.manager) {
      const overlay = document.createElement("div");
      overlay.className = "pd-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "Prompt manager");
      state.root.appendChild(overlay);
      state.manager = overlay;
    }

    const items = state.prompts.map((prompt) => `
      <div class="pd-manager-item" data-id="${escapeHtml(prompt.id)}">
        <div>
          <div class="pd-manager-name">${escapeHtml(prompt.name || "Untitled")}</div>
          <div class="pd-manager-content">${escapeHtml(prompt.content || "")}</div>
        </div>
        <div class="pd-actions">
          <button class="pd-text-button" type="button" data-action="edit">Edit</button>
          <button class="pd-danger-button" type="button" data-action="delete">Delete</button>
        </div>
      </div>
    `).join("");

    state.manager.innerHTML = `
      <div class="pd-modal">
        <div class="pd-modal-header">
          <div class="pd-modal-title">Prompt Manager</div>
          <button class="pd-text-button pd-primary" type="button" data-action="add">Add</button>
          <button class="pd-icon-button" type="button" data-action="close" title="Close" aria-label="Close">×</button>
        </div>
        <div class="pd-modal-body">
          ${items || '<div class="pd-empty">No prompts yet. Click Add to create one.</div>'}
        </div>
      </div>
    `;
  }

  function renderEditor(prompt) {
    if (!state.editorOpen) {
      if (state.editor) {
        state.editor.remove();
        state.editor = null;
      }
      return;
    }

    if (!state.root) {
      return;
    }

    const isEdit = Boolean(prompt);
    const overlay = document.createElement("div");
    overlay.className = "pd-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", isEdit ? "Edit prompt" : "Add prompt");
    overlay.innerHTML = `
      <form class="pd-modal pd-form" data-action="editor-form">
        <div class="pd-modal-header" style="padding:0 0 12px;border-bottom:0;min-height:0;">
          <div class="pd-modal-title">${isEdit ? "Edit Prompt" : "Add Prompt"}</div>
          <button class="pd-icon-button" type="button" data-action="close-editor" title="Close" aria-label="Close">×</button>
        </div>
        <label class="pd-field">
          <span class="pd-label">Name</span>
          <input class="pd-input" name="name" type="text" autocomplete="off" value="${escapeHtml(prompt ? prompt.name : "")}" />
        </label>
        <label class="pd-field">
          <span class="pd-label">Content</span>
          <textarea class="pd-textarea" name="content">${escapeHtml(prompt ? prompt.content : "")}</textarea>
        </label>
        <div class="pd-form-error" data-role="error"></div>
        <div class="pd-actions" style="justify-content:flex-end;">
          <button class="pd-text-button" type="button" data-action="close-editor">Cancel</button>
          <button class="pd-text-button pd-primary" type="submit">Save</button>
        </div>
      </form>
    `;

    if (state.editor) {
      state.editor.replaceWith(overlay);
    } else {
      state.root.appendChild(overlay);
    }
    state.editor = overlay;

    const nameInput = overlay.querySelector("input[name='name']");
    if (nameInput) {
      nameInput.focus();
      nameInput.select();
    }
  }

  function openPicker() {
    state.pickerOpen = true;
    renderPicker();
  }

  function closePicker() {
    state.pickerOpen = false;
    renderPicker();
  }

  function togglePicker() {
    if (state.pickerOpen) {
      closePicker();
    } else {
      openPicker();
    }
  }

  function openManager() {
    state.pickerOpen = false;
    state.managerOpen = true;
    renderPicker();
    renderManager();
  }

  function closeManager() {
    state.managerOpen = false;
    state.editorOpen = false;
    state.editingId = null;
    renderEditor(null);
    renderManager();
  }

  function openEditor(prompt) {
    state.editorOpen = true;
    state.editingId = prompt ? prompt.id : null;
    renderEditor(prompt || null);
  }

  function closeEditor() {
    state.editorOpen = false;
    state.editingId = null;
    renderEditor(null);
  }

  function deletePrompt(id) {
    savePrompts(state.prompts.filter((prompt) => prompt.id !== id));
  }

  function savePromptFromForm(form) {
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const content = String(formData.get("content") || "").trimEnd();
    const error = form.querySelector("[data-role='error']");

    if (!name || !content) {
      if (error) {
        error.textContent = "Name and content are required.";
      }
      return;
    }

    const timestamp = nowIso();
    if (state.editingId) {
      savePrompts(state.prompts.map((prompt) => (
        prompt.id === state.editingId
          ? { ...prompt, name, content, updatedAt: timestamp }
          : prompt
      )));
    } else {
      savePrompts([
        ...state.prompts,
        {
          id: makeId(),
          name,
          content,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ]);
    }

    closeEditor();
  }

  function dispatchInput(element) {
    element.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
    }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function insertIntoTextarea(textarea, text) {
    textarea.focus();
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    textarea.setRangeText(text, start, end, "end");
    dispatchInput(textarea);
  }

  function setCaretAtEnd(element) {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function dispatchPaste(element, text) {
    try {
      const data = new DataTransfer();
      data.setData("text/plain", text);
      const event = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    } catch (_error) {
      return false;
    }
  }

  function insertIntoContentEditable(element, text) {
    element.focus();

    const selection = window.getSelection();
    if (!selection || !element.contains(selection.anchorNode)) {
      setCaretAtEnd(element);
    }

    const before = element.textContent || "";
    const pasteHandled = dispatchPaste(element, text);

    window.setTimeout(() => {
      const afterPaste = element.textContent || "";
      if (pasteHandled && afterPaste !== before) {
        return;
      }

      element.focus();
      if (!document.execCommand("insertText", false, text)) {
        const currentSelection = window.getSelection();
        if (currentSelection && currentSelection.rangeCount > 0) {
          const range = currentSelection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          range.collapse(false);
          currentSelection.removeAllRanges();
          currentSelection.addRange(range);
        }
      }
      dispatchInput(element);
    }, 0);
  }

  function insertPrompt(prompt) {
    const composer = findComposer();
    if (!composer) {
      window.alert("ChatGPT composer was not found.");
      return;
    }

    const text = `${prompt.content}\n\n`;
    if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
      insertIntoTextarea(composer, text);
    } else if (composer.isContentEditable) {
      insertIntoContentEditable(composer, text);
    } else {
      window.alert("ChatGPT composer is not editable.");
      return;
    }

    closePicker();
  }

  function handleRootClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const actionTarget = target.closest("[data-action]");
    if (!actionTarget) {
      return;
    }

    const action = actionTarget.getAttribute("data-action");
    const item = actionTarget.closest("[data-id]");
    const id = item ? item.getAttribute("data-id") : null;
    const prompt = id ? state.prompts.find((candidate) => candidate.id === id) : null;

    if (action === "open-manager") {
      openManager();
    } else if (action === "insert" && prompt) {
      insertPrompt(prompt);
    } else if (action === "delete" && id) {
      deletePrompt(id);
    } else if (action === "add") {
      openEditor(null);
    } else if (action === "edit" && prompt) {
      openEditor(prompt);
    } else if (action === "close") {
      closeManager();
    } else if (action === "close-editor") {
      closeEditor();
    }
  }

  function handleDocumentClick(event) {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!state.root || state.root.contains(target)) {
      return;
    }

    if (state.pickerOpen) {
      closePicker();
    }
  }

  function handleSubmit(event) {
    const target = event.target;
    if (!(target instanceof HTMLFormElement)) {
      return;
    }

    if (target.getAttribute("data-action") === "editor-form") {
      event.preventDefault();
      savePromptFromForm(target);
    }
  }

  function handleKeydown(event) {
    if (event.key !== "Escape") {
      return;
    }

    if (state.editorOpen) {
      closeEditor();
    } else if (state.managerOpen) {
      closeManager();
    } else if (state.pickerOpen) {
      closePicker();
    }
  }

  function observeComposer() {
    const observer = new MutationObserver((mutations) => {
      const onlyOwnMutations = mutations.every((mutation) => (
        state.root && state.root.contains(mutation.target)
      ));
      if (!onlyOwnMutations) {
        scheduleButtonPositionUpdate();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function init() {
    state.prompts = readPrompts();
    renderRoot();
    renderPicker();
    renderManager();
    updateButtonPosition();

    state.root.addEventListener("click", handleRootClick);
    state.root.addEventListener("submit", handleSubmit);
    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("resize", scheduleButtonPositionUpdate);
    window.addEventListener("scroll", scheduleButtonPositionUpdate, true);
    observeComposer();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
