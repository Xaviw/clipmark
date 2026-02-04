/**
 * ClipMark Background Service Worker
 * 主入口文件
 */

import './clipboard.js';
import { initializeStorage, onStorageChanged } from './storage.js';
import { initializeSettings } from './settings.js';
import { syncToMCP } from './api.js';

/**
 * 初始化扩展
 */
async function initialize(): Promise<void> {
  // 初始化存储
  await initializeStorage();

  // 初始化设置
  await initializeSettings();

  // 监听存储变化，自动同步到 MCP 服务器
  onStorageChanged(async (items) => {
    // 静默同步，不阻塞用户操作
    syncToMCP(items).catch(() => {
      // 静默处理错误
    });
  });
}

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener(async () => {
  await initialize();
});

// 扩展启动时初始化
chrome.runtime.onStartup.addListener(async () => {
  await initializeStorage();
});

// 初始化
initialize().catch((error) => {
  console.error('Failed to initialize ClipMark:', error);
});
