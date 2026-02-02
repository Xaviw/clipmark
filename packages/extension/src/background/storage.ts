/**
 * 扩展本地存储管理
 */

import type { ClipItem } from '@clipmark/shared';
import { now, generateId } from '@clipmark/shared';
import { getSettings } from './settings.js';

const STORAGE_KEY = 'items';

/**
 * 获取所有项目
 */
export async function getAllItems(): Promise<ClipItem[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as ClipItem[]) || [];
}

/**
 * 获取项目列表（分页）
 */
export async function getItems(limit: number = 10, offset: number = 0): Promise<ClipItem[]> {
  const items = await getAllItems();
  const sorted = items.sort((a, b) => b.createdAt - a.createdAt);
  return sorted.slice(offset, offset + limit);
}

/**
 * 获取单个项目
 */
export async function getItem(id: string): Promise<ClipItem | null> {
  const items = await getAllItems();
  return items.find((item) => item.id === id) || null;
}

/**
 * 保存项目
 */
export async function saveItem(
  content: string,
  originalPlain: string,
  originalHtml: string,
  sourceUrl: string,
  title: string
): Promise<ClipItem> {
  const id = generateId();
  const createdAt = now();
  const item: ClipItem = {
    id,
    content,
    originalPlain,
    originalHtml,
    metadata: {
      sourceUrl,
      title,
      timestamp: createdAt,
    },
    createdAt,
    size: content.length,
  };

  const items = await getAllItems();
  items.push(item);

  // 检查是否超出最大数量限制
  const settings = await getSettings();
  if (items.length > settings.maxItems) {
    // 按时间排序，删除最旧的
    items.sort((a, b) => a.createdAt - b.createdAt);
    items.splice(0, items.length - settings.maxItems);
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: items });

  // 调试日志：记录保存的项目
  console.log('[ClipMark Storage] 保存项目');
  console.log('[ClipMark Storage] 项目 ID:', id);
  console.log('[ClipMark Storage] Content 长度:', content.length);
  console.log('[ClipMark Storage] Content 预览:', content.substring(0, 500));
  console.log('[ClipMark Storage] Size:', item.size);

  return item;
}

/**
 * 删除单个项目
 */
export async function deleteItem(id: string): Promise<boolean> {
  const items = await getAllItems();
  const filtered = items.filter((item) => item.id !== id);

  if (filtered.length === items.length) {
    return false; // 没有找到要删除的项目
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
  return true;
}

/**
 * 批量删除项目
 */
export async function deleteItems(ids: string[]): Promise<number> {
  const items = await getAllItems();
  const filtered = items.filter((item) => !ids.includes(item.id));
  const deletedCount = items.length - filtered.length;

  if (deletedCount > 0) {
    await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
  }

  return deletedCount;
}

/**
 * 清空所有项目
 */
export async function clearAllItems(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: [] });
}

/**
 * 初始化存储
 */
export async function initializeStorage(): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEY);

  // 如果存储不存在，初始化为空数组
  if (!result[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: [] });
  }
}

/**
 * 监听存储变化
 */
export function onStorageChanged(callback: (items: ClipItem[]) => void): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[STORAGE_KEY]) {
      const newItems = changes[STORAGE_KEY].newValue as ClipItem[];
      callback(newItems);
    }
  });
}
