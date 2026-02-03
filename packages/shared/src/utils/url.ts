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
