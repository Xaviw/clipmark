/**
 * URL匹配工具函数
 */

/**
 * 将通配符模式转换为正则表达式
 * 支持格式:
 * - *://*.example.com/*
 * - https://*.github.com/*
 * - https://example.com/docs/*
 * @param pattern - 通配符模式
 * @returns 正则表达式
 */
export function patternToRegex(pattern: string): RegExp {
  // 转义正则表达式特殊字符
  let regexStr = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

  // 替换通配符
  regexStr = regexStr.replace(/\\\*/g, '.*');

  // 确保匹配整个字符串
  regexStr = `^${regexStr}$`;

  return new RegExp(regexStr);
}

/**
 * 检查URL是否匹配通配符模式
 * @param url - 要检查的URL
 * @param pattern - 通配符模式
 * @returns 是否匹配
 */
export function matchPattern(url: string, pattern: string): boolean {
  const regex = patternToRegex(pattern);
  return regex.test(url);
}

/**
 * 检查URL是否匹配任一模式列表
 * @param url - 要检查的URL
 * @param patterns - 通配符模式数组
 * @returns 是否匹配任一模式
 */
export function matchAnyPattern(url: string, patterns: string[]): boolean {
  if (patterns.length === 0) {
    return true; // 空列表表示匹配所有
  }

  return patterns.some((pattern) => matchPattern(url, pattern));
}

/**
 * 解析URL获取域名
 * @param url - URL字符串
 * @returns 域名，如 "docs.qq.com"
 */
export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * 检查是否是有效的URL
 * @param url - URL字符串
 * @returns 是否有效
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 预定义的域名模式
 */
export const DOMAIN_PATTERNS = {
  /** 腾讯文档 */
  TENCENT_DOC: ['*://docs.qq.com/*', '*://doc.weixin.qq.com/*'],
  /** GitHub */
  GITHUB: ['*://*.github.com/*'],
  /** Notion */
  NOTION: ['*://*.notion.so/*', '*://notion.so/*'],
  /** 飞书 */
  FEISHU: ['*://*.feishu.cn/*', '*://feishu.cn/*'],
  /** 语雀 */
  YUQUE: ['*://*.yuque.com/*', '*://yuque.com/*'],
} as const;

/**
 * 获取域名的转换器类型
 * @param url - URL字符串
 * @returns 转换器类型
 */
export type ConverterType = 'tencent' | 'default' | 'github' | 'notion' | 'feishu' | 'yuque';

export function getConverterType(url: string): ConverterType {
  const domain = getDomain(url);

  if (domain.includes('docs.qq.com') || domain.includes('doc.weixin.qq.com')) {
    return 'tencent';
  }

  if (domain.includes('github.com')) {
    return 'github';
  }

  if (domain.includes('notion.so')) {
    return 'notion';
  }

  if (domain.includes('feishu.cn')) {
    return 'feishu';
  }

  if (domain.includes('yuque.com')) {
    return 'yuque';
  }

  return 'default';
}
