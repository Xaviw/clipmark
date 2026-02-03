/**
 * 应用设置
 */
export interface AppSettings {
  /** 最大缓存数量 (1-100) */
  maxItems: number;
  /** 自动复制开关 */
  autoCopy: boolean;
  /** 启用网址列表（通配符模式） */
  enabledUrls: string[];
}

/**
 * 默认设置值
 */
export const DEFAULT_SETTINGS: AppSettings = {
  maxItems: 5,
  autoCopy: false,
  enabledUrls: [],
} as const;

/**
 * 内容限制常量
 */
export const CONTENT_LIMITS = {
  /** 最大内容字符数 (10MB) */
  MAX_CONTENT_SIZE: 10 * 1024 * 1024,
  /** 最小缓存数量 */
  MIN_MAX_ITEMS: 1,
  /** 最大缓存数量 */
  MAX_MAX_ITEMS: 100,
} as const;
