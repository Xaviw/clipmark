/**
 * 截断字符串到指定长度
 * @param str - 原字符串
 * @param maxLength - 最大长度
 * @param suffix - 后缀，默认 '...'
 * @returns 截断后的字符串
 */
export function truncateString(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) {
    return str;
  }

  // 保留maxLength长度的字符，然后添加后缀
  const truncated = str.slice(0, maxLength - suffix.length);
  return truncated + suffix;
}

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @returns 格式化后的字符串，如 "1.5 KB"
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}

/**
 * 格式化字符数量
 * @param count - 字符数
 * @returns 格式化后的字符串，如 "1,000 字符"
 */
export function formatCharCount(count: number): string {
  return count.toLocaleString() + ' 字符';
}

/**
 * 生成唯一ID
 * 使用简化的UUID v4格式
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 清理字符串中的多余空白
 * @param str - 原字符串
 * @param maxConsecutiveNewlines - 最大连续空行数，默认为2
 * @returns 清理后的字符串
 */
export function normalizeWhitespace(str: string, maxConsecutiveNewlines = 2): string {
  // 替换所有空白字符序列为单个空格（保留换行符）
  let cleaned = str.replace(/[ \t]+/g, ' ');

  // 将连续换行符压缩到指定数量
  const newlinePattern = new RegExp(`\\n{${maxConsecutiveNewlines + 1},}`, 'g');
  cleaned = cleaned.replace(newlinePattern, '\n'.repeat(maxConsecutiveNewlines));

  // 去除首尾空白
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * 检查字符串是否为空或仅包含空白字符
 */
export function isBlank(str: string | null | undefined): boolean {
  return str == null || str.trim().length === 0;
}

/**
 * 安全地截取字符串
 * 如果截取位置超出字符串长度，返回整个字符串
 */
export function safeSlice(str: string, start: number, end?: number): string {
  if (start >= str.length) {
    return str;
  }
  return str.slice(start, end);
}
