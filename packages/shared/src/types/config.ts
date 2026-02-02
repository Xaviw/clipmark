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

/**
 * 错误消息常量
 */
export const ERROR_MESSAGES = {
  /** 内容过大 */
  CONTENT_TOO_LARGE: '内容过大，已跳过转换（限制10MB）',
  /** 转换失败 */
  CONVERSION_FAILED: '转换失败，已保存原始文本内容',
  /** 网络错误 */
  NETWORK_ERROR: '网络请求失败',
  /** 服务未连接 */
  SERVICE_NOT_CONNECTED: '服务未连接',
  /** 无效的URL */
  INVALID_URL: '无效的URL',
  /** 无效的设置值 */
  INVALID_SETTINGS: '无效的设置值',
} as const;

/**
 * 通知消息常量
 */
export const NOTIFICATION_MESSAGES = {
  /** 转换成功标题 */
  SUCCESS_TITLE: '内容已转换',
  /** 转换成功内容 */
  SUCCESS_MESSAGE: '已保存到剪贴板历史',
  /** 转换失败标题 */
  FAILED_TITLE: '转换失败',
  /** 转换失败内容 */
  FAILED_MESSAGE: '已保存原始文本内容',
  /** 内容过大标题 */
  TOO_LARGE_TITLE: '内容过大',
  /** 内容过大内容 */
  TOO_LARGE_MESSAGE: '已跳过转换（限制10MB）',
} as const;
