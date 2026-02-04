/**
 * 扩展设置管理
 */

import type { AppSettings } from '@clipmark/shared';
import { DEFAULT_SETTINGS } from '@clipmark/shared';

const STORAGE_KEY = 'settings';

/**
 * 获取设置
 */
export async function getSettings(): Promise<AppSettings> {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEY] as AppSettings) };
}

/**
 * 保存设置
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
}

/**
 * 初始化设置
 */
export async function initializeSettings(): Promise<void> {
  const result = await chrome.storage.sync.get(STORAGE_KEY);

  // 检查原始存储，如果设置不存在，保存默认设置
  if (!result[STORAGE_KEY]) {
    await saveSettings(DEFAULT_SETTINGS);
  }
}

/**
 * 监听设置变化
 */
export function onSettingsChanged(callback: (settings: AppSettings) => void): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes[STORAGE_KEY]) {
      const newSettings = changes[STORAGE_KEY].newValue as AppSettings;
      callback(newSettings);
    }
  });
}
