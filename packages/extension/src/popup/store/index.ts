/**
 * 响应式状态管理 Store
 */

import type { ClipItem, AppSettings } from '@clipmark/shared';

type Listener = () => void;

export interface StoreState {
  items: ClipItem[];
  settings: AppSettings;
  currentPageUrl: string;
  currentPageEnabled: boolean;
  mcpConnected: boolean;
  loading: boolean;
}

/**
 * 简单的响应式 Store 实现
 */
export class Store {
  private state: StoreState;
  private listeners: Set<Listener> = new Set();

  constructor(initialState: StoreState) {
    this.state = initialState;
  }

  /**
   * 获取当前状态
   */
  get(): Readonly<StoreState> {
    return this.state;
  }

  /**
   * 更新状态
   */
  set(partial: Partial<StoreState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);

    // 返回取消订阅函数
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有订阅者
   */
  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

/**
 * 创建全局 Store 实例
 */
export async function createStore(): Promise<Store> {
  // 获取初始数据
  const [items, settings, currentTab] = await Promise.all([
    getItems(),
    getSettings(),
    getCurrentTab(),
  ]);

  const initialState: StoreState = {
    items,
    settings,
    currentPageUrl: currentTab?.url || '',
    currentPageEnabled: false, // 将在初始化后检查
    mcpConnected: false,
    loading: false,
  };

  const store = new Store(initialState);

  // 检查当前页面状态
  if (currentTab?.url) {
    const enabled = await checkPageEnabled(currentTab.url);
    store.set({ currentPageEnabled: enabled });
  }

  // 检查 MCP 连接状态
  const mcpConnected = await checkMCPConnection();
  store.set({ mcpConnected });

  return store;
}

/**
 * 从 chrome.storage.local 获取所有项目
 */
async function getItems(): Promise<ClipItem[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get('items', (result) => {
      resolve((result.items as ClipItem[]) || []);
    });
  });
}

/**
 * 从 chrome.storage.sync 获取设置
 */
async function getSettings(): Promise<AppSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('settings', (result) => {
      resolve(
        (result.settings as AppSettings) || { maxItems: 5, autoCopy: false, enabledUrls: [] }
      );
    });
  });
}

/**
 * 获取当前标签页
 */
async function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0] || null);
    });
  });
}

/**
 * 检查页面是否启用
 */
async function checkPageEnabled(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!chrome?.runtime) {
      console.error('chrome.runtime is not available');
      resolve(true); // 默认启用
      return;
    }

    try {
      chrome.runtime.sendMessage({ type: 'GET_CURRENT_PAGE_STATUS', url }, (response) => {
        resolve(response?.enabled ?? true);
      });
    } catch (error) {
      console.error('Failed to check page enabled status:', error);
      resolve(true); // 默认启用
    }
  });
}

/**
 * 检查 MCP 连接状态
 */
async function checkMCPConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!chrome?.runtime) {
      console.error('chrome.runtime is not available');
      resolve(false); // 默认未连接
      return;
    }

    try {
      chrome.runtime.sendMessage({ type: 'CHECK_MCP_CONNECTION' }, (response) => {
        resolve(response?.connected ?? false);
      });
    } catch (error) {
      console.error('Failed to check MCP connection:', error);
      resolve(false); // 默认未连接
    }
  });
}
