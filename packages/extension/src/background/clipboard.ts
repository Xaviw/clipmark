/**
 * 剪贴板监听
 */

import { getSettings } from './settings.js';
import { saveItem, getAllItems } from './storage.js';
import { convertContent } from './converter.js';
import { saveToMCP, checkMCPConnection, deleteFromMCP, deleteManyFromMCP } from './api.js';
import { matchAnyPattern, CONTENT_LIMITS } from '@clipmark/shared';
import { NOTIFICATION_MESSAGES, NOTIFICATION_CONFIG } from '@clipmark/shared';

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
  // 调试日志：记录接收到的内容
  console.log('[ClipMark Background] 接收到 COPY_EVENT 消息');
  console.log('[ClipMark Background] HTML 参数长度:', html.length);
  console.log('[ClipMark Background] HTML 参数预览:', html.substring(0, 200));
  console.log('[ClipMark Background] Plain 参数长度:', plain.length);
  console.log('[ClipMark Background] Plain 参数预览:', plain.substring(0, 200));

  try {
    // 获取当前标签页信息
    console.log('[ClipMark Background] 步骤 1: 获取标签页信息');
    const tabInfo = await getCurrentTabInfo();
    console.log('[ClipMark Background] 标签页信息:', tabInfo);

    if (!tabInfo) {
      console.log('[ClipMark Background] No active tab found');
      return;
    }

    // 检查URL是否启用
    console.log('[ClipMark Background] 步骤 2: 检查URL是否启用');
    const isEnabled = await isUrlEnabled(tabInfo.url);
    console.log('[ClipMark Background] URL 启用状态:', isEnabled);

    if (!isEnabled) {
      console.log('[ClipMark Background] URL not in enabled list:', tabInfo.url);
      return;
    }

    // 检查内容大小
    console.log('[ClipMark Background] 步骤 3: 检查内容大小');
    if (html.length > CONTENT_LIMITS.MAX_CONTENT_SIZE) {
      console.log('[ClipMark Background] 内容过大，跳过');
      return;
    }

    // 转换内容
    console.log('[ClipMark Background] 步骤 4: 开始转换内容');
    const markdown = await convertContent(html, tabInfo.url);

    // 调试日志：记录转换结果
    console.log('[ClipMark Background] 转换完成');
    console.log('[ClipMark Background] Markdown 长度:', markdown.length);
    console.log('[ClipMark Background] Markdown 预览:', markdown.substring(0, 500));

    // 保存到本地存储
    console.log('[ClipMark Background] 步骤 5: 保存到本地存储');
    const item = await saveItem(markdown, plain, html, tabInfo.url, tabInfo.title);
    console.log('[ClipMark Background] 保存成功，项目 ID:', item.id);

    // 尝试保存到MCP服务（静默失败）
    console.log('[ClipMark Background] 步骤 6: 尝试保存到MCP');
    await saveToMCP(item);

    console.log('[ClipMark Background] 处理完成！');
  } catch (error) {
    console.error('[ClipMark Background] 处理失败:', error);
    console.error('[ClipMark Background] 错误堆栈:', error instanceof Error ? error.stack : String(error));

    // 转换失败，保存原始文本
    try {
      const tabInfo = await getCurrentTabInfo();
      if (tabInfo) {
        await saveItem(plain, plain, html, tabInfo.url, tabInfo.title);
        console.log('[ClipMark Background] 已保存原始文本作为降级方案');
      }
    } catch (saveError) {
      console.error('[ClipMark Background] 保存降级内容也失败了:', saveError);
    }
  }
}

/**
 * 显示通知
 */
function showNotification(title: string, message: string): void {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('public/icons/icon-48.png'),
    title,
    message,
    silent: false,
  });

  // 自动关闭通知
  setTimeout(() => {
    chrome.notifications.getAll((notifications) => {
      for (const id of Object.keys(notifications)) {
        chrome.notifications.clear(id);
      }
    });
  }, NOTIFICATION_CONFIG.DURATION);
}

/**
 * 监听剪贴板变化
 */
// 注意：Chrome 没有 clipboard change 事件
// 我们需要使用其他策略：
// 1. 使用 content script 监听页面的 copy 事件
// 2. 使用快捷键触发
// 3. 使用定时轮询（不推荐）

// 由于 Manifest V3 限制，我们使用后台监听器模式
// 这里先留空，后续通过 popup 或其他方式触发

/**
 * 手动触发剪贴板处理
 */
export async function triggerClipboardCheck(): Promise<void> {
  try {
    // 读取剪贴板内容
    const clipboardItems = await navigator.clipboard.read();

    for (const item of clipboardItems) {
      const htmlItem = item.getType('text/html');
      const plainItem = item.getType('text/plain');

      const [htmlBlob, plainBlob] = await Promise.all([htmlItem, plainItem]);

      const html = await blobToString(htmlBlob);
      const plain = await blobToString(plainBlob);

      await handleClipboardContent(html, plain);
    }
  } catch (error) {
    console.error('Failed to read clipboard:', error);
  }
}

/**
 * 将 Blob 转换为字符串
 */
async function blobToString(blob: Blob): Promise<string> {
  return blob.text();
}

/**
 * 处理来自 content script 的复制事件
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'COPY_EVENT') {
    // 异步处理复制事件
    handleClipboardContent(message.html, message.plain).catch((error) => {
      console.error('Failed to handle clipboard content:', error);
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
  } else if (message.type === 'DELETE_ITEM') {
    // 处理删除项目请求（静默失败）
    deleteFromMCP(message.id);
  } else if (message.type === 'CLEAR_ALL_ITEMS') {
    // 处理清空所有项目请求（静默失败）
    getAllItems().then((items) => {
      const ids = items.map((item) => item.id);
      return deleteManyFromMCP(ids);
    });
  }
});
