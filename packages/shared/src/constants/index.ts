/**
 * ClipMark 共享常量
 */

import { DEFAULT_SETTINGS, CONTENT_LIMITS, ERROR_MESSAGES, NOTIFICATION_MESSAGES } from '../types/config';

/**
 * 内容限制
 */
export { CONTENT_LIMITS };

/**
 * 默认设置
 */
export { DEFAULT_SETTINGS };

/**
 * 错误消息
 */
export { ERROR_MESSAGES };

/**
 * 通知消息
 */
export { NOTIFICATION_MESSAGES };

/**
 * 转换器类型
 */
export const CONVERTER_TYPES = {
  /** 默认转换器 */
  DEFAULT: 'default',
  /** 腾讯文档转换器 */
  TENCENT: 'tencent',
  /** GitHub转换器 */
  GITHUB: 'github',
  /** Notion转换器 */
  NOTION: 'notion',
  /** 飞书转换器 */
  FEISHU: 'feishu',
  /** 语雀转换器 */
  YUQUE: 'yuque',
} as const;

/**
 * 占位符模板
 */
export const PLACEHOLDER_TEMPLATES = {
  /** 图片占位符 */
  IMAGE: (desc: string, index: number) => `[图片占位符: ${desc}_${index}]`,
  /** SVG占位符 */
  SVG: (desc: string, index: number) => `[SVG图片占位符: ${desc}_${index}]`,
  /** iframe占位符 */
  IFRAME: (desc: string) => `[iframe内容占位符: ${desc}]`,
  /** canvas占位符 */
  CANVAS: (desc: string) => `[canvas内容占位符: ${desc}]`,
  /** 视频占位符 */
  VIDEO: (title: string) => `[视频占位符: ${title}]`,
  /** 音频占位符 */
  AUDIO: (title: string) => `[音频占位符: ${title}]`,
  /** 未知元素占位符 */
  UNKNOWN: (type: string) => `[未支持元素: ${type}]`,
} as const;

/**
 * 内容说明模板
 */
export const CONTENT_FOOTER_TEMPLATE = (placeholders: {
  images: number;
  iframes: number;
  others: number;
}): string => {
  const parts: string[] = [];

  if (placeholders.images > 0) {
    parts.push(`${placeholders.images} 个图片占位符`);
  }
  if (placeholders.iframes > 0) {
    parts.push(`${placeholders.iframes} 个iframe占位符`);
  }
  if (placeholders.others > 0) {
    parts.push(`${placeholders.others} 个其他占位符`);
  }

  if (parts.length === 0) {
    return '';
  }

  const placeholderList = parts.join('，');
  return `---

**内容说明**:

- 本内容包含 ${placeholderList}
- 请优先基于现有文本内容进行理解和回答
- 如确需查看占位符对应的原始内容，请提示用户提供`;
};

/**
 * 通知配置
 */
export const NOTIFICATION_CONFIG = {
  /** 显示时长（毫秒） */
  DURATION: 2000,
  /** 图标类型 */
  ICON_TYPE: {
    /** 默认图标 */
    DEFAULT: 'default',
    /** 警告图标 */
    WARNING: 'warning',
  } as const,
} as const;

/**
 * API配置
 */
export const API_CONFIG = {
  /** 默认MCP服务地址 */
  DEFAULT_MCP_URL: 'http://localhost:37283',
  /** API端点 */
  ENDPOINTS: {
    /** 保存项目 */
    SAVE_ITEM: '/api/items',
    /** 获取列表 */
    GET_ITEMS: '/api/items',
    /** 获取单个项目 */
    GET_ITEM: '/api/items',
    /** 删除项目 */
    DELETE_ITEM: '/api/items',
    /** 健康检查 */
    HEALTH: '/health',
  } as const,
  /** 请求超时（毫秒） */
  TIMEOUT: 5000,
} as const;
