/**
 * 格式化时间戳为可读的日期时间字符串
 * @param timestamp - Unix时间戳（毫秒）
 * @param format - 格式类型，默认 'full'
 * @returns 格式化后的字符串
 */
export function formatDate(
  timestamp: number,
  format: 'full' | 'date' | 'time' | 'relative' = 'full'
): string {
  const date = new Date(timestamp);

  switch (format) {
    case 'full':
      return formatFullDate(date);
    case 'date':
      return formatOnlyDate(date);
    case 'time':
      return formatOnlyTime(date);
    case 'relative':
      return formatRelativeDate(timestamp);
  }
}

/**
 * 格式化为完整的日期时间字符串
 * 格式: YYYY-MM-DD HH:mm:ss
 */
function formatFullDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 仅格式化日期部分
 * 格式: YYYY-MM-DD
 */
function formatOnlyDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 仅格式化时间部分
 * 格式: HH:mm:ss
 */
function formatOnlyTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化为相对时间
 * 例如: "刚刚", "5分钟前", "2小时前", "3天前"
 */
function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return formatFullDate(new Date(timestamp));
  }
}

/**
 * 获取当前时间戳
 */
export function now(): number {
  return Date.now();
}
