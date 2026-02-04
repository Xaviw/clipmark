/**
 * 剪贴板监听
 */

import { getSettings } from './settings.js';
import { saveItem } from './storage.js';
import { convertContent } from './converter.js';
import { checkMCPConnection } from './api.js';
import { matchAnyPattern, CONTENT_LIMITS } from '@clipmark/shared';

/**
 * 检查URL是否在启用列表中
 */
async function isUrlEnabled(url: string): Promise<boolean> {
  const settings = await getSettings();

  // 如果没有配置启用列表，默认启用所有网站
  if (!settings.enabledUrls || settings.enabledUrls.length === 0) {
    return true;
  }

  return matchAnyPattern(url, settings.enabledUrls);
}

/**
 * 获取当前标签页信息
 */
async function getCurrentTabInfo(): Promise<{ url: string; title: string } | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || !tab.title) {
      return null;
    }

    return {
      url: tab.url,
      title: tab.title,
    };
  } catch {
    return null;
  }
}

/**
 * 处理剪贴板内容
 */
async function handleClipboardContent(html: string, plain: string): Promise<void> {
  try {
    const tabInfo = await getCurrentTabInfo();

    if (!tabInfo) {
      return;
    }

    // 检查URL是否启用
    const isEnabled = await isUrlEnabled(tabInfo.url);

    if (!isEnabled) {
      return;
    }

    // 检查内容大小
    if (html.length > CONTENT_LIMITS.MAX_CONTENT_SIZE) {
      return;
    }

    // 转换内容
    const markdown = await convertContent(html, tabInfo.url);

    // 保存到本地存储（会自动同步到 MCP 服务器）
    await saveItem(markdown, tabInfo.url, tabInfo.title);
  } catch {
    // 转换失败，保存原始文本作为降级方案
    try {
      const tabInfo = await getCurrentTabInfo();
      if (tabInfo) {
        await saveItem(plain, tabInfo.url, tabInfo.title);
      }
    } catch {
      // 忽略保存失败
    }
  }
}

/**
 * 处理来自 content script 的复制事件
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'COPY_EVENT') {
    // 异步处理复制事件
    handleClipboardContent(message.html, message.plain).catch(() => {
      // 静默处理错误
    });
  } else if (message.type === 'CHECK_MCP_CONNECTION') {
    checkMCPConnection().then((connected) => {
      sendResponse({ connected });
    });
    return true; // 异步响应
  } else if (message.type === 'GET_CURRENT_PAGE_STATUS') {
    isUrlEnabled(message.url).then((enabled) => {
      sendResponse({ enabled });
    });
    return true; // 异步响应
  }
});
