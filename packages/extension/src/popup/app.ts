/**
 * ClipMark Popup Application
 */

import { createStore } from './store/index.js';

// ========== Type Definitions ==========
interface ClipItem {
  id: string;
  content: string;
  metadata: {
    sourceUrl: string;
    title: string;
    timestamp: number;
  };
  createdAt: number;
  size: number;
}

interface AppSettings {
  maxItems: number;
  autoCopy: boolean;
  enabledUrls: string[];
}

// ========== Global State ==========
let store: Awaited<ReturnType<typeof createStore>> | null = null;

// ========== DOM Elements ==========
const elements = {
  statusBar: {
    pageStatus: document.getElementById('page-status')!,
    mcpStatus: document.getElementById('mcp-status')!,
  },
  historyList: document.getElementById('history-list')!,
  emptyState: document.getElementById('empty-state')!,
  refreshBtn: document.getElementById('refresh-btn')!,
  settings: {
    enabledUrls: document.getElementById('enabled-urls') as HTMLTextAreaElement,
    maxItems: document.getElementById('max-items') as HTMLInputElement,
    autoCopy: document.getElementById('auto-copy') as HTMLInputElement,
    clearAllBtn: document.getElementById('clear-all-btn')!,
  },
};

// ========== Initialization ==========
async function init(): Promise<void> {
  try {
    store = await createStore();

    // 订阅状态变化
    store.subscribe(render);

    // 初始渲染
    render();

    // 绑定事件
    bindEvents();

    // 监听存储变化
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.items) {
        refreshItems();
      }
      if (areaName === 'sync' && changes.settings) {
        refreshSettings();
      }
    });
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

// ========== Rendering ==========
function render(): void {
  if (!store) return;

  const state = store.get();

  // 渲染状态栏
  renderStatusBar(state);

  // 渲染历史记录
  renderHistoryList(state.items);

  // 渲染设置
  renderSettings(state.settings);
}

function renderStatusBar(state: ReturnType<typeof store.get>): void {
  const { pageStatus, mcpStatus } = elements.statusBar;

  // 当前页面状态
  pageStatus.textContent = state.currentPageEnabled ? '已启用' : '未启用';
  pageStatus.className = `status-value ${state.currentPageEnabled ? 'enabled' : 'disabled'}`;

  // MCP 连接状态
  mcpStatus.style.display = state.mcpConnected ? 'none' : 'flex';
}

function renderHistoryList(items: ClipItem[]): void {
  const { historyList, emptyState } = elements;

  if (items.length === 0) {
    historyList.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  historyList.style.display = 'block';
  emptyState.style.display = 'none';

  historyList.innerHTML = items.map((item) => createHistoryItemHTML(item)).join('');

  // 绑定历史记录项事件
  bindHistoryItemEvents();
}

function createHistoryItemHTML(item: ClipItem): string {
  const preview = escapeHtml(item.content.slice(0, 200));
  const source = escapeHtml(item.metadata.sourceUrl);
  const time = formatDate(item.createdAt);
  const size = formatSize(item.size);

  return `
    <div class="history-item" data-id="${item.id}">
      <div class="history-item-header">
        <div class="history-item-source" title="${source}">${source}</div>
        <div class="history-item-time">${time}</div>
      </div>
      <div class="history-item-content">
        <div class="history-item-preview">${preview}${item.content.length > 200 ? '...' : ''}</div>
      </div>
      <div class="history-item-footer">
        <span class="history-item-size">${size}</span>
        <div class="history-item-actions">
          <button class="history-item-action copy-btn" data-id="${item.id}" title="复制到剪贴板">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
              <path d="M6 0v2h8v8h2V2a2 2 0 0 0-2-2H6z"/>
            </svg>
            复制
          </button>
          <button class="history-item-action delete-btn" data-id="${item.id}" title="删除">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5"/>
              <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none" stroke-width="1"/>
            </svg>
            删除
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderSettings(settings: AppSettings): void {
  const { enabledUrls, maxItems, autoCopy } = elements.settings;

  // 避免在用户输入时更新
  if (document.activeElement !== enabledUrls) {
    enabledUrls.value = settings.enabledUrls.join('\n');
  }

  if (document.activeElement !== maxItems) {
    maxItems.value = settings.maxItems.toString();
  }

  if (document.activeElement !== autoCopy) {
    autoCopy.checked = settings.autoCopy;
  }
}

// ========== Event Handlers ==========
function bindEvents(): void {
  // 刷新按钮
  elements.refreshBtn.addEventListener('click', refreshItems);

  // 设置输入
  elements.settings.enabledUrls.addEventListener('input', handleUrlsChange);
  elements.settings.maxItems.addEventListener('input', handleMaxItemsChange);
  elements.settings.autoCopy.addEventListener('change', handleAutoCopyChange);

  // 清空所有按钮
  elements.settings.clearAllBtn.addEventListener('click', handleClearAll);
}

function bindHistoryItemEvents(): void {
  // 复制按钮
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', handleCopy);
  });

  // 删除按钮
  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', handleDelete);
  });
}

async function handleCopy(event: Event): Promise<void> {
  const btn = event.currentTarget as HTMLButtonElement;
  const id = btn.dataset.id;

  if (!id || !store) return;

  const items = store.get().items;
  const item = items.find((i) => i.id === id);

  if (!item) return;

  try {
    await navigator.clipboard.writeText(item.content);

    // 显示成功状态
    btn.classList.add('copy-success');
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.5 3L5.5 11L2.5 8" stroke="currentColor" stroke-width="2" fill="none"/>
      </svg>
      已复制
    `;

    setTimeout(() => {
      btn.classList.remove('copy-success');
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
          <path d="M6 0v2h8v8h2V2a2 2 0 0 0-2-2H6z"/>
        </svg>
        复制
      `;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
}

async function handleDelete(event: Event): Promise<void> {
  const btn = event.currentTarget as HTMLButtonElement;
  const id = btn.dataset.id;

  if (!id) return;

  // 确认删除
  const confirmed = confirm('确定要删除这条记录吗？');
  if (!confirmed) return;

  try {
    // 从本地存储删除
    await new Promise<void>((resolve) => {
      chrome.storage.local.get('items', (result) => {
        const items = (result.items as ClipItem[]) || [];
        const filtered = items.filter((item) => item.id !== id);
        chrome.storage.local.set({ items: filtered }, () => resolve());
      });
    });

    // 通知 background 删除 MCP 服务器数据
    chrome.runtime.sendMessage({ type: 'DELETE_ITEM', id });

    // 刷新列表
    await refreshItems();
  } catch (error) {
    console.error('Failed to delete item:', error);
  }
}

async function handleUrlsChange(event: Event): Promise<void> {
  const textarea = event.target as HTMLTextAreaElement;
  const urls = textarea.value
    .split('\n')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  const { settings } = store!.get();
  await chrome.storage.sync.set({
    settings: { ...settings, enabledUrls: urls },
  });
}

async function handleMaxItemsChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const maxItems = Math.min(100, Math.max(1, parseInt(input.value) || 5));

  const { settings } = store!.get();
  await chrome.storage.sync.set({
    settings: { ...settings, maxItems },
  });
}

async function handleAutoCopyChange(event: Event): Promise<void> {
  const checkbox = event.target as HTMLInputElement;

  const { settings } = store!.get();
  await chrome.storage.sync.set({
    settings: { ...settings, autoCopy: checkbox.checked },
  });
}

async function handleClearAll(): Promise<void> {
  const confirmed = confirm('确定要清空所有历史记录吗？此操作不可恢复。');
  if (!confirmed) return;

  try {
    // 清空本地存储
    await chrome.storage.local.set({ items: [] });

    // 通知 background 清空 MCP 服务器数据
    chrome.runtime.sendMessage({ type: 'CLEAR_ALL_ITEMS' });

    // 刷新列表
    await refreshItems();
  } catch (error) {
    console.error('Failed to clear all items:', error);
  }
}

async function refreshItems(): Promise<void> {
  if (!store) return;

  const items = await new Promise<ClipItem[]>((resolve) => {
    chrome.storage.local.get('items', (result) => {
      resolve((result.items as ClipItem[]) || []);
    });
  });

  store.set({ items });
}

async function refreshSettings(): Promise<void> {
  if (!store) return;

  const settings = await new Promise<AppSettings>((resolve) => {
    chrome.storage.sync.get('settings', (result) => {
      resolve((result.settings as AppSettings) || { maxItems: 5, autoCopy: false, enabledUrls: [] });
    });
  });

  store.set({ settings });
}

// ========== Utility Functions ==========
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatSize(size: number): string {
  return size.toLocaleString() + ' 字符';
}

// ========== Start Application =%%
init();
