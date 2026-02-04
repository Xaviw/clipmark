/**
 * 扩展本地存储管理
 */

import type { ClipItem } from '@clipmark/shared';
import { now, getNextId } from '@clipmark/shared';
import { getSettings } from './settings.js';
import { syncToMCP } from './api.js';

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
  sourceUrl: string,
  title: string
): Promise<ClipItem> {
  const items = await getAllItems();

  // 获取当前最大 ID，生成下一个自增 ID
  const maxId = items.length > 0 ? items[items.length - 1].id : undefined;
  const id = getNextId(maxId);

  const createdAt = now();
  const item: ClipItem = {
    id,
    content,
    metadata: {
      sourceUrl,
      title,
      timestamp: createdAt,
    },
    createdAt,
    size: content.length,
  };

  items.push(item);

  // 检查是否超出最大数量限制
  const settings = await getSettings();
  if (items.length > settings.maxItems) {
    // 按时间排序，删除最旧的
    items.sort((a, b) => a.createdAt - b.createdAt);
    items.splice(0, items.length - settings.maxItems);
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: items });

  // 同步到 MCP 服务器
  await syncToMCP(items);

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

  // 同步到 MCP 服务器
  await syncToMCP(filtered);

  return true;
}

/**
 * 清空所有项目
 */
export async function clearAllItems(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: [] });

  // 同步到 MCP 服务器
  await syncToMCP([]);
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
